# 实现计划

> 按优先级排列的工具补充计划
> 状态: ✅ 已完成 (2024-12-29)

---

## Phase 1: MarketService 工具 ✅ 已完成

### 目标
让 MCP 能够获取 K 线、价格历史、套利和信号检测。

### 实现的工具

| 工具 | 功能 | 文件 |
|------|------|------|
| `get_klines` | K 线数据 (支持 dual K-lines) | `market.ts` |
| `get_price_history` | 价格历史 | `market.ts` |
| `detect_arbitrage` | 套利检测 | `market.ts` |
| `detect_market_signals` | 市场信号 | `market.ts` |
| `get_realtime_spread` | 实时价差 | `market.ts` |

### 使用示例

```typescript
// K 线数据
get_klines(conditionId, interval="1h", limit=100)
get_klines(conditionId, interval="1h", outcome="both")  // dual K-lines

// 价格历史
get_price_history(tokenId, interval="1w")

// 套利检测
detect_arbitrage(conditionId, threshold=0.005)

// 市场信号
detect_market_signals(conditionId)

// 实时价差
get_realtime_spread(conditionId)
```

---

## Phase 2: TradingService 工具 ✅ 已完成

### 目标
扩展交易功能，支持批量取消、交易历史和做市奖励。

### 实现的工具

| 工具 | 功能 | 文件 |
|------|------|------|
| `cancel_all_orders` | 取消所有订单 | `trade.ts` |
| `get_my_trades` | 交易历史 | `trade.ts` |
| `get_earnings` | 做市收益 | `trade.ts` |
| `get_current_rewards` | 奖励市场 | `trade.ts` |
| `check_order_scoring` | 订单计分 | `trade.ts` |

### 使用示例

```typescript
// 取消所有订单
cancel_all_orders()

// 交易历史
get_my_trades(limit=50, market=conditionId)

// 做市收益
get_earnings(date="2024-12-29")

// 奖励市场
get_current_rewards()

// 订单计分
check_order_scoring(orderId)
```

---

## Phase 3: OnchainService (CTF) 工具 ✅ 已完成

### 目标
支持 CTF (Conditional Token Framework) 操作: Split, Merge, Redeem。

### 实现的工具

| 工具 | 功能 | 文件 |
|------|------|------|
| `ctf_split` | Split USDC → YES + NO | `onchain.ts` |
| `ctf_merge` | Merge YES + NO → USDC | `onchain.ts` |
| `ctf_redeem` | 赎回获胜代币 | `onchain.ts` |
| `get_position_balance` | CTF 持仓余额 | `onchain.ts` |
| `get_market_resolution` | 市场结算状态 | `onchain.ts` |
| `check_ctf_ready` | CTF 就绪检查 | `onchain.ts` |
| `estimate_gas` | Gas 估算 | `onchain.ts` |
| `get_gas_price` | Gas 价格 | `onchain.ts` |

### 使用示例

```typescript
// 检查就绪状态
check_ctf_ready(amount="100")

// Split
ctf_split(conditionId, amount="100")

// Merge
ctf_merge(conditionId, amount="100")

// 查看余额
get_position_balance(conditionId)

// 检查市场结算
get_market_resolution(conditionId)

// Redeem
ctf_redeem(conditionId)

// Gas
get_gas_price()
estimate_gas(operation="split", conditionId, amount="100")
```

---

## Phase 4: SmartMoneyService ⚪ 暂缓

### 原因
SmartMoneyService 是 WalletService 的封装，核心数据已通过以下工具获取:
- `get_leaderboard(sortBy="pnl")` - 高 PnL 钱包
- `get_trader_profile` - smartScore 字段

### 变通方案

```typescript
// 获取"聪明钱"候选
get_leaderboard(limit=100, sortBy="pnl")

// 评估钱包质量
get_trader_profile(address)
// 返回 { stats: { smartScore: 40 } }
```

---

## 实现完成清单

### ✅ Phase 1: MarketService
- [x] 创建 K 线工具定义
- [x] 实现 `handleGetKlines`
- [x] 实现 `handleGetPriceHistory`
- [x] 实现 `handleDetectArbitrage`
- [x] 实现 `handleDetectMarketSignals`
- [x] 实现 `handleGetRealtimeSpread`
- [x] 添加类型定义
- [x] 注册到 MCP server

### ✅ Phase 2: TradingService
- [x] 实现 `handleCancelAllOrders`
- [x] 实现 `handleGetMyTrades`
- [x] 实现 `handleGetEarnings`
- [x] 实现 `handleGetCurrentRewards`
- [x] 实现 `handleCheckOrderScoring`
- [x] 添加类型定义
- [x] 注册到 MCP server

### ✅ Phase 3: OnchainService
- [x] 创建 `onchain.ts` 文件
- [x] 实现 `handleCtfSplit`
- [x] 实现 `handleCtfMerge`
- [x] 实现 `handleCtfRedeem`
- [x] 实现 `handleGetPositionBalance`
- [x] 实现 `handleGetMarketResolution`
- [x] 实现 `handleCheckCtfReady`
- [x] 实现 `handleEstimateGas`
- [x] 实现 `handleGetGasPrice`
- [x] 添加类型定义
- [x] 注册到 MCP server

---

## 验收结果

| 验收项 | 状态 |
|--------|------|
| TypeScript 编译通过 | ✅ |
| 工具定义正确注册 | ✅ |
| 场景覆盖率 90%+ | ✅ (90%) |
| 文档更新 | ✅ |
