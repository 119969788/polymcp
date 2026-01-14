# Trading Tools E2E Test

> 交易执行工具端到端测试

---

## 工具清单

| 工具 | 功能 | 认证 | 优先级 |
|------|------|------|--------|
| `place_limit_order` | 下限价单 | 私钥 | P2 |
| `place_market_order` | 下市价单 | 私钥 | P2 |
| `cancel_order` | 取消订单 | 私钥 | P2 |
| `get_my_orders` | 查看我的订单 | 私钥 | P2 |

---

## 前置条件

所有交易工具测试需要:
1. **配置 `POLY_PRIVATE_KEY`** - 钱包私钥（API credentials 会自动派生）
2. 钱包已完成合约授权 (`approve_trading`)
3. 钱包有足够的 USDC.e 余额

### 认证机制

Trading Tools 使用 `TradingClient`，它会：
1. 从 `POLY_PRIVATE_KEY` 创建 Wallet signer
2. 自动调用 `createOrDeriveApiKey()` 派生 API credentials
3. 使用 L2 认证进行订单操作

无需手动配置 `POLY_API_KEY`、`POLY_API_SECRET`、`POLY_PASSPHRASE`。

---

## 实现状态

### 2025-12-23 实现完成

Trading Tools 已从占位符升级为完整实现：

```
trade.ts (之前)
├── checkTradingEnabled() - 基础检查
├── handlePlaceLimitOrder() - 抛出 AUTH_REQUIRED
├── handlePlaceMarketOrder() - 抛出 AUTH_REQUIRED
├── handleCancelOrder() - 抛出 AUTH_REQUIRED
└── handleGetMyOrders() - 抛出 AUTH_REQUIRED

trade.ts (现在)
├── getTradingClient() - 懒加载 TradingClient
├── handlePlaceLimitOrder() - 使用 TradingClient.createOrder()
├── handlePlaceMarketOrder() - 使用 TradingClient.createMarketOrder()
├── handleCancelOrder() - 使用 TradingClient.cancelOrder()
└── handleGetMyOrders() - 使用 TradingClient.getOpenOrders()
```

---

## Test Case 1: get_my_orders (只读)

### 1.1 查看活跃订单
```
调用: get_my_orders(status="LIVE")
预期: 返回当前挂单列表
验证:
- orders 是数组
- 每个订单有 id, status, tokenId, side, price, originalSize, remainingSize, createdAt
- count 字段表示订单数量
```

### 1.2 查看已成交订单
```
调用: get_my_orders(status="FILLED")
预期: 返回空数组 + 提示信息
注意: TradingClient 只支持 LIVE 订单查询
      历史订单需使用 get_trader_trades
```

### 1.3 查看已取消订单
```
调用: get_my_orders(status="CANCELLED")
预期: 返回空数组 + 提示信息
注意: 同上
```

---

## Test Case 2: place_limit_order (危险操作)

> 警告: 此测试会产生真实订单

### 2.1 远离市价的限价单
```
前置:
- 获取一个市场的最优价格
- 设置一个远离市价的限价 (如 bestBid - 0.1)

调用: place_limit_order(
  conditionId=<id>,
  outcome="Yes",
  side="BUY",
  price=0.10,  // 远低于市价
  size=10
)
预期: 订单创建成功，但不会立即成交
验证:
- success: true
- orderId 存在
- get_my_orders 能看到此订单
```

### 返回格式
```json
{
  "success": true,
  "orderId": "0x...",
  "market": {
    "conditionId": "0x...",
    "question": "...",
    "outcome": "Yes"
  },
  "order": {
    "side": "BUY",
    "price": 0.10,
    "size": 10,
    "orderType": "GTC"
  },
  "transactionHashes": ["0x..."]
}
```

---

## Test Case 3: cancel_order

### 3.1 取消未成交订单
```
前置: 使用 Test 2.1 创建的订单
调用: cancel_order(orderId=<orderId>)
预期: 订单取消成功
验证:
- success: true
- message 包含成功信息
```

### 3.2 取消不存在的订单
```
调用: cancel_order(orderId="invalid-order-id")
预期: 返回失败
验证:
- success: false
- 错误信息清晰
```

---

## Test Case 4: place_market_order (危险操作)

> 警告: 此测试会立即执行交易

### 4.1 小额市价买入
```
前置:
- 确认钱包有足够余额
- 选择高流动性市场

调用: place_market_order(
  conditionId=<id>,
  outcome="Yes",
  side="BUY",
  amount=5  // $5 最小测试金额
)
预期: 立即成交
验证:
- success: true
- priceLimit 接近当前价格
```

### 返回格式
```json
{
  "success": true,
  "orderId": "0x...",
  "market": {
    "conditionId": "0x...",
    "question": "...",
    "outcome": "Yes"
  },
  "order": {
    "side": "BUY",
    "amount": 5,
    "priceLimit": 0.55,
    "maxSlippage": 0.02
  },
  "transactionHashes": ["0x..."]
}
```

---

## 安全测试流程

为了安全测试，建议按以下顺序:

