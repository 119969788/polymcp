# 腾讯云服务器安装指南

本文档详细说明如何在腾讯云服务器上安装和部署 `poly-mcp` 项目。

## 📋 前置要求

- 腾讯云服务器（推荐配置：2核4GB内存，Ubuntu 20.04/22.04 或 CentOS 7/8）
- 已配置 SSH 访问
- root 或具有 sudo 权限的用户

## 🔧 步骤 1: 连接到腾讯云服务器

### 使用 SSH 连接

```bash
ssh root@your-server-ip
# 或
ssh ubuntu@your-server-ip
```

### 如果使用密钥文件

```bash
ssh -i /path/to/your-key.pem root@your-server-ip
```

## 📦 步骤 2: 安装 Node.js 和 npm

### Ubuntu/Debian 系统

```bash
# 更新系统包
sudo apt update
sudo apt upgrade -y

# 安装 Node.js 18.x (LTS 版本)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### CentOS/RHEL 系统

```bash
# 更新系统包
sudo yum update -y

# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

## 🔨 步骤 3: 安装 Git

### Ubuntu/Debian

```bash
sudo apt install -y git
```

### CentOS/RHEL

```bash
sudo yum install -y git
```

## 📥 步骤 4: 克隆项目

```bash
# 进入合适的目录（如 /opt 或 /home）
cd /opt
# 或
cd ~

# 克隆项目
git clone https://github.com/119969788/polymcp.git

# 进入项目目录
cd polymcp
```

## 📚 步骤 5: 安装项目依赖

```bash
# 安装所有依赖
npm install

# 如果安装速度慢，可以使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

## 🏗️ 步骤 6: 构建项目

```bash
# 构建 TypeScript 项目
npm run build

# 验证构建是否成功
ls -la dist/
```

## ⚙️ 步骤 7: 配置环境变量（可选）

如果需要启用交易功能，需要配置钱包私钥：

```bash
# 创建环境变量文件
nano .env
# 或
vim .env
```

在文件中添加：

```bash
# 单钱包配置
POLY_PRIVATE_KEY=your-wallet-private-key

# 或多钱包配置（推荐）
POLY_WALLETS='{"main":"0x...","trading":"0x...","arb":"0x..."}'

# 链 ID（可选，默认 137 主网）
POLY_CHAIN_ID=137
```

保存并退出：
- nano: `Ctrl+X`, 然后 `Y`, 然后 `Enter`
- vim: `Esc`, 然后 `:wq`, 然后 `Enter`

## 🚀 步骤 8: 运行项目

### 方式 1: 直接运行（开发模式）

```bash
# 开发模式（使用 tsx）
npm run mcp:dev
```

### 方式 2: 构建后运行（生产模式）

```bash
# 先构建
npm run build

# 运行构建后的文件
npm start
# 或
npm run mcp
```

### 方式 3: 使用 PM2 管理进程（推荐生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 使用 PM2 启动
pm2 start dist/server.js --name poly-mcp

# 查看状态
pm2 status

# 查看日志
pm2 logs poly-mcp

# 设置开机自启
pm2 startup
pm2 save
```

## 🔍 步骤 9: 验证安装

### 检查进程是否运行

```bash
# 如果使用 PM2
pm2 list

# 如果直接运行，检查进程
ps aux | grep node
```

### 测试 MCP 服务器

MCP 服务器通过 stdio 通信，通常需要配合 MCP 客户端（如 Claude Desktop）使用。

## 🛡️ 步骤 10: 配置防火墙（如需要）

如果需要在服务器上运行 Web 服务，需要开放相应端口：

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 3000/tcp
sudo ufw enable
sudo ufw status

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
```

## 📝 步骤 11: 配置系统服务（可选）

创建 systemd 服务文件：

```bash
sudo nano /etc/systemd/system/poly-mcp.service
```

添加以下内容：

```ini
[Unit]
Description=Poly MCP Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/polymcp
Environment="NODE_ENV=production"
Environment="POLY_PRIVATE_KEY=your-private-key"
ExecStart=/usr/bin/node /opt/polymcp/dist/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启用并启动服务：

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用服务
sudo systemctl enable poly-mcp

# 启动服务
sudo systemctl start poly-mcp

# 查看状态
sudo systemctl status poly-mcp

# 查看日志
sudo journalctl -u poly-mcp -f
```

## 🔄 更新项目

```bash
# 进入项目目录
cd /opt/polymcp

# 拉取最新代码
git pull

# 重新安装依赖（如果有新依赖）
npm install

# 重新构建
npm run build

# 重启服务
# 如果使用 PM2
pm2 restart poly-mcp

# 如果使用 systemd
sudo systemctl restart poly-mcp
```

## 🐛 常见问题排查

### 1. Node.js 版本问题

```bash
# 检查 Node.js 版本（需要 >= 16）
node --version

# 如果版本过低，重新安装
```

### 2. 依赖安装失败

```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 3. 构建失败

```bash
# 检查 TypeScript 版本
npx tsc --version

# 手动安装 TypeScript
npm install -D typescript

# 重新构建
npm run build
```

### 4. 权限问题

```bash
# 确保有执行权限
chmod +x dist/server.js

# 如果使用非 root 用户，可能需要 sudo
```

### 5. 端口被占用

```bash
# 查找占用端口的进程
lsof -i :3000
# 或
netstat -tulpn | grep 3000

# 杀死进程
kill -9 <PID>
```

## 📊 监控和维护

### 查看日志

```bash
# PM2 日志
pm2 logs poly-mcp

# systemd 日志
sudo journalctl -u poly-mcp -f

# 直接运行的日志（在 stderr）
```

### 资源监控

```bash
# 查看进程资源使用
top
# 或
htop

# 查看 Node.js 进程
ps aux | grep node
```

## 🔐 安全建议

1. **不要将私钥提交到 Git**
   - 使用 `.env` 文件存储私钥
   - 确保 `.env` 在 `.gitignore` 中

2. **限制文件权限**
   ```bash
   chmod 600 .env
   ```

3. **使用非 root 用户运行**
   ```bash
   # 创建专用用户
   sudo useradd -m -s /bin/bash polymcp
   sudo chown -R polymcp:polymcp /opt/polymcp
   ```

4. **定期更新依赖**
   ```bash
   npm audit
   npm audit fix
   ```

## 📞 获取帮助

如果遇到问题，可以：

1. 查看项目 README.md
2. 检查 GitHub Issues: https://github.com/119969788/polymcp/issues
3. 查看日志文件排查错误

## ✅ 安装完成检查清单

- [ ] Node.js 和 npm 已安装
- [ ] Git 已安装
- [ ] 项目已克隆
- [ ] 依赖已安装
- [ ] 项目已构建成功
- [ ] 环境变量已配置（如需要）
- [ ] 服务已启动
- [ ] 防火墙已配置（如需要）
- [ ] 服务已设置为开机自启（可选）

---

**安装完成后，你的 poly-mcp 服务器应该已经在腾讯云上运行了！** 🎉
