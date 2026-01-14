# Poly-MCP E2E 能力评估 v2

> 2024-12-29 (更新)

---

## 概述

本目录包含 poly-mcp 与 poly-sdk 的能力差距分析，识别缺失的工具和参数，并提供实现计划。

## 文档索引

| 文档 | 内容 |
|------|------|
| [00-gap-analysis.md](./00-gap-analysis.md) | 完整能力差距分析 |
| [01-test-scenarios.md](./01-test-scenarios.md) | 29 个真实场景测试 |
| [02-implementation-plan.md](./02-implementation-plan.md) | 分阶段实现计划 |

---

## 实现状态 ✅

### 场景覆盖率

```
总场景数: 29
✅ 完整支持: 26 (90%)
⚠️ 部分支持: 1 (3%)
❌ 无法完成: 2 (7%)
```

### 新增工具 (18 个)

| 类别 | 工具 | 状态 |
|------|------|------|
| **MarketService** | `get_klines` | ✅ 已实现 |
| | `get_price_history` | ✅ 已实现 |
| | `detect_arbitrage` | ✅ 已实现 |
| | `detect_market_signals` | ✅ 已实现 |
| | `get_realtime_spread` | ✅ 已实现 |
| **TradingService** | `cancel_all_orders` | ✅ 已实现 |
| | `get_my_trades` | ✅ 已实现 |
| | `get_earnings` | ✅ 已实现 |
| | `get_current_rewards` | ✅ 已实现 |
| | `check_order_scoring` | ✅ 已实现 |
| **OnchainService** | `ctf_split` | ✅ 已实现 |
| | `ctf_merge` | ✅ 已实现 |
| | `ctf_redeem` | ✅ 已实现 |
| | `get_position_balance` | ✅ 已实现 |
| | `get_market_resolution` | ✅ 已实现 |
| | `check_ctf_ready` | ✅ 已实现 |
| | `estimate_gas` | ✅ 已实现 |
| | `get_gas_price` | ✅ 已实现 |

---

## 剩余差距

### 暂不实现 (SmartMoneyService)

| 服务/工具 | 原因 |
|-----------|------|
| `get_smart_money_list` | SmartMoneyService 是 WalletService 封装，优先级低 |
| `check_is_smart_money` | 同上 |

**变通方案**:
- 使用 `get_leaderboard(sortBy="pnl")` 获取高 PnL 钱包
- 使用 `get_trader_profile` 查看 `smartScore`

---

## 文件变更

### 新增文件

```
packages/poly-mcp/src/tools/onchain.ts    # CTF 操作工具
```

### 修改文件

```
packages/poly-mcp/src/tools/market.ts     # 添加 5 个工具
packages/poly-mcp/src/tools/trade.ts      # 添加 5 个工具
packages/poly-mcp/src/tools/index.ts      # 更新导出
packages/poly-mcp/src/index.ts            # 注册新工具
packages/poly-mcp/src/types.ts            # 添加类型定义
```

---

## 工具总数

| 类别 | 数量 |
|------|------|
| Trader | 7 |
| Market | 10 |
| Order | 4 |
| Trade | 7 |
| Wallet | 12 |
| Onchain (CTF) | 8 |
| **总计** | **48** |
