/**
 * Usage Guide Tool
 *
 * AI agents should call this tool FIRST to understand how to use Polymarket MCP.
 * Returns common use cases and recommended tool combinations.
 */

import type { ToolDefinition } from '../types.js';

// Local type to avoid circular import
type GuideHandler = (args: Record<string, unknown>) => Promise<unknown>;

export const guideToolDefinitions: ToolDefinition[] = [
  {
    name: 'get_usage_guide',
    description:
      '🚀 START HERE! Get usage guide and common scenarios for Polymarket MCP. Call this FIRST to understand available tools and recommended workflows.',
    inputSchema: {
      type: 'object',
      properties: {
        scenario: {
          type: 'string',
          enum: [
            'overview',
            'smart_money_analysis',
            'trader_deep_dive',
            'wallet_tracking',
            'market_discovery',
            'sports_strategy',
            'copy_trading',
            'deposit_and_auth',
            'trading',
            'redeem_positions',
          ],
          description:
            'Specific scenario to get detailed guide for. Default: overview',
        },
      },
    },
  },
];

const OVERVIEW_GUIDE = `
# Polymarket MCP 使用指南

## 🎯 核心能力

本 MCP 提供 Polymarket 预测市场的完整访问能力：

| 类别 | 工具 | 用途 |
|------|------|------|
| **市场** | search_markets, get_market, get_orderbook | 发现和分析市场 |
| **钱包** | get_wallet_positions, get_wallet_trades, get_wallet_pnl | 追踪钱包活动 |
| **排行榜** | get_leaderboard | 获取聪明钱地址 |
| **充值** | deposit_usdc, swap, swap_and_deposit | 资金充值和转换 |
| **授权** | check_allowances, approve_trading | 交易授权管理 |
| **交易** | create_order, cancel_order, get_open_orders | 执行交易 |
| **CTF** | ctf_split, ctf_merge, ctf_redeem | 拆分/合并/赎回条件代币 |
| **结算** | get_market_resolution, get_position_balance | 检查市场结算和仓位余额 |

## 📋 常见场景

### 1. 分析聪明钱 (smart_money_analysis)
\`\`\`
get_leaderboard → 获取 Top 10 聪明钱
  ↓
get_wallet_positions(address) → 查看每个钱包持仓
  ↓
get_wallet_pnl(address) → 分析盈利模式
\`\`\`

### 2. 深度分析交易者策略 (trader_deep_dive) ⭐ 新增
\`\`\`
get_wallet_positions(address) → 持仓分析
  ↓
按 eventSlug 分组 → 识别对冲 vs 单边策略
  ↓
get_wallet_trades(address) → 入场时机分析
  ↓
判断策略类型: 对冲型/方向型/套利型/做市型
\`\`\`

### 3. 跟单交易 (copy_trading) ⭐ 新增
\`\`\`
get_leaderboard → 选择跟单目标
  ↓
get_wallet_trades(address) → 监控新交易
  ↓
get_market + get_orderbook → 评估当前价格
  ↓
create_order → 跟进交易
\`\`\`

### 4. 追踪特定钱包 (wallet_tracking)
\`\`\`
get_wallet_trades(address, startTime) → 查看今日交易
  ↓
get_wallet_positions(address) → 当前持仓
  ↓
get_market(conditionId) → 深入分析相关市场
\`\`\`

### 5. 发现热门市场 (market_discovery)
\`\`\`
search_markets(query, sortBy: 'volume24hr') → 热门市场
  ↓
get_orderbook(conditionId) → 分析流动性
  ↓
get_leaderboard → 查看哪些聪明钱参与
\`\`\`

### 6. 体育市场策略 (sports_strategy)
\`\`\`
search_markets(query: 'NBA/NFL/soccer', tag: 'Sports') → 体育市场
  ↓
get_market(conditionId) → 查看赔率和截止时间
  ↓
get_orderbook → 分析价差和深度
\`\`\`

### 7. 赎回获胜仓位 (redeem_positions) ⭐ 新增
\`\`\`
get_trader_positions(address) → 查找 redeemable=true 的仓位
  ↓
get_market(conditionId) → 获取 tokenIds
  ↓
get_market_resolution(conditionId) → 确认已结算
  ↓
ctf_redeem(conditionId, tokenIds) → 赎回获胜代币
\`\`\`

## 💡 Pro Tips

1. **总是先用 get_leaderboard** 获取聪明钱地址列表
2. **用 search_markets 的 tag 参数** 过滤特定类别 (Politics, Sports, Crypto)
3. **分析持仓时看 avgPrice vs curPrice** 判断盈亏状态
4. **查看 volume24hr** 判断市场活跃度

调用 get_usage_guide(scenario: 'xxx') 获取特定场景的详细指南。
`;

