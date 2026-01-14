# Order Tools E2E Test

> 订单簿分析工具端到端测试

---

## 工具清单

| 工具 | 功能 | 认证 | 优先级 |
|------|------|------|--------|
| `get_orderbook` | 获取订单簿深度 | 无 | P0 |
| `get_best_prices` | 获取最优价格 | 无 | P1 |
| `estimate_execution` | 估算执行成本 | 无 | P3 |

---

## Test Case 1: get_orderbook

### 1.1 Yes 方向订单簿
```
前置: 获取一个活跃市场的 conditionId
调用: get_orderbook(conditionId=<id>, outcome="Yes")
预期: 返回 Yes 方向的订单簿
验证:
- orderbook.bids 存在且是数组
- orderbook.asks 存在且是数组
- 每个价格级有 price, size, total
- bids 按价格降序，asks 按价格升序
- summary.bestBid <= summary.bestAsk
```

### 1.2 No 方向订单簿
```
调用: get_orderbook(conditionId=<id>, outcome="No")
预期: 返回 No 方向的订单簿
验证:
- 数据结构与 Yes 方向一致
- Yes.bestBid + No.bestBid ≈ 1.0 (套利检查)
```

### 1.3 自定义深度
```
调用: get_orderbook(conditionId=<id>, outcome="Yes", depth=5)
预期: 返回 5 个价格级
验证:
- bids.length <= 5
- asks.length <= 5
```

### 1.4 深度 = 20
```
调用: get_orderbook(conditionId=<id>, outcome="Yes", depth=20)
预期: 返回更多价格级
验证:
- 如果市场流动性足够，返回更多级别
```

---

## Test Case 2: get_best_prices

### 2.1 双向最优价格
```
前置: 获取一个活跃市场的 conditionId
调用: get_best_prices(conditionId=<id>)
预期: 返回 Yes 和 No 的最优价格
验证:
- yes.bestBid, yes.bestAsk 存在
- no.bestBid, no.bestAsk 存在
- yes.spread = yes.bestAsk - yes.bestBid
- no.spread = no.bestAsk - no.bestBid
```

### 2.2 价格一致性验证
```
前置: 同时调用 get_orderbook(Yes) 和 get_best_prices
验证:
- get_best_prices.yes.bestBid = get_orderbook(Yes).summary.bestBid
- get_best_prices.yes.bestAsk = get_orderbook(Yes).summary.bestAsk
```

### 2.3 套利空间检查
```
验证:
- yes.bestBid + no.bestAsk 是否 > 1.0 (卖出套利)
- yes.bestAsk + no.bestBid 是否 < 1.0 (买入套利)
- 记录发现的套利机会
```

---

## Test Case 3: estimate_execution

### 3.1 小额买入估算
```
前置: 获取一个活跃市场
调用: estimate_execution(conditionId=<id>, outcome="Yes", side="BUY", amount=100)
预期: 估算 $100 买入 Yes 的成本
验证:
- estimate.avgPrice 存在
- estimate.sharesReceived 存在
- estimate.priceImpact 较小 (< 1%)
```

### 3.2 大额买入估算
```
调用: estimate_execution(conditionId=<id>, outcome="Yes", side="BUY", amount=1000)
预期: 估算 $1000 买入的成本
验证:
- priceImpact 比小额大
- avgPrice 比小额高
- 可能有 warning 字段
```

### 3.3 超大额买入
```
调用: estimate_execution(conditionId=<id>, outcome="Yes", side="BUY", amount=10000)
预期: 显示高滑点警告
验证:
- priceImpact > 5%
- warning 字段存在
```

### 3.4 卖出估算
```
调用: estimate_execution(conditionId=<id>, outcome="Yes", side="SELL", amount=500)
预期: 估算卖出成本
验证:
- avgPrice 存在
- 卖出价格通常低于买入价格
```

### 3.5 No 方向估算
```
调用: estimate_execution(conditionId=<id>, outcome="No", side="BUY", amount=500)
预期: 估算 No 方向买入
验证:
- 数据结构一致
```

---

## 执行记录

| Test Case | 状态 | 结果 | 备注 |
|-----------|------|------|------|
| 1.1 orderbook Yes | - | - | - |
| 1.2 orderbook No | - | - | - |
| 1.3 orderbook depth=5 | - | - | - |
| 1.4 orderbook depth=20 | - | - | - |
| 2.1 best_prices 双向 | - | - | - |
| 2.2 best_prices 一致性 | - | - | - |
| 2.3 套利空间检查 | - | - | - |
| 3.1 estimate 小额 | - | - | - |
| 3.2 estimate 大额 | - | - | - |
| 3.3 estimate 超大额 | - | - | - |
| 3.4 estimate 卖出 | - | - | - |
| 3.5 estimate No | - | - | - |

---

## 发现的问题

| ID | 问题描述 | 严重性 | 状态 |
|----|---------|--------|------|
| - | - | - | - |
