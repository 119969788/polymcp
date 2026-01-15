# 解决 @catalyst-team/smart-money 包不存在的问题

## 问题分析

`@catalyst-team/smart-money@0.1.0` 这个包在 npm registry 中不存在，导致安装失败。

## 解决方案

### 方案 1: 从 GitHub 安装（如果存在 GitHub 仓库）

如果该包有 GitHub 仓库，可以从 GitHub 直接安装：

```bash
# 在 package.json 中修改依赖
# 将 "@catalyst-team/smart-money": "0.1.0"
# 改为从 GitHub 安装
```

### 方案 2: 临时移除依赖（快速解决）

如果内幕检测功能不是必需的，可以临时移除这个依赖：

```bash
cd /opt/polymcp

# 编辑 package.json，注释掉或删除 smart-money 依赖
# 然后修改相关代码文件，使其在包不存在时也能运行
```

### 方案 3: 创建最小化实现（推荐）

创建一个本地的 smart-money 实现，提供基本功能。

## 快速修复步骤

### 步骤 1: 修改 package.json

```bash
cd /opt/polymcp
nano package.json
```

将：
```json
"@catalyst-team/smart-money": "0.1.0"
```

改为从 GitHub 安装（如果仓库存在）：
```json
"@catalyst-team/smart-money": "github:catalyst-team/smart-money#v0.1.0"
```

或者暂时移除（如果不需要内幕检测功能）：
```json
// "@catalyst-team/smart-money": "0.1.0"
```

### 步骤 2: 修改代码使其可选

如果选择移除依赖，需要修改相关文件，使代码在包不存在时也能运行。

### 步骤 3: 重新安装

```bash
rm -rf node_modules package-lock.json
npm install
```

## 临时解决方案：创建最小化实现

我将创建一个本地的 smart-money 实现文件。