const SMART_MONEY_GUIDE = `
# 聪明钱分析指南

## 🎯 目标
分析 Top 聪明钱的持仓策略，了解他们如何获利。

## 📋 推荐流程

### Step 1: 获取聪明钱列表
\`\`\`
get_leaderboard(limit: 10)
\`\`\`
返回按 PnL 排名的钱包，关注字段：
- \`address\`: 钱包地址
- \`pnl\`: 总盈亏
- \`volume\`: 总交易量

### Step 2: 分析每个钱包持仓
\`\`\`
get_wallet_positions(address)
\`\`\`
关键分析点：
- \`size\`: 持仓大小
- \`avgPrice\` vs \`curPrice\`: 判断浮盈/浮亏
- \`cashPnl\`: 该持仓盈亏
- \`outcome\`: 押注方向 (Yes/No)

### Step 3: 分析交易历史
\`\`\`
get_wallet_trades(address, limit: 50)
\`\`\`
观察：
- 买入时机和价格
- 是否有加仓/减仓行为
- 偏好的市场类型

### Step 4: 计算盈利效率
\`\`\`
get_wallet_pnl(address)
\`\`\`
关注：
- 胜率
- 平均盈亏比
- ROI

## 💡 分析要点

1. **跟踪大单**: size > $10,000 的持仓值得关注
2. **价格优势**: avgPrice 远低于 curPrice 说明入场时机好
3. **市场选择**: 看他们主要玩哪类市场 (政治/体育/加密)
4. **风险管理**: 是否分散投资还是集中押注

## 📝 示例问题

- "Top 10 聪明钱主要在哪些市场有持仓？"
- "排名第一的钱包是怎么赚钱的？"
- "聪明钱最近买入了哪些市场？"
`;

const TRADER_DEEP_DIVE_GUIDE = `
# 交易者深度分析指南

## 🎯 目标
深入分析一个交易者的策略模式，理解他们如何盈利。

## 📋 分析框架

### Step 1: 识别策略类型

通过交易模式判断交易者类型：

| 类型 | 特征 | 如何识别 |
|------|------|---------|
| **对冲型** | 同一事件买 Yes 和 No | 持仓中同一 eventSlug 有多个方向 |
| **方向型** | 单边押注 | 只买 Yes 或只买 No |
| **套利型** | 跨市场价差 | 相关市场有相反方向持仓 |
| **做市型** | 提供流动性 | 大量小额双向交易 |

\`\`\`
get_wallet_positions(address)
→ 检查同一 eventSlug 是否有多个持仓
→ 如果有，很可能是对冲型策略
\`\`\`

### Step 2: 分析入场时机

\`\`\`
get_wallet_trades(address, limit: 100)
\`\`\`

关键分析点：
- **avgPrice vs curPrice**: 入场价格好不好
- **交易时间顺序**: 先买什么后买什么
- **同一事件的多笔交易**: 是否在加仓或对冲

### Step 3: 对冲配对检测

手动检测方法：
\`\`\`
1. 获取所有持仓
2. 按 eventSlug 分组
3. 如果同一事件有 Yes 和 No 持仓 = 对冲

示例分析：
positions.filter(p => p.eventSlug === "cs2-xxx-match")
→ [{ outcome: "Team A", size: 1000, avgPrice: 0.65 },
   { outcome: "Team B", size: 500, avgPrice: 0.20 }]
→ 这是对冲！先买 favorite，后买 underdog
\`\`\`

### Step 4: 盈利归因

| 盈利来源 | 如何判断 |
|---------|---------|
| **时机好** | avgPrice 远低于 curPrice |
| **对冲锁利** | 两边持仓成本 < 1，无论结果都赚 |
| **方向正确** | 单边押注，市场走向有利 |
| **高胜率** | 历史交易多数盈利 |

### Step 5: 策略可复制性评估

问自己：
- 这个策略需要什么信息优势？
- 入场时机是否可以复制？
- 资金量要求是多少？
- 是否依赖特定市场类型？

## 💡 Black-rabbit 风格分析

文章中 Black-rabbit 的策略特征：
\`\`\`
1. 市场类型: 电竞比赛 (CS2)
2. 策略类型: 对冲型
3. 入场模式:
   - 早期买入 favorite (高概率方)
   - 等待赔率极化
   - 后期买入 underdog (极低价格)
4. 盈利来源: 赔率波动，不是结果预测
\`\`\`

要识别这种策略：
\`\`\`
get_wallet_trades(address)
→ 按 eventSlug 分组
→ 检查交易时间顺序
→ 如果: 先买高概率方，后买低概率方 = 对冲策略
\`\`\`

## 📝 示例问题

- "这个交易者是什么策略类型？"
- "他的盈利主要来自哪里？"
- "他的策略可以复制吗？"
- "他在这场比赛是怎么操作的？"
`;

