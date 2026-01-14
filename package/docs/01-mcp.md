# @catalyst-team/poly-mcp Design

> Product-First Thinking: 先验证 API 返回什么，再设计工具

**Package**: `@catalyst-team/poly-mcp`
**Dependency**: `@catalyst-team/poly-sdk`

## 1. 功能本质

**用户目标**: AI Agent 能够查询 Polymarket 数据并执行交易
**一句话**: 这是让 AI 访问预测市场的工具集
**成功标准**: Agent 能回答 "这个钱包表现如何？" "这个市场什么价？" "帮我下单买 YES"

---

## 2. API 能力验证（真实数据）

### 2.1 Positions API

```bash
GET https://data-api.polymarket.com/positions?user={address}
```

**实际返回字段**:
```json
{
  "proxyWallet": "0xc2e7800b...",
  "conditionId": "0x39e493c3...",
  "title": "Spread: Grizzlies (-12.5)",
  "slug": "nba-was-mem-2025-12-20-spread-home-12pt5",
  "outcome": "Wizards",
  "outcomeIndex": 1,
  "size": 1346825.46,
  "avgPrice": 0.520337,
  "curPrice": 1,
  "initialValue": 700803.12,
  "currentValue": 1346825.46,
  "cashPnl": 646022.34,
  "percentPnl": 92.18,
  "realizedPnl": 0,
  "redeemable": true,
  "endDate": "2025-12-21"
}
```

### 2.2 Activity API

```bash
GET https://data-api.polymarket.com/activity?user={address}&limit=N
```

**实际返回字段**:
```json
{
  "proxyWallet": "0xc2e7800b...",
  "type": "TRADE",
  "side": "BUY",
  "conditionId": "0x39e493c3...",
  "title": "Spread: Grizzlies (-12.5)",
  "outcome": "Wizards",
  "size": 17307.69,
  "price": 0.52,
  "usdcSize": 9000,
  "timestamp": 1766278645,
  "transactionHash": "0x5fd43582..."
}
```

### 2.3 Leaderboard API

```bash
GET https://data-api.polymarket.com/v1/leaderboard?limit=N
```

**实际返回字段**:
```json
{
  "rank": "1",
  "proxyWallet": "0xc2e7800b...",
  "userName": "beachboy4",
  "xUsername": "",
  "verifiedBadge": false,
  "vol": 1346825.46,
  "pnl": 802943.86,
  "profileImage": ""
}
```

### 2.4 Gamma Market API

```bash
GET https://gamma-api.polymarket.com/markets?slug={slug}
```

**实际返回字段**:
```json
{
  "conditionId": "0xfa48a993...",
  "question": "US recession in 2025?",
  "slug": "us-recession-in-2025",
  "description": "This market will resolve to...",
  "outcomePrices": "[\"0.0065\", \"0.9935\"]",
  "volume": "11010561.19",
  "liquidity": "110917.70",
  "spread": 0.001,
  "active": true,
  "closed": false,
  "endDate": "2025-12-31T12:00:00Z"
}
```

### 2.5 CLOB Market API

```bash
GET https://clob.polymarket.com/markets/{conditionId}
```

**实际返回字段**:
```json
{
  "question": "US recession in 2025?",
  "tokens": [
    { "token_id": "10417...", "outcome": "Yes", "price": 0.0065 },
    { "token_id": "44528...", "outcome": "No", "price": 0.9935 }
  ],
  "active": true,
  "closed": false,
  "minimum_tick_size": 0.001,
  "minimum_order_size": 5
}
```

### 2.6 Orderbook API

```bash
GET https://clob.polymarket.com/book?token_id={tokenId}
```

**实际返回字段**:
```json
{
  "market": "0xfa48a993...",
  "asset_id": "10417...",
  "bids": [{ "price": "0.001", "size": "128351" }],
  "asks": [{ "price": "0.999", "size": "3103559" }]
}
```

### 2.7 Trades API

```bash
GET https://data-api.polymarket.com/trades?market={conditionId}
```

**实际返回字段**:
```json
{
  "proxyWallet": "0xdb07e53d...",
  "side": "SELL",
  "conditionId": "0xfa48a993...",
  "title": "US recession in 2025?",
  "outcome": "Yes",
  "size": 142.85,
  "price": 0.006,
  "timestamp": 1766318459,
  "transactionHash": "0x85b3dcd4..."
}
```

---

## 3. 工具分类

基于实际 API 能力，分为 **5 类工具**：

| 类别 | 核心问题 | 数据来源 |
|------|----------|----------|
| **Trader Tools** | "这个交易者怎么样？" | Data API |
| **Market Tools** | "这个市场什么情况？" | Gamma + CLOB |
| **Order Tools** | "盘口深度如何？" | CLOB |
| **Trade Tools** | "帮我交易" | Trading Client |
| **Wallet Tools** | "如何充值和授权？" | Bridge API + 合约调用 |

### 分类说明

- **Trader Tools**: 分析交易者的持仓、交易记录、排名（公开数据）
- **Wallet Tools**: 管理用户自己钱包的充值和授权（需要私钥）

---

## 4. Trader Tools（交易者分析）

### 工具列表

| Tool | 用户问题 | 返回 |
|------|----------|------|
| `get_trader_positions` | "他持有什么仓位？" | 持仓列表 + PnL |
| `get_trader_closed_positions` | "他已平仓位怎么样？" | 已结算持仓 + 已实现 PnL |
| `get_trader_trades` | "他最近交易了什么？" | 仅交易记录 (BUY/SELL) |
| `get_trader_activity` | "他完整活动历史？" | 全部活动 (TRADE/SPLIT/MERGE/REDEEM...) |
| `get_trader_profile` | "他是什么水平？" | 综合分析 |
| `get_leaderboard` | "谁是顶级交易者？" | 排行榜 |
| `get_account_value` | "他账户值多少钱？" | 账户总价值 |

### 4.1 `get_trader_positions`

**用户场景**: "0xc2e7800b 这个钱包持有什么仓位？赚了多少？"

**MCP Tool Definition**:
```json
{
  "name": "get_trader_positions",
  "description": "Get all positions held by a trader with PnL breakdown",
  "inputSchema": {
    "type": "object",
    "properties": {
      "address": {
        "type": "string",
        "description": "Trader wallet address (0x...)"
      }
    },
    "required": ["address"]
  }
}
```

**Input**:
```json
{
  "address": "0xc2e7800b5af46e6093872b177b7a5e7f0563be51"
}
```

**Output** (基于真实 API):
```json
{
  "trader": {
    "address": "0xc2e7800b...",
    "displayName": "beachboy4"
  },
  "positions": [
    {
      "market": {
        "conditionId": "0x39e493c3...",
        "title": "Spread: Grizzlies (-12.5)",
        "slug": "nba-was-mem-2025-12-20-spread-home-12pt5"
      },
      "holding": {
        "outcome": "Wizards",
        "size": 1346825.46,
        "avgPrice": 0.52,
        "curPrice": 1.00
      },
      "pnl": {
        "unrealized": 646022.34,
        "unrealizedPercent": 92.18,
        "realized": 0
      },
      "status": {
        "redeemable": true,
        "endDate": "2025-12-21"
      }
    }
  ],
  "summary": {
    "totalPositions": 5,
    "totalUnrealizedPnl": 1192449.91,
    "totalRealizedPnl": 0,
    "winningPositions": 4,
    "losingPositions": 1
  }
}
```

### 4.2 `get_trader_closed_positions`

**用户场景**: "他已经平掉的仓位表现如何？"

