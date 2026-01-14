# Polymarket 聪明钱交易策略深度分析

> 报告日期: 2025-12-25
> 数据来源: Polymarket Leaderboard + Trader API
> 分析范围: Top 20 盈利交易者 + 高频交易者

---

## 执行摘要

通过对 Polymarket 排行榜 Top 20 交易者的深度分析，我们发现了 **4 种可复制的盈利策略**：

| 策略类型 | 代表交易者 | 盈利能力 | 风险等级 | 可自动化 |
|---------|-----------|---------|---------|---------|
| Crypto Up/Down 双边做市 | Account88888, 0x8dxd | $5K-$12K/周 | 中 | ✅ 高 |
| 冷门市场价值投注 | simonbanza | +$230K | 高 | ❌ 低 |
| 同场多注对冲 | gmpm | +$47K | 中 | ✅ 中 |
| 高频套利 | CRYINGLITTLEBABY | +$12K ($1.27M volume) | 低 | ✅ 高 |

---

## 策略一: Crypto Up/Down 双边做市

### 代表交易者

**Account88888** (0x7f69983eb28245bba0d5083502a78744a8f66162)
- 排名: Top 50 (Smart Score 54)
- 总交易量: $1.5M+
- 持仓数: 15+ (全部为 Crypto Up/Down)

**0x8dxd** (0x63ce342161250d705dc0b16df89036c8e5f9ba9a)
- 排名: #45
- 总交易量: $558K
- 官方 PnL: +$5,646
- 持仓数: 26
- 胜率: 38% (但整体盈利)

### 策略核心逻辑

在 15 分钟周期的 Crypto Up/Down 市场中，同时买入 Up 和 Down 代币：

```
市场: BTC Up or Down - December 25, 4:45AM-5:00AM ET
结算规则: 15分钟结束时，BTC 涨则 Up=1，跌则 Down=1

交易者策略:
- 买入 Up @ $0.46-$0.55 (平均 $0.50)
- 买入 Down @ $0.46-$0.51 (平均 $0.50)
- 总投入: ~$200 per round
- 无论涨跌，一边归零一边翻倍
- 如果 Up+Down 成本 < $1.00，则必赚
```

### 完整交易路径 (Account88888)

**时间线: 2025-12-25 09:45:05 - 09:45:11 (6秒内完成)**

```
批次1 (09:45:05):
├── BUY Down @ $0.50 x 202 shares = $101.00
├── BUY Down @ $0.51 x 202 shares = $103.02
├── BUY Down @ $0.50 x 202 shares = $101.00
├── BUY Down @ $0.51 x 202 shares = $103.02
├── BUY Down @ $0.49 x 5 shares = $2.45
└── BUY Down @ $0.47 x 69.71 shares = $32.76

批次2 (09:45:07):
├── BUY Up @ $0.49 x 101 shares = $49.49
├── BUY Up @ $0.47 x 55.6 shares = $26.13
├── BUY Up @ $0.47 x 5 shares = $2.35
├── BUY Up @ $0.47 x 6 shares = $2.82
├── BUY Down @ $0.51 x 101 shares = $51.51 (x8笔)
└── BUY Down @ $0.50 x 25 shares = $12.50

批次3 (09:45:09-11):
├── BUY Up @ $0.46 x 8.25 shares = $3.80
├── BUY Up @ $0.47 x 34.4 shares = $16.17
├── BUY Up @ $0.50-$0.55 x 202 shares = $101-$110
└── 继续平衡 Up/Down 仓位...

总计: 50笔交易, $2,223 买入量 (全部 BUY)
```

### 盈利机制分析

```
假设场景:
- Up 买入成本: $0.48 x 500 shares = $240
- Down 买入成本: $0.50 x 480 shares = $240
- 总成本: $480

结算时:
- 若 BTC 上涨: Up 价值 = $500, Down 价值 = $0
- 若 BTC 下跌: Up 价值 = $0, Down 价值 = $480

盈亏分析:
- 涨时: $500 - $480 = +$20 (4.2% 收益)
- 跌时: $480 - $480 = $0 (保本)

关键: Up + Down 平均成本 < $1.00 时必赚
```

### 关键执行细节

1. **批量下单**: 同一秒内发送多笔交易，确保价格一致性
2. **价格敏感建仓**: 在 $0.46-$0.55 范围内积极买入
3. **动态平衡**: Up/Down 比例维持在 50:50 附近
4. **快速周转**: 15分钟结算，一天可交易 96 轮

### 风险控制

- 避免在 Up/Down 价格严重偏离 0.50 时入场
- 单轮最大投入控制在 $500 以内
- 监控 bid-ask spread，spread > 5% 时停止交易

---

## 策略二: 冷门市场价值投注

### 代表交易者