const COPY_TRADING_GUIDE = `
# 跟单交易指南

## 🎯 目标
跟随聪明钱的交易策略。

## ⚠️ 风险提示

跟单交易有固有风险：
- 你看到的是延迟信息，不是实时
- 聪明钱可能有你不知道的信息来源
- 市场条件可能已经变化
- 入场价格可能已经不理想

## 📋 跟单工作流

### Step 1: 选择跟单目标

\`\`\`
get_leaderboard(limit: 20)
\`\`\`

筛选标准：
- **高 PnL**: 证明能赚钱
- **高 Volume**: 证明是活跃交易者
- **稳定性**: 不是靠单笔暴赚

### Step 2: 理解策略类型

\`\`\`
get_usage_guide(scenario: "trader_deep_dive")
\`\`\`

确保你理解他的策略再跟单！

### Step 3: 监控新交易

\`\`\`
// 定期检查
get_wallet_trades(address, limit: 10)
→ 对比上次检查，发现新交易
\`\`\`

### Step 4: 评估是否跟进

发现新交易后，问自己：
- 当前价格还有利吗？
- 这笔交易符合他一贯的策略吗？
- 市场流动性足够吗？

\`\`\`
get_market(conditionId)
get_orderbook(conditionId)
\`\`\`

### Step 5: 执行跟单

\`\`\`
// 确认价格可接受后
create_order(
  conditionId: "...",
  outcome: "Yes",  // 和目标交易者一致
  side: "BUY",
  price: 0.55,     // 限价，不要市价追高
  size: 100
)
\`\`\`

## 💡 跟单策略建议

### 保守跟单
- 只跟 Top 5 交易者
- 只跟他们的大单 (>$1000)
- 设置严格止损

### 选择性跟单
- 只跟特定类型市场 (如体育)
- 只跟他们的对冲策略
- 避免跟方向性赌博

### 反向跟单
- 有时候跟"聪明钱的对手"更赚钱
- 特别是市场过度反应时

## 📊 跟单检查清单

\`\`\`
□ 目标交易者策略类型已理解
□ 当前入场价格可接受 (和他的 avgPrice 对比)
□ 市场流动性足够
□ 仓位大小在风险承受范围内
□ 有退出计划 (止盈/止损)
\`\`\`

## 📝 示例问题

- "排名第一的交易者最近买了什么？"
- "我应该跟着买入这个市场吗？"
- "当前价格比他的入场价高多少？"
- "有哪些活跃交易者值得跟单？"
`;

