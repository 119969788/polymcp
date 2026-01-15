# 安装问题修复指南

## 问题描述

在使用腾讯云镜像安装时，遇到以下错误：
```
npm error 404 Not Found - GET https://mirrors.tencentyun.com/npm/@catalyst-team%2fsmart-money
```

这是因为 `@catalyst-team/smart-money` 包在腾讯云镜像中不存在，需要使用官方 npm registry。

## 解决方案

### 方案 1: 使用官方 npm registry（推荐）

在安装前，临时切换到官方 npm registry：

```bash
# 切换到官方 npm registry
npm config set registry https://registry.npmjs.org/

# 安装依赖
npm install

# 如果需要，可以切换回腾讯云镜像（可选）
# npm config set registry https://mirrors.tencentyun.com/npm/
```

### 方案 2: 使用 .npmrc 文件配置混合源

创建 `.npmrc` 文件，为特定包使用官方源：

```bash
# 在项目根目录创建 .npmrc 文件
cat > .npmrc << 'EOF'
registry=https://mirrors.tencentyun.com/npm/
@catalyst-team:registry=https://registry.npmjs.org/
EOF

# 然后安装
npm install
```

### 方案 3: 使用 npm install 的 --registry 参数

```bash
# 先安装其他依赖（使用镜像）
npm install --registry=https://mirrors.tencentyun.com/npm/ --ignore-scripts

# 然后单独安装 @catalyst-team 的包（使用官方源）
npm install @catalyst-team/smart-money@0.1.0 --registry=https://registry.npmjs.org/
npm install @catalyst-team/poly-sdk@0.4.3 --registry=https://registry.npmjs.org/
```

### 方案 4: 完全使用官方源（最简单）

```bash
# 设置使用官方源
npm config set registry https://registry.npmjs.org/

# 安装依赖
npm install

# 安装完成后可以切换回镜像（可选）
# npm config set registry https://mirrors.tencentyun.com/npm/
```

## 快速修复命令

在项目目录下执行：

```bash
cd /opt/polymcp

# 方法 1: 临时使用官方源
npm install --registry=https://registry.npmjs.org/

# 或方法 2: 配置混合源
echo "@catalyst-team:registry=https://registry.npmjs.org/" > .npmrc
echo "registry=https://mirrors.tencentyun.com/npm/" >> .npmrc
npm install
```

## 验证安装

安装完成后，验证包是否正确安装：

```bash
# 检查 node_modules 中是否有 smart-money
ls -la node_modules/@catalyst-team/

# 应该看到：
# poly-sdk/
# smart-money/
```

## 继续安装流程

修复后，继续执行：

```bash
# 构建项目
npm run build

# 使用 PM2 启动（如果已安装）
pm2 start dist/server.js --name poly-mcp
```

## 永久解决方案

为了避免每次都需要手动配置，可以更新安装脚本，自动处理这个问题。
