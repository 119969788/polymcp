# @catalyst-team/poly-mcp

AI Agent 接入 Polymarket 预测市场的 MCP Server。

## 🎯 你可以做什么

### 1. 聪明钱分析 (Smart Money Analysis)
```
get_leaderboard → 获取 Top 10 聪明钱地址
  ↓
get_trader_positions(address) → 查看每个钱包持仓
  ↓
get_trader_profile(address) → 分析盈利模式
```
**示例问题**: "Top 10 聪明钱主要在哪些市场有持仓？"

### 2. 内幕检测 (Insider Detection) 🆕
```
get_political_markets → 获取政治市场列表
  ↓
scan_insider_wallets(conditionId) → 扫描市场内的可疑钱包
  ↓
analyze_wallet_insider(address) → 深度分析钱包内幕特征
  ↓
classify_wallet(address, tags) → 对钱包打标签分类
```
**示例问题**: "委内瑞拉相关市场有没有内幕钱包？帮我分析下"

### 3. 交易者深度分析 (Trader Deep Dive)
```
get_trader_positions(address) → 持仓分析
  ↓
按 eventSlug 分组 → 识别对冲 vs 单边策略
  ↓
get_trader_trades(address) → 入场时机分析
  ↓
判断策略类型: 对冲型/方向型/套利型/做市型
```
**示例问题**: "这个交易者是什么策略类型？他的盈利主要来自哪里？"

### 4. 跟单交易 (Copy Trading)
```
get_leaderboard → 选择跟单目标
  ↓
get_trader_trades(address) → 监控新交易
  ↓
get_market + get_orderbook → 评估当前价格
  ↓
place_limit_order → 跟进交易
```
**示例问题**: "排名第一的交易者最近买了什么？我应该跟吗？"

### 5. 钱包追踪 (Wallet Tracking)
```
get_trader_trades(address) → 查看今日交易
  ↓
get_trader_positions(address) → 当前持仓
  ↓
get_market(conditionId) → 深入分析相关市场
```
**示例问题**: "这个钱包今天有哪些交易？表现如何？"

### 6. 热门市场发现 (Market Discovery)
```
search_markets(query, sortBy: 'volume') → 热门市场
  ↓
get_orderbook(conditionId) → 分析流动性
  ↓
get_leaderboard → 查看哪些聪明钱参与
```
**示例问题**: "最近24小时哪些市场交易量最大？聪明钱在买入什么？"

### 7. 套利检测 (Arbitrage Detection) 🆕
```
detect_arbitrage(conditionId) → 检测套利机会
  ↓
get_realtime_spread(conditionId) → 获取实时价差
  ↓
ctf_split / ctf_merge → 执行套利操作
```
**示例问题**: "这个市场有套利机会吗？"

### 8. 短期加密市场 (Crypto Short-Term) 🆕
```
scan_crypto_short_term_markets(coin: 'BTC') → 扫描即将结束的市场
  ↓
get_klines(conditionId, interval: '5s') → 获取高频K线
  ↓
detect_market_signals(conditionId) → 检测市场信号
```
**示例问题**: "找出即将在15分钟内结束的BTC市场"

### 9. 充值与授权 (Deposit & Auth)
```
check_allowances() → 检查授权状态
  ↓
approve_trading() → 一键授权所有合约
  ↓
swap("MATIC", "USDC", "100") → 换币
  ↓
deposit_usdc(100) → 充值到交易账户
```
**示例问题**: "我的钱包准备好交易了吗？帮我检查授权状态"

### 10. 执行交易 (Trading)
```
get_market(identifier) → 获取市场信息
  ↓
get_orderbook(conditionId) → 查看盘口深度
  ↓
estimate_execution(conditionId, "Yes", "BUY", 100) → 预估成交
  ↓
place_limit_order(conditionId, "Yes", "BUY", 0.55, 100) → 下单
```
**示例问题**: "帮我在这个市场买入 100 USDC 的 Yes"

### 11. 链上操作 (CTF Operations) 🆕
```
check_ctf_ready("100") → 检查是否准备好
  ↓
ctf_split(conditionId, "100") → 拆分 USDC 为 YES+NO
  ↓
ctf_merge(conditionId, "100") → 合并 YES+NO 为 USDC
  ↓
ctf_redeem(conditionId) → 赎回获胜的 tokens
```
**示例问题**: "帮我把这个市场的 YES+NO tokens 合并回 USDC"

---

## 📦 安装

### npm 安装 (推荐)
```bash
npm install -g @catalyst-team/poly-mcp
```

