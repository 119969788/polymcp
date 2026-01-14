/**
 * Market Tools - MCP tools for market discovery and analysis
 */

import type { PolymarketSDK } from '@catalyst-team/poly-sdk';
import type {
  ToolDefinition,
  GetMarketInput,
  GetMarketOutput,
  SearchMarketsInput,
  SearchMarketsOutput,
  GetTrendingMarketsInput,
  GetTrendingMarketsOutput,
  GetMarketTradesInput,
  GetMarketTradesOutput,
  GetKLinesInput,
  GetKLinesOutput,
  GetDualKLinesOutput,
  GetPriceHistoryInput,
  GetPriceHistoryOutput,
  DetectArbitrageInput,
  DetectArbitrageOutput,
  DetectMarketSignalsInput,
  DetectMarketSignalsOutput,
  GetRealtimeSpreadInput,
  GetRealtimeSpreadOutput,
  ScanCryptoShortTermMarketsInput,
  ScanCryptoShortTermMarketsOutput,
} from '../types.js';
import { validateConditionId, wrapError, McpToolError, ErrorCode } from '../errors.js';
import type { KLineInterval } from '@catalyst-team/poly-sdk';

export const marketToolDefinitions: ToolDefinition[] = [
  {
    name: 'get_market',
    description: 'Get market details including prices, volume, and status',
    inputSchema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: "Market slug (e.g., 'us-recession-in-2025') or conditionId (0x...)",
        },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'search_markets',
    description:
      'Search for markets by keyword. Searches in question text and slug. Returns markets sorted by 24h volume.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search keyword (e.g., "Trump", "Bitcoin", "recession"). Multi-word queries match any word.',
        },
        active: {
          type: 'boolean',
          description: 'Only return active markets',
          default: true,
        },
        limit: {
          type: 'number',
          description: 'Maximum results',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_trending_markets',
    description: 'Get trending markets sorted by volume or liquidity',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 10,
        },
        sortBy: {
          type: 'string',
          enum: ['volume', 'liquidity', 'newest'],
          default: 'volume',
        },
      },
    },
  },
  {
    name: 'get_market_trades',
    description: 'Get recent trades for a specific market',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID',
        },
        limit: {
          type: 'number',
          default: 20,
        },
      },
      required: ['conditionId'],
    },
  },
  {
    name: 'get_klines',
    description: 'Get K-line (candlestick) data for a market. Aggregates trade data into OHLCV candles. Use outcome="both" to get dual K-lines with spread analysis. Supports second-level intervals (1s, 5s, 15s) for 15-minute crypto markets.',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID',
        },
        interval: {
          type: 'string',
          description: 'K-line interval. Use 5s/15s/30s for 15-minute crypto markets.',
          enum: ['1s', '5s', '15s', '30s', '1m', '5m', '15m', '30m', '1h', '4h', '12h', '1d'],
        },
        limit: {
          type: 'number',
          description: 'Maximum number of trades to aggregate',
          default: 500,
        },
        outcome: {
          type: 'string',
          description: 'Which outcome to get K-lines for. Use "both" for dual K-lines with spread analysis.',
          enum: ['Yes', 'No', 'both'],
          default: 'Yes',
        },
        startTimestamp: {
          type: 'number',
          description: 'Start timestamp (Unix milliseconds) - filter candles after this time. Example: Date.now() - 15*60*1000 for last 15 minutes.',
        },
        endTimestamp: {
          type: 'number',
          description: 'End timestamp (Unix milliseconds) - filter candles before this time.',
        },
      },
      required: ['conditionId', 'interval'],
    },
  },
  {
    name: 'get_price_history',
    description: 'Get historical price data for a specific token',
    inputSchema: {
      type: 'object',
      properties: {
        tokenId: {
          type: 'string',
          description: 'Token ID to get price history for',
        },
        interval: {
          type: 'string',
          description: 'Time interval for price data',
          enum: ['1h', '6h', '1d', '1w', 'max'],
          default: '1d',
        },
      },
      required: ['tokenId'],
    },
  },
  {
    name: 'detect_arbitrage',
    description: 'Detect arbitrage opportunities in a market. Analyzes orderbook to find long (buy YES+NO, merge) or short (split, sell YES+NO) arbitrage.',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID',
        },
        threshold: {
          type: 'number',
          description: 'Minimum profit threshold (e.g., 0.005 for 0.5%)',
          default: 0.005,
        },
      },
      required: ['conditionId'],
    },
  },
  {
    name: 'detect_market_signals',
    description: 'Detect market signals including volume surges, depth imbalances, whale trades, and momentum indicators',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID',
        },
      },
      required: ['conditionId'],
    },
  },
  {
    name: 'get_realtime_spread',
    description: 'Get real-time spread analysis from orderbook. Shows bid/ask prices for YES and NO, spread metrics, and potential arbitrage profit.',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID',
        },
      },
      required: ['conditionId'],
    },
  },
  {
    name: 'scan_crypto_short_term_markets',
    description: 'Scan for short-term crypto markets (Up/Down markets ending soon). Supports BTC, ETH, SOL, XRP with 5-minute and 15-minute durations. Useful for high-frequency trading strategies.',
    inputSchema: {
      type: 'object',
      properties: {
        minMinutesUntilEnd: {
          type: 'number',
          description: 'Minimum minutes until market ends (default: 5)',
          default: 5,
        },
        maxMinutesUntilEnd: {
          type: 'number',
          description: 'Maximum minutes until market ends (default: 60)',
          default: 60,
        },
        limit: {
          type: 'number',
          description: 'Maximum number of markets to return (default: 20)',
          default: 20,
        },
        sortBy: {
          type: 'string',
          enum: ['endDate', 'volume', 'liquidity'],
          description: 'Sort field (default: endDate - soonest first)',
          default: 'endDate',
        },
        duration: {
          type: 'string',
          enum: ['5m', '15m', 'all'],
          description: 'Filter by duration: 5m (5-minute), 15m (15-minute), or all (default: all)',
          default: 'all',
        },
        coin: {
          type: 'string',
          enum: ['BTC', 'ETH', 'SOL', 'XRP', 'all'],
          description: 'Filter by cryptocurrency: BTC, ETH, SOL, XRP, or all (default: all)',
          default: 'all',
        },
      },
    },
  },
];

