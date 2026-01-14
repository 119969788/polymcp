/**
 * MCP Tool Types for Polymarket
 */

// Tool Input Types
export interface GetTraderPositionsInput {
  address: string;
  limit?: number;
  offset?: number;
  sortBy?: 'CASHPNL' | 'PERCENTPNL' | 'CURRENT' | 'INITIAL' | 'TOKENS' | 'TITLE' | 'PRICE' | 'AVGPRICE';
  sortDirection?: 'ASC' | 'DESC';
}

export interface GetTraderTradesInput {
  address: string;
  limit?: number;
  side?: 'BUY' | 'SELL';
}

export interface GetTraderActivityInput {
  address: string;
  limit?: number;
  offset?: number;
  start?: number;
  end?: number;
  type?: 'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION';
  side?: 'BUY' | 'SELL';
  market?: string;
  fetchAll?: boolean;
  maxItems?: number;
}

export interface GetTraderProfileInput {
  address: string;
}

export interface GetLeaderboardInput {
  limit?: number;
  offset?: number;
  period?: 'day' | 'week' | 'month' | 'all';
  sortBy?: 'pnl' | 'volume';
}

export interface GetClosedPositionsInput {
  address: string;
  limit?: number;
  offset?: number;
  sortBy?: 'REALIZEDPNL' | 'TIMESTAMP' | 'TITLE' | 'PRICE' | 'AVGPRICE';
  sortDirection?: 'ASC' | 'DESC';
}

export interface GetAccountValueInput {
  address: string;
  market?: string[];
}

export interface GetMarketInput {
  identifier: string;
}

export interface SearchMarketsInput {
  query: string;
  active?: boolean;
  limit?: number;
}

export interface GetTrendingMarketsInput {
  limit?: number;
  sortBy?: 'volume' | 'liquidity' | 'newest';
}

export interface GetMarketTradesInput {
  conditionId: string;
  limit?: number;
}

export interface GetKLinesInput {
  conditionId: string;
  /** K-line interval. Use 1s/5s/15s/30s for 15-minute crypto markets. */
  interval: '1s' | '5s' | '15s' | '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '12h' | '1d';
  limit?: number;
  outcome?: 'Yes' | 'No' | 'both';
  /** Start timestamp (Unix milliseconds) - filter candles after this time */
  startTimestamp?: number;
  /** End timestamp (Unix milliseconds) - filter candles before this time */
  endTimestamp?: number;
}

export interface GetPriceHistoryInput {
  tokenId: string;
  interval?: '1h' | '6h' | '1d' | '1w' | 'max';
}

export interface DetectArbitrageInput {
  conditionId: string;
  threshold?: number;
}

export interface DetectMarketSignalsInput {
  conditionId: string;
}

export interface GetRealtimeSpreadInput {
  conditionId: string;
}

export interface ScanCryptoShortTermMarketsInput {
  minMinutesUntilEnd?: number;
  maxMinutesUntilEnd?: number;
  limit?: number;
  sortBy?: 'endDate' | 'volume' | 'liquidity';
  duration?: '5m' | '15m' | 'all';
  coin?: 'BTC' | 'ETH' | 'SOL' | 'XRP' | 'all';
}

export interface GetOrderbookInput {
  conditionId: string;
  outcome: 'Yes' | 'No';
  depth?: number;
}

export interface GetBestPricesInput {
  conditionId: string;
}

export interface EstimateExecutionInput {
  conditionId: string;
  outcome: 'Yes' | 'No';
  side: 'BUY' | 'SELL';
  amount: number;
}

export interface PlaceLimitOrderInput {
  conditionId: string;
  outcome: 'Yes' | 'No';
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  orderType?: 'GTC' | 'GTD';
}

export interface PlaceMarketOrderInput {
  conditionId: string;
  outcome: 'Yes' | 'No';
  side: 'BUY' | 'SELL';
  amount: number;
  maxSlippage?: number;
}

export interface CancelOrderInput {
  orderId: string;
}