**MCP Tool Definition**:
```json
{
  "name": "get_trader_closed_positions",
  "description": "Get closed/settled positions for a trader with realized PnL",
  "inputSchema": {
    "type": "object",
    "properties": {
      "address": {
        "type": "string",
        "description": "Trader wallet address (0x...)"
      },
      "limit": {
        "type": "number",
        "description": "Maximum positions to return (max 50)",
        "default": 20
      },
      "sortBy": {
        "type": "string",
        "enum": ["REALIZEDPNL", "TIMESTAMP", "TITLE"],
        "description": "Sort by field",
        "default": "REALIZEDPNL"
      }
    },
    "required": ["address"]
  }
}
```

**Input**:
```json
{
  "address": "0xc2e7800b...",
  "limit": 10,
  "sortBy": "REALIZEDPNL"
}
```

**Output**:
```json
{
  "trader": {
    "address": "0xc2e7800b...",
    "displayName": "beachboy4"
  },
  "closedPositions": [
    {
      "market": {
        "conditionId": "0x39e493c3...",
        "title": "Spread: Grizzlies (-12.5)",
        "slug": "nba-was-mem-2025-12-20"
      },
      "holding": {
        "outcome": "Wizards",
        "avgPrice": 0.52,
        "settlementPrice": 1.00
      },
      "pnl": {
        "realized": 646022.34,
        "totalBought": 700803.12
      },
      "settledAt": "2025-12-21T00:00:00Z"
    }
  ],
  "summary": {
    "totalClosed": 10,
    "totalRealizedPnl": 802943.86,
    "winningPositions": 8,
    "losingPositions": 2
  }
}
```

### 4.3 `get_trader_trades`

**用户场景**: "他最近买了什么？卖了什么？"

**MCP Tool Definition**:
```json
{
  "name": "get_trader_trades",
  "description": "Get recent trading activity for a trader",
  "inputSchema": {
    "type": "object",
    "properties": {
      "address": {
        "type": "string",
        "description": "Trader wallet address"
      },
      "limit": {
        "type": "number",
        "description": "Maximum number of trades to return",
        "default": 20
      },
      "side": {
        "type": "string",
        "enum": ["BUY", "SELL"],
        "description": "Filter by trade side"
      }
    },
    "required": ["address"]
  }
}
```

**Input**:
```json
{
  "address": "0xc2e7800b...",
  "limit": 20,
  "side": "BUY"
}
```

**Output**:
```json
{
  "trader": {
    "address": "0xc2e7800b...",
    "displayName": "beachboy4"
  },
  "trades": [
    {
      "type": "TRADE",
      "side": "BUY",
      "market": {
        "conditionId": "0x39e493c3...",
        "title": "Spread: Grizzlies (-12.5)"
      },
      "outcome": "Wizards",
      "execution": {
        "size": 17307.69,
        "price": 0.52,
        "usdcValue": 9000
      },
      "timestamp": "2025-12-20T15:30:45Z",
      "txHash": "0x5fd43582..."
    }
  ],
  "summary": {
    "totalTrades": 20,
    "buyCount": 15,
    "sellCount": 5,
    "buyVolume": 50000,
    "sellVolume": 10000
  }
}
```

### 4.4 `get_trader_activity`

**用户场景**: "他的完整活动历史是什么？有没有 SPLIT/MERGE 操作（可能是 Bot）？"

**MCP Tool Definition**:
```json
{
  "name": "get_trader_activity",
  "description": "Get complete activity history for a trader including TRADE, SPLIT, MERGE, REDEEM, REWARD, CONVERSION",
  "inputSchema": {
    "type": "object",
    "properties": {
      "address": {
        "type": "string",
        "description": "Trader wallet address (0x...)"
      },
      "limit": {
        "type": "number",
        "description": "Maximum number of activities to return",
        "default": 50
      },
      "type": {
        "type": "string",
        "enum": ["TRADE", "SPLIT", "MERGE", "REDEEM", "REWARD", "CONVERSION"],
        "description": "Filter by activity type"
      },
      "market": {
        "type": "string",
        "description": "Filter by market conditionId"
      }
    },
    "required": ["address"]
  }
}
```

**Input 示例 1** - 获取全部活动:
```json
{
  "address": "0xc2e7800b...",
  "limit": 100
}
```

**Input 示例 2** - 检测 Bot（过滤 SPLIT/MERGE）:
```json
{
  "address": "0xc2e7800b...",
  "type": "SPLIT"
}
```

**Input 示例 3** - 分析特定市场的活动:
```json
{
  "address": "0xc2e7800b...",
  "market": "0x39e493c3...",
  "limit": 100
}
```

**Output**:
```json
{
  "trader": {
    "address": "0xc2e7800b...",
    "displayName": null
  },
  "activities": [
    {
      "type": "SPLIT",
      "market": {
        "conditionId": "0x39e493c3...",
        "title": "Trump 2024"
      },
      "size": 1000,
      "usdcValue": 1000,
      "timestamp": "2025-12-20T15:30:45Z",
      "txHash": "0x5fd43582..."
    }
  ],
  "summary": {
    "total": 50,
    "byType": {
      "TRADE": 40,
      "SPLIT": 5,
      "MERGE": 3,
      "REDEEM": 2
    },
    "totalVolume": 50000
  }
}
```

**Note**: 如果 `byType` 中有大量 SPLIT/MERGE，可能是套利 Bot 或做市商。

### 4.5 `get_trader_profile`

**用户场景**: "这个人厉害吗？值得跟单吗？"

**MCP Tool Definition**:
```json
{
  "name": "get_trader_profile",
  "description": "Get comprehensive trader profile with performance metrics",
  "inputSchema": {
    "type": "object",
    "properties": {
      "address": {
        "type": "string",
        "description": "Trader wallet address"
      }
    },
    "required": ["address"]
  }
}
```

**Input**:
```json
{
  "address": "0xc2e7800b..."
}
```

**Output**:
```json
{
  "trader": {
    "address": "0xc2e7800b...",
    "displayName": "beachboy4",
    "xUsername": null,
    "verified": false,
    "profileImage": null
  },
  "ranking": {
    "rank": 1,
    "totalTraders": 10000
  },
  "performance": {
    "officialPnl": 802943.86,
    "totalVolume": 1346825.46,
    "unrealizedPnl": 1192449.91,
    "realizedPnl": 0
  },
  "stats": {
    "positionCount": 5,
    "winRate": 0.80,
    "avgPercentPnl": 92.18,
    "smartScore": 85
  },
  "activity": {
    "lastTradeAt": "2025-12-20T15:30:45Z",
    "isActive": true
  }
}
```

### 4.6 `get_leaderboard`

**用户场景**: "谁是最赚钱的交易者？"

**MCP Tool Definition**:
```json
{
  "name": "get_leaderboard",
  "description": "Get top traders by PnL",
  "inputSchema": {
    "type": "object",
    "properties": {
      "limit": {
        "type": "number",
        "description": "Number of traders to return",
        "default": 10
      },
      "offset": {
        "type": "number",
        "description": "Pagination offset",
        "default": 0
      }
    }
  }
}
```

**Input**:
```json
{
  "limit": 10,
  "offset": 0
}
```

**Output**:
```json
{
  "traders": [
    {
      "rank": 1,
      "address": "0xc2e7800b...",
      "displayName": "beachboy4",
      "pnl": 802943.86,
      "volume": 1346825.46,
      "verified": false
    }
  ],
  "pagination": {
    "total": 10000,
    "offset": 0,
    "limit": 10
  }
}
```

### 4.7 `get_account_value`

**用户场景**: "这个钱包账户值多少钱？"

**MCP Tool Definition**:
```json
{
  "name": "get_account_value",
  "description": "Get total value of a user's positions",
  "inputSchema": {
    "type": "object",
    "properties": {
      "address": {
        "type": "string",
        "description": "User wallet address (0x...)"
      },
      "market": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Optional: filter by specific market conditionIds"
      }
    },
    "required": ["address"]
  }
}
```

