# Market Tools E2E Test

> 市场查询工具端到端测试

---

## 工具清单

| 工具 | 功能 | 认证 | 优先级 |
|------|------|------|--------|
| `search_markets` | 搜索市场 | 无 | P1 |
| `get_trending_markets` | 趋势市场 | 无 | P3 |
| `get_market` | 市场详情 | 无 | P0 |
| `get_market_trades` | 市场成交 | 无 | P1 |

---

## Test Case 1: search_markets

### 1.1 热门关键词搜索
```
调用: search_markets(query="Trump")
预期: 返回与 Trump 相关的市场
验证:
- markets 是数组
- 每个市场的 question 或 slug 包含搜索词
- 按 volume 排序
```

### 1.2 技术关键词搜索
```
调用: search_markets(query="Bitcoin")
预期: 返回加密货币相关市场
验证:
- 结果与 Bitcoin/BTC 价格预测相关
```

### 1.3 active 过滤
```
调用: search_markets(query="2024", active=false)
预期: 包含已结束的市场
验证:
- 可能返回已关闭的 2024 年市场
```

### 1.4 limit 参数
```
调用: search_markets(query="election", limit=3)
预期: 最多返回 3 个市场
验证:
- markets.length <= 3
```

---

## Test Case 2: get_trending_markets

### 2.1 按交易量排序
```
调用: get_trending_markets(sortBy="volume")
预期: 返回高交易量市场
验证:
- markets 按 volume24h 降序排列
```

### 2.2 按流动性排序
```
调用: get_trending_markets(sortBy="liquidity")
预期: 返回高流动性市场
验证:
- 返回的市场流动性较高
```

### 2.3 最新市场
```
调用: get_trending_markets(sortBy="newest")
预期: 返回最近创建的市场
验证:
- 按创建时间排序
```

### 2.4 自定义数量
```
调用: get_trending_markets(limit=5)
预期: 返回 5 个市场
验证:
- markets.length = 5
```

---

## Test Case 3: get_market

### 3.1 使用 slug
```
调用: get_market(identifier="presidential-election-winner-2024")
预期: 返回完整市场信息
验证:
- market.slug 匹配
- prices.yes + prices.no ≈ 1.0
- tokens.yes 和 tokens.no 都有 tokenId
- status 字段存在
```

### 3.2 使用 conditionId
```
前置: 从 search_markets 获取一个 conditionId
调用: get_market(identifier=<conditionId>)
预期: 返回同样的市场信息
验证:
- 与使用 slug 返回的数据一致
```

### 3.3 无效标识符
```
调用: get_market(identifier="invalid-slug-12345")
预期: 返回错误
验证:
- 错误信息清晰说明市场不存在
```

---

## Test Case 4: get_market_trades

### 4.1 热门市场成交
```
前置: 获取一个高交易量市场的 conditionId
调用: get_market_trades(conditionId=<id>)
预期: 返回最近成交
验证:
- trades 是数组
- 每笔交易有 trader, side, outcome, size, price, timestamp
- 按时间倒序
```

### 4.2 自定义数量
```
调用: get_market_trades(conditionId=<id>, limit=5)
预期: 返回 5 笔成交
验证:
- trades.length <= 5
```

### 4.3 冷门市场
```
调用: get_market_trades(conditionId=<low_volume_market>)
预期: 返回较少或空的成交
验证:
- 即使没有成交也不报错
```

---

## 执行记录

| Test Case | 状态 | 结果 | 备注 |
|-----------|------|------|------|
| 1.1 search_markets Trump | - | - | - |
| 1.2 search_markets Bitcoin | - | - | - |
| 1.3 search_markets active=false | - | - | - |
| 1.4 search_markets limit | - | - | - |
| 2.1 trending volume | - | - | - |
| 2.2 trending liquidity | - | - | - |
| 2.3 trending newest | - | - | - |
| 2.4 trending limit | - | - | - |
| 3.1 get_market slug | - | - | - |
| 3.2 get_market conditionId | - | - | - |
| 3.3 get_market invalid | - | - | - |
| 4.1 market_trades 热门 | - | - | - |
| 4.2 market_trades limit | - | - | - |
| 4.3 market_trades 冷门 | - | - | - |

---

## 发现的问题

| ID | 问题描述 | 严重性 | 状态 |
|----|---------|--------|------|
| - | - | - | - |
