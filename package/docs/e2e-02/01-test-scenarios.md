# 真实场景测试用例

> 这些场景用于验证 poly-mcp 工具的完整性和正确性
> 更新日期: 2024-12-29 (工具补充后)

---

## 场景分类

| 类别 | 场景数 | 可完成 | 部分完成 | 无法完成 |
|------|--------|--------|----------|----------|
| 钱包分析 | 5 | 5 | 0 | 0 |
| 市场发现 | 5 | 5 | 0 | 0 |
| 交易执行 | 4 | 4 | 0 | 0 |
| 聪明钱 | 4 | 1 | 1 | 2 |
| 技术分析 | 4 | 4 | 0 | 0 |
| 做市 | 3 | 3 | 0 | 0 |
| CTF 操作 | 4 | 4 | 0 | 0 |

**总计: 29 场景, 26 可完成 (90%), 1 部分完成 (3%), 2 无法完成 (7%)**

---

## 类别 1: 钱包分析 (✅ 完整支持)

### 场景 1.1: 钱包基础画像

**用户输入**: "分析钱包 0xabc...def 的基本情况"

**工具调用链**:
```
1. get_trader_profile(address="0xabc...def")
   → 排名、PnL、胜率、交易量

2. get_account_value(address="0xabc...def")
   → 账户总价值
```

**状态**: ✅ 可完成

---

### 场景 1.2: 钱包持仓分析

**用户输入**: "这个钱包当前持有哪些市场？"

**工具调用链**:
```
1. get_trader_positions(address="0xabc...def")
   → 当前持仓列表、未实现盈亏
```

**状态**: ✅ 可完成

---

### 场景 1.3: 钱包历史战绩

**用户输入**: "这个钱包历史上最赚钱的交易是什么？"

**工具调用链**:
```
1. get_trader_closed_positions(address, sortBy="REALIZEDPNL", limit=10)
   → 已结算持仓按盈亏排序
```

**状态**: ✅ 可完成

---

### 场景 1.4: 单市场深度分析

**用户输入**: "分析这个钱包在 Trump 市场的操作"

**工具调用链**:
```
1. search_markets(query="Trump")
   → 找到 conditionId

2. get_trader_activity(address, market=conditionId, limit=50)
   → 该市场的所有操作历史

3. get_market(conditionId)
   → 市场状态和结果
```

**状态**: ✅ 可完成

---

### 场景 1.5: 排行榜查询

**用户输入**: "本月盈利最高的钱包是哪个？"

**工具调用链**:
```
1. get_leaderboard(period="month", sortBy="pnl", limit=1)
   → 月度排行榜第一名
```

**状态**: ✅ 可完成

---

## 类别 2: 市场发现 (✅ 完整支持)

### 场景 2.1: 热门市场

**用户输入**: "现在最热门的市场是什么？"

**工具调用链**:
```
1. get_trending_markets(limit=10, sortBy="volume")
   → 按交易量排序的热门市场
```

**状态**: ✅ 可完成

---

### 场景 2.2: 市场搜索

**用户输入**: "有没有关于比特币价格的市场？"

**工具调用链**:
```
1. search_markets(query="Bitcoin", active=true, limit=10)
   → 搜索结果
```

**状态**: ✅ 可完成

---

### 场景 2.3: 市场详情

**用户输入**: "告诉我 'us-recession-in-2025' 市场的详情"

**工具调用链**:
```
1. get_market(identifier="us-recession-in-2025")
   → 市场信息、价格、状态
```

**状态**: ✅ 可完成

---

### 场景 2.4: 市场交易流分析

**用户输入**: "这个市场最近的交易是什么方向？"

**工具调用链**:
```
1. get_market_trades(conditionId, limit=50)
   → 最近交易 + buyVolume24h / sellVolume24h 摘要
```

**状态**: ✅ 可完成

---

### 场景 2.5: 找出有套利机会的市场 ✅ (新增工具)

**用户输入**: "有没有套利机会？"

**工具调用链**:
```
1. get_trending_markets(limit=20)
   → 获取热门市场列表

2. FOR each market:
   detect_arbitrage(conditionId, threshold=0.005)
   → 检测套利机会 (long/short arb)
```

**状态**: ✅ 可完成 (已添加 `detect_arbitrage` 工具)

---

## 类别 3: 交易执行 (✅ 完整支持)

### 场景 3.1: 下单