**Input**:
```json
{
  "address": "0xc2e7800b..."
}
```

**Output**:
```json
{
  "address": "0xc2e7800b...",
  "value": 1346825.46,
  "currency": "USDC"
}
```

---

## 5. Market Tools（市场查询）

### 工具列表

| Tool | 用户问题 | 返回 |
|------|----------|------|
| `get_market` | "这个市场什么情况？" | 市场详情 |
| `search_markets` | "有什么关于 XX 的市场？" | 搜索结果 |
| `get_trending_markets` | "现在什么市场热门？" | 热门列表 |
| `get_market_trades` | "这个市场最近成交如何？" | 成交记录 |

### 5.1 `get_market`

**用户场景**: "US recession 2025 这个市场现在什么价？"

**MCP Tool Definition**:
```json
{
  "name": "get_market",
  "description": "Get market details including prices, volume, and status",
  "inputSchema": {
    "type": "object",
    "properties": {
      "identifier": {
        "type": "string",
        "description": "Market slug (e.g., 'us-recession-in-2025') or conditionId (0x...)"
      }
    },
    "required": ["identifier"]
  }
}
```

**Input**:
```json
{
  "identifier": "us-recession-in-2025"
}
```

**Output**:
```json
{
  "market": {
    "conditionId": "0xfa48a993...",
    "question": "US recession in 2025?",
    "slug": "us-recession-in-2025",
    "description": "This market will resolve to..."
  },
  "prices": {
    "yes": 0.0065,
    "no": 0.9935,
    "spread": 0.001
  },
  "tokens": {
    "yes": { "tokenId": "10417...", "price": 0.0065 },
    "no": { "tokenId": "44528...", "price": 0.9935 }
  },
  "stats": {
    "volume": 11010561.19,
    "liquidity": 110917.70
  },
  "status": {
    "active": true,
    "closed": false,
    "acceptingOrders": true,
    "endDate": "2025-12-31T12:00:00Z"
  },
  "trading": {
    "minTickSize": 0.001,
    "minOrderSize": 5
  }
}
```

### 5.2 `search_markets`

**用户场景**: "有什么关于 Trump 的市场？"

**实现说明**: Gamma API 不支持服务端文本搜索，所以我们获取活跃市场后在客户端过滤。搜索结果按 24h 交易量排序，精确匹配短语优先。

**MCP Tool Definition**:
```json
{
  "name": "search_markets",
  "description": "Search for markets by keyword. Searches in question text and slug. Returns markets sorted by 24h volume.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search keyword (e.g., 'Trump', 'Bitcoin', 'recession'). Multi-word queries match any word."
      },
      "active": {
        "type": "boolean",
        "description": "Only return active markets",
        "default": true
      },
      "limit": {
        "type": "number",
        "description": "Maximum results",
        "default": 10
      }
    },
    "required": ["query"]
  }
}
```

**Input**:
```json
{
  "query": "Trump",
  "active": true,
  "limit": 5
}
```

**Output** (真实数据验证 - 2024-12-22):
```json
{
  "markets": [
    {
      "conditionId": "0xac9c6628a5398bb2a06f566854270a9fbc7f2badec4329d3b5fdc1407291c35b",
      "question": "Will Trump release the Epstein files by December 19?",
      "slug": "will-trump-release-the-epstein-files-by-december-19-771",
      "prices": { "yes": 0.9975, "no": 0.0025 },
      "volume": 67321563.56,
      "volume24h": 22684085.39
    },
    {
      "conditionId": "0x8e6ff03d48ea73396ca8c8eac6a8cada2a7507545a78901c4769776be351eaf5",
      "question": "Will Trump release the Epstein files by December 22?",
      "slug": "will-trump-release-the-epstein-files-by-december-22",
      "prices": { "yes": 0.125, "no": 0.875 },
      "volume": 173550.94,
      "volume24h": 123824.96,
      "endDate": "2025-12-26T00:00:00.000Z"
    }
  ],
  "total": 41
}
```

### 5.3 `get_trending_markets`

**用户场景**: "现在什么市场交易量大？"

**MCP Tool Definition**:
```json
{
  "name": "get_trending_markets",
  "description": "Get trending markets sorted by volume or liquidity",
  "inputSchema": {
    "type": "object",
    "properties": {
      "limit": {
        "type": "number",
        "default": 10
      },
      "sortBy": {
        "type": "string",
        "enum": ["volume", "liquidity", "newest"],
        "default": "volume"
      }
    }
  }
}
```

**Input**:
```json
{
  "limit": 10,
  "sortBy": "volume"
}
```

**Output**:
```json
{
  "markets": [
    {
      "conditionId": "0x...",
      "question": "...",
      "volume24h": 1000000,
      "priceChange24h": 0.05,
      "prices": { "yes": 0.65, "no": 0.35 }
    }
  ]
}
```

### 5.4 `get_market_trades`

**用户场景**: "这个市场最近有什么大单？"

**MCP Tool Definition**:
```json
{
  "name": "get_market_trades",
  "description": "Get recent trades for a specific market",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conditionId": {
        "type": "string",
        "description": "Market condition ID"
      },
      "limit": {
        "type": "number",
        "default": 20
      }
    },
    "required": ["conditionId"]
  }
}
```

**Input**:
```json
{
  "conditionId": "0xfa48a993...",
  "limit": 20
}
```

**Output**:
```json
{
  "market": {
    "conditionId": "0xfa48a993...",
    "question": "US recession in 2025?"
  },
  "trades": [
    {
      "trader": "0xdb07e53d...",
      "traderName": "dontletmecook",
      "side": "SELL",
      "outcome": "Yes",
      "size": 142.85,
      "price": 0.006,
      "timestamp": "2025-12-21T08:20:59Z"
    }
  ],
  "summary": {
    "buyVolume24h": 50000,
    "sellVolume24h": 30000,
    "netFlow": 20000
  }
}
```

---

## 6. Order Tools（订单簿分析）

### 工具列表

| Tool | 用户问题 | 返回 |
|------|----------|------|
| `get_orderbook` | "盘口深度如何？" | 买卖盘 |
| `get_best_prices` | "现在最好的价格是？" | 最优价格 |
| `estimate_execution` | "我买 1000 USDC 会成交在什么价？" | 成交预估 |

### 6.1 `get_orderbook`

**用户场景**: "这个市场的盘口深度怎么样？"

**MCP Tool Definition**:
```json
{
  "name": "get_orderbook",
  "description": "Get orderbook depth for a market outcome",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conditionId": {
        "type": "string",
        "description": "Market condition ID"
      },
      "outcome": {
        "type": "string",
        "enum": ["Yes", "No"],
        "description": "Which outcome's orderbook to fetch"
      },
      "depth": {
        "type": "number",
        "description": "Number of price levels",
        "default": 10
      }
    },
    "required": ["conditionId", "outcome"]
  }
}
```

**Input**:
```json
{
  "conditionId": "0xfa48a993...",
  "outcome": "Yes",
  "depth": 10
}
```

**Output**:
```json
{
  "market": {
    "conditionId": "0xfa48a993...",
    "question": "US recession in 2025?"
  },
  "outcome": "Yes",
  "tokenId": "10417...",
  "orderbook": {
    "bids": [
      { "price": 0.006, "size": 128351, "total": 770.11 },
      { "price": 0.005, "size": 51922, "total": 259.61 }
    ],
    "asks": [
      { "price": 0.007, "size": 100000, "total": 700.00 },
      { "price": 0.008, "size": 50000, "total": 400.00 }
    ]
  },
  "summary": {
    "bestBid": 0.006,
    "bestAsk": 0.007,
    "spread": 0.001,
    "spreadPercent": 14.29,
    "bidDepth": 180273,
    "askDepth": 150000
  }
}
```

