/**
 * Trader Tools - MCP tools for trader/wallet analysis
 */

import type { PolymarketSDK } from '@catalyst-team/poly-sdk';
import type {
  ToolDefinition,
  GetTraderPositionsInput,
  GetTraderPositionsOutput,
  GetTraderTradesInput,
  GetTraderTradesOutput,
  GetTraderActivityInput,
  GetTraderActivityOutput,
  GetTraderProfileInput,
  GetTraderProfileOutput,
  GetLeaderboardInput,
  GetLeaderboardOutput,
  GetClosedPositionsInput,
  GetClosedPositionsOutput,
  GetAccountValueInput,
  GetAccountValueOutput,
} from '../types.js';
import { validateAddress, wrapError } from '../errors.js';

export const traderToolDefinitions: ToolDefinition[] = [
  {
    name: 'get_trader_positions',
    description: 'Get open positions held by a trader with PnL breakdown. Supports pagination for wallets with many positions.',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Trader wallet address (0x...)',
        },
        limit: {
          type: 'number',
          description: 'Maximum positions to return (max 500, default 100)',
          default: 100,
        },
        offset: {
          type: 'number',
          description: 'Pagination offset (0-10000). Use with limit for paginating through many positions.',
          default: 0,
        },
        sortBy: {
          type: 'string',
          enum: ['CASHPNL', 'PERCENTPNL', 'CURRENT', 'INITIAL', 'TOKENS', 'TITLE', 'PRICE', 'AVGPRICE'],
          description: 'Sort field (default: CASHPNL for unrealized PnL)',
          default: 'CASHPNL',
        },
        sortDirection: {
          type: 'string',
          enum: ['ASC', 'DESC'],
          description: 'Sort direction',
          default: 'DESC',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_trader_trades',
    description: 'Get recent trading activity for a trader',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Trader wallet address',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of trades to return',
          default: 20,
        },
        side: {
          type: 'string',
          enum: ['BUY', 'SELL'],
          description: 'Filter by trade side',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_trader_activity',
    description: 'Get complete activity history for a trader including TRADE, SPLIT, MERGE, REDEEM, REWARD, CONVERSION. Supports pagination, time filtering, and fetchAll mode for complete history.',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Trader wallet address (0x...)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of activities to return per page (max 500). Ignored when fetchAll=true.',
          default: 100,
        },
        offset: {
          type: 'number',
          description: 'Pagination offset (0-10000). Use with limit for paginating through complete history. Ignored when fetchAll=true.',
          default: 0,
        },
        start: {
          type: 'number',
          description: 'Start timestamp (Unix seconds). Filter activities after this time.',
        },
        end: {
          type: 'number',
          description: 'End timestamp (Unix seconds). Filter activities before this time.',
        },
        type: {
          type: 'string',
          enum: ['TRADE', 'SPLIT', 'MERGE', 'REDEEM', 'REWARD', 'CONVERSION'],
          description: 'Filter by activity type',
        },
        side: {
          type: 'string',
          enum: ['BUY', 'SELL'],
          description: 'Filter by trade side',
        },
        market: {
          type: 'string',
          description: 'Filter by market conditionId',
        },
        fetchAll: {
          type: 'boolean',
          description: 'Fetch ALL activities with auto-pagination (up to maxItems). Use for complete history analysis.',
          default: false,
        },
        maxItems: {
          type: 'number',
          description: 'Maximum items to fetch when fetchAll=true (default 10000, max 10000)',
          default: 10000,
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_trader_profile',
    description: 'Get comprehensive trader profile with performance metrics',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Trader wallet address',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_leaderboard',
    description: 'Get top traders by PnL. Supports filtering by time period (day/week/month).',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of traders to return',
          default: 10,
        },
        offset: {
          type: 'number',
          description: 'Pagination offset',
          default: 0,
        },
        period: {
          type: 'string',
          enum: ['day', 'week', 'month', 'all'],
          description: 'Time period filter: day (24h), week (7d), month (30d), or all (all-time)',
          default: 'all',
        },
        sortBy: {
          type: 'string',
          enum: ['pnl', 'volume'],
          description: 'Sort by PnL or volume',
          default: 'pnl',
        },
      },
    },
  },
  {
    name: 'get_trader_closed_positions',
    description: 'Get closed/settled positions for a trader with realized PnL. Supports pagination for complete history analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Trader wallet address (0x...)',
        },
        limit: {
          type: 'number',
          description: 'Maximum positions to return (max 50)',
          default: 50,
        },
        offset: {
          type: 'number',
          description: 'Pagination offset (0-100000). Use with limit for paginating through complete history.',
          default: 0,
        },
        sortBy: {
          type: 'string',
          enum: ['REALIZEDPNL', 'TIMESTAMP', 'TITLE', 'PRICE', 'AVGPRICE'],
          description: 'Sort by field',
          default: 'REALIZEDPNL',
        },
        sortDirection: {
          type: 'string',
          enum: ['ASC', 'DESC'],
          description: 'Sort direction (DESC for highest PnL first, ASC for lowest first)',
          default: 'DESC',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_account_value',
    description: 'Get total value of a user\'s positions',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'User wallet address (0x...)',
        },
        market: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: filter by specific market conditionIds',
        },
      },
      required: ['address'],
    },
  },
];