export async function handleGetMarket(
  sdk: PolymarketSDK,
  input: GetMarketInput
): Promise<GetMarketOutput> {
  if (!input.identifier) {
    throw new McpToolError(ErrorCode.INVALID_INPUT, 'Market identifier is required');
  }

  try {
    const market = await sdk.getMarket(input.identifier);

    // Get tokens by index: [0] = primary (Yes/Team1/Up), [1] = secondary (No/Team2/Down)
    // This works for all market types (binary, sports, financial) regardless of outcome labels
    const yesToken = market.tokens[0];  // primary outcome
    const noToken = market.tokens[1];   // secondary outcome

    return {
      market: {
        conditionId: market.conditionId,
        question: market.question,
        slug: market.slug,
        description: market.description,
      },
      prices: {
        yes: yesToken?.price ?? 0.5,
        no: noToken?.price ?? 0.5,
        spread: market.spread,
      },
      tokens: market.tokens.map(t => ({
        tokenId: t.tokenId,
        outcome: t.outcome,
        price: t.price,
      })),
      stats: {
        volume: market.volume,
        liquidity: market.liquidity,
      },
      status: {
        active: market.active,
        closed: market.closed,
        acceptingOrders: market.acceptingOrders,
        endDate: market.endDate?.toISOString(),
      },
      trading: {
        minTickSize: undefined, // From CLOB if needed
        minOrderSize: undefined,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleSearchMarkets(
  sdk: PolymarketSDK,
  input: SearchMarketsInput
): Promise<SearchMarketsOutput> {
  if (!input.query) {
    throw new McpToolError(ErrorCode.INVALID_INPUT, 'Search query is required');
  }

  try {
    // Fetch active markets sorted by 24h volume for better relevance
    // Note: Gamma API doesn't support server-side text search,
    // so we fetch a larger set and filter client-side
    const allMarkets = await sdk.gammaApi.getMarkets({
      active: input.active !== false,
      closed: false,
      order: 'volume24hr',
      ascending: false,
      limit: 500, // Fetch more markets for comprehensive search
    });

    const queryLower = input.query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 0);

    // Filter by query - match any word in question or slug
    const filtered = allMarkets.filter((m) => {
      const questionLower = m.question.toLowerCase();
      const slugLower = m.slug.toLowerCase();

      // Match if any query word is found in question or slug
      return queryWords.some(
        (word) => questionLower.includes(word) || slugLower.includes(word)
      );
    });

    // Sort by relevance: prioritize exact phrase matches, then by volume
    filtered.sort((a, b) => {
      const aQuestion = a.question.toLowerCase();
      const bQuestion = b.question.toLowerCase();
      const aExact = aQuestion.includes(queryLower);
      const bExact = bQuestion.includes(queryLower);

      // Exact phrase matches first
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Then by 24h volume
      return (b.volume24hr || 0) - (a.volume24hr || 0);
    });

    // Apply limit
    const results = filtered.slice(0, input.limit || 10);

    return {
      markets: results.map((m) => {
        // Safely handle endDate - it may be invalid
        let endDateStr: string | undefined;
        try {
          if (m.endDate && !isNaN(m.endDate.getTime())) {
            endDateStr = m.endDate.toISOString();
          }
        } catch {
          // Ignore invalid date
        }

        return {
          conditionId: m.conditionId,
          question: m.question,
          slug: m.slug,
          prices: {
            yes: m.outcomePrices[0] || 0.5,
            no: m.outcomePrices[1] || 0.5,
          },
          volume: m.volume,
          volume24h: m.volume24hr,
          endDate: endDateStr,
        };
      }),
      total: filtered.length,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetTrendingMarkets(
  sdk: PolymarketSDK,
  input: GetTrendingMarketsInput
): Promise<GetTrendingMarketsOutput> {
  try {
    const sortBy = input.sortBy || 'volume';
    let orderBy: string;
    const ascending = false;

    switch (sortBy) {
      case 'volume':
        orderBy = 'volume24hr';
        break;
      case 'liquidity':
        orderBy = 'liquidity';
        break;
      case 'newest':
        orderBy = 'startDate';
        break;
      default:
        orderBy = 'volume24hr';
    }

    // Fetch more markets than requested to allow filtering
    const requestedLimit = input.limit || 10;
    const markets = await sdk.gammaApi.getMarkets({
      active: true,
      closed: false, // Explicitly exclude closed markets
      limit: requestedLimit * 2, // Fetch extra in case some need filtering
      order: orderBy,
      ascending,
    });

    // Filter out markets that are closed or not accepting orders
    // This handles edge cases where API returns recently-settled markets
    const activeMarkets = markets.filter((m) => {
      // Skip if explicitly marked as closed
      if (m.closed) return false;
      // Skip if market has ended (endDate in past)
      if (m.endDate) {
        const endTime = m.endDate instanceof Date ? m.endDate.getTime() : new Date(m.endDate).getTime();
        if (!isNaN(endTime) && endTime < Date.now()) return false;
      }
      return true;
    });

    // Take only the requested number after filtering
    const finalMarkets = activeMarkets.slice(0, requestedLimit);

    return {
      markets: finalMarkets.map((m) => ({
        conditionId: m.conditionId,
        question: m.question,
        slug: m.slug,
        volume24h: m.volume24hr,
        priceChange24h: m.oneDayPriceChange,
        prices: {
          yes: m.outcomePrices[0] || 0.5,
          no: m.outcomePrices[1] || 0.5,
        },
        // Add status fields for transparency
        status: {
          active: m.active,
          closed: m.closed,
          endDate: m.endDate ? (m.endDate instanceof Date ? m.endDate.toISOString() : String(m.endDate)) : undefined,
        },
      })),
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetMarketTrades(
  sdk: PolymarketSDK,
  input: GetMarketTradesInput
): Promise<GetMarketTradesOutput> {
  validateConditionId(input.conditionId);

  try {
    const trades = await sdk.dataApi.getTradesByMarket(
      input.conditionId,
      input.limit || 20
    );

    // Get market info for the title
    let marketTitle = '';
    try {
      const market = await sdk.getMarket(input.conditionId);
      marketTitle = market.question;
    } catch {
      // Use conditionId as fallback
      marketTitle = input.conditionId;
    }

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentTrades = trades.filter((t) => t.timestamp >= oneDayAgo);
    const buyTrades = recentTrades.filter((t) => t.side === 'BUY');
    const sellTrades = recentTrades.filter((t) => t.side === 'SELL');

    const buyVolume24h = buyTrades.reduce((sum, t) => sum + t.size * t.price, 0);
    const sellVolume24h = sellTrades.reduce((sum, t) => sum + t.size * t.price, 0);

    return {
      market: {
        conditionId: input.conditionId,
        title: marketTitle,
      },
      trades: trades.slice(0, input.limit || 20).map((t) => ({
        trader: t.proxyWallet || '',
        traderName: t.name,
        side: t.side,
        outcome: t.outcome,
        size: t.size,
        price: t.price,
        timestamp: new Date(t.timestamp).toISOString(),
      })),
      summary: {
        buyVolume24h,
        sellVolume24h,
        netFlow: buyVolume24h - sellVolume24h,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get K-line (candlestick) data for a market
 */
export async function handleGetKLines(
  sdk: PolymarketSDK,
  input: GetKLinesInput
): Promise<GetKLinesOutput | GetDualKLinesOutput> {
  validateConditionId(input.conditionId);

  if (!input.interval) {
    throw new McpToolError(ErrorCode.INVALID_INPUT, 'Interval is required');
  }

  try {
    // Get market info for context
    const market = await sdk.getMarket(input.conditionId);
    const interval = input.interval as KLineInterval;

    // If outcome is 'both', return dual K-lines with spread analysis
    if (input.outcome === 'both') {
      const dualData = await sdk.markets.getDualKLines(
        input.conditionId,
        interval,
        {
          limit: input.limit || 500,
          startTimestamp: input.startTimestamp,
          endTimestamp: input.endTimestamp,
        }
      );

      // Calculate average spread
      let avgSpread = 0;
      if (dualData.spreadAnalysis && dualData.spreadAnalysis.length > 0) {
        avgSpread = dualData.spreadAnalysis.reduce((sum, s) => sum + s.priceSpread, 0) / dualData.spreadAnalysis.length;
      }

      return {
        market: {
          conditionId: input.conditionId,
          title: market.question,
          slug: market.slug,
        },
        interval: input.interval,
        yes: dualData.yes.map(c => ({
          timestamp: new Date(c.timestamp).toISOString(),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          tradeCount: c.tradeCount,
          buyVolume: c.buyVolume,
          sellVolume: c.sellVolume,
        })),
        no: dualData.no.map(c => ({
          timestamp: new Date(c.timestamp).toISOString(),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          tradeCount: c.tradeCount,
          buyVolume: c.buyVolume,
          sellVolume: c.sellVolume,
        })),
        spreadAnalysis: (dualData.spreadAnalysis || []).map(s => ({
          timestamp: new Date(s.timestamp).toISOString(),
          yesPrice: s.yesPrice,
          noPrice: s.noPrice,
          priceSum: s.priceSum,
          priceSpread: s.priceSpread,
          arbOpportunity: s.arbOpportunity,
        })),
        summary: {
          totalCandles: { yes: dualData.yes.length, no: dualData.no.length },
          avgSpread,
        },
      };
    }

    // Single outcome K-lines
    // outcomeIndex: 0 = primary (Yes/Up/Team1), 1 = secondary (No/Down/Team2)
    const outcomeIndex = input.outcome?.toLowerCase() === 'no' ? 1 : 0;
    const candles = await sdk.markets.getKLines(
      input.conditionId,
      interval,
      {
        limit: input.limit || 500,
        outcomeIndex,
        startTimestamp: input.startTimestamp,
        endTimestamp: input.endTimestamp,
      }
    );

    // Calculate summary
    const avgVolume = candles.length > 0
      ? candles.reduce((sum, c) => sum + c.volume, 0) / candles.length
      : 0;

    const timeRange = candles.length > 0
      ? {
          start: new Date(candles[0].timestamp).toISOString(),
          end: new Date(candles[candles.length - 1].timestamp).toISOString(),
        }
      : null;

    return {
      market: {
        conditionId: input.conditionId,
        title: market.question,
        slug: market.slug,
      },
      interval: input.interval,
      candles: candles.map(c => ({
        timestamp: new Date(c.timestamp).toISOString(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        tradeCount: c.tradeCount,
        buyVolume: c.buyVolume,
        sellVolume: c.sellVolume,
      })),
      summary: {
        totalCandles: candles.length,
        timeRange,
        avgVolume,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get historical price data for a token
 */
export async function handleGetPriceHistory(
  sdk: PolymarketSDK,
  input: GetPriceHistoryInput
): Promise<GetPriceHistoryOutput> {
  if (!input.tokenId) {
    throw new McpToolError(ErrorCode.INVALID_INPUT, 'Token ID is required');
  }

  try {
    const interval = input.interval || '1d';
    const history = await sdk.markets.getPricesHistory({
      tokenId: input.tokenId,
      interval: interval as '1h' | '6h' | '1d' | '1w' | 'max',
    });

    // Calculate summary
    let priceRange: { min: number; max: number } | null = null;
    let priceChange: number | null = null;

    if (history.length > 0) {
      const prices = history.map(p => p.price);
      priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };
      priceChange = history[history.length - 1].price - history[0].price;
    }

    return {
      tokenId: input.tokenId,
      interval,
      history: history.map(p => ({
        timestamp: new Date(p.timestamp).toISOString(),
        price: p.price,
      })),
      summary: {
        totalPoints: history.length,
        priceRange,
        priceChange,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Detect arbitrage opportunities in a market
 */
export async function handleDetectArbitrage(
  sdk: PolymarketSDK,
  input: DetectArbitrageInput
): Promise<DetectArbitrageOutput> {
  validateConditionId(input.conditionId);

  try {
    // Get market info
    const market = await sdk.getMarket(input.conditionId);

    // Get processed orderbook for context
    const orderbook = await sdk.markets.getProcessedOrderbook(input.conditionId);

    // Detect arbitrage
    const threshold = input.threshold ?? 0.005;
    const arb = await sdk.detectArbitrage(input.conditionId, threshold);

    return {
      market: {
        conditionId: input.conditionId,
        title: market.question,
        slug: market.slug,
      },
      hasOpportunity: arb !== null,
      opportunity: arb ? {
        type: arb.type,
        profit: arb.profit,
        profitPercent: arb.profit * 100,
        action: arb.action,
      } : null,
      orderbook: {
        yesBid: orderbook.yes.bid,
        yesAsk: orderbook.yes.ask,
        noBid: orderbook.no.bid,
        noAsk: orderbook.no.ask,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Detect market signals
 */
export async function handleDetectMarketSignals(
  sdk: PolymarketSDK,
  input: DetectMarketSignalsInput
): Promise<DetectMarketSignalsOutput> {
  validateConditionId(input.conditionId);

  try {
    // Get market info
    const market = await sdk.getMarket(input.conditionId);

    // Detect signals
    const signals = await sdk.markets.detectMarketSignals(input.conditionId);

    // Calculate summary
    const highSeverityCount = signals.filter(s => s.severity === 'high').length;
    const signalTypes = [...new Set(signals.map(s => s.type))];

    return {
      market: {
        conditionId: input.conditionId,
        title: market.question,
        slug: market.slug,
      },
      signals: signals.map(s => ({
        type: s.type,
        severity: s.severity,
        details: s.details,
      })),
      summary: {
        totalSignals: signals.length,
        highSeverityCount,
        signalTypes,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get real-time spread analysis from orderbook
 */
export async function handleGetRealtimeSpread(
  sdk: PolymarketSDK,
  input: GetRealtimeSpreadInput
): Promise<GetRealtimeSpreadOutput> {
  validateConditionId(input.conditionId);

  try {
    // Get market info
    const market = await sdk.getMarket(input.conditionId);

    // Get realtime spread
    const spread = await sdk.markets.getRealtimeSpread(input.conditionId);

    return {
      market: {
        conditionId: input.conditionId,
        title: market.question,
        slug: market.slug,
      },
      timestamp: new Date(spread.timestamp).toISOString(),
      orderbook: {
        yesBid: spread.yesBid,
        yesAsk: spread.yesAsk,
        noBid: spread.noBid,
        noAsk: spread.noAsk,
      },
      spread: {
        askSum: spread.askSum,
        bidSum: spread.bidSum,
        askSpread: spread.askSpread,
        bidSpread: spread.bidSpread,
      },
      arbitrage: {
        longArbProfit: spread.longArbProfit,
        shortArbProfit: spread.shortArbProfit,
        opportunity: spread.arbOpportunity,
        profitPercent: spread.arbProfitPercent,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Scan for short-term crypto markets (Up/Down markets ending soon)
 */
export async function handleScanCryptoShortTermMarkets(
  sdk: PolymarketSDK,
  input: ScanCryptoShortTermMarketsInput
): Promise<ScanCryptoShortTermMarketsOutput> {
  try {
    const minMinutesUntilEnd = input.minMinutesUntilEnd ?? 5;
    const maxMinutesUntilEnd = input.maxMinutesUntilEnd ?? 60;
    const limit = input.limit ?? 20;
    const sortBy = input.sortBy ?? 'endDate';
    const duration = input.duration ?? 'all';
    const coin = input.coin ?? 'all';

    const markets = await sdk.markets.scanCryptoShortTermMarkets({
      minMinutesUntilEnd,
      maxMinutesUntilEnd,
      limit,
      sortBy,
      duration,
      coin,
    });

    const now = Date.now();

    // Helper to detect duration from slug
    const detectDuration = (slug: string): '5m' | '15m' | 'unknown' => {
      if (slug.includes('-updown-5m-')) return '5m';
      if (slug.includes('-updown-15m-')) return '15m';
      return 'unknown';
    };

    // Helper to detect coin from slug
    const detectCoin = (slug: string): 'BTC' | 'ETH' | 'SOL' | 'XRP' | 'unknown' => {
      if (slug.startsWith('btc-updown')) return 'BTC';
      if (slug.startsWith('eth-updown')) return 'ETH';
      if (slug.startsWith('sol-updown')) return 'SOL';
      if (slug.startsWith('xrp-updown')) return 'XRP';
      return 'unknown';
    };

    return {
      markets: markets.map((m) => {
        const endTime = m.endDate ? new Date(m.endDate).getTime() : 0;
        const minutesUntilEnd = Math.round((endTime - now) / 60000);
        const slug = m.slug ?? '';

        return {
          conditionId: m.conditionId,
          slug,
          question: m.question,
          outcomes: m.outcomes ?? [],
          outcomePrices: m.outcomePrices ?? [],
          endDate: m.endDate ? new Date(m.endDate).toISOString() : '',
          minutesUntilEnd,
          volume24hr: m.volume24hr ?? 0,
          liquidity: m.liquidity ?? 0,
          spread: m.spread ?? 0,
          duration: detectDuration(slug),
          coin: detectCoin(slug),
        };
      }),
      count: markets.length,
      scanParams: {
        minMinutesUntilEnd,
        maxMinutesUntilEnd,
        sortBy,
        duration,
        coin,
      },
      scannedAt: new Date().toISOString(),
    };
  } catch (err) {
    throw wrapError(err);
  }
}