export interface GetMyOrdersInput {
  status?: 'LIVE' | 'FILLED' | 'CANCELLED';
}

// Tool Output Types
export interface TraderInfo {
  address: string;
  displayName: string | null;
}

export interface MarketInfo {
  conditionId: string;
  title: string;
  slug?: string;
}

export interface PositionHolding {
  outcome: string;
  size: number;
  avgPrice: number;
  curPrice?: number;
}

export interface PositionPnL {
  unrealized?: number;
  unrealizedPercent?: number;
  realized?: number;
}

export interface PositionStatus {
  redeemable?: boolean;
  endDate?: string;
}

export interface PositionOutput {
  market: MarketInfo;
  holding: PositionHolding;
  pnl: PositionPnL;
  status: PositionStatus;
}

export interface GetTraderPositionsOutput {
  trader: TraderInfo;
  positions: PositionOutput[];
  summary: {
    totalPositions: number;
    totalUnrealizedPnl: number;
    totalRealizedPnl: number;
    winningPositions: number;
    losingPositions: number;
  };
}

export interface TradeExecution {
  size: number;
  price: number;
  usdcValue: number;
}

export interface TradeOutput {
  type: string;
  side: 'BUY' | 'SELL';
  market: MarketInfo;
  outcome: string;
  execution: TradeExecution;
  timestamp: string;
  txHash: string;
}

export interface GetTraderTradesOutput {
  trader: TraderInfo;
  trades: TradeOutput[];
  summary: {
    totalTrades: number;
    buyCount: number;
    sellCount: number;
    buyVolume: number;
    sellVolume: number;
  };
}

export interface ActivityOutput {
  type: 'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION';
  side?: 'BUY' | 'SELL';
  market: MarketInfo;
  outcome?: string;
  size: number;
  price?: number;
  usdcValue: number;
  timestamp: string;
  txHash: string;
}

export interface GetTraderActivityOutput {
  trader: TraderInfo;
  activities: ActivityOutput[];
  summary: {
    total: number;
    byType: Record<string, number>;
    totalVolume: number;
  };
}

export interface GetTraderProfileOutput {
  trader: {
    address: string;
    displayName: string | null;
    xUsername: string | null;
    verified: boolean;
    profileImage: string | null;
  };
  ranking: {
    rank: number | null;
    totalTraders: number;
  };
  performance: {
    officialPnl: number | null;
    totalVolume: number;
    unrealizedPnl: number;
    realizedPnl: number;
  };
  stats: {
    positionCount: number;
    winRate: number;
    avgPercentPnl: number;
    smartScore: number;
  };
  activity: {
    lastTradeAt: string | null;
    isActive: boolean;
  };
  /** Explanation when PnL values differ between sources */
  notes?: string;
}

export interface LeaderboardTrader {
  rank: number;
  address: string;
  displayName: string | null;
  pnl: number;
  volume: number;
  verified: boolean;
}

export interface GetLeaderboardOutput {
  traders: LeaderboardTrader[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
  };
  period?: 'day' | 'week' | 'month' | 'all';
  sortBy?: 'pnl' | 'volume';
}

// Closed Positions Output
export interface ClosedPositionOutput {
  market: MarketInfo;
  holding: {
    outcome: string;
    avgPrice: number;
    settlementPrice: number;
  };
  pnl: {
    realized: number;
    totalBought: number;
  };
  settledAt: string;
}

export interface GetClosedPositionsOutput {
  trader: TraderInfo;
  closedPositions: ClosedPositionOutput[];
  summary: {
    totalClosed: number;
    totalRealizedPnl: number;
    winningPositions: number;
    losingPositions: number;
  };
}

// Account Value Output
export interface GetAccountValueOutput {
  address: string;
  value: number;
  currency: string;
}

export interface TokenInfo {
  tokenId: string;
  outcome: string;
  price: number;
}