### 6.2 `get_best_prices`

**用户场景**: "YES 现在什么价能买到？"

**MCP Tool Definition**:
```json
{
  "name": "get_best_prices",
  "description": "Get best bid/ask prices for both outcomes",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conditionId": {
        "type": "string",
        "description": "Market condition ID"
      }
    },
    "required": ["conditionId"]
  }
}
```

**Input**:
```json
{
  "conditionId": "0xfa48a993..."
}
```

**Output**:
```json
{
  "market": "US recession in 2025?",
  "yes": {
    "bestBid": 0.006,
    "bestAsk": 0.007,
    "midPrice": 0.0065,
    "spread": 0.001
  },
  "no": {
    "bestBid": 0.993,
    "bestAsk": 0.994,
    "midPrice": 0.9935,
    "spread": 0.001
  }
}
```

### 6.3 `estimate_execution`

**用户场景**: "如果我花 1000 USDC 买 YES，平均成交价是多少？"

**MCP Tool Definition**:
```json
{
  "name": "estimate_execution",
  "description": "Estimate execution price and slippage for a trade",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conditionId": {
        "type": "string"
      },
      "outcome": {
        "type": "string",
        "enum": ["Yes", "No"]
      },
      "side": {
        "type": "string",
        "enum": ["BUY", "SELL"]
      },
      "amount": {
        "type": "number",
        "description": "Amount in USDC"
      }
    },
    "required": ["conditionId", "outcome", "side", "amount"]
  }
}
```

**Input**:
```json
{
  "conditionId": "0xfa48a993...",
  "outcome": "Yes",
  "side": "BUY",
  "amount": 1000
}
```

**Output**:
```json
{
  "market": "US recession in 2025?",
  "order": {
    "side": "BUY",
    "outcome": "Yes",
    "usdcAmount": 1000
  },
  "estimate": {
    "avgPrice": 0.0072,
    "sharesReceived": 138889,
    "priceImpact": 0.03,
    "worstPrice": 0.008
  },
  "warning": null
}
```

---

## 7. Trade Tools（交易执行）

### 工具列表

| Tool | 用户问题 | 需要 |
|------|----------|------|
| `place_limit_order` | "帮我挂单买 YES" | API Key |
| `place_market_order` | "帮我市价买入" | API Key |
| `cancel_order` | "取消这个订单" | API Key |
| `get_my_orders` | "我有什么挂单？" | API Key |

### 7.1 `place_limit_order`

**用户场景**: "帮我在 0.50 买入 100 股 YES"

**MCP Tool Definition**:
```json
{
  "name": "place_limit_order",
  "description": "Place a limit order on a market",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conditionId": {
        "type": "string"
      },
      "outcome": {
        "type": "string",
        "enum": ["Yes", "No"]
      },
      "side": {
        "type": "string",
        "enum": ["BUY", "SELL"]
      },
      "price": {
        "type": "number",
        "description": "Limit price (0.001 to 0.999)"
      },
      "size": {
        "type": "number",
        "description": "Number of shares"
      },
      "orderType": {
        "type": "string",
        "enum": ["GTC", "GTD"],
        "default": "GTC"
      }
    },
    "required": ["conditionId", "outcome", "side", "price", "size"]
  }
}
```

**Input**:
```json
{
  "conditionId": "0xfa48a993...",
  "outcome": "Yes",
  "side": "BUY",
  "price": 0.50,
  "size": 100,
  "orderType": "GTC"
}
```

**Output**:
```json
{
  "success": true,
  "order": {
    "orderId": "0x123...",
    "status": "LIVE",
    "tokenId": "10417...",
    "side": "BUY",
    "price": 0.50,
    "size": 100,
    "filled": 0,
    "createdAt": "2025-12-21T10:00:00Z"
  }
}
```

### 7.2 `place_market_order`

**用户场景**: "帮我用 500 USDC 市价买入 YES"

**MCP Tool Definition**:
```json
{
  "name": "place_market_order",
  "description": "Place a market order on a market",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conditionId": {
        "type": "string"
      },
      "outcome": {
        "type": "string",
        "enum": ["Yes", "No"]
      },
      "side": {
        "type": "string",
        "enum": ["BUY", "SELL"]
      },
      "amount": {
        "type": "number",
        "description": "Amount in USDC"
      },
      "maxSlippage": {
        "type": "number",
        "description": "Maximum acceptable slippage (e.g., 0.02 for 2%)",
        "default": 0.02
      }
    },
    "required": ["conditionId", "outcome", "side", "amount"]
  }
}
```

**Input**:
```json
{
  "conditionId": "0xfa48a993...",
  "outcome": "Yes",
  "side": "BUY",
  "amount": 500,
  "maxSlippage": 0.02
}
```

**Output**:
```json
{
  "success": true,
  "execution": {
    "orderId": "0x456...",
    "side": "BUY",
    "usdcSpent": 500,
    "sharesReceived": 714.29,
    "avgPrice": 0.70,
    "fee": 0
  }
}
```

### 7.3 `cancel_order`

**MCP Tool Definition**:
```json
{
  "name": "cancel_order",
  "description": "Cancel an open order",
  "inputSchema": {
    "type": "object",
    "properties": {
      "orderId": {
        "type": "string",
        "description": "Order ID to cancel"
      }
    },
    "required": ["orderId"]
  }
}
```

**Input**:
```json
{
  "orderId": "0x123..."
}
```

**Output**:
```json
{
  "success": true,
  "cancelledOrderId": "0x123..."
}
```

### 7.4 `get_my_orders`

**MCP Tool Definition**:
```json
{
  "name": "get_my_orders",
  "description": "Get your open orders",
  "inputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["LIVE", "FILLED", "CANCELLED"],
        "default": "LIVE"
      }
    }
  }
}
```

**Input**:
```json
{
  "status": "LIVE"
}
```

**Output**:
```json
{
  "orders": [
    {
      "orderId": "0x123...",
      "market": "US recession in 2025?",
      "outcome": "Yes",
      "side": "BUY",
      "price": 0.50,
      "originalSize": 100,
      "remainingSize": 100,
      "status": "LIVE",
      "createdAt": "2025-12-21T10:00:00Z"
    }
  ]
}
```

---

## 8. Wallet Tools（钱包管理）

### ⚠️ CRITICAL: USDC.e vs Native USDC

Polymarket CTF **only accepts USDC.e** (bridged USDC), NOT native USDC!