const WALLET_TRACKING_GUIDE = `
# 钱包追踪指南

## 🎯 目标
追踪特定钱包的交易活动和持仓变化。

## 📋 推荐流程

### 查看今日交易
\`\`\`
get_wallet_trades(
  address: "0x...",
  startTime: 今天0点的timestamp
)
\`\`\`

### 查看当前持仓
\`\`\`
get_wallet_positions(address: "0x...")
\`\`\`

### 深入分析市场
\`\`\`
get_market(conditionId)  // 从持仓中获取
get_orderbook(conditionId)
\`\`\`

## 💡 分析要点

1. **交易频率**: 高频交易者 vs 长期持有者
2. **买卖方向**: 最近是在买入还是卖出
3. **市场偏好**: 主要参与哪类市场
4. **时机把握**: 是否在关键时点交易

## 📝 示例问题

- "这个钱包今天有哪些交易？"
- "这个钱包目前持有哪些仓位？"
- "这个钱包最近的交易表现如何？"
`;

const MARKET_DISCOVERY_GUIDE = `
# 市场发现指南

## 🎯 目标
发现值得关注的热门市场，并分析聪明钱参与情况。

## 📋 推荐流程

### Step 1: 搜索热门市场
\`\`\`
search_markets(
  sortBy: 'volume24hr',  // 按24h交易量排序
  limit: 20
)
\`\`\`

或按类别搜索：
\`\`\`
search_markets(
  query: 'Trump',  // 关键词
  tag: 'Politics'  // 分类标签
)
\`\`\`

### Step 2: 分析市场深度
\`\`\`
get_orderbook(conditionId)
\`\`\`
关注：
- bid/ask spread: 价差越小流动性越好
- 深度: 大单能否成交

### Step 3: 查看聪明钱参与
\`\`\`
get_leaderboard(limit: 20)
  ↓
对每个地址: get_wallet_positions(address)
  ↓
过滤: 找出持有该市场的聪明钱
\`\`\`

## 💡 筛选标准

1. **volume24hr > $100k**: 活跃市场
2. **spread < 2%**: 流动性好
3. **聪明钱参与 > 3个**: 有信号价值
4. **距离截止 > 24h**: 还有交易时间

## 📝 示例问题

- "最近24小时哪些市场交易量最大？"
- "有哪些政治类市场值得关注？"
- "聪明钱最近在买入哪些市场？"
`;

const SPORTS_STRATEGY_GUIDE = `
# 体育市场策略指南

## 🎯 目标
制定体育市场投资策略。

## 📋 推荐流程

### Step 1: 发现体育市场
\`\`\`
search_markets(
  tag: 'Sports',
  query: 'NBA' | 'NFL' | 'Soccer'
)
\`\`\`

### Step 2: 分析赔率
\`\`\`
get_market(conditionId)
\`\`\`
关注：
- \`tokens[].price\`: Yes/No 价格即为隐含概率
- \`endDate\`: 比赛时间
- \`volume\`: 市场关注度

### Step 3: 对比传统赔率
\`\`\`
Polymarket Yes 价格 0.65 → 隐含胜率 65%
传统博彩赔率 1.8 → 隐含胜率 55%
→ 套利空间: 10%
\`\`\`

### Step 4: 分析流动性
\`\`\`
get_orderbook(conditionId)
\`\`\`
确保能以期望价格成交。

## 💡 体育市场特点

1. **时效性强**: 比赛开始前市场关闭
2. **信息不对称**: 伤病、阵容等内部消息
3. **波动大**: 赛前消息会剧烈影响价格
4. **流动性变化**: 临近比赛流动性增加

## 📊 策略建议

### 价值投注
- 寻找 Polymarket vs 传统赔率的差异
- 差异 > 5% 可能有价值

### 对冲策略
- Polymarket 买 Yes
- 传统博彩买 No (如果赔率更好)
- 锁定利润

### 信息优势
- 关注伤病报告
- 关注阵容变化
- 关注天气影响 (户外运动)

## 📝 示例问题

- "今天有哪些 NBA 比赛可以投注？"
- "这场比赛的赔率合理吗？"
- "哪些体育市场有套利机会？"
`;