**用户输入**: "在 Trump 市场买入 $50 的 Yes"

**工具调用链**:
```
1. search_markets(query="Trump")
   → conditionId

2. place_market_order(conditionId, outcome="Yes", side="BUY", amount=50)
   → 订单结果
```

**状态**: ✅ 可完成

---

### 场景 3.2: 查看订单

**用户输入**: "我现在有哪些挂单？"

**工具调用链**:
```
1. get_my_orders(status="LIVE")
   → 订单列表
```

**状态**: ✅ 可完成

---

### 场景 3.3: 取消订单

**用户输入**: "取消订单 order_xxx"

**工具调用链**:
```
1. cancel_order(orderId="order_xxx")
   → 取消结果
```

**状态**: ✅ 可完成

---

### 场景 3.4: 取消所有订单 ✅ (新增工具)

**用户输入**: "取消我所有的挂单"

**工具调用链**:
```
1. cancel_all_orders()
   → 一次性取消所有挂单
```

**状态**: ✅ 可完成 (已添加 `cancel_all_orders` 工具)

---

## 类别 4: 聪明钱 (⚠️ 部分支持)

### 场景 4.1: 发现聪明钱 ❌

**用户输入**: "谁是 Polymarket 上的聪明钱？"

**工具调用链**:
```
1. get_smart_money_list(limit=20, minPnl=10000) → ❌ 工具不存在
```

**状态**: ❌ 无法完成

**变通方案**:
```
1. get_leaderboard(limit=100, sortBy="pnl")
   → 可以获取排行榜，但无法识别"聪明钱"特征
```

**备注**: SmartMoneyService 是 WalletService 的封装，暂不实现。

---

### 场景 4.2: 检查是否聪明钱 ❌

**用户输入**: "0xabc...def 是聪明钱吗？"

**工具调用链**:
```
1. check_is_smart_money(address="0xabc...def") → ❌ 工具不存在
```

**状态**: ❌ 无法完成

---

### 场景 4.3: 聪明钱持仓对比 ⚠️

**用户输入**: "聪明钱们都在买什么？"

**工具调用链**:
```
1. get_leaderboard(limit=10, sortBy="pnl")
   → 获取排行榜前 10

2. FOR each trader:
   get_trader_positions(address)
   → 获取持仓
```

**状态**: ⚠️ 部分可完成 (使用排行榜代替聪明钱列表)

---

### 场景 4.4: 分析某个钱包的聪明钱得分 ✅

**用户输入**: "分析这个钱包是不是值得跟单"

**工具调用链**:
```
1. get_trader_profile(address)
   → PnL、胜率、smartScore

2. get_trader_closed_positions(address, sortBy="REALIZEDPNL")
   → 分析历史表现

3. get_trader_trades(address, limit=50)
   → 分析最近交易模式
```

**状态**: ✅ 可完成 (profile 中包含 smartScore)

---

## 类别 5: 技术分析 (✅ 完整支持 - 新增)

### 场景 5.1: K 线分析 ✅ (新增工具)

**用户输入**: "给我这个市场的 1 小时 K 线"

**工具调用链**:
```
1. get_klines(conditionId, interval="1h", limit=100)
   → K 线数据 (OHLCV)
```

**状态**: ✅ 可完成 (已添加 `get_klines` 工具)

---

### 场景 5.2: 双向 K 线分析 ✅ (新增工具)

**用户输入**: "对比 Yes 和 No 的价格走势"

**工具调用链**:
```
1. get_klines(conditionId, interval="1h", outcome="both")
   → 同时获取 Yes 和 No 的 K 线，包含 spread 分析
```

**状态**: ✅ 可完成

---

### 场景 5.3: 价格历史 ✅ (新增工具)

**用户输入**: "这个市场过去一周价格走势如何？"

**工具调用链**:
```
1. get_price_history(tokenId, interval="1w")
   → 价格历史数据
```

**状态**: ✅ 可完成 (已添加 `get_price_history` 工具)

---

### 场景 5.4: 实时价差分析 ✅ (新增工具)

**用户输入**: "这个市场的价差是多少？"

**工具调用链**:
```
1. get_realtime_spread(conditionId)
   → Yes/No 的 bid/ask、spread、套利机会分析
```

**状态**: ✅ 可完成 (已添加 `get_realtime_spread` 工具)

---

## 类别 6: 做市 (✅ 完整支持 - 新增)