| Token | Address | CTF Compatible |
|-------|---------|----------------|
| USDC.e (Bridged) | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` | ✅ **Required** |
| Native USDC | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | ❌ Not accepted |

**常见错误**:
- 钱包有 100 USDC（Native）→ CTF 操作失败
- 原因：CTF 需要 USDC.e，不是 Native USDC

**解决方案**:
- `swap('USDC', 'USDC_E', amount)` - 将 Native USDC 换成 USDC.e
- `transferUsdcE(to, amount)` - 给 session 钱包转 USDC.e（用于 CTF）
- `CTFClient.checkReadyForCTF(amount)` - 检查钱包是否准备好 CTF 操作

### 工具列表

| Tool | 用户问题 | 需要 |
|------|----------|------|
| `get_supported_deposit_assets` | "支持哪些资产充值？" | ❌ |
| `get_deposit_addresses` | "充值地址是什么？" | 私钥 |
| `deposit_usdc` | "帮我充值到交易账户" | 私钥 |
| `check_allowances` | "我的授权状态如何？" | 私钥 |
| `approve_trading` | "帮我授权所有合约" | 私钥 |
| `swap` | "帮我换币" | 私钥 |
| `swap_and_deposit` | "帮我换币并充值" | 私钥 |
| `get_token_balances` | "我钱包有什么余额？" | 私钥 |
| `get_wallet_balances` | "查看某个钱包余额" | ❌ |

### 8.1 `get_supported_deposit_assets`

**用户场景**: "Polymarket 支持从哪些链充值？"

**MCP Tool Definition**:
```json
{
  "name": "get_supported_deposit_assets",
  "description": "Get list of supported assets for cross-chain deposits to Polymarket",
  "inputSchema": {
    "type": "object",
    "properties": {
      "chainId": {
        "type": "number",
        "description": "Filter by chain ID (optional)"
      }
    }
  }
}
```

**Input**:
```json
{}
```

**Output** (基于真实 API - 已验证):
```json
{
  "assets": [
    {
      "chainId": 1,
      "chainName": "ethereum",
      "tokenSymbol": "USDC",
      "tokenAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      "minDepositUsd": 5
    },
    {
      "chainId": 137,
      "chainName": "polygon",
      "tokenSymbol": "USDC",
      "tokenAddress": "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
      "minDepositUsd": 1
    }
  ],
  "summary": {
    "totalAssets": 207,
    "chains": ["ethereum", "polygon", "arbitrum", "optimism", "base", "solana", "bitcoin"]
  }
}
```

### 8.2 `get_deposit_addresses`

**用户场景**: "我的跨链充值地址是什么？"

**MCP Tool Definition**:
```json
{
  "name": "get_deposit_addresses",
  "description": "Get deposit addresses for cross-chain deposits",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

**Output** (基于真实 API - 已验证):
```json
{
  "polymarketAddress": "0x1234...your wallet",
  "depositAddresses": {
    "evm": "0xabcd...deposit address",
    "solana": "ABC123...solana address",
    "bitcoin": "bc1q...bitcoin address"
  }
}
```

### 8.3 `deposit_usdc`

**用户场景**: "帮我把 100 USDC 充值到交易账户"

**MCP Tool Definition**:
```json
{
  "name": "deposit_usdc",
  "description": "Deposit USDC from Polygon wallet to Polymarket trading account",
  "inputSchema": {
    "type": "object",
    "properties": {
      "amount": {
        "type": "number",
        "description": "Amount of USDC to deposit"
      },
      "token": {
        "type": "string",
        "enum": ["NATIVE_USDC", "USDC_E"],
        "description": "Which USDC token to deposit",
        "default": "NATIVE_USDC"
      }
    },
    "required": ["amount"]
  }
}
```

**Input**:
```json
{
  "amount": 100,
  "token": "NATIVE_USDC"
}
```

**Output**:
```json
{
  "success": true,
  "transaction": {
    "hash": "0x5fd43582...",
    "amount": 100,
    "token": "NATIVE_USDC",
    "from": "0x1234...your wallet",
    "to": "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"
  }
}
```

### 8.4 `check_allowances`

**用户场景**: "我的钱包授权好了吗？可以交易了吗？"

**MCP Tool Definition**:
```json
{
  "name": "check_allowances",
  "description": "Check if wallet has required USDC and ERC1155 approvals for trading",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

**Output** (基于真实合约调用 - 已验证):
```json
{
  "address": "0x1234...your wallet",
  "usdcBalance": "1000.00",
  "tradingReady": false,
  "erc20Allowances": [
    {
      "contract": "CTF Exchange",
      "address": "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
      "approved": true,
      "allowance": "unlimited"
    },
    {
      "contract": "Neg Risk CTF Exchange",
      "address": "0xC5d563A36AE78145C45a50134d48A1215220f80a",
      "approved": false,
      "allowance": "0"
    },
    {
      "contract": "Neg Risk Adapter",
      "address": "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296",
      "approved": false,
      "allowance": "0"
    }
  ],
  "erc1155Approvals": [
    {
      "contract": "CTF Exchange",
      "address": "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E",
      "approved": true
    },
    {
      "contract": "Neg Risk CTF Exchange",
      "address": "0xC5d563A36AE78145C45a50134d48A1215220f80a",
      "approved": false
    }
  ],
  "issues": [
    "USDC not approved for Neg Risk CTF Exchange",
    "USDC not approved for Neg Risk Adapter",
    "ERC1155 not approved for Neg Risk CTF Exchange"
  ]
}
```

### 8.5 `approve_trading`

**用户场景**: "帮我完成所有授权，让我可以交易"

**MCP Tool Definition**:
```json
{
  "name": "approve_trading",
  "description": "Approve all required contracts for trading on Polymarket",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

**Output**:
```json
{
  "success": true,
  "transactions": [
    {
      "type": "ERC20_APPROVAL",
      "contract": "CTF Exchange",
      "hash": "0xabc..."
    },
    {
      "type": "ERC20_APPROVAL",
      "contract": "Neg Risk CTF Exchange",
      "hash": "0xdef..."
    },
    {
      "type": "ERC20_APPROVAL",
      "contract": "Neg Risk Adapter",
      "hash": "0x123..."
    },
    {
      "type": "ERC1155_APPROVAL",
      "contract": "CTF Exchange",
      "hash": "0x456..."
    },
    {
      "type": "ERC1155_APPROVAL",
      "contract": "Neg Risk CTF Exchange",
      "hash": "0x789..."
    }
  ],
  "message": "All 5 approvals completed. Your wallet is now ready for trading."
}
```

### 8.6 `swap`

**用户场景**: "帮我把 100 MATIC 换成 USDC"

**MCP Tool Definition**:
```json
{
  "name": "swap",
  "description": "Swap between tokens on Polygon using QuickSwap V3",
  "inputSchema": {
    "type": "object",
    "properties": {
      "tokenIn": {
        "type": "string",
        "description": "Token to swap from (MATIC, WETH, USDC, USDC_E, USDT, DAI)"
      },
      "tokenOut": {
        "type": "string",
        "description": "Token to swap to (MATIC, WETH, USDC, USDC_E, USDT, DAI)"
      },
      "amount": {
        "type": "string",
        "description": "Amount to swap in token units"
      },
      "slippage": {
        "type": "number",
        "description": "Slippage tolerance in percent (default: 0.5)"
      }
    },
    "required": ["tokenIn", "tokenOut", "amount"]
  }
}
```

**Input**:
```json
{
  "tokenIn": "MATIC",
  "tokenOut": "USDC",
  "amount": "100",
  "slippage": 0.5
}
```

**Output**:
```json
{
  "success": true,
  "wallet": "0x1234...",
  "tokenIn": "MATIC",
  "tokenOut": "USDC",
  "amountIn": "100",
  "amountOut": "55.23",
  "txHash": "0xabc...",
  "gasUsed": "150000",
  "explorerUrl": "https://polygonscan.com/tx/0xabc..."
}
```

### 8.7 `swap_and_deposit`

**用户场景**: "帮我把 MATIC 换成 USDC 并充值到 Polymarket"

**MCP Tool Definition**:
```json
{
  "name": "swap_and_deposit",
  "description": "Swap any token to USDC and deposit to Polymarket in one operation",
  "inputSchema": {
    "type": "object",
    "properties": {
      "token": {
        "type": "string",
        "description": "Token to deposit (MATIC, WETH, USDT, DAI, USDC)"
      },
      "amount": {
        "type": "string",
        "description": "Amount to deposit in token units"
      },
      "slippage": {
        "type": "number",
        "description": "Slippage tolerance for swap in percent (default: 0.5)"
      }
    },
    "required": ["token", "amount"]
  }
}
```

**Input**:
```json
{
  "token": "MATIC",
  "amount": "100",
  "slippage": 0.5
}
```

**Output**:
```json
{
  "success": true,
  "wallet": "0x1234...",
  "tokenIn": "MATIC",
  "amountIn": "100",
  "usdcAmount": "55.23",
  "swapTxHash": "0xabc...",
  "depositTxHash": "0xdef...",
  "depositAddress": "0x4bFb41d5...",
  "message": "Swapped 100 MATIC to 55.23 USDC, then deposited to Polymarket.",
  "explorerUrl": "https://polygonscan.com/tx/0xdef..."
}
```

### 8.8 `get_token_balances`

**用户场景**: "我的钱包里有什么余额？"（需要私钥配置）

**MCP Tool Definition**:
```json
{
  "name": "get_token_balances",
  "description": "Get balances for all supported tokens on Polygon for the configured wallet",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

**Output**:
```json
{
  "wallet": "0x1234...",
  "balances": [
    { "token": "MATIC", "symbol": "MATIC", "balance": "150.5", "decimals": 18 },
    { "token": "USDC", "symbol": "USDC", "balance": "1000.00", "decimals": 6 },
    { "token": "USDC_E", "symbol": "USDC.e", "balance": "500.00", "decimals": 6 },
    { "token": "USDT", "symbol": "USDT", "balance": "0", "decimals": 6 },
    { "token": "DAI", "symbol": "DAI", "balance": "0", "decimals": 18 },
    { "token": "WETH", "symbol": "WETH", "balance": "0.5", "decimals": 18 }
  ],
  "nonZeroBalances": [
    { "token": "MATIC", "balance": "150.5" },
    { "token": "USDC", "balance": "1000.00" },
    { "token": "USDC_E", "balance": "500.00" },
    { "token": "WETH", "balance": "0.5" }
  ],
  "supportedTokens": ["MATIC", "USDC", "USDC_E", "USDT", "DAI", "WETH"]
}
```

### 8.9 `get_wallet_balances`

**用户场景**: "查看某个钱包有什么余额？"（不需要私钥）

**MCP Tool Definition**:
```json
{
  "name": "get_wallet_balances",
  "description": "Get Polygon token balances for any wallet address (no private key required)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "address": {
        "type": "string",
        "description": "Wallet address to check (0x...)"
      }
    },
    "required": ["address"]
  }
}
```

**Input**:
```json
{
  "address": "0xc2e7800b5af46e6093872b177b7a5e7f0563be51"
}
```

**Output** (真实数据验证 - 2024-12-22):
```json
{
  "address": "0xc2e7800b5af46e6093872b177b7a5e7f0563be51",
  "balances": [
    { "token": "MATIC", "symbol": "MATIC", "balance": "0.0956", "decimals": 18 },
    { "token": "USDC", "symbol": "USDC", "balance": "0", "decimals": 6 },
    { "token": "USDC_E", "symbol": "USDC.e", "balance": "2648315.63", "decimals": 6 },
    { "token": "USDT", "symbol": "USDT", "balance": "0", "decimals": 6 },
    { "token": "DAI", "symbol": "DAI", "balance": "0", "decimals": 18 },
    { "token": "WETH", "symbol": "WETH", "balance": "0", "decimals": 18 }
  ],
  "nonZeroBalances": [
    { "token": "MATIC", "balance": "0.0956" },
    { "token": "USDC_E", "balance": "2648315.63" }
  ],
  "summary": {
    "totalTokens": 2,
    "stablecoinValue": "2648315.63"
  },
  "supportedTokens": ["MATIC", "USDC", "USDC_E", "USDT", "DAI", "WETH"]
}
```

### 8.10 合约地址参考

**Polygon Mainnet (chainId: 137)**:

| Contract | Address | 用途 |
|----------|---------|------|
| USDC (Native) | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` | ERC20 代币 |
| USDC.e (Bridged) | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` | ERC20 代币 |
| USDT | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` | ERC20 代币 |
| DAI | `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063` | ERC20 代币 |
| WMATIC | `0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270` | Wrapped MATIC |
| WETH | `0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619` | Wrapped ETH |
| Conditional Tokens | `0x4D97DCd97eC945f40cF65F87097ACe5EA0476045` | ERC1155 代币 |
| CTF Exchange | `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E` | 交易合约 |
| Neg Risk CTF Exchange | `0xC5d563A36AE78145C45a50134d48A1215220f80a` | Neg Risk 交易 |
| Neg Risk Adapter | `0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296` | Neg Risk 适配器 |
| QuickSwap V3 Router | `0xf5b509bB0909a69B1c207E495f687a596C168E12` | DEX Swap 路由 |