const DEPOSIT_AND_AUTH_GUIDE = `
# 充值与授权指南

## 🎯 目标
准备好钱包进行 Polymarket 交易。

## ⚠️ 关键概念：USDC.e vs Native USDC

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│  Polymarket CTF 只接受 USDC.e (Bridged USDC)               │
│                                                             │
│  USDC.e:      0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 ✅ │
│  Native USDC: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 ❌ │
│                                                             │
│  常见错误：钱包显示有 USDC，但 CTF 操作失败                 │
│  原因：你有的是 Native USDC，不是 USDC.e                   │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## 📋 完整准备流程

### Step 1: 检查钱包状态
\`\`\`
check_ctf_ready(amount: "100")
\`\`\`
返回：
- \`usdcEBalance\`: USDC.e 余额 (用于 CTF)
- \`nativeUsdcBalance\`: Native USDC 余额 (不能用于 CTF)
- \`maticBalance\`: MATIC 余额 (用于 gas)
- \`ready\`: 是否准备就绪
- \`suggestion\`: 如果未就绪，给出建议

### Step 2: 充值 USDC.e

Polymarket CTF 交易需要 USDC.e (bridged USDC)，不是 Native USDC。

#### 方式 A: MATIC → USDC → deposit (推荐)
最可靠的路径，分两步完成：
\`\`\`
// Step 1: Swap MATIC 到 Native USDC (QuickSwap V3)
swap(
  tokenIn: "MATIC",
  tokenOut: "USDC",
  amount: "50"
)

// Step 2: Deposit USDC，Bridge 自动转成 USDC.e (1-5分钟)
deposit_usdc(
  amount: 25,
  token: "NATIVE_USDC"
)
\`\`\`

#### 方式 B: 已有 Native USDC
如果钱包已有 Native USDC，直接 deposit：
\`\`\`
deposit_usdc(
  amount: 100,
  token: "NATIVE_USDC"
)
\`\`\`
Bridge 会自动将 Native USDC 转换为 USDC.e。

#### 方式 C: 跨链充值
从其他链充值，Bridge 自动处理转换：
\`\`\`
get_deposit_addresses()  // 获取充值地址
\`\`\`
支持的链：Ethereum, Arbitrum, Base, Optimism, Solana, Bitcoin

#### ✅ 可用的 Swap 路径 (Quoter 验证)

QuickSwap V3 上有 15 个流动性池，主要路径：
\`\`\`
MATIC → USDC      ✅ 推荐
MATIC → USDC_E    ✅ 可直接 swap 到 USDC.e
USDC → USDC_E     ✅ 几乎 1:1 (稳定币对)
MATIC → USDT      ✅
MATIC → DAI       ✅
MATIC → WETH      ✅
\`\`\`

💡 使用 \`get_swap_quote\` 检查路径可用性和预估输出金额。
💡 使用 \`get_available_pools\` 查看所有 15 个可用的交易对。

#### ⚠️ 流动性注意事项
- 大额交易可能有较高滑点
- 建议先用 \`get_swap_quote\` 检查预估输出
- MATIC/USDC 和 USDC/USDC_E 流动性最好

#### 💡 检查 Swap 路径可用性

使用 \`get_swap_quote\` 在执行前检查路径是否可行：
\`\`\`
get_swap_quote(
  tokenIn: "MATIC",
  tokenOut: "USDC",
  amount: "10"
)
// 返回: { possible: true, route: ["MATIC", "USDC"], amountOut: "3.75" }
\`\`\`

使用 \`get_available_pools\` 查看所有可用的交易对：
\`\`\`
get_available_pools()
// 返回: { pools: [{ pair: "MATIC/USDC", ... }], totalPools: N }
\`\`\`

这些工具无需私钥，只需链上读取操作。

### Step 3: 检查授权状态
\`\`\`
check_allowances()
\`\`\`
返回每个合约的授权状态：
- CTF Exchange
- Neg Risk CTF Exchange
- Neg Risk Adapter
- Conditional Tokens

### Step 4: 设置授权
\`\`\`
approve_trading()
\`\`\`
一键授权所有必要的合约：
- ERC20 授权 (USDC.e)
- ERC1155 授权 (条件代币)

## 💡 授权详解

### 需要授权的合约

| 合约 | 地址 | 用途 |
|------|------|------|
| CTF Exchange | 0x4bFb41d5B... | 普通市场交易 |
| Neg Risk CTF Exchange | 0xC5d563A36... | 负风险市场交易 |
| Neg Risk Adapter | 0xd91E80cF2... | 负风险适配 |
| Conditional Tokens | 0x4D97DCd97... | CTF 操作 |

### 授权类型

1. **ERC20 授权**: 允许合约使用你的 USDC.e
2. **ERC1155 授权**: 允许合约转移你的条件代币

## 📊 状态检查流程图

\`\`\`
check_ctf_ready()
      │
      ├─ ready: true ──→ check_allowances()
      │                        │
      │                        ├─ all approved ──→ 可以交易!
      │                        │
      │                        └─ not approved ──→ approve_trading()
      │
      └─ ready: false
              │
              ├─ 缺 USDC.e ──→ deposit_usdc() 或 手动转换
              │
              └─ 缺 MATIC ──→ 需要充值 MATIC 作为 gas
\`\`\`

## ⚠️ 常见问题

### Q: 为什么显示 USDC 余额为 0？
A: 你可能有 Native USDC，不是 USDC.e。用 check_ctf_ready() 查看两种余额。

### Q: 授权需要 gas 吗？
A: 是的，每次授权需要少量 MATIC (约 $0.01)。

### Q: 授权是一次性的吗？
A: 是的，授权后除非撤销，否则一直有效。

### Q: 可以只授权部分金额吗？
A: 可以，但推荐授权无限额度，避免每次交易都要重新授权。

## 📝 示例问题

- "我的钱包准备好交易了吗？"
- "帮我检查授权状态"
- "我需要充值多少才能开始交易？"
- "为什么我的 USDC 余额显示为 0？"
`;