### 场景 6.1: 查看收益 ✅ (新增工具)

**用户输入**: "我今天做市赚了多少？"

**工具调用链**:
```
1. get_earnings(date="2024-12-29")
   → 当日做市收益
```

**状态**: ✅ 可完成 (已添加 `get_earnings` 工具)

---

### 场景 6.2: 发现奖励市场 ✅ (新增工具)

**用户输入**: "哪些市场有做市奖励？"

**工具调用链**:
```
1. get_current_rewards()
   → 当前有奖励的市场列表
```

**状态**: ✅ 可完成 (已添加 `get_current_rewards` 工具)

---

### 场景 6.3: 检查订单是否计分 ✅ (新增工具)

**用户输入**: "我的订单在计分吗？"

**工具调用链**:
```
1. get_my_orders(status="LIVE")
   → 获取订单列表

2. check_order_scoring(orderId)
   → 检查订单是否计分
```

**状态**: ✅ 可完成 (已添加 `check_order_scoring` 工具)

---

## 类别 7: CTF 操作 (✅ 完整支持 - 新增)

### 场景 7.1: Split 操作

**用户输入**: "我想把 100 USDC 拆分成 Yes 和 No 代币"

**工具调用链**:
```
1. check_ctf_ready(amount="100")
   → 检查余额和授权是否就绪

2. ctf_split(conditionId, amount="100")
   → 执行 Split: 100 USDC → 100 Yes + 100 No
```

**状态**: ✅ 可完成 (已添加 CTF 工具)

---

### 场景 7.2: Merge 操作

**用户输入**: "把我的 Yes 和 No 代币合并回 USDC"

**工具调用链**:
```
1. get_position_balance(conditionId)
   → 查看 Yes/No 余额

2. ctf_merge(conditionId, amount="100")
   → 执行 Merge: 100 Yes + 100 No → 100 USDC
```

**状态**: ✅ 可完成

---

### 场景 7.3: Redeem 操作

**用户输入**: "市场已经结算了，帮我赎回获胜代币"

**工具调用链**:
```
1. get_market_resolution(conditionId)
   → 检查市场是否已结算，获取获胜方

2. ctf_redeem(conditionId)
   → 赎回获胜代币为 USDC
```

**状态**: ✅ 可完成

---

### 场景 7.4: Gas 估算

**用户输入**: "Split 100 USDC 需要多少 Gas？"

**工具调用链**:
```
1. get_gas_price()
   → 当前 Polygon 网络 Gas 价格

2. estimate_gas(operation="split", conditionId, amount="100")
   → 估算 Gas 费用 (MATIC 和 USD)
```

**状态**: ✅ 可完成

---

## 总结

### 工具补充前后对比

| 指标 | 补充前 | 补充后 | 变化 |
|------|--------|--------|------|
| 总场景数 | 23 | 29 | +6 |
| 可完成 | 11 (48%) | 26 (90%) | +15 |
| 部分完成 | 2 (9%) | 1 (3%) | -1 |
| 无法完成 | 10 (43%) | 2 (7%) | -8 |

### 新增工具列表

| 类别 | 工具 | 功能 |
|------|------|------|
| MarketService | `get_klines` | K 线数据 |
| | `get_price_history` | 价格历史 |
| | `detect_arbitrage` | 套利检测 |
| | `detect_market_signals` | 市场信号 |
| | `get_realtime_spread` | 实时价差 |
| TradingService | `cancel_all_orders` | 批量取消 |
| | `get_my_trades` | 交易历史 |
| | `get_earnings` | 做市收益 |
| | `get_current_rewards` | 奖励市场 |
| | `check_order_scoring` | 订单计分 |
| OnchainService | `ctf_split` | Split 操作 |
| | `ctf_merge` | Merge 操作 |
| | `ctf_redeem` | Redeem 操作 |
| | `get_position_balance` | 持仓余额 |
| | `get_market_resolution` | 市场结算 |
| | `check_ctf_ready` | CTF 就绪检查 |
| | `estimate_gas` | Gas 估算 |
| | `get_gas_price` | Gas 价格 |

### 剩余无法完成的场景

| 场景 | 原因 | 变通方案 |
|------|------|----------|
| 4.1 发现聪明钱 | SmartMoneyService 暂不实现 | 使用 `get_leaderboard` |
| 4.2 检查是否聪明钱 | 同上 | 使用 `get_trader_profile` 查看 smartScore |
