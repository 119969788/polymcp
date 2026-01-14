# Trader Tools E2E Test

> 交易者分析工具端到端测试

---

## 工具清单

| 工具 | 功能 | 认证 | 优先级 |
|------|------|------|--------|
| `get_leaderboard` | 获取 PnL 排行榜 | 无 | P1 |
| `get_trader_profile` | 获取交易者资料 | 无 | P1 |
| `get_trader_positions` | 获取持仓和 PnL | 无 | P0 |
| `get_trader_trades` | 获取交易历史 | 无 | P1 |

---

## Test Case 1: get_leaderboard

### 1.1 默认参数
```
调用: get_leaderboard()
预期: 返回 10 个交易者，按 PnL 排序
验证:
- traders 数组长度 = 10
- 每个 trader 有 rank, address, pnl, volume
- rank 从 1 开始递增
```

### 1.2 自定义 limit
```
调用: get_leaderboard(limit=5)
预期: 返回 5 个交易者
验证:
- traders 数组长度 = 5
```

### 1.3 分页测试
```
调用: get_leaderboard(limit=5, offset=5)
预期: 返回第 6-10 名交易者
验证:
- 第一个 trader 的 rank = 6
- 与 offset=0 的结果不重叠
```

---

## Test Case 2: get_trader_profile

### 2.1 有效地址
```
前置: 从 leaderboard 获取一个地址
调用: get_trader_profile(address=<top_trader>)
预期: 返回完整的交易者资料
验证:
- trader.address 匹配
- ranking.rank 存在
- performance.officialPnl 存在
- stats.positionCount >= 0
```

### 2.2 无效地址
```
调用: get_trader_profile(address="0x0000000000000000000000000000000000000000")
预期: 返回空数据或错误
验证:
- 错误信息清晰
```

---

## Test Case 3: get_trader_positions

### 3.1 有持仓的交易者
```
前置: 从 leaderboard 获取顶级交易者
调用: get_trader_positions(address=<top_trader>)
预期: 返回持仓列表和汇总
验证:
- positions 是数组
- 每个 position 有 market, holding, pnl
- summary.totalPositions 匹配 positions.length
- unrealizedPnl 和 realizedPnl 有值
```

### 3.2 无持仓的地址
```
调用: get_trader_positions(address=<new_address>)
预期: 返回空持仓列表
验证:
- positions = []
- summary.totalPositions = 0
```

---

## Test Case 4: get_trader_trades

### 4.1 默认参数
```
前置: 从 leaderboard 获取活跃交易者
调用: get_trader_trades(address=<active_trader>)
预期: 返回最近 20 笔交易
验证:
- trades 数组长度 <= 20
- 每笔交易有 side, outcome, size, price, timestamp
- 按时间倒序排列
```

### 4.2 过滤 BUY
```
调用: get_trader_trades(address=<trader>, side="BUY")
预期: 只返回买入交易
验证:
- 所有 trade.side = "BUY"
```

### 4.3 过滤 SELL
```
调用: get_trader_trades(address=<trader>, side="SELL")
预期: 只返回卖出交易
验证:
- 所有 trade.side = "SELL"
```

### 4.4 自定义 limit
```
调用: get_trader_trades(address=<trader>, limit=5)
预期: 返回 5 笔交易
验证:
- trades.length <= 5
```

---

## 执行记录

| Test Case | 状态 | 结果 | 备注 |
|-----------|------|------|------|
| 1.1 get_leaderboard 默认 | - | - | - |
| 1.2 get_leaderboard limit | - | - | - |
| 1.3 get_leaderboard 分页 | - | - | - |
| 2.1 get_trader_profile 有效 | - | - | - |
| 2.2 get_trader_profile 无效 | - | - | - |
| 3.1 get_trader_positions 有持仓 | - | - | - |
| 3.2 get_trader_positions 无持仓 | - | - | - |
| 4.1 get_trader_trades 默认 | - | - | - |
| 4.2 get_trader_trades BUY | - | - | - |
| 4.3 get_trader_trades SELL | - | - | - |
| 4.4 get_trader_trades limit | - | - | - |

---

## 发现的问题

| ID | 问题描述 | 严重性 | 状态 |
|----|---------|--------|------|
| - | - | - | - |
