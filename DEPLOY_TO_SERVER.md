# 部署到腾讯云服务器指南

## 方法 1: 使用 Git Clone（推荐）

在服务器上直接克隆项目：

```bash
# SSH 连接到服务器
ssh root@your-server-ip

# 进入 /opt 目录
cd /opt

# 克隆项目
git clone https://github.com/119969788/polymcp.git

# 进入项目目录
cd polymcp

# 安装依赖
npm install

# 构建项目
npm run build

# 使用 PM2 启动
npm install -g pm2
pm2 start dist/server.js --name poly-mcp
pm2 save
```

## 方法 2: 使用 SCP 上传（从本地 Windows）

在 Windows PowerShell 中执行：

```powershell
# 上传整个项目目录
scp -r J:\polymcp root@your-server-ip:/opt/

# 或者只上传必要的文件
scp -r J:\polymcp\src root@your-server-ip:/opt/polymcp/
scp J:\polymcp\package.json root@your-server-ip:/opt/polymcp/
scp J:\polymcp\tsconfig.json root@your-server-ip:/opt/polymcp/
```

然后 SSH 到服务器：

```bash
ssh root@your-server-ip
cd /opt/polymcp
npm install
npm run build
pm2 start dist/server.js --name poly-mcp
```

## 方法 3: 使用压缩包上传

在本地 Windows 上：

```powershell
# 压缩项目（排除 node_modules 和 dist）
Compress-Archive -Path J:\polymcp\src,J:\polymcp\package.json,J:\polymcp\tsconfig.json,J:\polymcp\README.md -DestinationPath J:\polymcp.zip
```

上传到服务器：

```powershell
scp J:\polymcp.zip root@your-server-ip:/opt/
```

在服务器上解压：

```bash
ssh root@your-server-ip
cd /opt
unzip polymcp.zip -d polymcp
cd polymcp
npm install
npm run build
pm2 start dist/server.js --name poly-mcp
```
