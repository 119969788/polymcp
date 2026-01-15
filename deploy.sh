#!/bin/bash

# 快速部署脚本 - 在腾讯云服务器上运行

set -e

echo "=========================================="
echo "Poly MCP 服务器部署脚本"
echo "=========================================="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 root 用户运行此脚本"
    exit 1
fi

# 项目目录
PROJECT_DIR="/opt/polymcp"

echo "步骤 1: 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "错误: Node.js 未安装"
    echo "请先运行安装脚本: ./install.sh"
    exit 1
fi
echo "✓ Node.js 已安装: $(node --version)"
echo ""

echo "步骤 2: 克隆或更新项目..."
if [ -d "$PROJECT_DIR" ]; then
    echo "项目目录已存在，更新代码..."
    cd "$PROJECT_DIR"
    git pull
else
    echo "克隆项目..."
    mkdir -p /opt
    cd /opt
    git clone https://github.com/119969788/polymcp.git
    cd polymcp
fi
echo "✓ 项目代码已更新"
echo ""

echo "步骤 3: 安装依赖..."
npm install
echo "✓ 依赖安装完成"
echo ""

echo "步骤 4: 构建项目..."
npm run build
echo "✓ 项目构建完成"
echo ""

echo "步骤 5: 检查 PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "安装 PM2..."
    npm install -g pm2
fi
echo "✓ PM2 已安装"
echo ""

echo "步骤 6: 启动服务..."
pm2 delete poly-mcp 2>/dev/null || true
pm2 start dist/server.js --name poly-mcp
pm2 save
pm2 startup
echo "✓ 服务已启动"
echo ""

echo "步骤 7: 查看状态..."
pm2 status
echo ""

echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "项目目录: $PROJECT_DIR"
echo "查看日志: pm2 logs poly-mcp"
echo "查看状态: pm2 status"
echo "重启服务: pm2 restart poly-mcp"
echo ""
