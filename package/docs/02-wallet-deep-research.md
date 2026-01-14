# 钱包深度分析指南

> 核心原则：**分页获取，逐步分析，边分析边输出**。解决仓位过多和上下文不足的问题。

---

## 设计原则

### 为什么要分页 + 逐步分析？

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 仓位太多获取不完 | API 单次最多返回 50/500 条 | 分页获取：offset + limit |
| 分析不深入 | 同时处理多个市场，每个都浅尝辄止 | 一次只分析一个市场 |
| 上下文不足 | 数据太多，信息被挤掉 | 边分析边输出，释放上下文 |
| 幻觉风险 | 数据太多记不住，开始编造 | 分批处理，及时输出 |

### 核心流程

```
基础信息 → 分页获取持仓 → 找核心盈亏来源 → 逐个深入分析 → 逐步输出报告
```

---

## 工具参数参考

### 持仓相关

| 工具 | 关键参数 | 说明 |
|------|----------|------|
| `get_trader_positions` | `limit` (max 500) | 当前持仓数量限制 |
|  | `offset` (0-10000) | 分页偏移量 |
|  | `sortBy` | CASHPNL, PERCENTPNL, CURRENT, INITIAL, TOKENS, TITLE, PRICE, AVGPRICE |
|  | `sortDirection` | ASC, DESC |
| `get_trader_closed_positions` | `limit` (max 50) | 已结算持仓数量限制 |
|  | `offset` (0-100000) | 分页偏移量 |
|  | `sortBy` | REALIZEDPNL, TIMESTAMP, TITLE, PRICE, AVGPRICE |
|  | `sortDirection` | ASC, DESC (找亏钱用 ASC) |

### 活动历史

| 工具 | 关键参数 | 说明 |
|------|----------|------|
| `get_trader_activity` | `limit` (max 500) | 活动数量限制 |
|  | `offset` (0-10000) | 分页偏移量 |
|  | `start` | Unix 秒，过滤此时间之后的活动 |
|  | `end` | Unix 秒，过滤此时间之前的活动 |
|  | `type` | TRADE, SPLIT, MERGE, REDEEM, REWARD, CONVERSION |
|  | `side` | BUY, SELL |
|  | `market` | 按 conditionId 过滤 |

---

## 完整分析流程

### Phase 1: 账户概览（快速）

**目标**：了解账户规模和基本特征

```
工具调用（并行）：
1. get_trader_profile(address)     → 排名、总 PnL、胜率
2. get_account_value(address)      → 账户总价值
```

**立即输出**：

```markdown
## 1. 账户概览

| 指标 | 值 |
|------|-----|
| 地址 | 0x... |
| 全站排名 | #X |
| 总 PnL | $X |
| 账户价值 | $X |
| 胜率 | X% |
```

---

### Phase 2: 持仓全景（分页获取）

**目标**：获取完整的持仓和历史数据，找出核心盈亏来源

#### Step 2.1: 获取当前持仓

```
工具调用：
get_trader_positions(address, limit=100, offset=0, sortBy='CASHPNL', sortDirection='DESC')
→ 如果返回 100 条，可能还有更多，继续：
get_trader_positions(address, limit=100, offset=100, sortBy='CASHPNL', sortDirection='DESC')
→ 直到返回少于 limit 条
```

#### Step 2.2: 获取已结算持仓 - TOP 盈利

```
工具调用：
get_trader_closed_positions(address, limit=50, offset=0, sortBy='REALIZEDPNL', sortDirection='DESC')
→ 获取 TOP 50 最赚钱的市场
```

#### Step 2.3: 获取已结算持仓 - TOP 亏损

```
工具调用：
get_trader_closed_positions(address, limit=50, offset=0, sortBy='REALIZEDPNL', sortDirection='ASC')
→ 获取 TOP 50 最亏钱的市场
```

**立即输出**：

```markdown
## 2. 持仓全景

### 当前持仓 (X 个)
| 市场 | 方向 | 价值 | 未实现盈亏 |
|------|------|------|-----------|
| ... | Yes/No | $X | +$X |

### 历史战绩
- 已结算市场: X 个
- 盈利市场: X 个
- 亏损市场: X 个

### TOP 5 盈利来源 (待深入分析)
1. [市场名] +$X ← 接下来重点分析
2. [市场名] +$X
3. [市场名] +$X
4. [市场名] +$X
5. [市场名] +$X

### TOP 5 亏损来源 (待分析)
1. [市场名] -$X
2. [市场名] -$X
3. [市场名] -$X
4. [市场名] -$X
5. [市场名] -$X
```

---

### Phase 3: 逐个市场深度分析

**关键原则**：一次只分析一个市场！分析完立即输出，再进入下一个。

#### 对每个重点市场：

```
工具调用：
1. get_market(conditionId)                                    → 市场详情
2. get_trader_activity(address, market=conditionId, limit=100) → 该钱包在此市场的操作
```

**分析要点**：
- 入场时间和价格
- 加仓/减仓行为
- 退出方式（止盈/持有到结算）
- 持仓周期

**立即输出（每个市场单独输出）**：

```markdown
### 3.1 [市场名称] (+$X)

**市场信息**
- 标题: ...
- 状态: 已结算/进行中
- 最终结果: Yes/No @ $X

**操作时间线**
| 时间 | 操作 | 方向 | 价格 | 数量 |
|------|------|------|------|------|
| 2024-03-15 | BUY | Yes | $0.35 | 1000 |
| 2024-06-20 | BUY | Yes | $0.42 | 500 |
| 2024-11-06 | REDEEM | - | $1.00 | 1500 |

**策略分析**
- 入场时机: 价格在 $0.35 时入场，处于低位
- 加仓行为: 价格上涨到 $0.42 时加仓
- 退出策略: 持有到结算
- 持仓周期: 约 8 个月
- 盈亏: +$X (+X%)
```