const REDEEM_POSITIONS_GUIDE = `
# 仓位赎回指南

## 🎯 目标
在市场结算后赎回获胜仓位，将条件代币转换为 USDC。

## ⚠️ 关键概念

### CLOB 仓位 vs CTF 仓位

| 类型 | 来源 | 代币位置 | 赎回方式 |
|------|------|----------|----------|
| **CLOB** | 通过 Polymarket 订单簿交易 | ERC1155 在钱包 | \`ctf_redeem\` ✅ |
| **CTF Split** | 通过 \`ctf_split\` 拆分 USDC | ERC1155 在钱包 | \`ctf_redeem\` ✅ |

💡 **重要发现**：CLOB 仓位的代币实际上存储在你的钱包里（作为 ERC1155），
可以使用 \`ctf_redeem\` 手动赎回！

## 📋 赎回流程

### Step 1: 查看可赎回仓位
\`\`\`
get_trader_positions(address: "0x...")
\`\`\`
筛选条件：
- \`status.redeemable: true\` - 可赎回
- \`holding.curPrice: 1\` - 获胜方（价格为 1）
- \`holding.curPrice: 0\` - 失败方（价格为 0，无需赎回）

### Step 2: 检查市场结算状态
\`\`\`
get_market_resolution(conditionId: "0x...")
\`\`\`
返回：
- \`isResolved\`: 是否已结算
- \`winningOutcome\`: 获胜方 (YES/NO)
- \`payoutNumerators\`: 赔付比例

### Step 3: 获取 Token IDs
\`\`\`
get_market(identifier: "0x...")  // conditionId 或 slug
\`\`\`
从返回的 \`tokens\` 数组获取：
- \`tokens[0].tokenId\`: YES/Up token ID
- \`tokens[1].tokenId\`: NO/Down token ID

### Step 4: 执行赎回
\`\`\`
ctf_redeem(
  conditionId: "0x...",
  tokenIds: {
    yesTokenId: "...",
    noTokenId: "..."
  },
  outcome: "Yes" | "No"  // 可选，会自动检测获胜方
)
\`\`\`

返回：
- \`success\`: 是否成功
- \`tokensRedeemed\`: 赎回的代币数量
- \`usdcReceived\`: 收到的 USDC 金额
- \`txHash\`: 交易哈希
- \`explorerUrl\`: Polygonscan 链接

## 💡 实战示例

### 示例：赎回 ETH 15分钟市场获胜仓位

\`\`\`
// 1. 获取市场信息和 token IDs
get_market(identifier: "0x85c33bef...")

// 返回:
// tokens: [
//   { tokenId: "37845751...", outcome: "Up" },
//   { tokenId: "94775948...", outcome: "Down" }
// ]

// 2. 检查市场结算
get_market_resolution(conditionId: "0x85c33bef...")

// 返回:
// isResolved: true
// winningOutcome: "NO"  (Down 赢了)

// 3. 执行赎回
ctf_redeem(
  conditionId: "0x85c33bef...",
  tokenIds: {
    yesTokenId: "37845751...",
    noTokenId: "94775948..."
  },
  outcome: "No"  // Down = No
)

// 返回:
// success: true
// tokensRedeemed: "98.195932"
// usdcReceived: "98.195932"
// txHash: "0xe1b35c47..."
\`\`\`

## 📊 批量赎回策略

如果有多个获胜仓位需要赎回：

\`\`\`
1. 获取所有仓位
   get_trader_positions(address)

2. 筛选可赎回仓位
   filter: redeemable=true AND curPrice=1

3. 对每个仓位:
   a. get_market → 获取 tokenIds
   b. get_market_resolution → 确认结算
   c. ctf_redeem → 执行赎回
\`\`\`

## ⚠️ 常见问题

### Q: 为什么赎回失败？
可能原因：
- 市场尚未结算 → 等待结算
- 没有获胜代币 → 检查 curPrice 是否为 1
- Token IDs 错误 → 从 get_market 获取正确的 IDs

### Q: 输掉的仓位需要赎回吗？
不需要。失败方代币价值为 $0，无需操作。

### Q: Gas 费用多少？
Polygon 网络约 73,000 gas (~$0.01)。

### Q: Polymarket 不会自动赎回吗？
会自动赎回，但可能有延迟。手动赎回更快拿到资金。

## 📝 示例问题

- "帮我赎回所有获胜仓位"
- "检查哪些仓位可以赎回"
- "这个市场结算了吗？"
- "帮我赎回 ETH 12:00PM 的仓位"
`;