```
1. get_my_orders - 验证认证正常
   ↓
2. place_limit_order (远离市价) - 创建测试订单
   ↓
3. get_my_orders - 确认订单存在
   ↓
4. cancel_order - 取消测试订单
   ↓
5. get_my_orders - 确认订单被取消

(可选 - 仅在明确需要时)
6. place_market_order (小额) - 测试真实交易
```

---

## 执行记录

### 2025-12-23 实现验证

| Test Case | 状态 | 结果 | 备注 |
|-----------|------|------|------|
| 1.1 get_my_orders LIVE | ✅ PASS | 返回空数组 | API Key 自动派生成功 |
| 1.2 get_my_orders FILLED | ✅ PASS | 返回提示信息 | 仅支持 LIVE 查询，建议用 get_trader_trades |
| 1.3 get_my_orders CANCELLED | ✅ PASS | 返回提示信息 | 仅支持 LIVE 查询，建议用 get_trader_trades |
| 2.1 limit_order 远离市价 | ⚠️ BLOCKED | 需要 USDC | 钱包有 200 MATIC 但无 USDC |
| 2.2 limit_order 接近市价 | ⚠️ BLOCKED | 需要 USDC | 同上 |
| 3.1 cancel_order 有效 | ⚠️ BLOCKED | 依赖 2.1 | - |
| 3.2 cancel_order 无效 | ⚠️ BLOCKED | 依赖 2.1 | - |
| 4.1 market_order 买入 | ⚠️ BLOCKED | 需要 USDC | - |
| 4.2 market_order 卖出 | ⚠️ BLOCKED | 需要持仓 | - |

**结果**: MCP Server 已正确加载新代码。`get_my_orders` 工具功能正常：
- API credentials 从 POLY_PRIVATE_KEY 自动派生成功
- LIVE 状态返回当前挂单（空数组表示无挂单）
- FILLED/CANCELLED 状态返回提示信息，建议使用 `get_trader_trades` 获取历史

### 2025-12-23 完整交易流程测试 ✅ ALL PASS

**测试钱包**: `0xed1050F19F2D5890FF29c2f7416de97e68069171`

**准备阶段**:
| Step | 操作 | 结果 |
|------|------|------|
| 1 | swap(MATIC→WMATIC, 50) | ✅ 50 WMATIC |
| 2 | swap(WMATIC→USDC, 50) | ✅ 5.36 USDC |
| 3 | deposit_usdc(7, NATIVE_USDC) | ✅ Bridge 成功 |
| 4 | approve_trading() | ✅ 7 项授权完成 |

**最终钱包状态**:
| Token | Balance |
|-------|---------|
| MATIC | 149.88 |
| USDC.e | 6.99 |

**授权状态**: ✅ tradingReady: true

**交易测试**:
| Step | 状态 | 说明 |
|------|------|------|
| 1. 搜索市场 | ✅ PASS | Bitcoin $1M 市场 |
| 2. 下限价单 | ✅ PASS | orderId: `0x621b0e25...` |
| 3. 验证订单 | ✅ PASS | get_my_orders 确认存在 |
| 4. 取消订单 | ✅ PASS | 取消成功 |
| 5. 验证取消 | ✅ PASS | get_my_orders 返回空数组 |

**测试详情**:
- 市场: Will Bitcoin reach $1,000,000 by December 31, 2025?
- conditionId: `0xd8b9ff369452daebce1ac8cb6a29d6817903e85168356c72812317f38e317613`
- 订单: BUY Yes @ $0.001, size: 10 (远低于市价 $0.0015)
- orderId: `0x621b0e252bc9116e6c608ef087d24b45ba12d864def370bbdac5695855a28664`

---

## 发现的问题

| ID | 问题描述 | 严重性 | 状态 |
|----|---------|--------|------|
| 1 | swap WMATIC→USDC_E 失败 | Low | ✅ WORKAROUND (用 WMATIC→USDC→deposit) |
| 2 | swap USDC→USDC_E 失败 | Low | ✅ WORKAROUND (直接 deposit USDC) |

### 问题说明

QuickSwap V3 没有 WMATIC↔USDC_E 和 USDC↔USDC_E 的直接交易池。

**解决方案**: 使用 `deposit_usdc(amount, "NATIVE_USDC")` 通过 Polymarket Bridge 自动转换为 USDC.e

---

## 技术实现细节

### TradingClient 初始化流程

```typescript
// 1. 从 SDK 的 clobApi 获取 signer
const signer = sdk.clobApi.signer;

// 2. 提取私钥
const privateKey = signer.privateKey;

// 3. 创建 TradingClient
const tradingClient = new TradingClient(rateLimiter, {
  privateKey,
  chainId: 137
});

// 4. 初始化（自动派生 API credentials）
await tradingClient.initialize();
// 内部调用: clobClient.createOrDeriveApiKey()
```

### 订单创建流程

```typescript
// place_limit_order 内部流程
1. checkTradingEnabled(sdk)        // 验证 signer 存在
2. validateConditionId/Outcome/Side/Price/Size  // 输入验证
3. sdk.clobApi.getMarket()         // 获取 tokenId
4. getTradingClient(sdk)           // 获取或初始化 TradingClient
5. client.createOrder({...})       // 调用 @polymarket/clob-client
```
