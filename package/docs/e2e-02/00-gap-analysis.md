# Poly-MCP 能力差距分析

> 日期: 2024-12-29
> 状态: ✅ 已完成实现
> 目标: 识别 poly-mcp 与 poly-sdk 之间的能力差距

---

## 执行摘要

经过全面分析和实现，差距已基本填补：

| 类别 | 原状态 | 现状态 | 描述 |
|------|--------|--------|------|
| **Smart Money 服务** | 🔴 Critical | ⚪ 暂缓 | 使用 leaderboard 变通 |
| **K-Line/价格历史** | 🟠 High | ✅ Fixed | `get_klines`, `get_price_history` |
| **套利检测** | 🟠 High | ✅ Fixed | `detect_arbitrage` |
| **市场信号** | 🟡 Medium | ✅ Fixed | `detect_market_signals` |
| **奖励追踪** | 🟡 Medium | ✅ Fixed | `get_earnings`, `get_current_rewards` |
| **CTF 操作** | 🟠 High | ✅ Fixed | 全部 8 个工具 |

---

## 1. 已实现的服务

### 1.1 MarketService (✅ 完整)

| SDK 方法 | 功能 | MCP 状态 |
|----------|------|----------|
| `getMarket()` | 获取市场详情 | ✅ `get_market` |
| `searchMarkets()` | 搜索市场 | ✅ `search_markets` |
| `getTrendingMarkets()` | 热门市场 | ✅ `get_trending_markets` |
| `getKLines()` | K 线数据 | ✅ `get_klines` |
| `getDualKLines()` | 双向 K 线 | ✅ `get_klines` (outcome="both") |
| `getPricesHistory()` | 价格历史 | ✅ `get_price_history` |
| `getRealtimeSpread()` | 实时价差 | ✅ `get_realtime_spread` |
| `detectArbitrage()` | 套利检测 | ✅ `detect_arbitrage` |
| `detectMarketSignals()` | 市场信号检测 | ✅ `detect_market_signals` |

---

### 1.2 TradingService (✅ 完整)

| SDK 方法 | 功能 | MCP 状态 |
|----------|------|----------|
| `createLimitOrder()` | 限价单 | ✅ `place_limit_order` |
| `createMarketOrder()` | 市价单 | ✅ `place_market_order` |
| `cancelOrder()` | 取消单个订单 | ✅ `cancel_order` |
| `getOpenOrders()` | 获取订单 | ✅ `get_my_orders` |
| `cancelAllOrders()` | 取消所有 | ✅ `cancel_all_orders` |
| `getTrades()` | 自己的交易 | ✅ `get_my_trades` |
| `isOrderScoring()` | 订单是否计分 | ✅ `check_order_scoring` |
| `getEarningsForDay()` | 当日收益 | ✅ `get_earnings` |
| `getCurrentRewards()` | 当前奖励 | ✅ `get_current_rewards` |

---

### 1.3 WalletService (✅ 完整)

| SDK 方法 | 功能 | MCP 状态 |
|----------|------|----------|
| `getLeaderboard()` | 排行榜 | ✅ `get_leaderboard` |
| `getWalletPositions()` | 钱包持仓 | ✅ `get_trader_positions` |
| `getWalletActivity()` | 钱包活动 | ✅ `get_trader_activity` |
| `getWalletProfile()` | 钱包画像 | ✅ `get_trader_profile` |
| `getClosedPositions()` | 已关闭持仓 | ✅ `get_trader_closed_positions` |
| `getAccountValue()` | 账户价值 | ✅ `get_account_value` |

---

### 1.4 OnchainService (✅ 完整)

| SDK 方法 | 功能 | MCP 状态 |
|----------|------|----------|
| `split()` | Split USDC → YES + NO | ✅ `ctf_split` |
| `merge()` | Merge YES + NO → USDC | ✅ `ctf_merge` |
| `redeem()` | 赎回获胜代币 | ✅ `ctf_redeem` |
| `getPositionBalance()` | 获取持仓余额 | ✅ `get_position_balance` |
| `getMarketResolution()` | 市场结算状态 | ✅ `get_market_resolution` |
| `checkReadyForCTF()` | 检查 CTF 就绪状态 | ✅ `check_ctf_ready` |
| `estimateSplitGas()` | 估算 split gas | ✅ `estimate_gas` |
| `estimateMergeGas()` | 估算 merge gas | ✅ `estimate_gas` |
| `getGasPrice()` | 获取当前 gas 价格 | ✅ `get_gas_price` |