### 从源码构建
```bash
pnpm -F @catalyst-team/poly-sdk build
pnpm -F @catalyst-team/poly-mcp build
```

---

## ⚙️ MCP 配置

### Claude Desktop 配置

文件位置: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### 只读模式 (市场数据、钱包分析)
```json
{
  "mcpServers": {
    "polymarket": {
      "command": "npx",
      "args": ["@catalyst-team/poly-mcp"]
    }
  }
}
```

#### 交易模式 - 单钱包
```json
{
  "mcpServers": {
    "polymarket": {
      "command": "npx",
      "args": ["@catalyst-team/poly-mcp"],
      "env": {
        "POLY_PRIVATE_KEY": "your-wallet-private-key"
      }
    }
  }
}
```

#### 交易模式 - 多钱包 (推荐)

**注意**: JSON 中的嵌套 JSON 需要转义，建议先在 shell 中设置环境变量，再在配置中引用。

**方式 1: 直接在配置中写 (需要转义引号)**
```json
{
  "mcpServers": {
    "polymarket": {
      "command": "npx",
      "args": ["@catalyst-team/poly-mcp"],
      "env": {
        "POLY_WALLETS": "{\"main\":\"0xYourMainWalletPrivateKey\",\"trading\":\"0xYourTradingWalletPrivateKey\",\"arb\":\"0xYourArbWalletPrivateKey\"}"
      }
    }
  }
}
```

**方式 2: 使用 shell 环境变量 (更简洁)**

先在 `~/.zshrc` 或 `~/.bashrc` 中添加：
```bash
export POLY_WALLETS='{"main":"0xYourMainWalletPrivateKey","trading":"0xYourTradingWalletPrivateKey","arb":"0xYourArbWalletPrivateKey"}'
```

然后在 Claude Desktop 配置中：
```json
{
  "mcpServers": {
    "polymarket": {
      "command": "npx",
      "args": ["@catalyst-team/poly-mcp"]
    }
  }
}
```
(MCP Server 会自动读取系统环境变量)

#### 本地开发
```json
{
  "mcpServers": {
    "polymarket": {
      "command": "node",
      "args": ["/path/to/poly-mcp/dist/server.js"],
      "env": {
        "POLY_PRIVATE_KEY": "your-wallet-private-key"
      }
    }
  }
}
```

---

## 🛠️ 完整工具列表

### Guide Tool
| 工具 | 描述 |
|------|------|
| `get_usage_guide` | 🚀 获取使用指南，AI Agent 应首先调用此工具 |

### Trader Tools (公开数据)
| 工具 | 描述 |
|------|------|
| `get_trader_positions` | 获取钱包当前持仓和 PnL，支持分页 |
| `get_trader_trades` | 获取钱包交易历史 |
| `get_trader_activity` | 获取完整活动历史 (TRADE/SPLIT/MERGE/REDEEM 等)，支持 fetchAll |
| `get_trader_profile` | 获取交易者综合分析 |
| `get_trader_closed_positions` | 获取已平仓位和实现盈亏 |
| `get_leaderboard` | 获取 PnL 排行榜，支持时间周期过滤 |
| `get_account_value` | 获取账户总价值 |

### Market Tools (公开数据)
| 工具 | 描述 |
|------|------|
| `get_market` | 通过 slug 或 conditionId 获取市场详情 |
| `search_markets` | 关键词搜索市场 |
| `get_trending_markets` | 获取热门市场 |
| `get_market_trades` | 获取市场最近成交 |
| `get_klines` | 获取 K 线数据，支持秒级间隔 (1s/5s/15s) |
| `get_price_history` | 获取价格历史 |
| `detect_arbitrage` | 检测套利机会 (long/short arb) |
| `detect_market_signals` | 检测市场信号 (量能/深度/鲸鱼/动量) |
| `get_realtime_spread` | 获取实时价差和套利利润 |
| `scan_crypto_short_term_markets` | 扫描短期加密市场 (5m/15m Up/Down) |

### Order Tools (公开数据)
| 工具 | 描述 |
|------|------|
| `get_orderbook` | 获取盘口深度 |
| `get_best_prices` | 获取最优买卖价 |
| `estimate_execution` | 预估成交价格和滑点 |

### Trade Tools (需要私钥)
| 工具 | 描述 |
|------|------|
| `place_limit_order` | 下限价单 (GTC/GTD) |
| `place_market_order` | 下市价单 |
| `cancel_order` | 取消订单 |
| `cancel_all_orders` | 取消所有订单 |
| `get_my_orders` | 查看挂单 |
| `get_my_trades` | 查看成交历史 |