---

## 9. 数据字段映射

### 9.1 可直接使用的字段

| 需要 | API | 字段 | 状态 |
|------|-----|------|------|
| 持仓 | positions | size, avgPrice, curPrice | ✅ |
| PnL | positions | cashPnl, realizedPnl, percentPnl | ✅ |
| 市场标题 | positions/activity | title, slug | ✅ |
| 交易历史 | activity | type, side, size, price, timestamp | ✅ |
| 排行榜 | leaderboard | rank, pnl, vol | ✅ |
| 市场价格 | gamma | outcomePrices | ✅ |
| 订单簿 | clob/book | bids, asks | ✅ |

### 9.2 需要计算的字段

| 需要 | 计算方式 |
|------|----------|
| winRate | positions.filter(p => p.cashPnl > 0).length / total |
| netFlow | buyVolume - sellVolume |
| priceImpact | 遍历订单簿计算 |
| smartScore | WalletService.calculateSmartScore() |

### 9.3 不可用的字段

| 需要 | 问题 | 解决方案 |
|------|------|----------|
| 精确 officialPnl 计算方式 | API 黑盒 | 显示两种 PnL |
| 历史价格走势 | 需要自己收集 | 后续增加 |

---

## 10. 实现架构

```
packages/
├── poly-sdk/                     # Core SDK
│   ├── src/
│   │   ├── index.ts              # SDK 入口
│   │   ├── clients/
│   │   │   ├── bridge-client.ts  # Bridge API + depositUsdc
│   │   │   ├── trading-client.ts # Trading operations
│   │   │   └── ...
│   │   └── services/
│   │       ├── authorization-service.ts  # 授权管理
│   │       ├── swap-service.ts   # DEX swap 功能
│   │       └── ...
│   └── package.json
│
└── poly-mcp/                     # MCP Server (separate package)
    ├── src/
    │   ├── index.ts              # MCP Handler + exports
    │   ├── server.ts             # Standalone MCP server
    │   ├── errors.ts             # Error handling
    │   ├── types.ts              # Type definitions
    │   └── tools/
    │       ├── trader.ts         # Trader Tools (4个)
    │       ├── market.ts         # Market Tools (4个)
    │       ├── order.ts          # Order Tools (3个)
    │       ├── trade.ts          # Trade Tools (4个)
    │       ├── wallet.ts         # Wallet Tools (11个)
    │       └── guide.ts          # Usage guide tool
    ├── docs/
    │   └── 01-mcp.md             # This file
    └── package.json
```

### 10.1 MCP Server 入口

