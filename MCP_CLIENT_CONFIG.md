# MCP 客户端配置指南

## Windows 上配置 Claude Desktop 连接远程服务器

由于你的服务器在腾讯云（Linux）上，而 Claude Desktop 在 Windows 上，需要通过 SSH 连接。

### 方法 1: 使用 SSH 连接（推荐）

编辑配置文件：`C:\Users\Administrator\.config\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "ssh",
      "args": [
        "root@your-server-ip",
        "node /opt/polymcp/dist/server.js"
      ]
    }
  }
}
```

**替换 `your-server-ip` 为你的腾讯云服务器 IP 地址**

### 方法 2: 使用 SSH 密钥（更安全）

如果你有 SSH 密钥文件：

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "ssh",
      "args": [
        "-i",
        "C:\\path\\to\\your\\private-key.pem",
        "root@your-server-ip",
        "node /opt/polymcp/dist/server.js"
      ]
    }
  }
}
```

### 方法 3: 在服务器上运行，通过本地连接（如果服务器有公网 IP）

如果服务器有公网 IP 且开放了端口，可以配置为直接连接：

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "node",
      "args": ["/opt/polymcp/dist/server.js"],
      "env": {
        "POLY_PRIVATE_KEY": "your-private-key"
      }
    }
  }
}
```

但这种方式需要服务器暴露端口，不推荐。

### 方法 4: 在本地 Windows 上运行（最简单）

如果你想在本地 Windows 上运行：

1. 在 Windows 上安装 Node.js
2. 克隆项目到本地
3. 安装依赖并构建
4. 配置指向本地路径：

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "node",
      "args": ["C:\\path\\to\\polymcp\\dist\\server.js"]
    }
  }
}
```

## macOS 配置

配置文件位置：`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "ssh",
      "args": [
        "root@your-server-ip",
        "node /opt/polymcp/dist/server.js"
      ]
    }
  }
}
```

## Linux 配置

配置文件位置：`~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "ssh",
      "args": [
        "root@your-server-ip",
        "node /opt/polymcp/dist/server.js"
      ]
    }
  }
}
```

## 配置环境变量（如果需要交易功能）

如果需要启用交易功能，在配置中添加环境变量：

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "ssh",
      "args": [
        "root@your-server-ip",
        "node /opt/polymcp/dist/server.js"
      ],
      "env": {
        "POLY_PRIVATE_KEY": "your-wallet-private-key"
      }
    }
  }
}
```

或者使用多钱包配置：

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "ssh",
      "args": [
        "root@your-server-ip",
        "node /opt/polymcp/dist/server.js"
      ],
      "env": {
        "POLY_WALLETS": "{\"main\":\"0x...\",\"trading\":\"0x...\"}"
      }
    }
  }
}
```

## 验证配置

1. 保存配置文件
2. 完全退出 Claude Desktop
3. 重新启动 Claude Desktop
4. 在 Claude Desktop 中，你应该能看到 polymarket MCP 服务器已连接

## 故障排查

### 1. SSH 连接失败

确保：
- 服务器 IP 地址正确
- SSH 服务正在运行
- 防火墙允许 SSH 连接
- 如果使用密钥，路径正确

### 2. 命令未找到

确保服务器上 Node.js 已安装：
```bash
ssh root@your-server-ip "which node"
```

### 3. 文件不存在

确保服务器上文件存在：
```bash
ssh root@your-server-ip "ls -la /opt/polymcp/dist/server.js"
```

### 4. 权限问题

确保文件有执行权限：
```bash
ssh root@your-server-ip "chmod +x /opt/polymcp/dist/server.js"
```

## 测试连接

在服务器上测试：

```bash
# 直接运行测试
node /opt/polymcp/dist/server.js

# 应该看到：
# polymarket-mcp v0.1.0 started
# Available tools: 66
```

如果看到这些输出，说明服务器端配置正确。