**simonbanza** (0x5350afcd8bd8ceffdf4da32420d6d31be0822fda)
- 排名: #2
- 官方 PnL: +$170,805
- Smart Score: 80 (极高)
- 持仓数: 3
- 胜率: 67%
- 总交易量: $100K

### 策略核心逻辑

专注于冷门市场（低关注度体育赛事），利用市场定价效率低的特点进行价值投注：

```
目标市场特征:
- 关注度低 (非主流体育)
- 赔率存在明显偏差
- 单场投注上限较低（需多账户或分批）

代表案例:
- Hawaii vs California (大学橄榄球)
- Cameroon 非洲杯赛事
```

### 完整交易路径

**持仓1: California vs. Hawaii**
```
市场: cfb-cah-hawaii-2025-12-24
押注: Hawaii 胜
规模: 350,000 shares
平均成本: $0.5096
当前价格: $1.00 (已结算)

PnL 计算:
- 投入: 350,000 x $0.5096 = $178,360
- 收益: 350,000 x $1.00 = $350,000
- 净利: +$171,606 (+96.2%)
```

**持仓2: Cameroon 非洲杯**
```
市场: acn-cmr-gab-2025-12-24-cmr
押注: Cameroon 获胜
规模: 110,000 shares
平均成本: $0.4515
当前价格: $1.00 (已结算)

PnL 计算:
- 投入: 110,000 x $0.4515 = $49,665
- 收益: 110,000 x $1.00 = $110,000
- 净利: +$60,328 (+121.5%)
```

**持仓3: 土耳其政治市场**
```
市场: erdoan-out-in-2025
押注: No (Erdogan 不会下台)
规模: 20 shares
平均成本: $0.993
当前价格: $0.9955

状态: 小额对冲头寸，未结算
```

### 策略特点分析

1. **极度集中**: 3 个持仓，但单笔 $100K+
2. **冷门市场**: 非主流体育赛事
3. **高确信度**: 只在有信息优势时下注
4. **长持仓**: 持有到结算，不做短线

### 信息优势来源推测

- 体育领域专业知识 (大学橄榄球)
- 地区性赛事研究 (非洲杯)
- 线下信息渠道

### 风险提示

⚠️ **此策略难以复制**:
- 需要特定领域专业知识
- 单笔下注金额巨大
- 依赖主观判断而非算法

---

## 策略三: 同场多注对冲

### 代表交易者

**gmpm** (0x14964aefa2cd7caff7878b3820a690a03c5aa429)
- 排名: #6
- 官方 PnL: +$47,660
- Smart Score: 63
- 持仓数: 3
- 胜率: 67%
- 总交易量: $142K

### 策略核心逻辑

在同一场比赛的多个相关市场同时下注，形成对冲组合：

```
比赛: California vs. Hawaii

下注组合:
1. 胜负盘: Hawaii 胜 @ 0.53
2. 让分盘: Hawaii -1.5 @ 0.48

情景分析:
- Hawaii 大胜 (>1.5分): 两个都赢
- Hawaii 小胜 (≤1.5分): 胜负盘赢，让分盘输
- Hawaii 输: 两个都输
```

### 完整交易路径

**持仓1: Hawaii 胜负盘**
```
市场: cfb-cah-hawaii-2025-12-24
押注: Hawaii
规模: 95,542 shares
平均成本: $0.5299
当前价格: $1.00 (已结算)
净利: +$44,904 (+88.7%)
```

**持仓2: Hawaii 让分盘 (-1.5)**
```
市场: cfb-cah-hawaii-2025-12-25-spread-home-1pt5
押注: Hawaii -1.5
规模: 4,930 shares
平均成本: $0.48
当前价格: $1.00 (已结算)
净利: +$2,564 (+108.3%)
```

**持仓3: Detroit Lions 超级碗 (失败案例)**
```
市场: will-the-detroit-lions-win-super-bowl-2026
押注: Yes
规模: 130,189 shares
平均成本: $0.1155
当前价格: $0.004
净亏: -$14,527 (-96.5%)
状态: 未结算，几乎确定亏损
```

### 策略优化建议

1. **相关性管理**: 胜负盘和让分盘高度相关，需考虑分配比例
2. **赔率套利**: 当两个市场定价不一致时，可构建无风险套利
3. **止损机制**: Lions 超级碗案例显示需要及时止损

---

## 策略四: 高频套利 (Crypto Up/Down)

### 代表交易者

**CRYINGLITTLEBABY** (0x961afce6bd9aec79c5cf09d2d4dac2b434b23361)
- 排名: #19
- 官方 PnL: +$12,655
- 总交易量: $1,269,832 (最高！)
- 持仓数: 6
- 胜率: 50%

### 策略特点

与策略一类似，但更注重高频交易和快速周转：