export interface GetMarketOutput {
  market: {
    conditionId: string;
    question: string;
    slug: string;
    description?: string;
  };
  prices: {
    yes: number;
    no: number;
    spread?: number;
  };
  tokens: TokenInfo[];
  stats: {
    volume: number;
    liquidity: number;
  };
  status: {
    active: boolean;
    closed: boolean;
    acceptingOrders: boolean;
    endDate?: string;
  };
  trading: {
    minTickSize?: number;
    minOrderSize?: number;
  };
}

export interface SearchMarketResult {
  conditionId: string;
  question: string;
  slug: string;
  prices: { yes: number; no: number };
  volume: number;
  volume24h?: number;
  endDate?: string;
}

export interface SearchMarketsOutput {
  markets: SearchMarketResult[];
  total: number;
}

export interface TrendingMarket {
  conditionId: string;
  question: string;
  slug: string;
  volume24h?: number;
  priceChange24h?: number;
  prices: { yes: number; no: number };
  status?: {
    active: boolean;
    closed: boolean;
    endDate?: string;
  };
}

export interface GetTrendingMarketsOutput {
  markets: TrendingMarket[];
}

export interface MarketTradeOutput {
  trader: string;
  traderName?: string;
  side: 'BUY' | 'SELL';
  outcome: string;
  size: number;
  price: number;
  timestamp: string;
}

export interface GetMarketTradesOutput {
  market: MarketInfo;
  trades: MarketTradeOutput[];
  summary: {
    buyVolume24h: number;
    sellVolume24h: number;
    netFlow: number;
  };
}

// K-Lines Output Types
export interface KLineCandleOutput {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradeCount: number;
  buyVolume: number;
  sellVolume: number;
}

export interface GetKLinesOutput {
  market: MarketInfo;
  interval: string;
  candles: KLineCandleOutput[];
  summary: {
    totalCandles: number;
    timeRange: { start: string; end: string } | null;
    avgVolume: number;
  };
}

export interface GetDualKLinesOutput {
  market: MarketInfo;
  interval: string;
  yes: KLineCandleOutput[];
  no: KLineCandleOutput[];
  spreadAnalysis: SpreadDataPointOutput[];
  summary: {
    totalCandles: { yes: number; no: number };
    avgSpread: number;
  };
}

export interface SpreadDataPointOutput {
  timestamp: string;
  yesPrice: number;
  noPrice: number;
  priceSum: number;
  priceSpread: number;
  arbOpportunity: 'LONG' | 'SHORT' | '';
}

// Price History Output Types
export interface PricePointOutput {
  timestamp: string;
  price: number;
}

export interface GetPriceHistoryOutput {
  tokenId: string;
  interval: string;
  history: PricePointOutput[];
  summary: {
    totalPoints: number;
    priceRange: { min: number; max: number } | null;
    priceChange: number | null;
  };
}

// Arbitrage Output Types
export interface DetectArbitrageOutput {
  market: MarketInfo;
  hasOpportunity: boolean;
  opportunity: {
    type: 'long' | 'short';
    profit: number;
    profitPercent: number;
    action: string;
  } | null;
  orderbook: {
    yesBid: number;
    yesAsk: number;
    noBid: number;
    noAsk: number;
  };
}

// Market Signals Output Types
export interface MarketSignalOutput {
  type: 'volume_surge' | 'depth_imbalance' | 'whale_trade' | 'momentum';
  severity: 'low' | 'medium' | 'high';
  details: Record<string, unknown>;
}

export interface DetectMarketSignalsOutput {
  market: MarketInfo;
  signals: MarketSignalOutput[];
  summary: {
    totalSignals: number;
    highSeverityCount: number;
    signalTypes: string[];
  };
}

// Realtime Spread Output Types
export interface GetRealtimeSpreadOutput {
  market: MarketInfo;
  timestamp: string;
  orderbook: {
    yesBid: number;
    yesAsk: number;
    noBid: number;
    noAsk: number;
  };
  spread: {
    askSum: number;
    bidSum: number;
    askSpread: number;
    bidSpread: number;
  };
  arbitrage: {
    longArbProfit: number;
    shortArbProfit: number;
    opportunity: 'LONG' | 'SHORT' | '';
    profitPercent: number;
  };
}