```typescript
// packages/poly-mcp/src/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PolymarketSDK } from '@catalyst-team/poly-sdk';
import { registerTraderTools } from './tools/trader.js';
import { registerMarketTools } from './tools/market.js';
import { registerOrderTools } from './tools/order.js';
import { registerTradeTools } from './tools/trade.js';
import { registerWalletTools } from './tools/wallet.js';
import { registerGuideTools } from './tools/guide.js';

const server = new Server(
  { name: 'poly-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const sdk = new PolymarketSDK();

// Register all tools
registerTraderTools(server, sdk);
registerMarketTools(server, sdk);
registerOrderTools(server, sdk);
registerTradeTools(server, sdk);
registerWalletTools(server, sdk);
registerGuideTools(server);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 10.2 工具注册示例

```typescript
// packages/poly-mcp/src/tools/trader.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { PolymarketSDK } from '@catalyst-team/poly-sdk';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export function registerTraderTools(server: Server, sdk: PolymarketSDK) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_trader_positions',
        description: 'Get all positions held by a trader with PnL breakdown',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Trader wallet address (0x...)'
            }
          },
          required: ['address']
        }
      },
      // ... more tools
    ]
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'get_trader_positions': {
        const { address } = args as { address: string };
        const positions = await sdk.wallets.getWalletPositions(address);
        const profile = await sdk.wallets.getWalletProfile(address);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              trader: {
                address,
                displayName: profile.displayName || null
              },
              positions: positions.map(p => ({
                market: {
                  conditionId: p.conditionId,
                  title: p.title,
                  slug: p.slug
                },
                holding: {
                  outcome: p.outcome,
                  size: p.size,
                  avgPrice: p.avgPrice,
                  curPrice: p.curPrice
                },
                pnl: {
                  unrealized: p.cashPnl,
                  unrealizedPercent: p.percentPnl,
                  realized: p.realizedPnl
                },
                status: {
                  redeemable: p.redeemable,
                  endDate: p.endDate
                }
              })),
              summary: {
                totalPositions: positions.length,
                totalUnrealizedPnl: positions.reduce((s, p) => s + (p.cashPnl || 0), 0),
                totalRealizedPnl: positions.reduce((s, p) => s + (p.realizedPnl || 0), 0),
                winningPositions: positions.filter(p => (p.cashPnl || 0) > 0).length,
                losingPositions: positions.filter(p => (p.cashPnl || 0) < 0).length
              }
            }, null, 2)
          }]
        };
      }
      // ... more cases
    }
  });
}
```

---

## 9. On-Chain Tools（链上数据 - Subgraph）

> 基于 Goldsky 托管的 Polymarket Subgraph，提供链上数据查询

### 工具列表

| Tool | 用户问题 | 数据来源 |
|------|----------|----------|
| `get_market_open_interest` | "这个市场有多少 OI？" | OI Subgraph |
| `get_global_open_interest` | "Polymarket 总 OI 是多少？" | OI Subgraph |
| `get_condition_status` | "这个市场结算了吗？" | PnL Subgraph |
| `get_onchain_activity` | "这个用户链上做了什么？" | Activity Subgraph |
| `get_order_fills` | "最近有什么成交？" | Orderbook Subgraph |

### 9.1 `get_market_open_interest`

**用户场景**: "0xfa48a993 这个市场有多少资金在里面？"

**MCP Tool Definition**:
```json
{
  "name": "get_market_open_interest",
  "description": "Get open interest for a specific market from on-chain data",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conditionId": {
        "type": "string",
        "description": "Market condition ID (0x...)"
      }
    },
    "required": ["conditionId"]
  }
}
```

**Input**:
```json
{
  "conditionId": "0xfa48a993..."
}
```

**Output** (基于真实 Subgraph):
```json
{
  "market": {
    "conditionId": "0xfa48a993...",
    "question": "US recession in 2025?"
  },
  "openInterest": {
    "raw": "11010561190000",
    "formatted": "11,010,561.19",
    "currency": "USDC"
  },
  "rank": 15,
  "percentOfTotal": 3.31
}
```

### 9.2 `get_global_open_interest`

**用户场景**: "Polymarket 现在总共有多少资金？"

**MCP Tool Definition**:
```json
{
  "name": "get_global_open_interest",
  "description": "Get total open interest across all Polymarket markets",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

**Output** (基于真实 Subgraph - 已验证):
```json
{
  "globalOpenInterest": {
    "raw": "332425854000000",
    "formatted": "332,425,854",
    "currency": "USDC"
  },
  "topMarkets": [
    {
      "conditionId": "0xc6485bb7...",
      "openInterest": "71,147,696",
      "percentOfTotal": 21.41
    },
    {
      "conditionId": "0x95534417...",
      "openInterest": "60,486,105",
      "percentOfTotal": 18.20
    }
  ]
}
```

### 9.3 `get_condition_status`

**用户场景**: "这个市场结算了吗？谁赢了？"

**MCP Tool Definition**:
```json
{
  "name": "get_condition_status",
  "description": "Check if a market condition is resolved and get payout information",
  "inputSchema": {
    "type": "object",
    "properties": {
      "conditionId": {
        "type": "string",
        "description": "Market condition ID (0x...)"
      }
    },
    "required": ["conditionId"]
  }
}
```

**Input**:
```json
{
  "conditionId": "0xfa48a993..."
}
```

**Output** (基于真实 Subgraph):
```json
{
  "conditionId": "0xfa48a993...",
  "resolved": true,
  "payout": {
    "numerators": ["1", "0"],
    "denominator": "1",
    "winningOutcome": "Yes",
    "winningIndex": 0
  },
  "positionIds": [
    "10417...yes_token_id",
    "44528...no_token_id"
  ]
}
```

**未结算市场**:
```json
{
  "conditionId": "0x00000977...",
  "resolved": false,
  "payout": null,
  "positionIds": ["44554...", "56914..."]
}
```

### 9.4 `get_onchain_activity`

**用户场景**: "这个用户在链上做过什么操作？"

**MCP Tool Definition**:
```json
{
  "name": "get_onchain_activity",
  "description": "Get user's on-chain CTF activity (splits, merges, redemptions)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "address": {
        "type": "string",
        "description": "User wallet address (0x...)"
      },
      "limit": {
        "type": "number",
        "description": "Maximum events per type",
        "default": 20
      }
    },
    "required": ["address"]
  }
}
```

**Input**:
```json
{
  "address": "0xc2e7800b...",
  "limit": 10
}
```

**Output** (基于真实 Subgraph):
```json
{
  "address": "0xc2e7800b...",
  "activity": {
    "splits": [
      {
        "id": "0xbff75087...",
        "timestamp": "2025-12-20T15:30:00Z",
        "condition": "0x2506d9db...",
        "amount": "5000000"
      }
    ],
    "merges": [],
    "redemptions": [
      {
        "id": "0xff097248...",
        "timestamp": "2025-12-20T15:35:00Z",
        "condition": "0x76f39bb0...",
        "payout": "10000000"
      }
    ]
  },
  "summary": {
    "totalSplits": 5,
    "totalMerges": 0,
    "totalRedemptions": 12,
    "totalPayoutReceived": "50000000"
  }
}
```

### 9.5 `get_order_fills`

**用户场景**: "最近有什么大单成交？" / "这个用户成交了什么？"

**MCP Tool Definition**:
```json
{
  "name": "get_order_fills",
  "description": "Get recent order fill events from on-chain data",
  "inputSchema": {
    "type": "object",
    "properties": {
      "maker": {
        "type": "string",
        "description": "Filter by maker address (optional)"
      },
      "taker": {
        "type": "string",
        "description": "Filter by taker address (optional)"
      },
      "limit": {
        "type": "number",
        "description": "Maximum number of fills",
        "default": 20
      }
    }
  }
}
```

**Input (最近成交)**:
```json
{
  "limit": 10
}
```

**Input (特定用户)**:
```json
{
  "maker": "0xbbaa9ffc...",
  "limit": 10
}
```

**Output** (基于真实 Subgraph - 已验证):
```json
{
  "fills": [
    {
      "id": "0xf4dd79c7...",
      "orderHash": "0x25e7d399...",
      "maker": "0xd0d6053c...",
      "taker": "0x4bfb41d5...",
      "makerAssetId": "59975245897...",
      "takerAssetId": "0",
      "makerAmountFilled": "13600000",
      "takerAmountFilled": "8024000",
      "fee": "0",
      "timestamp": "2025-12-20T16:00:00Z",
      "txHash": "0xf4dd79c7..."
    }
  ],
  "summary": {
    "totalFills": 10,
    "totalVolume": "135000000"
  }
}
```

---

## 10. 配置与认证

### 10.1 环境变量

```bash
# .env
POLY_PRIVATE_KEY=your-private-key  # 用于 Trade Tools 和 Wallet Tools
POLY_CHAIN_ID=137                  # Polygon Mainnet (default)
```

**Note**: API credentials 会自动从私钥派生，使用 Polymarket 的 `createOrDeriveApiKey()` 方法。

### 10.2 MCP 配置

#### 发布后使用 (推荐)

```json
// Claude Desktop config: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "polymarket": {
      "command": "npx",
      "args": ["@catalyst-team/poly-mcp"],
      "env": {
        "POLY_PRIVATE_KEY": "your-wallet-private-key"
      }
    }
  }
}
```

#### 本地开发

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "node",
      "args": ["/path/to/PerdictionRouter/packages/poly-mcp/dist/server.js"],
      "env": {
        "POLY_PRIVATE_KEY": "your-wallet-private-key"
      }
    }
  }
}
```

### 10.3 工具权限

| 工具类别 | 需要认证 | 说明 |
|---------|---------|------|
| Trader Tools | ❌ | 公开数据查询 |
| Market Tools | ❌ | 公开数据查询 |
| Order Tools | ❌ | 公开数据查询 |
| Trade Tools | ✅ | 需要 API Key |
| Wallet Tools | ⚠️ | 部分需要私钥（swap, deposit, allowance），get_wallet_balances 和 get_supported_deposit_assets 不需要 |

---

## 11. 错误处理

### 11.1 统一错误格式

```typescript
interface McpError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 11.2 错误码

