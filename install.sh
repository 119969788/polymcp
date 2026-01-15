#!/bin/bash

# Poly MCP 腾讯云快速安装脚本
# 适用于 Ubuntu/Debian 和 CentOS/RHEL 系统

set -e

echo "=========================================="
echo "Poly MCP 腾讯云安装脚本"
echo "=========================================="
echo ""

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo "无法检测操作系统类型"
    exit 1
fi

echo "检测到操作系统: $OS $VER"
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 root 用户或 sudo 运行此脚本"
    exit 1
fi

# 步骤 1: 更新系统
echo "步骤 1: 更新系统包..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    apt update
    apt upgrade -y
    apt install -y curl wget git build-essential
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    yum update -y
    yum install -y curl wget git gcc-c++ make
else
    echo "不支持的操作系统: $OS"
    exit 1
fi
echo "✓ 系统更新完成"
echo ""

# 步骤 2: 安装 Node.js
echo "步骤 2: 安装 Node.js 18.x..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "Node.js 已安装: $NODE_VERSION"
else
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    fi
    echo "✓ Node.js 安装完成"
    node --version
    npm --version
fi
echo ""

# 步骤 3: 克隆项目
echo "步骤 3: 克隆项目..."
PROJECT_DIR="/opt/polymcp"
if [ -d "$PROJECT_DIR" ]; then
    echo "项目目录已存在: $PROJECT_DIR"
    read -p "是否删除并重新克隆? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_DIR"
    else
        echo "跳过克隆，使用现有目录"
        cd "$PROJECT_DIR"
    fi
fi

if [ ! -d "$PROJECT_DIR" ]; then
    mkdir -p /opt
    cd /opt
    git clone https://github.com/119969788/polymcp.git
    echo "✓ 项目克隆完成"
fi

cd "$PROJECT_DIR"
echo ""

# 步骤 4: 安装依赖
echo "步骤 4: 安装项目依赖..."
if [ -d "node_modules" ]; then
    echo "node_modules 已存在，跳过安装"
else
    # 配置混合源：@catalyst-team 包使用官方源，其他使用镜像
    echo "配置 npm 源..."
    cat > .npmrc << 'EOF'
registry=https://registry.npmmirror.com/
@catalyst-team:registry=https://registry.npmjs.org/
EOF
    echo "✓ npm 源配置完成"
    
    # 安装依赖
    echo "使用 npm 安装依赖（可能需要几分钟）..."
    npm install || {
        echo "使用镜像安装失败，尝试使用官方源..."
        npm install --registry=https://registry.npmjs.org/
    }
    echo "✓ 依赖安装完成"
fi
echo ""

# 步骤 5: 构建项目
echo "步骤 5: 构建项目..."
npm run build
echo "✓ 项目构建完成"
echo ""

# 步骤 6: 安装 PM2（可选）
echo "步骤 6: 安装 PM2 进程管理器..."
if command -v pm2 &> /dev/null; then
    echo "PM2 已安装"
else
    read -p "是否安装 PM2 进程管理器? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        npm install -g pm2
        echo "✓ PM2 安装完成"
    fi
fi
echo ""

# 步骤 7: 配置环境变量
echo "步骤 7: 配置环境变量..."
if [ -f ".env" ]; then
    echo ".env 文件已存在"
    read -p "是否重新配置? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "跳过环境变量配置"
    fi
fi

if [ ! -f ".env" ] || [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "请选择配置方式:"
    echo "1) 只读模式（不需要私钥）"
    echo "2) 单钱包模式"
    echo "3) 多钱包模式"
    read -p "请选择 (1-3): " -n 1 -r
    echo
    echo ""
    
    case $REPLY in
        1)
            echo "# 只读模式" > .env
            echo "POLY_CHAIN_ID=137" >> .env
            ;;
        2)
            read -p "请输入钱包私钥: " PRIVATE_KEY
            echo "# 单钱包模式" > .env
            echo "POLY_PRIVATE_KEY=$PRIVATE_KEY" >> .env
            echo "POLY_CHAIN_ID=137" >> .env
            ;;
        3)
            read -p "请输入钱包配置 JSON (例如: {\"main\":\"0x...\",\"trading\":\"0x...\"}): " WALLETS_JSON
            echo "# 多钱包模式" > .env
            echo "POLY_WALLETS='$WALLETS_JSON'" >> .env
            echo "POLY_CHAIN_ID=137" >> .env
            ;;
        *)
            echo "无效选择，使用只读模式"
            echo "# 只读模式" > .env
            echo "POLY_CHAIN_ID=137" >> .env
            ;;
    esac
    chmod 600 .env
    echo "✓ 环境变量配置完成"
fi
echo ""

# 步骤 8: 启动服务
echo "步骤 8: 启动服务..."
if command -v pm2 &> /dev/null; then
    echo "使用 PM2 启动服务..."
    pm2 delete poly-mcp 2>/dev/null || true
    pm2 start dist/server.js --name poly-mcp
    pm2 save
    pm2 startup
    echo "✓ 服务已启动（使用 PM2 管理）"
    echo ""
    echo "常用 PM2 命令:"
    echo "  pm2 status          - 查看状态"
    echo "  pm2 logs poly-mcp   - 查看日志"
    echo "  pm2 restart poly-mcp - 重启服务"
    echo "  pm2 stop poly-mcp   - 停止服务"
else
    echo "警告: 未安装 PM2，建议手动启动服务"
    echo "运行命令: npm start"
fi
echo ""

# 完成
echo "=========================================="
echo "安装完成！"
echo "=========================================="
echo ""
echo "项目目录: $PROJECT_DIR"
echo "配置文件: $PROJECT_DIR/.env"
echo ""
echo "下一步:"
echo "1. 检查服务状态: pm2 status (如果使用 PM2)"
echo "2. 查看日志: pm2 logs poly-mcp (如果使用 PM2)"
echo "3. 配置 MCP 客户端连接到服务器"
echo ""
echo "详细文档请查看: INSTALL.md"
echo ""