```
交易频率统计:
- 34 笔交易在 1 分钟内完成
- 全部为 BUY 订单
- 多市场同时操作 (BTC, ETH, SOL, XRP)
```

### 当前持仓分析

**双边对冲案例: XRP Up or Down**
```
Up 持仓:
- 规模: 1,492 shares
- 成本: $0.5036
- 当前: $0.0005 (亏损 99.9%)

Down 持仓:
- 规模: 1,526 shares
- 成本: $0.5297
- 当前: $0.9995 (盈利 88.7%)

净结果:
- Up 亏损: -$750
- Down 盈利: +$716
- 总 PnL: -$34 (因成本略高于 $1.00)
```

### 失败案例分析

**Bitcoin Up or Down - December 25, 3AM ET**
```
Up 持仓: 152 shares @ $0.4764 → 当前 $0.0005
Down 持仓: 27 shares @ $0.48 → 当前 $0.9995

问题: Up/Down 比例失衡 (152:27 ≈ 5.6:1)
结果: 净亏损 -$58
```

### 关键教训

1. **仓位平衡至关重要**: Up:Down 比例偏离 1:1 会导致亏损
2. **成本控制**: Up + Down 总成本必须 < $1.00
3. **批量执行**: 使用程序化交易确保执行一致性

---

## 策略对比与建议

### 适用性分析

| 策略 | 资金需求 | 技术门槛 | 时间投入 | 年化收益预估 |
|-----|---------|---------|---------|-------------|
| Crypto Up/Down 做市 | $5K+ | 高 | 持续监控 | 50-100% |
| 冷门市场价值投注 | $50K+ | 中 | 研究为主 | 不确定 |
| 同场多注对冲 | $10K+ | 中 | 事件驱动 | 30-50% |
| 高频套利 | $20K+ | 高 | 全自动 | 20-40% |

### 我们 MM 策略的改进方向

基于以上分析，对现有 `earning-engine/strategies/src/mm/` 的建议：

#### 1. 支持 Crypto Up/Down 市场
```typescript
// 新增市场类型支持
interface CryptoUpDownMarket {
  conditionId: string;
  underlying: 'BTC' | 'ETH' | 'SOL' | 'XRP';
  duration: 15 | 60; // 分钟
  upTokenId: string;
  downTokenId: string;
}
```

#### 2. 双边同时建仓
```typescript
// 当前代码只支持单边
// 需要新增: 同时在 Up 和 Down 两边挂单

async function buildDualSidedPosition(
  market: CryptoUpDownMarket,
  totalSize: number,
  upRatio: number = 0.5
) {
  const upSize = totalSize * upRatio;
  const downSize = totalSize * (1 - upRatio);

  // 批量下单
  await Promise.all([
    placeLimitOrder(market.upTokenId, 'BUY', upSize),
    placeLimitOrder(market.downTokenId, 'BUY', downSize)
  ]);
}
```

#### 3. 动态仓位平衡
```typescript
// 根据当前价格调整 Up/Down 比例
function calculateOptimalRatio(upPrice: number, downPrice: number): number {
  const totalCost = upPrice + downPrice;

  // 确保 totalCost < 1.0 才有利可图
  if (totalCost >= 0.98) return 0; // 不交易

  // 偏向更便宜的一边
  return downPrice / totalCost;
}
```

#### 4. 批量执行优化
```typescript
// 当前代码: 顺序执行
// 建议: 并行批量执行

async function executeBatch(orders: Order[]) {
  // 按时间窗口聚合订单
  const batches = groupByTimeWindow(orders, 100); // 100ms 窗口

  for (const batch of batches) {
    await Promise.all(batch.map(o => executeOrder(o)));
  }
}
```

---

## 附录: 交易者钱包地址

| 昵称 | 地址 | 主要策略 |
|-----|------|---------|
| Account88888 | 0x7f69983eb28245bba0d5083502a78744a8f66162 | Crypto Up/Down |
| 0x8dxd | 0x63ce342161250d705dc0b16df89036c8e5f9ba9a | Crypto Up/Down |
| simonbanza | 0x5350afcd8bd8ceffdf4da32420d6d31be0822fda | 冷门价值投注 |
| gmpm | 0x14964aefa2cd7caff7878b3820a690a03c5aa429 | 同场对冲 |
| CRYINGLITTLEBABY | 0x961afce6bd9aec79c5cf09d2d4dac2b434b23361 | 高频套利 |

---

## 下一步行动

1. **优先级 P0**: 为 MM 策略添加 Crypto Up/Down 市场支持
2. **优先级 P1**: 实现双边同时建仓功能
3. **优先级 P2**: 开发自动仓位平衡算法
4. **优先级 P3**: 研究冷门市场定价效率

---

*报告生成时间: 2025-12-25T10:00:00Z*
*分析师: Claude (AI)*
