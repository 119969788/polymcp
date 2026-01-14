# Wallet Tools E2E Test

> 钱包管理工具端到端测试

---

## 工具清单

| 工具 | 功能 | 认证 | 优先级 |
|------|------|------|--------|
| `get_supported_deposit_assets` | 支持的充值资产 | 无 | P1 |
| `get_wallet_balances` | 查询任意钱包余额 | 无 | P1 |
| `get_deposit_addresses` | 获取充值地址 | 私钥 | P1 |
| `get_token_balances` | 获取自己的余额 | 私钥 | P1 |
| `check_allowances` | 检查授权状态 | 私钥 | P1 |
| `approve_trading` | 授权交易合约 | 私钥 | P2 |
| `swap` | 代币交换 | 私钥 | P2 |
| `swap_and_deposit` | 交换并充值 | 私钥 | P2 |
| `deposit_usdc` | 充值 USDC | 私钥 | P2 |

---

## Phase A: 只读工具 (无需认证)

### Test Case 1: get_supported_deposit_assets

#### 1.1 列出所有资产
```
调用: get_supported_deposit_assets()
预期: 返回所有支持的链和资产
验证:
- assets 是数组
- 包含多个链 (Ethereum, Polygon, Arbitrum, Base, Solana, Bitcoin)
- 每个资产有 chainId, chainName, tokenSymbol, minDeposit
```

#### 1.2 按链过滤
```
调用: get_supported_deposit_assets(chainId=137)
预期: 只返回 Polygon 链的资产
验证:
- 所有资产的 chainId = 137
```

---

### Test Case 2: get_wallet_balances

#### 2.1 查询主钱包
```
调用: get_wallet_balances(address="0x0F5988a267303f46b50912f176450491DF10476f")
预期: 返回钱包的代币余额
验证:
- balances 包含 MATIC, USDC, USDC_E 等
- nonZeroBalances 只包含有余额的代币
```

#### 2.2 查询顶级交易者钱包
```
前置: 从 leaderboard 获取一个地址
调用: get_wallet_balances(address=<top_trader>)
预期: 返回该钱包的余额
验证:
- 数据结构一致
```

#### 2.3 空钱包
```
调用: get_wallet_balances(address="0x0000000000000000000000000000000000000001")
预期: 返回全零余额
验证:
- 所有余额 = 0
- nonZeroBalances = []
```

---

## Phase B: 需要私钥的工具

> 注意: 如果环境未配置私钥，这些测试将被跳过

### Test Case 3: get_deposit_addresses

#### 3.1 获取充值地址
```
调用: get_deposit_addresses()
预期: 返回所有链的充值地址
验证:
- addresses.evm 是有效的以太坊地址
- addresses.solana 是有效的 Solana 地址 (如果支持)
- addresses.bitcoin 是有效的 BTC 地址 (如果支持)
```

---

### Test Case 4: get_token_balances

#### 4.1 获取自己的余额
```
调用: get_token_balances()
预期: 返回配置钱包的余额
验证:
- wallet 地址与配置一致
- balances 包含所有支持的代币
```

---

### Test Case 5: check_allowances

#### 5.1 检查授权状态
```
调用: check_allowances()
预期: 返回所有合约的授权状态
验证:
- erc20Allowances 包含 CTF Exchange, Neg Risk Exchange 等
- erc1155Approvals 包含 Conditional Tokens
- tradingReady 表示是否可以交易
- issues 列出未授权的合约
```

---

### Test Case 6: approve_trading (危险操作)

> 警告: 此测试会产生链上交易，消耗 Gas

#### 6.1 授权所有合约
```
前置条件:
- 确认钱包有足够的 MATIC 支付 Gas
- 确认这是测试环境或用户明确同意

调用: approve_trading()
预期: 授权所有必要的合约
验证:
- 所有授权交易成功
- check_allowances 显示 tradingReady = true
```

---

### Test Case 7: swap (危险操作)

> 警告: 此测试会产生链上交易

#### 7.1 MATIC -> USDC 小额交换
```
前置: 确认钱包有足够 MATIC
调用: swap(tokenIn="MATIC", tokenOut="USDC", amount="0.1")
预期: 成功交换
验证:
- txHash 存在
- amountOut > 0
```

---

### Test Case 8: swap_and_deposit (危险操作)

> 此测试通常跳过，除非明确需要测试

---

### Test Case 9: deposit_usdc (危险操作)

> 此测试通常跳过，除非明确需要测试

---

## 执行记录

### Phase A (只读) - 2025-12-23

| Test Case | 状态 | 结果 | 备注 |
|-----------|------|------|------|
| 1.1 supported_assets 全部 | ✅ PASS | 返回 6 链 47 资产 | 包含 Ethereum, Polygon, Base, Arbitrum, Optimism, Solana |
| 1.2 supported_assets 按链 | ✅ PASS | Polygon: 7 资产 | chainId=137 过滤正常 |
| 2.1 wallet_balances 主钱包 | ✅ PASS | 返回所有代币余额 | 0x0F5988... 查询成功 |
| 2.2 wallet_balances 交易者 | ✅ PASS | Top trader 余额正常 | 从 leaderboard 获取地址 |
| 2.3 wallet_balances 空钱包 | ✅ PASS | 全零余额 | nonZeroBalances = [] |

### Phase B (需要私钥) - 2025-12-23

| Test Case | 状态 | 结果 | 备注 |
|-----------|------|------|------|
| 3.1 deposit_addresses | ⚠️ SKIPPED | - | AUTH_REQUIRED (需要私钥) |
| 4.1 token_balances | ⚠️ SKIPPED | - | AUTH_REQUIRED (需要私钥) |
| 5.1 check_allowances | ✅ PASS | 7 项缺失授权 | 钱包 0xed1050... |
| 6.1 approve_trading | ✅ PASS | 7 项授权成功 | 全部 ERC20+ERC1155 |
| 7.1 swap MATIC→USDC | ✅ PASS | 20 MATIC → 7.5 USDC | QuickSwap V3 |
| 7.2 swap WMATIC→USDC_E | ❌ FAIL | 无直接池 | 需用 deposit 替代 |
| 8.x swap_and_deposit | ⚠️ SKIPPED | 用分步替代 | - |
| 9.x deposit_usdc | ✅ PASS | 7 USDC → 6.99 USDC.e | Bridge 1-5分钟 |

---

## 发现的问题

| ID | 问题描述 | 严重性 | 状态 |
|----|---------|--------|------|
| 5 | approve_trading: signer.provider 为 null | High | ✅ FIXED |
| 6 | swap/get_token_balances: signer.provider 为 null | High | ✅ FIXED |

### 问题修复详情 (2025-12-23)

**Issue #5 & #6 - Provider 未初始化**

- **问题**: SDK 返回的 signer 没有 provider 属性，导致 SwapService 和 AuthorizationService 无法执行链上查询
- **根因**: `getSignerFromSdk()` 直接返回 signer，未检查是否有 provider 连接
- **修复**:
  1. `swap-service.ts`: 添加 provider 回退逻辑
     ```typescript
     this.provider = signer.provider || new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
     this.signer = signer.provider ? signer : signer.connect(this.provider);
     ```
  2. `wallet.ts`: 在 `getSignerFromSdk()` 中确保 signer 连接到 provider
     ```typescript
     if (!signer.provider) {
       const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
       return signer.connect(provider);
     }
     ```
- **验证**: 需要重启 MCP Server 以加载新代码