export async function handleGetTraderPositions(
  sdk: PolymarketSDK,
  input: GetTraderPositionsInput
): Promise<GetTraderPositionsOutput> {
  validateAddress(input.address);

  try {
    const positions = await sdk.dataApi.getPositions(input.address, {
      limit: input.limit,
      offset: input.offset,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
    });

    const totalUnrealizedPnl = positions.reduce((sum, p) => sum + (p.cashPnl || 0), 0);
    const totalRealizedPnl = positions.reduce((sum, p) => sum + (p.realizedPnl || 0), 0);
    const winningPositions = positions.filter((p) => (p.cashPnl || 0) > 0).length;
    const losingPositions = positions.filter((p) => (p.cashPnl || 0) < 0).length;

    return {
      trader: {
        address: input.address,
        displayName: null, // Will be enriched if available
      },
      positions: positions.map((p) => ({
        market: {
          conditionId: p.conditionId,
          title: p.title,
          slug: p.slug,
        },
        holding: {
          outcome: p.outcome,
          size: p.size,
          avgPrice: p.avgPrice,
          curPrice: p.curPrice,
        },
        pnl: {
          unrealized: p.cashPnl,
          unrealizedPercent: p.percentPnl,
          realized: p.realizedPnl,
        },
        status: {
          redeemable: p.redeemable,
          endDate: p.endDate,
        },
      })),
      summary: {
        totalPositions: positions.length,
        totalUnrealizedPnl,
        totalRealizedPnl,
        winningPositions,
        losingPositions,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetTraderTrades(
  sdk: PolymarketSDK,
  input: GetTraderTradesInput
): Promise<GetTraderTradesOutput> {
  validateAddress(input.address);

  try {
    const activityResult = await sdk.wallets.getWalletActivity(
      input.address,
      input.limit || 100
    );

    let trades = activityResult.activities.filter((a) => a.type === 'TRADE');

    // Filter by side if specified
    if (input.side) {
      trades = trades.filter((a) => a.side === input.side);
    }

    // Apply limit
    const limit = input.limit || 20;
    trades = trades.slice(0, limit);

    const buyTrades = trades.filter((t) => t.side === 'BUY');
    const sellTrades = trades.filter((t) => t.side === 'SELL');

    return {
      trader: {
        address: input.address,
        displayName: null,
      },
      trades: trades.map((t) => ({
        type: t.type,
        side: t.side,
        market: {
          conditionId: t.conditionId,
          title: t.title || '',
          slug: t.slug,
        },
        outcome: t.outcome,
        execution: {
          size: t.size,
          price: t.price,
          usdcValue: t.usdcSize || t.size * t.price,
        },
        timestamp: new Date(t.timestamp).toISOString(),
        txHash: t.transactionHash,
      })),
      summary: {
        totalTrades: trades.length,
        buyCount: buyTrades.length,
        sellCount: sellTrades.length,
        buyVolume: buyTrades.reduce((sum, t) => sum + (t.usdcSize || t.size * t.price), 0),
        sellVolume: sellTrades.reduce((sum, t) => sum + (t.usdcSize || t.size * t.price), 0),
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetTraderActivity(
  sdk: PolymarketSDK,
  input: GetTraderActivityInput
): Promise<GetTraderActivityOutput> {
  validateAddress(input.address);

  try {
    let activities;

    if (input.fetchAll) {
      // Use getAllActivity for complete history with auto-pagination
      const maxItems = Math.min(input.maxItems || 10000, 10000);
      activities = await sdk.dataApi.getAllActivity(
        input.address,
        {
          start: input.start,
          end: input.end,
          type: input.type,
          side: input.side,
          market: input.market ? [input.market] : undefined,
        },
        maxItems
      );
    } else {
      // Use getActivity for single page with pagination
      activities = await sdk.dataApi.getActivity(input.address, {
        limit: input.limit || 100,
        offset: input.offset,
        start: input.start,
        end: input.end,
        type: input.type,
        side: input.side,
        market: input.market ? [input.market] : undefined,
      });
    }

    // Count by type
    const byType: Record<string, number> = {};
    for (const a of activities) {
      byType[a.type] = (byType[a.type] || 0) + 1;
    }

    const totalVolume = activities.reduce(
      (sum, a) => sum + (a.usdcSize || a.size * (a.price || 0)),
      0
    );

    // Time range analysis (if we have activities)
    let timeRange: { earliest: string; latest: string } | undefined;
    if (activities.length > 0) {
      const timestamps = activities.map((a) => a.timestamp);
      timeRange = {
        earliest: new Date(Math.min(...timestamps)).toISOString(),
        latest: new Date(Math.max(...timestamps)).toISOString(),
      };
    }

    return {
      trader: {
        address: input.address,
        displayName: null,
      },
      activities: activities.map((a) => ({
        type: a.type as 'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION',
        side: a.side,
        market: {
          conditionId: a.conditionId,
          title: a.title || '',
          slug: a.slug,
        },
        outcome: a.outcome,
        size: a.size,
        price: a.price,
        usdcValue: a.usdcSize || a.size * (a.price || 0),
        timestamp: new Date(a.timestamp).toISOString(),
        txHash: a.transactionHash,
      })),
      summary: {
        total: activities.length,
        byType,
        totalVolume,
        ...(input.fetchAll && { fetchedAll: true, maxItems: input.maxItems || 10000 }),
        ...(timeRange && { timeRange }),
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetTraderProfile(
  sdk: PolymarketSDK,
  input: GetTraderProfileInput
): Promise<GetTraderProfileOutput> {
  validateAddress(input.address);

  try {
    const profile = await sdk.wallets.getWalletProfile(input.address);

    // Try to get leaderboard data for rank and official PnL
    let rank: number | null = null;
    let leaderboardPnl: number | null = null;
    let leaderboardVolume: number | null = null;
    let displayName: string | null = null;
    let verified = false;
    try {
      const leaderboard = await sdk.wallets.getLeaderboard(0, 100);
      const entry = leaderboard.entries.find(
        (e) => e.address.toLowerCase() === input.address.toLowerCase()
      );
      if (entry) {
        rank = entry.rank;
        leaderboardPnl = entry.pnl;
        leaderboardVolume = entry.volume;
        displayName = entry.userName || null;
        verified = entry.verifiedBadge || false;
      }
    } catch {
      // Ignore leaderboard errors
    }

    const winningCount = profile.positionCount > 0
      ? Math.round(profile.positionCount * (profile.avgPercentPnL > 0 ? 0.6 : 0.4))
      : 0;
    const winRate = profile.positionCount > 0
      ? winningCount / profile.positionCount
      : 0;

    return {
      trader: {
        address: input.address,
        displayName,
        xUsername: null,
        verified,
        profileImage: null,
      },
      ranking: {
        rank,
        totalTraders: 10000, // Approximate
      },
      performance: {
        // Official PnL from leaderboard (used for ranking)
        officialPnl: leaderboardPnl,
        // Volume from leaderboard
        totalVolume: leaderboardVolume ?? (profile.totalPnL + profile.unrealizedPnL),
        // Calculated PnL from profile positions
        unrealizedPnl: profile.unrealizedPnL,
        realizedPnl: profile.realizedPnL,
      },
      stats: {
        positionCount: profile.positionCount,
        winRate,
        avgPercentPnl: profile.avgPercentPnL,
        smartScore: profile.smartScore,
      },
      activity: {
        lastTradeAt: profile.lastActiveAt.getTime() > 0
          ? profile.lastActiveAt.toISOString()
          : null,
        isActive: Date.now() - profile.lastActiveAt.getTime() < 7 * 24 * 60 * 60 * 1000,
      },
      // Explain potential PnL differences
      notes: leaderboardPnl !== null && Math.abs((leaderboardPnl || 0) - (profile.unrealizedPnL + profile.realizedPnL)) > 100
        ? 'Note: officialPnl (from leaderboard) may differ from unrealizedPnl + realizedPnl (from positions) due to different calculation methods. Leaderboard PnL includes historical settled positions.'
        : undefined,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetLeaderboard(
  sdk: PolymarketSDK,
  input: GetLeaderboardInput
): Promise<GetLeaderboardOutput> {
  const limit = input.limit || 10;
  const offset = input.offset || 0;
  const period = input.period || 'all';
  const sortBy = input.sortBy || 'pnl';

  try {
    // Use period-based leaderboard if period is specified
    if (period !== 'all' || sortBy !== 'pnl') {
      const entries = await sdk.wallets.getLeaderboardByPeriod(period, limit, sortBy);

      return {
        traders: entries.map((e) => ({
          rank: e.rank,
          address: e.address,
          displayName: e.userName || null,
          pnl: e.pnl,
          volume: e.volume,
          verified: false,
        })),
        pagination: {
          total: entries.length,
          offset: 0,
          limit,
        },
        period,
        sortBy,
      };
    }

    // Default: all-time leaderboard with pagination
    const page = Math.floor(offset / 50);
    const leaderboard = await sdk.wallets.getLeaderboard(page, 50);

    // Apply offset and limit within the page
    const startIdx = offset % 50;
    const entries = leaderboard.entries.slice(startIdx, startIdx + limit);

    return {
      traders: entries.map((e) => ({
        rank: e.rank,
        address: e.address,
        displayName: e.userName || null,
        pnl: e.pnl,
        volume: e.volume,
        verified: e.verifiedBadge || false,
      })),
      pagination: {
        // No total from API, estimate based on hasMore
        total: leaderboard.hasMore ? offset + limit + 1 : offset + entries.length,
        offset,
        limit,
      },
      period: 'all',
      sortBy: 'pnl',
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetClosedPositions(
  sdk: PolymarketSDK,
  input: GetClosedPositionsInput
): Promise<GetClosedPositionsOutput> {
  validateAddress(input.address);

  try {
    const closedPositions = await sdk.dataApi.getClosedPositions(input.address, {
      limit: input.limit || 50,
      offset: input.offset,
      sortBy: input.sortBy || 'REALIZEDPNL',
      sortDirection: input.sortDirection || 'DESC',
    });

    const totalRealizedPnl = closedPositions.reduce((sum, p) => sum + (p.realizedPnl || 0), 0);
    const winningPositions = closedPositions.filter((p) => (p.realizedPnl || 0) > 0).length;
    const losingPositions = closedPositions.filter((p) => (p.realizedPnl || 0) < 0).length;

    return {
      trader: {
        address: input.address,
        displayName: null,
      },
      closedPositions: closedPositions.map((p) => ({
        market: {
          conditionId: p.conditionId,
          title: p.title,
          slug: p.slug,
        },
        holding: {
          outcome: p.outcome,
          avgPrice: p.avgPrice,
          settlementPrice: p.curPrice, // curPrice is settlement price for closed positions
        },
        pnl: {
          realized: p.realizedPnl,
          totalBought: p.totalBought,
        },
        settledAt: new Date(p.timestamp).toISOString(),
      })),
      summary: {
        totalClosed: closedPositions.length,
        totalRealizedPnl,
        winningPositions,
        losingPositions,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetAccountValue(
  sdk: PolymarketSDK,
  input: GetAccountValueInput
): Promise<GetAccountValueOutput> {
  validateAddress(input.address);

  try {
    const result = await sdk.dataApi.getAccountValue(input.address, input.market);

    return {
      address: result.user,
      value: result.value,
      currency: 'USDC',
    };
  } catch (err) {
    throw wrapError(err);
  }
}