### Rewards Tools (需要私钥)
| 工具 | 描述 |
|------|------|
| `get_earnings` | 获取做市收益 |
| `get_current_rewards` | 获取当前奖励市场 |
| `check_order_scoring` | 检查订单是否在赚取奖励 |

### Wallet Management Tools (多钱包管理)
| 工具 | 描述 | 需要私钥 |
|------|------|:--------:|
| `list_wallets` | 列出所有配置的钱包 | ✅ |
| `get_active_wallet` | 获取当前活跃钱包 | ✅ |
| `set_active_wallet` | 切换活跃钱包 | ✅ |

### Wallet Tools (充值/换币)
| 工具 | 描述 | 需要私钥 |
|------|------|:--------:|
| `get_supported_deposit_assets` | 支持的充值资产和链 | ❌ |
| `get_deposit_addresses` | 获取充值地址 | ✅ |
| `deposit_usdc` | 充值 USDC | ✅ |
| `check_allowances` | 检查授权状态 | ✅ |
| `approve_trading` | 一键授权所有合约 | ✅ |
| `swap` | QuickSwap V3 换币 | ✅ |
| `swap_and_deposit` | 换币并充值 | ✅ |
| `get_token_balances` | 获取自己钱包余额 | ✅ |
| `get_wallet_balances` | 获取任意钱包余额 | ❌ |
| `get_swap_quote` | 获取换币报价 | ❌ |
| `get_available_pools` | 获取可用交易池 | ❌ |

### CTF/Onchain Tools (链上操作) 🆕
| 工具 | 描述 | 需要私钥 |
|------|------|:--------:|
| `ctf_split` | 拆分 USDC 为 YES + NO tokens | ✅ |
| `ctf_merge` | 合并 YES + NO tokens 为 USDC | ✅ |
| `ctf_redeem` | 赎回获胜的 tokens | ✅ |
| `get_position_balance` | 获取持仓 token 余额 | ✅ |
| `get_market_resolution` | 检查市场是否已结算 | ✅ |
| `check_ctf_ready` | 检查钱包是否准备好 CTF 交易 | ✅ |
| `estimate_gas` | 估算 gas 费用 | ✅ |
| `get_gas_price` | 获取当前 gas 价格 | ✅ |

### Insider Detection Tools (内幕检测) 🆕
| 工具 | 描述 |
|------|------|
| `analyze_wallet_insider` | 分析钱包内幕特征，返回 InsiderScore (0-100) |
| `scan_insider_wallets` | 扫描市场交易，检测可疑钱包 |
| `get_insider_candidates` | 获取已检测的内幕候选人列表 |
| `get_political_markets` | 获取政治市场及内幕活动摘要 |

### Insider Signals Tools (内幕信号) 🆕
| 工具 | 描述 |
|------|------|
| `get_insider_signals` | 获取内幕检测信号 (新钱包/大单/集群) |
| `get_insider_signal_count` | 获取未读信号数量 |
| `mark_insider_signal_read` | 标记信号为已读 |
| `mark_all_insider_signals_read` | 标记所有信号为已读 |

### Wallet Classification Tools (钱包分类) 🆕
| 工具 | 描述 |
|------|------|
| `get_tag_definitions` | 获取所有标签定义 (22 个预定义标签，7 个分类) |
| `add_tag_definition` | 添加新标签定义 |
| `get_wallet_classification` | 获取钱包分类 |
| `classify_wallet` | 对钱包打标签分类 |
| `get_wallets_by_tag` | 按标签获取钱包列表 |
| `remove_wallet_tag` | 移除钱包标签 |

---

## 🕵️ 内幕检测系统

### InsiderScore 评分体系

基于委内瑞拉/格陵兰案例研究，分析钱包的内幕交易特征：

| 特征 | 权重 | 说明 |
|------|------|------|
| 新钱包 (<7天) | 15 | 为特定事件新建的钱包 |
| 无历史 (<3笔) | 10 | 几乎没有交易历史 |
| 单边押注 | 20 | 只买 YES 或只买 NO |
| 大额押注 | 15 | 单笔交易超过 $1000 |
| 时机敏感 | 10 | 在事件前 24h 内交易 |
| 存款窗口短 (<24h) | 25 | 充值后立即交易 |
| 价格不敏感 | 10 | 不在乎买入价格 |
| 两阶段模式 | 15 | 先失败后成功的交易模式 |