const TRADING_GUIDE = `
# 交易操作指南

## ⚠️ 前置条件

### 1. 检查钱包准备状态
\`\`\`
check_ctf_ready(amount: "100")
\`\`\`
确保有：
- USDC.e (不是 Native USDC!)
- MATIC (gas 费)

### 2. 检查授权
\`\`\`
check_allowances()
\`\`\`
如未授权：
\`\`\`
approve_trading()
\`\`\`

## 📋 交易流程

### 创建限价单
\`\`\`
create_order(
  tokenId: "...",  // Yes 或 No 的 tokenId
  side: "BUY",
  price: 0.55,     // 限价
  size: 100        // 数量
)
\`\`\`

### 查看挂单
\`\`\`
get_open_orders()
\`\`\`

### 取消订单
\`\`\`
cancel_order(orderId: "...")
\`\`\`

## 💡 交易技巧

1. **先看 orderbook**: 了解当前价格和深度
2. **用限价单**: 避免滑点
3. **小额测试**: 先用小金额验证流程
4. **注意 gas**: Polygon 网络 gas 费通常很低

## ⚠️ 重要提醒

- **USDC.e vs Native USDC**: CTF 只接受 USDC.e
- **私钥安全**: 不要泄露私钥
- **风险管理**: 不要投入无法承受损失的资金
`;

export function createGuideHandlers(): Record<string, GuideHandler> {
  return {
    get_usage_guide: async (args: Record<string, unknown>) => {
      const scenario = (args.scenario as string) || 'overview';

      const guides: Record<string, string> = {
        overview: OVERVIEW_GUIDE,
        smart_money_analysis: SMART_MONEY_GUIDE,
        trader_deep_dive: TRADER_DEEP_DIVE_GUIDE,
        wallet_tracking: WALLET_TRACKING_GUIDE,
        market_discovery: MARKET_DISCOVERY_GUIDE,
        sports_strategy: SPORTS_STRATEGY_GUIDE,
        copy_trading: COPY_TRADING_GUIDE,
        deposit_and_auth: DEPOSIT_AND_AUTH_GUIDE,
        trading: TRADING_GUIDE,
        redeem_positions: REDEEM_POSITIONS_GUIDE,
      };

      const guide = guides[scenario] || OVERVIEW_GUIDE;

      return {
        scenario,
        guide,
        available_scenarios: Object.keys(guides),
        tip: '调用 get_usage_guide(scenario: "xxx") 获取其他场景的详细指南',
      };
    },
  };
}