---

## 2. 暂不实现的服务

### 2.1 SmartMoneyService (⚪ 暂缓)

SmartMoneyService 是 WalletService 的封装，提供"聪明钱"标签和评分功能。

| SDK 方法 | 功能 | MCP 状态 |
|----------|------|----------|
| `getSmartMoneyList()` | 获取聪明钱排行榜 | ⚪ 暂不实现 |
| `isSmartMoney(address)` | 判断是否为聪明钱 | ⚪ 暂不实现 |
| `getSmartMoneyInfo(address)` | 获取聪明钱详情 | ⚪ 暂不实现 |

**变通方案**:
```
1. get_leaderboard(sortBy="pnl", limit=100)
   → 获取高 PnL 钱包作为"聪明钱"候选

2. get_trader_profile(address)
   → 查看 smartScore 字段评估钱包质量
```

---

## 3. 场景测试结果 (更新后)

```
总场景数: 29
✅ 完整支持: 26 (90%)
⚠️ 部分支持: 1 (3%)
❌ 无法完成: 2 (7%)
```

### 可完成的场景

| 类别 | 场景数 | 可完成 |
|------|--------|--------|
| 钱包分析 | 5 | 5 |
| 市场发现 | 5 | 5 |
| 交易执行 | 4 | 4 |
| 技术分析 | 4 | 4 |
| 做市 | 3 | 3 |
| CTF 操作 | 4 | 4 |
| 聪明钱 | 4 | 1 |

---

## 4. 工具清单

### 4.1 完整工具列表 (48 个)

**Trader (7)**
- `get_trader_positions`
- `get_trader_trades`
- `get_trader_activity`
- `get_trader_profile`
- `get_leaderboard`
- `get_trader_closed_positions`
- `get_account_value`

**Market (10)**
- `get_market`
- `search_markets`
- `get_trending_markets`
- `get_market_trades`
- `get_klines`
- `get_price_history`
- `detect_arbitrage`
- `detect_market_signals`
- `get_realtime_spread`
- `get_orderbook`

**Order (4)**
- `get_best_prices`
- `estimate_execution`
- `place_limit_order`
- `place_market_order`

**Trade (7)**
- `cancel_order`
- `cancel_all_orders`
- `get_my_orders`
- `get_my_trades`
- `get_earnings`
- `get_current_rewards`
- `check_order_scoring`

**Wallet (12)**
- `get_supported_deposit_assets`
- `get_deposit_addresses`
- `deposit_usdc`
- `check_allowances`
- `approve_trading`
- `swap`
- `swap_and_deposit`
- `get_token_balances`
- `get_wallet_balances`
- `get_swap_quote`
- `get_available_pools`
- `get_usage_guide`

**Onchain/CTF (8)**
- `ctf_split`
- `ctf_merge`
- `ctf_redeem`
- `get_position_balance`
- `get_market_resolution`
- `check_ctf_ready`
- `estimate_gas`
- `get_gas_price`

---

## 5. 实现历史

### Phase 1: MarketService (✅ 已完成)
- 2024-12-29: 添加 `get_klines`, `get_price_history`, `detect_arbitrage`, `detect_market_signals`, `get_realtime_spread`

### Phase 2: TradingService (✅ 已完成)
- 2024-12-29: 添加 `cancel_all_orders`, `get_my_trades`, `get_earnings`, `get_current_rewards`, `check_order_scoring`

### Phase 3: OnchainService (✅ 已完成)
- 2024-12-29: 创建 `onchain.ts`，添加 8 个 CTF 工具

### Phase 4: SmartMoneyService (⚪ 暂缓)
- 优先级低，使用 leaderboard 变通
