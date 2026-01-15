# 跟单交易使用指南

## 🎯 什么是跟单交易？

跟单交易（Copy Trading）是指跟随优秀交易者的策略，自动复制他们的交易行为。通过分析排行榜上的聪明钱交易者，你可以：

1. 发现表现优秀的交易者
2. 监控他们的交易行为
3. 自动或手动复制他们的交易

## 📋 跟单交易流程

### 步骤 1: 获取排行榜

首先查看表现最好的交易者：

```
get_leaderboard → 获取 Top 10 聪明钱地址
```

**示例问题**：
- "显示排行榜前 10 名交易者"
- "最近一周表现最好的交易者是谁？"

### 步骤 2: 分析交易者

选择要跟单的交易者，分析他们的持仓和交易历史：

```
get_trader_positions(address) → 查看当前持仓
get_trader_trades(address) → 查看交易历史
get_trader_profile(address) → 分析盈利模式
```

**示例问题**：
- "这个交易者当前有哪些持仓？"
- "这个交易者最近买了什么？"
- "这个交易者的盈利主要来自哪里？"

### 步骤 3: 评估市场

在跟单之前，评估目标市场的当前状态：

```
get_market(identifier) → 获取市场信息
get_orderbook(conditionId) → 查看盘口深度
estimate_execution(conditionId, outcome, side, amount) → 预估成交价格
```

**示例问题**：
- "这个市场的当前价格是多少？"
- "买入 100 USDC 的 Yes，预估成交价是多少？"
- "这个市场的流动性如何？"

### 步骤 4: 执行跟单

确认后，执行跟单交易：

```
place_limit_order(conditionId, outcome, side, price, size) → 下限价单
place_market_order(conditionId, outcome, side, amount) → 下市价单
```

**示例问题**：
- "帮我在这个市场买入 100 USDC 的 Yes，价格 0.55"
- "立即买入 50 USDC 的 Yes"

## 🔍 完整跟单示例

### 示例 1: 自动跟单流程

```
1. 获取排行榜
   → get_leaderboard(limit: 10)

2. 选择排名第一的交易者
   → get_trader_profile(address: "0x...")

3. 查看他的最新交易
   → get_trader_trades(address: "0x...", limit: 5)

4. 分析他买入的市场
   → get_market(identifier: "conditionId")

5. 评估当前价格
   → get_orderbook(conditionId: "0x...", outcome: "Yes")

6. 决定跟单
   → place_limit_order(
        conditionId: "0x...",
        outcome: "Yes",
        side: "BUY",
        price: 0.55,
        size: 100
      )
```

### 示例 2: 监控特定交易者

```
1. 监控交易者的新交易
   → get_trader_trades(address: "0x...", limit: 10)

2. 查看他的持仓变化
   → get_trader_positions(address: "0x...")

3. 如果发现新买入，评估是否跟单
   → get_market(identifier: "conditionId")
   → estimate_execution(...)
   → place_limit_order(...)
```

## 🛠️ 可用工具列表

### 交易者分析工具

| 工具 | 描述 | 用途 |
|------|------|------|
| `get_leaderboard` | 获取 PnL 排行榜 | 发现优秀交易者 |
| `get_trader_profile` | 获取交易者综合分析 | 了解交易者策略 |
| `get_trader_positions` | 获取当前持仓 | 查看交易者持仓 |
| `get_trader_trades` | 获取交易历史 | 监控交易行为 |
| `get_trader_activity` | 获取完整活动历史 | 全面分析交易者 |

### 市场分析工具

| 工具 | 描述 | 用途 |
|------|------|------|
| `get_market` | 获取市场详情 | 了解市场信息 |
| `get_orderbook` | 获取盘口深度 | 分析流动性 |
| `get_best_prices` | 获取最优买卖价 | 查看当前价格 |
| `estimate_execution` | 预估成交价格 | 评估交易成本 |

### 交易执行工具

| 工具 | 描述 | 用途 |
|------|------|------|
| `place_limit_order` | 下限价单 | 按指定价格买入/卖出 |
| `place_market_order` | 下市价单 | 立即成交 |
| `get_my_orders` | 查看挂单 | 管理订单 |
| `cancel_order` | 取消订单 | 取消未成交订单 |

## 💡 跟单策略建议

### 1. 选择跟单目标

- ✅ 选择长期表现稳定的交易者
- ✅ 关注胜率高的交易者
- ✅ 选择交易风格与你匹配的交易者
- ❌ 避免跟单波动性很大的交易者

### 2. 风险管理

- 不要全仓跟单
- 设置止损点
- 分散跟单多个交易者
- 定期评估跟单效果

### 3. 时机选择

- 关注交易者的新买入
- 评估市场当前价格是否合理
- 考虑市场流动性
- 避免在高波动时跟单

### 4. 监控和调整

- 定期查看交易者表现
- 如果交易者表现下滑，考虑停止跟单
- 根据市场变化调整跟单策略

## 📊 跟单检查清单

在跟单之前，确认：

- [ ] 已分析交易者的历史表现
- [ ] 已了解交易者的交易风格
- [ ] 已评估目标市场的当前状态
- [ ] 已计算预估成交价格和滑点
- [ ] 已设置合理的止损点
- [ ] 已确认资金充足
- [ ] 已了解市场风险

## 🚨 风险提示

1. **跟单有风险**：即使是最优秀的交易者也可能亏损
2. **市场变化**：交易者买入时的价格可能与你跟单时的价格不同
3. **时机差异**：你看到交易时，市场可能已经变化
4. **资金管理**：不要投入超过你能承受损失的资金

## 📝 使用示例

### 在 Claude Desktop 中使用

1. 打开 Claude Desktop
2. 确保 MCP 服务器已连接
3. 开始对话，例如：

```
"帮我找出排行榜前 5 名的交易者，分析他们的持仓，然后告诉我应该跟单哪个"
```

或者：

```
"排名第一的交易者最近买了什么？帮我评估一下是否应该跟单"
```

## 🔗 相关工具

- **聪明钱分析**: 使用 `get_leaderboard` 和 `get_trader_profile`
- **市场发现**: 使用 `search_markets` 和 `get_trending_markets`
- **套利检测**: 使用 `detect_arbitrage` 发现套利机会
- **内幕检测**: 使用 `scan_insider_wallets` 检测可疑交易

---

**开始跟单前，请确保你已经：**
1. ✅ 配置了钱包私钥（如果需要交易）
2. ✅ 了解了市场风险
3. ✅ 制定了风险管理策略
4. ✅ 测试了工具连接

祝你跟单顺利！🎉