**完成一个后，再分析下一个市场...**

---

### Phase 4: 行为模式总结

```
基于已分析的市场数据总结，无需额外 API 调用
```

**立即输出**：

```markdown
## 4. 行为画像

| 维度 | 特征 |
|------|------|
| 交易风格 | 保守/激进 |
| 持仓周期 | 短期(<1周) / 中期(1-4周) / 长期(>1月) |
| 入场偏好 | 低价抄底 / 趋势跟随 / 事件驱动 |
| 退出策略 | 止盈 / 持有到结算 |
| 市场偏好 | 政治 / 加密 / 体育 |
| Bot 可能性 | 低/中/高 (基于 SPLIT/MERGE 占比) |
```

---

### Phase 5: 可复制策略提取

```markdown
## 5. 可复制策略

### 入场策略
- 价格条件: 当 Yes 价格 < $0.X 时入场
- 时机选择: ...

### 仓位管理
- 初始仓位: 总资金的 X%
- 加仓条件: ...

### 退出策略
- 止盈条件: 价格达到 $X 或涨幅 X%
- 止损条件: 价格跌破 $X
- 持有到结算比例: X%
```

---

### Phase 6: 总结

```markdown
## 6. 总结

[地址简称] 是一个 [风格] 型交易者，主要通过 [策略] 在 [市场类型] 获利。
核心优势是 [优势]，可学习的策略是 [策略要点]。
```

---

## Agent Prompt 模板

```
请对 Polymarket 钱包 [地址] 进行深度分析。

## 核心原则
1. **分页获取**：使用 offset 参数分页获取完整数据
2. **逐步分析**：一次只深入分析一个市场
3. **边分析边输出**：每个步骤完成后立即输出对应部分的报告
4. **释放上下文**：输出后不要保留原始数据，只保留结论

## 执行步骤

### Phase 1: 账户概览
并行调用 get_trader_profile 和 get_account_value
→ 输出: 账户概览表格

### Phase 2: 持仓全景

#### 2.1 获取当前持仓
get_trader_positions(address, limit=100, offset=0, sortBy='CASHPNL', sortDirection='DESC')
→ 如果满 100 条，继续 offset=100, 200... 直到返回不足 100 条

#### 2.2 获取 TOP 盈利持仓
get_trader_closed_positions(address, limit=50, sortBy='REALIZEDPNL', sortDirection='DESC')
→ 输出: TOP 5 最赚钱市场列表

#### 2.3 获取 TOP 亏损持仓
get_trader_closed_positions(address, limit=50, sortBy='REALIZEDPNL', sortDirection='ASC')
→ 输出: TOP 5 最亏钱市场列表

### Phase 3: 逐个市场深度分析

对 TOP 5 盈利 + TOP 3 亏损市场，依次执行：
1. 调用 get_market(conditionId) 获取市场信息
2. 调用 get_trader_activity(address, market=conditionId, limit=100) 获取操作历史
3. 分析入场/加仓/退出策略
4. **立即输出该市场的分析报告**
5. **完成后再进入下一个市场**

### Phase 4: 行为画像
基于已分析内容，总结行为特征
→ 输出: 行为画像表格

### Phase 5: 策略提取
提炼可复制的交易策略
→ 输出: 策略清单

### Phase 6: 总结
一句话概括
→ 输出: 总结

## 注意事项
- 如果仓位超过 500 个，只分析 TOP 相关的即可
- 每个市场分析完就输出，不要等到全部完成
- 输出后释放详细数据，只保留结论
```

---

## 简化版 Prompt（快速分析）

```
分析 Polymarket 钱包 [地址]。

要求：
1. 先获取 profile 和 account_value 了解概况
2. 用 get_trader_closed_positions(sortBy='REALIZEDPNL', limit=50) 找 TOP 5 最赚钱市场
3. 用 get_trader_closed_positions(sortBy='REALIZEDPNL', sortDirection='ASC', limit=50) 找 TOP 5 最亏钱市场
4. 对 TOP 3 盈利市场，逐个分析操作历史
5. 边分析边输出报告
```

---

## Activity 类型说明

| 类型 | 说明 | 策略含义 |
|------|------|----------|
| `TRADE` | 买卖交易 | 正常交易 |
| `SPLIT` | 1 USDC → 1 YES + 1 NO | 做市/套利 |
| `MERGE` | 1 YES + 1 NO → 1 USDC | 套利收割 |
| `REDEEM` | 结算后赎回 | 盈利兑现 |
| `REWARD` | 流动性奖励 | 做市收益 |

**Bot 检测**：如果 SPLIT/MERGE 占比 > 20%，大概率是套利 Bot。

---

## 分页策略汇总

| 数据类型 | 推荐策略 | 说明 |
|----------|----------|------|
| 当前持仓 | limit=100, 循环直到 < limit | 获取完整持仓 |
| 已结算持仓-盈利 | limit=50, sortDirection=DESC | TOP 50 最赚钱 |
| 已结算持仓-亏损 | limit=50, sortDirection=ASC | TOP 50 最亏钱 |
| 特定市场活动 | limit=100, market=conditionId | 单市场完整历史 |
| 时间段活动 | limit=500, start/end | 指定时间范围 |