// Short-term Crypto Markets Output Types
export interface CryptoShortTermMarket {
  conditionId: string;
  slug: string;
  question: string;
  outcomes: string[];
  outcomePrices: number[];
  endDate: string;
  minutesUntilEnd: number;
  volume24hr: number;
  liquidity: number;
  spread: number;
  /** Detected duration: '5m' or '15m' */
  duration: '5m' | '15m' | 'unknown';
  /** Detected coin: 'BTC', 'ETH', 'SOL', 'XRP' */
  coin: 'BTC' | 'ETH' | 'SOL' | 'XRP' | 'unknown';
}

export interface ScanCryptoShortTermMarketsOutput {
  markets: CryptoShortTermMarket[];
  count: number;
  scanParams: {
    minMinutesUntilEnd: number;
    maxMinutesUntilEnd: number;
    sortBy: string;
    duration: string;
    coin: string;
  };
  scannedAt: string;
}

export interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
}

export interface GetOrderbookOutput {
  market: MarketInfo;
  outcome: string;
  tokenId: string;
  orderbook: {
    bids: OrderbookLevel[];
    asks: OrderbookLevel[];
  };
  summary: {
    bestBid: number;
    bestAsk: number;
    spread: number;
    spreadPercent: number;
    bidDepth: number;
    askDepth: number;
  };
}

export interface PriceInfo {
  bestBid: number;
  bestAsk: number;
  midPrice: number;
  spread: number;
}

export interface GetBestPricesOutput {
  market: string;
  yes: PriceInfo;
  no: PriceInfo;
}

export interface EstimateExecutionOutput {
  market: string;
  order: {
    side: 'BUY' | 'SELL';
    outcome: string;
    usdcAmount: number;
  };
  estimate: {
    avgPrice: number;
    sharesReceived: number;
    priceImpact: number;
    worstPrice: number;
  };
  warning: string | null;
}

// ===== Wallet Tool Types =====

// Deposit Input/Output
export interface GetSupportedAssetsInput {
  chainId?: number;
}

export interface SupportedAsset {
  chainId: number;
  chainName: string;
  tokenSymbol: string;
  tokenName: string;
  tokenAddress: string;
  decimals: number;
  minDeposit: string;
  minDepositUsd: number;
}

export interface GetSupportedAssetsOutput {
  assets: SupportedAsset[];
  summary: {
    totalChains: number;
    totalAssets: number;
    chains: string[];
  };
}

export interface GetDepositAddressesInput {
  // Uses wallet from SDK
}

export interface GetDepositAddressesOutput {
  wallet: string;
  addresses: {
    evm: string;
    solana: string;
    bitcoin: string;
  };
  evmChains: string[];
  instructions: string;
}

// Allowance Input/Output
export interface CheckAllowancesInput {
  // Uses wallet from SDK
}

export interface AllowanceStatus {
  contract: string;
  address: string;
  approved: boolean;
  allowance?: string;
}

export interface CheckAllowancesOutput {
  wallet: string;
  erc20: {
    usdc: {
      balance: string;
      allowances: AllowanceStatus[];
    };
  };
  erc1155: {
    conditionalTokens: {
      approvals: AllowanceStatus[];
    };
  };
  tradingReady: boolean;
  issues: string[];
}

export interface ApproveTradingInput {
  // Uses wallet from SDK
}

export interface ApprovalResult {
  contract: string;
  txHash?: string;
  success: boolean;
  error?: string;
}

export interface ApproveTradingOutput {
  wallet: string;
  erc20Approvals: ApprovalResult[];
  erc1155Approvals: ApprovalResult[];
  allApproved: boolean;
  summary: string;
}

// Error Types
export interface McpErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type McpToolResult<T> = T | McpErrorResponse;

// Tool Definition Type - Property schema supporting nested objects
export interface PropertySchema {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: { type: string };
  properties?: Record<string, PropertySchema>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, PropertySchema>;
    required?: string[];
  };
}