**加分项**:
- 高回报倍数 (>=5x): +10
- 政治市场: +5
- 突发事件: +10
- 跨链资金关联: +15
- 身份暴露 (ENS/SNS): +20

### 风险等级

| 等级 | 分数 | 颜色 | 说明 |
|------|------|------|------|
| critical | ≥80 | 🔴 红色 | 高度可疑，需要重点关注 |
| high | ≥60 | 🟡 黄色 | 中度可疑，建议跟踪 |
| medium | ≥40 | 🟠 橙色 | 轻度可疑，可能是投机者 |
| low | <40 | 🟢 绿色 | 正常交易者 |

### 标签分类系统

7 个分类，22+ 个预定义标签：

| 分类 | 标签示例 |
|------|---------|
| trading-style | high-frequency, swing-trader, scalper |
| market-preference | crypto-focused, politics-focused, sports-focused |
| scale | whale (>$100k), shark ($10k-$100k), fish (<$10k) |
| performance | consistently-profitable, break-even, losing |
| activity | very-active, active, dormant |
| risk-profile | high-conviction, diversified, risk-averse |
| special | insider-suspected, copy-worthy, market-maker |

---

## 💡 Pro Tips

1. **AI Agent 首先调用 `get_usage_guide`** - 获取完整的使用场景指南
2. **用 `get_leaderboard` 获取聪明钱地址** - 这是分析的起点
3. **用 `scan_insider_wallets` 检测可疑钱包** - 政治市场特别有用
4. **用 `get_klines` 的秒级间隔** - 分析 15 分钟加密市场
5. **用 `detect_arbitrage` 发现套利机会** - 结合 `ctf_split/merge` 执行
6. **分析持仓时看 `avgPrice` vs `curPrice`** - 判断盈亏状态
7. **查看 `volume24hr`** - 判断市场活跃度

---

## 🔐 多钱包配置

支持 3 种方式配置钱包私钥：

### 方式 1: JSON 格式 (推荐)
```bash
export POLY_WALLETS='{"main":"0x123...","trading":"0x456...","arb":"0x789..."}'
```
- 每个钱包有自己的名称
- 方便管理多个策略钱包

### 方式 2: 单钱包 (向后兼容)
```bash
export POLY_PRIVATE_KEY="0x..."
```
- 钱包名称默认为 `default`

### 方式 3: 索引格式
```bash
export POLY_PRIVATE_KEY_1="0x..."
export POLY_WALLET_NAME_1="main"
export POLY_PRIVATE_KEY_2="0x..."
export POLY_WALLET_NAME_2="trading"
```
- 支持最多 10 个钱包

### 多钱包使用示例
```
# 列出所有钱包
list_wallets
→ { wallets: [{name: "main", address: "0x...", isActive: true}, ...] }

# 切换活跃钱包
set_active_wallet(wallet: "trading")
→ { success: true, activeWallet: {name: "trading", ...} }

# 后续交易将使用 trading 钱包
place_limit_order(...)
```

---

## ⚠️ 重要：USDC.e vs Native USDC

Polymarket CTF **只接受 USDC.e** (Bridged USDC)！

| Token | 地址 | CTF 兼容 |
|-------|------|:--------:|
| USDC.e (Bridged) | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` | ✅ |
| Native USDC | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | ❌ |

**常见错误**: 钱包显示有 USDC，但 CTF 操作失败
**原因**: 你有的是 Native USDC，不是 USDC.e
**解决**: 使用 `deposit_usdc` 通过 Bridge 自动转换

---

## 📂 数据存储

MCP Server 会在本地存储一些数据：

| 文件 | 位置 | 用途 |
|------|------|------|
| 内幕候选人 | `~/.polymarket/insider-candidates.json` | 存储已检测的可疑钱包 |
| 钱包分类 | `~/.polymarket/wallet-classifications.json` | 存储钱包标签和分类 |
| 标签定义 | `~/.polymarket/tag-definitions.json` | 存储自定义标签 |
| 内幕信号 | `./data/signals/` | 存储内幕检测信号 |

---

## 📦 发布

```bash
# 按顺序发布 (有依赖关系)
pnpm -F @catalyst-team/cache publish
pnpm -F @catalyst-team/poly-sdk publish
pnpm -F @catalyst-team/poly-mcp publish
```

---

## 🔗 相关资源

- **poly-sdk**: `@catalyst-team/poly-sdk` - Polymarket SDK
- **smart-money**: `@catalyst-team/smart-money` - 内幕检测算法
- **文档**: `docs/01-mcp.md` - 详细设计文档
- **Polymarket**: https://polymarket.com

## License

MIT