| Code | 说明 | 示例 |
|------|------|------|
| `INVALID_ADDRESS` | 无效钱包地址 | "Address must start with 0x" |
| `MARKET_NOT_FOUND` | 市场不存在 | "Market 0x... not found" |
| `INSUFFICIENT_BALANCE` | 余额不足 | "Insufficient USDC balance" |
| `ORDER_REJECTED` | 订单被拒绝 | "Price outside valid range" |
| `RATE_LIMITED` | 请求过于频繁 | "Rate limit exceeded" |
| `AUTH_REQUIRED` | 需要认证 | "Trade tools require API key" |
| `INTERNAL_ERROR` | 内部错误 | "Unexpected error occurred" |

### 11.3 错误处理实现

```typescript
// src/utils/errors.ts
export class McpToolError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }

  toResponse() {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: {
            code: this.code,
            message: this.message,
            details: this.details
          }
        })
      }],
      isError: true
    };
  }
}

// 使用
try {
  const positions = await sdk.wallets.getWalletPositions(address);
  // ...
} catch (err) {
  if (err instanceof PolymarketError) {
    throw new McpToolError(
      err.code,
      err.message,
      { originalError: err.details }
    );
  }
  throw new McpToolError('INTERNAL_ERROR', 'Unexpected error occurred');
}
```

---

## 12. 优先级

| Phase | Tools | 说明 |
|-------|-------|------|
| **P0** | get_trader_positions, get_market, get_orderbook | 核心查询 |
| **P1** | get_trader_trades, get_leaderboard, search_markets, check_allowances, get_supported_deposit_assets, get_deposit_addresses, get_token_balances, get_wallet_balances | 分析 + 钱包状态 |
| **P2** | place_limit_order, place_market_order, deposit_usdc, approve_trading, swap, swap_and_deposit | 交易执行 + 钱包操作 |
| **P3** | estimate_execution, get_trending_markets | 高级功能 |

---

## 13. 测试计划

### 13.1 单元测试

```typescript
// tests/tools/trader.test.ts
describe('get_trader_positions', () => {
  it('returns positions for valid address', async () => {
    const result = await callTool('get_trader_positions', {
      address: '0xc2e7800b5af46e6093872b177b7a5e7f0563be51'
    });

    expect(result.trader.address).toBe('0xc2e7800b...');
    expect(result.positions).toBeInstanceOf(Array);
    expect(result.summary.totalPositions).toBeGreaterThanOrEqual(0);
  });

  it('returns error for invalid address', async () => {
    const result = await callTool('get_trader_positions', {
      address: 'invalid'
    });

    expect(result.error.code).toBe('INVALID_ADDRESS');
  });
});
```

### 13.2 集成测试

```bash
# 使用 MCP Inspector 测试
npx @anthropic/mcp-inspector poly-mcp

# 手动测试
echo '{"method":"tools/call","params":{"name":"get_trader_positions","arguments":{"address":"0xc2e7800b5af46e6093872b177b7a5e7f0563be51"}}}' | npx poly-mcp
```

---

## 14. 工具汇总

| # | Tool | 类别 | 优先级 | 需要私钥 |
|---|------|------|--------|----------|
| 1 | `get_trader_positions` | Trader | P0 | ❌ |
| 2 | `get_trader_closed_positions` | Trader | P1 | ❌ |
| 3 | `get_trader_trades` | Trader | P1 | ❌ |
| 4 | `get_trader_activity` | Trader | P1 | ❌ |
| 5 | `get_trader_profile` | Trader | P1 | ❌ |
| 6 | `get_leaderboard` | Trader | P1 | ❌ |
| 7 | `get_account_value` | Trader | P1 | ❌ |
| 7 | `get_market` | Market | P0 | ❌ |
| 8 | `search_markets` | Market | P1 | ❌ |
| 9 | `get_trending_markets` | Market | P3 | ❌ |
| 10 | `get_market_trades` | Market | P1 | ❌ |
| 11 | `get_orderbook` | Order | P0 | ❌ |
| 12 | `get_best_prices` | Order | P1 | ❌ |
| 13 | `estimate_execution` | Order | P3 | ❌ |
| 14 | `place_limit_order` | Trade | P2 | ✅ |
| 15 | `place_market_order` | Trade | P2 | ✅ |
| 16 | `cancel_order` | Trade | P2 | ✅ |
| 17 | `get_my_orders` | Trade | P2 | ✅ |
| 18 | `get_supported_deposit_assets` | Wallet | P1 | ❌ |
| 19 | `get_deposit_addresses` | Wallet | P1 | ✅ |
| 20 | `deposit_usdc` | Wallet | P2 | ✅ |
| 21 | `check_allowances` | Wallet | P1 | ✅ |
| 22 | `approve_trading` | Wallet | P2 | ✅ |
| 23 | `swap` | Wallet | P2 | ✅ |
| 24 | `swap_and_deposit` | Wallet | P2 | ✅ |
| 25 | `get_token_balances` | Wallet | P1 | ✅ |
| 26 | `get_wallet_balances` | Wallet | P1 | ❌ |
| 27 | `get_swap_quote` | Wallet | P1 | ❌ |
| 28 | `get_available_pools` | Wallet | P1 | ❌ |
| 29 | `get_usage_guide` | Guide | P0 | ❌ |
| 30 | `get_market_open_interest` | On-Chain | P1 | ❌ |
| 31 | `get_global_open_interest` | On-Chain | P1 | ❌ |
| 32 | `get_condition_status` | On-Chain | P1 | ❌ |
| 33 | `get_onchain_activity` | On-Chain | P1 | ❌ |
| 34 | `get_order_fills` | On-Chain | P1 | ❌ |

**Total: 34 Tools**

---

## 15. 后续优化

### 15.1 性能优化

- [ ] 批量查询：合并多个钱包的查询
- [ ] 流式响应：对大数据量使用流式传输
- [ ] 缓存策略：MCP 层缓存热点数据

### 15.2 功能扩展

- [ ] 历史价格图表数据
- [ ] 钱包对比分析
- [ ] 市场相关性分析
- [ ] 套利机会检测

### 15.3 监控与日志

- [ ] 请求追踪
- [ ] 性能指标收集
- [ ] 错误报警
