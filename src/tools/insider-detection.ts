/**
 * Insider Detection Tools - MCP tools for detecting suspicious insider wallets
 *
 * These tools enable Agent to analyze wallets for insider trading patterns.
 * Uses algorithms from @catalyst-team/smart-money package.
 *
 * Key features:
 * - Analyze individual wallet for insider characteristics
 * - Scan market trades for suspicious wallets
 * - Get political markets with insider activity summary
 * - Persistent storage in ~/.polymarket/insider-candidates.json
 *
 * @see docs/plans/03-insider-politic-markets/
 */

import type { PolymarketSDK } from '@catalyst-team/poly-sdk';
import {
  calculateInsiderScore,
  getInsiderLevel,
  getInsiderLevelColor,
  getInsiderLevelDescription,
  isNewWallet,
  hasNoHistory,
  isSingleSidedBet,
  isLargePosition,
  isTimingSensitive,
  hasShortDepositWindow,
  hasLowPriceSensitivity,
  calculatePriceStandardDeviation,
  calculateReturnMultiple,
  isPoliticalMarket,
  categorizePoliticalMarket,
  INSIDER_THRESHOLDS,
  type InsiderCharacteristics,
  type InsiderCandidate,
  type InsiderScoreResult,
  type MarketType,
  type PoliticalCategory,
} from '../lib/smart-money/index.js';
import type { ToolDefinition } from '../types.js';
import { wrapError, McpToolError, ErrorCode } from '../errors.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// ============================================================================
// Storage
// ============================================================================

const STORAGE_DIR = path.join(os.homedir(), '.polymarket');
const CANDIDATES_FILE = path.join(STORAGE_DIR, 'insider-candidates.json');

interface InsiderCandidateStore {
  version: 1;
  candidates: Record<string, InsiderCandidate>;
  metadata: {
    lastScanAt: number;
    totalCandidates: number;
    highScoreCount: number;
  };
}

async function loadCandidates(): Promise<InsiderCandidateStore> {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const data = await fs.readFile(CANDIDATES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      version: 1,
      candidates: {},
      metadata: {
        lastScanAt: 0,
        totalCandidates: 0,
        highScoreCount: 0,
      },
    };
  }
}

async function saveCandidates(store: InsiderCandidateStore): Promise<void> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.writeFile(CANDIDATES_FILE, JSON.stringify(store, null, 2));
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const insiderDetectionToolDefinitions: ToolDefinition[] = [
  {
    name: 'analyze_wallet_insider',
    description:
      'Analyze a wallet for insider trading characteristics. Returns InsiderScore (0-100) with detailed breakdown of features like new wallet, single-sided bet, large position, short deposit window, etc. Based on Venezuela/Greenland case studies.',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Wallet address (0x...)',
        },
        targetMarket: {
          type: 'string',
          description:
            'Optional: conditionId of target market for timing analysis',
        },
        eventTimestamp: {
          type: 'number',
          description:
            'Optional: Unix timestamp of event for timing sensitivity',
        },
        saveCandidate: {
          type: 'boolean',
          description:
            'Whether to save high-score candidates (default: true)',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'scan_insider_wallets',
    description:
      'Scan recent trades in a market to detect suspicious insider wallets. Returns list of wallets with InsiderScore >= minScore threshold.',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID to scan',
        },
        minScore: {
          type: 'number',
          description: 'Minimum InsiderScore threshold (default: 60)',
        },
        limit: {
          type: 'number',
          description: 'Maximum trades to analyze (default: 100)',
        },
      },
      required: ['conditionId'],
    },
  },
  {
    name: 'get_insider_candidates',
    description:
      'Get list of detected insider candidates from local storage. Supports filtering by score and sorting.',
    inputSchema: {
      type: 'object',
      properties: {
        minScore: {
          type: 'number',
          description: 'Minimum InsiderScore (default: 0)',
        },
        maxScore: {
          type: 'number',
          description: 'Maximum InsiderScore (default: 100)',
        },
        sortBy: {
          type: 'string',
          enum: ['score', 'analyzedAt', 'potentialProfit'],
          description: 'Sort field (default: score)',
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order (default: desc)',
        },
        limit: {
          type: 'number',
          description: 'Maximum candidates to return (default: 50)',
        },
      },
    },
  },
  {
    name: 'get_political_markets',
    description:
      'Get political markets with insider activity summary. Filters markets by political keywords (election, geopolitics, policy, leadership) and shows insider activity level.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: [
            'election',
            'geopolitics',
            'policy',
            'leadership',
            'international',
            'all',
          ],
          description: 'Political category filter (default: all)',
        },
        active: {
          type: 'boolean',
          description: 'Only active markets (default: true)',
        },
        limit: {
          type: 'number',
          description: 'Maximum markets to return (default: 20)',
        },
        sortBy: {
          type: 'string',
          enum: ['volume', 'insiderActivity', 'newest'],
          description: 'Sort field (default: volume)',
        },
      },
    },
  },
];

// ============================================================================
// Input Types
// ============================================================================

interface AnalyzeWalletInsiderInput {
  address: string;
  targetMarket?: string;
  eventTimestamp?: number;
  saveCandidate?: boolean;
}

interface ScanInsiderWalletsInput {
  conditionId: string;
  minScore?: number;
  limit?: number;
}

interface GetInsiderCandidatesInput {
  minScore?: number;
  maxScore?: number;
  sortBy?: 'score' | 'analyzedAt' | 'potentialProfit';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

interface GetPoliticalMarketsInput {
  category?: PoliticalCategory | 'all';
  active?: boolean;
  limit?: number;
  sortBy?: 'volume' | 'insiderActivity' | 'newest';
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Determine market type from market title/description
 */
function determineMarketType(title: string, description?: string): MarketType {
  const result = categorizePoliticalMarket(title, description);
  if (typeof result === 'object' && 'isPolitical' in result && result.isPolitical) {
    return 'political';
  }
  const text = `${title} ${description || ''}`.toLowerCase();
  if (
    text.includes('btc') ||
    text.includes('eth') ||
    text.includes('bitcoin') ||
    text.includes('crypto') ||
    text.includes('sol') ||
    text.includes('xrp')
  ) {
    return 'crypto';
  }
  if (
    text.includes('nfl') ||
    text.includes('nba') ||
    text.includes('soccer') ||
    text.includes('football') ||
    text.includes('match')
  ) {
    return 'sports';
  }
  return 'other';
}

/**
 * Activity item type for trader activity
 */
interface ActivityItem {
  type: string;
  timestamp: number;
  conditionId?: string;
  marketTitle?: string;
  side?: string;
  outcome?: string;
  size?: number;
  price?: number;
  usdcValue?: number;
}

/**
 * Position item type
 */
interface PositionItem {
  title?: string;
  avgPrice?: number;
  curPrice?: number;
}

/**
 * Calculate characteristics from trader data
 */
async function calculateCharacteristics(
  sdk: PolymarketSDK,
  address: string,
  marketInfo?: { conditionId?: string; eventTimestamp?: number }
): Promise<{
  characteristics: InsiderCharacteristics;
  suspiciousTrades: Array<{
    timestamp: number;
    conditionId: string;
    marketTitle: string;
    side: 'BUY' | 'SELL';
    outcome: string;
    size: number;
    price: number;
    usdcValue: number;
  }>;
  totalVolume: number;
  markets: string[];
}> {
  // Get trader profile
  const profile = await sdk.wallets.getWalletProfile(address);

  // Get trader activity
  const activityResult = await sdk.wallets.getWalletActivity(address, { limit: 500 });
  const activity: ActivityItem[] = activityResult.activities || [];

  // Get positions
  const positionsResult = await sdk.dataApi.getPositions(address, { limit: 500 });
  const positions: PositionItem[] = positionsResult || [];

  // Calculate wallet age
  const now = Date.now();
  const firstActivity =
    activity.length > 0
      ? Math.min(...activity.map((a: ActivityItem) => a.timestamp))
      : now;
  const walletAgeDays = Math.floor((now - firstActivity) / (1000 * 60 * 60 * 24));

  // Calculate trade count
  const trades = activity.filter((a: ActivityItem) => a.type === 'TRADE');
  const totalTradeCount = trades.length;

  // Calculate YES bet ratio
  const yesTrades = trades.filter((t: ActivityItem) => t.outcome?.toLowerCase() === 'yes');
  const yesBetRatio =
    totalTradeCount > 0 ? yesTrades.length / totalTradeCount : 0.5;

  // Calculate max single trade
  const maxSingleTradeUsd = trades.reduce(
    (max: number, t: ActivityItem) => Math.max(max, t.usdcValue || 0),
    0
  );

  // Calculate total volume
  const totalVolume = trades.reduce((sum: number, t: ActivityItem) => sum + (t.usdcValue || 0), 0);

  // Get unique markets
  const markets = [...new Set(trades.map((t: ActivityItem) => t.conditionId).filter(Boolean))] as string[];

  // Calculate deposit to trade time (if available)
  const deposits = activity.filter(
    (a: ActivityItem) => a.type === 'SPLIT' || a.type === 'CONVERSION'
  );
  const firstTrade = trades.length > 0 ? trades[trades.length - 1] : null;
  const firstDeposit = deposits.length > 0 ? deposits[deposits.length - 1] : null;
  const depositToTradeMinutes =
    firstDeposit && firstTrade
      ? Math.max(0, (firstTrade.timestamp - firstDeposit.timestamp) / (1000 * 60))
      : undefined;

  // Calculate price standard deviation
  const buyPrices = trades
    .filter((t: ActivityItem) => t.side === 'BUY')
    .map((t: ActivityItem) => t.price)
    .filter((p: number | undefined): p is number => p !== undefined && p > 0);
  const priceStandardDeviation =
    buyPrices.length > 1 ? calculatePriceStandardDeviation(buyPrices) : undefined;

  // Check for failed trades (rough heuristic: very low prices followed by success)
  const hasFailedTrades = trades.some((t: ActivityItem) => t.price && t.price < 0.02);
  const successAfterFailure =
    hasFailedTrades && trades.some((t: ActivityItem) => t.price && t.price > 0.05);

  // Calculate return multiple from positions
  const avgPositionPrice = positions.reduce(
    (sum: number, p: PositionItem) => sum + (p.avgPrice || 0.5),
    0
  ) / Math.max(positions.length, 1);
  // Calculate return multiple (need current price, use avg price as fallback)
  const currentPrice = positions[0]?.curPrice || avgPositionPrice || 0.5;
  const returnMultiple = calculateReturnMultiple(avgPositionPrice || 0.5, currentPrice);

  // Determine market type
  const primaryMarketTitle =
    positions[0]?.title || trades[0]?.marketTitle || '';
  const marketType = determineMarketType(primaryMarketTitle);

  // Calculate timing sensitivity (if event timestamp provided)
  let hoursBeforeEvent: number | undefined;
  if (marketInfo?.eventTimestamp && firstTrade) {
    hoursBeforeEvent =
      (marketInfo.eventTimestamp - firstTrade.timestamp) / (1000 * 60 * 60);
  }

  // Build characteristics
  const characteristics: InsiderCharacteristics = {
    isNewWallet: isNewWallet(walletAgeDays),
    hasNoHistory: hasNoHistory(totalTradeCount),
    singleSidedBet: isSingleSidedBet(yesBetRatio),
    largePosition: isLargePosition(maxSingleTradeUsd, totalVolume),
    timingSensitive: isTimingSensitive(hoursBeforeEvent),
    shortDepositWindow: hasShortDepositWindow(depositToTradeMinutes),
    lowPriceSensitivity: hasLowPriceSensitivity(priceStandardDeviation),
    twoPhasePattern: hasFailedTrades && successAfterFailure,

    walletAgeDays,
    totalTradeCount,
    maxSingleTradeUsd,
    yesBetRatio,
    hoursBeforeEvent,
    depositToTradeMinutes,
    priceStandardDeviation,
    hasFailedTrades,
    successAfterFailure,

    returnMultiple,
    marketType,
  };

  // Build suspicious trades list
  const suspiciousTrades = trades.slice(0, 20).map((t: ActivityItem) => ({
    timestamp: t.timestamp,
    conditionId: t.conditionId || '',
    marketTitle: t.marketTitle || '',
    side: (t.side || 'BUY') as 'BUY' | 'SELL',
    outcome: t.outcome || '',
    size: t.size || 0,
    price: t.price || 0,
    usdcValue: t.usdcValue || 0,
  }));

  return {
    characteristics,
    suspiciousTrades,
    totalVolume,
    markets,
  };
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Analyze a wallet for insider characteristics
 */
export async function handleAnalyzeWalletInsider(
  sdk: PolymarketSDK,
  input: AnalyzeWalletInsiderInput
) {
  try {
    // Validate address
    if (!input.address || !input.address.startsWith('0x')) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        'Invalid wallet address. Must start with 0x'
      );
    }

    const { characteristics, suspiciousTrades, totalVolume, markets } =
      await calculateCharacteristics(sdk, input.address, {
        conditionId: input.targetMarket,
        eventTimestamp: input.eventTimestamp,
      });

    // Calculate score
    const scoreResult = calculateInsiderScore(characteristics);

    // Build candidate
    const now = Date.now();
    const candidate: InsiderCandidate = {
      address: input.address.toLowerCase(),
      score: scoreResult.score,
      level: scoreResult.level,
      insiderScore: scoreResult.score,
      insiderLevel: scoreResult.level,
      analyzedAt: now,
      characteristics,
      markets,
      potentialProfit: totalVolume * ((characteristics.returnMultiple || 1) - 1),
      totalVolume,
      walletAge: characteristics.walletAgeDays,
      tags: [],
    };

    // Save if high score and saveCandidate is not false
    if (input.saveCandidate !== false && scoreResult.score >= INSIDER_THRESHOLDS.high) {
      const store = await loadCandidates();
      store.candidates[candidate.address] = candidate;
      store.metadata.lastScanAt = now;
      store.metadata.totalCandidates = Object.keys(store.candidates).length;
      store.metadata.highScoreCount = Object.values(store.candidates).filter(
        (c) => (c.insiderScore || c.score) >= INSIDER_THRESHOLDS.critical
      ).length;
      await saveCandidates(store);
    }

    return {
      address: candidate.address,
      insiderScore: scoreResult.score,
      level: scoreResult.level,
      levelColor: getInsiderLevelColor(scoreResult.level),
      levelDescription: getInsiderLevelDescription(scoreResult.level),
      breakdown: {
        baseScore: scoreResult.breakdown.baseScore || 0,
        bonusScore: scoreResult.breakdown.bonusScore || 0,
        features: (scoreResult.breakdown.features || []).map((f: any) => ({
          name: f.feature,
          weight: f.weight,
          matched: true,
          contribution: f.score,
        })),
        bonuses: (scoreResult.breakdown.bonuses || []).map((b: any) => ({
          name: b.feature,
          value: b.score,
          matched: true,
        })),
      },
      characteristics: {
        walletAgeDays: characteristics.walletAgeDays,
        totalTradeCount: characteristics.totalTradeCount,
        maxSingleTradeUsd: characteristics.maxSingleTradeUsd,
        yesBetRatio: Math.round(characteristics.yesBetRatio * 100) + '%',
        depositToTradeMinutes: characteristics.depositToTradeMinutes,
        priceStandardDeviation: characteristics.priceStandardDeviation
          ? Math.round(characteristics.priceStandardDeviation * 1000) / 1000
          : undefined,
        returnMultiple: characteristics.returnMultiple
          ? Math.round(characteristics.returnMultiple * 100) / 100 + 'x'
          : undefined,
        marketType: characteristics.marketType,
      },
      summary: {
        totalVolume: Math.round(totalVolume * 100) / 100,
        potentialProfit: candidate.potentialProfit ? Math.round(candidate.potentialProfit * 100) / 100 : 0,
        markets: markets.length,
        recentTrades: suspiciousTrades.length,
      },
      saved: input.saveCandidate !== false && scoreResult.score >= INSIDER_THRESHOLDS.high,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Scan market trades for insider wallets
 */
export async function handleScanInsiderWallets(
  sdk: PolymarketSDK,
  input: ScanInsiderWalletsInput
) {
  try {
    const minScore = input.minScore ?? INSIDER_THRESHOLDS.high;
    const limit = input.limit ?? 100;

    // Get market trades
    const trades = await sdk.dataApi.getTradesByMarket(input.conditionId, limit);

    // Get unique wallet addresses (use proxyWallet from Trade type)
    const wallets = [
      ...new Set(trades.map((t) => t.proxyWallet).filter((w): w is string => Boolean(w))),
    ];

    // Analyze each wallet
    const candidates: Array<{
      address: string;
      insiderScore: number;
      level: string;
      levelColor: string;
      summary: {
        totalVolume: number;
        potentialProfit: number;
        yesBetRatio: string;
        marketType: string;
      };
    }> = [];

    for (const address of wallets.slice(0, 20)) {
      // Limit to 20 wallets to avoid rate limiting
      try {
        const result = await handleAnalyzeWalletInsider(sdk, {
          address,
          targetMarket: input.conditionId,
          saveCandidate: true,
        });

        if (result.insiderScore >= minScore) {
          candidates.push({
            address: result.address,
            insiderScore: result.insiderScore,
            level: result.level,
            levelColor: result.levelColor,
            summary: {
              totalVolume: result.summary.totalVolume,
              potentialProfit: result.summary.potentialProfit,
              yesBetRatio: result.characteristics.yesBetRatio,
              marketType: result.characteristics.marketType || 'standard',
            },
          });
        }
      } catch {
        // Skip wallets that fail analysis
        continue;
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.insiderScore - a.insiderScore);

    return {
      conditionId: input.conditionId,
      tradesAnalyzed: trades.length,
      walletsScanned: Math.min(wallets.length, 20),
      totalWallets: wallets.length,
      minScoreThreshold: minScore,
      candidates,
      highScoreCount: candidates.filter(
        (c) => c.insiderScore >= INSIDER_THRESHOLDS.critical
      ).length,
      mediumScoreCount: candidates.filter(
        (c) =>
          c.insiderScore >= INSIDER_THRESHOLDS.high &&
          c.insiderScore < INSIDER_THRESHOLDS.critical
      ).length,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get insider candidates from storage
 */
export async function handleGetInsiderCandidates(
  _sdk: PolymarketSDK,
  input: GetInsiderCandidatesInput
) {
  try {
    const store = await loadCandidates();

    let candidates = Object.values(store.candidates);

    // Filter by score
    const minScore = input.minScore ?? 0;
    const maxScore = input.maxScore ?? 100;
    candidates = candidates.filter(
      (c) => (c.insiderScore || c.score) >= minScore && (c.insiderScore || c.score) <= maxScore
    );

    // Sort
    const sortBy = input.sortBy ?? 'score';
    const sortOrder = input.sortOrder ?? 'desc';
    candidates.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'score':
          cmp = (a.insiderScore || a.score) - (b.insiderScore || b.score);
          break;
        case 'analyzedAt':
          cmp = a.analyzedAt - b.analyzedAt;
          break;
        case 'potentialProfit':
          cmp = (a.potentialProfit || 0) - (b.potentialProfit || 0);
          break;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    // Limit
    const limit = input.limit ?? 50;
    candidates = candidates.slice(0, limit);

    return {
      candidates: candidates.map((c) => ({
        address: c.address,
        displayName: c.displayName,
        insiderScore: c.insiderScore,
        level: c.insiderLevel,
        levelColor: getInsiderLevelColor(c.insiderLevel || c.level),
        levelDescription: getInsiderLevelDescription(c.insiderLevel || c.level),
        totalVolume: Math.round((c.totalVolume || 0) * 100) / 100,
        potentialProfit: c.potentialProfit ? Math.round(c.potentialProfit * 100) / 100 : 0,
        markets: c.markets.length,
        walletAgeDays: c.walletAge,
        analyzedAt: new Date(c.analyzedAt).toISOString(),
        tags: c.tags,
      })),
      totalCount: candidates.length,
      metadata: {
        lastScanAt: store.metadata.lastScanAt
          ? new Date(store.metadata.lastScanAt).toISOString()
          : null,
        totalCandidates: store.metadata.totalCandidates,
        highScoreCount: store.metadata.highScoreCount,
      },
      filters: {
        minScore,
        maxScore,
        sortBy,
        sortOrder,
        limit,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get political markets with insider activity
 */
export async function handleGetPoliticalMarkets(
  sdk: PolymarketSDK,
  input: GetPoliticalMarketsInput
) {
  try {
    const category = input.category ?? 'all';
    const active = input.active ?? true;
    const limit = input.limit ?? 20;

    // Search for political markets
    const politicalTerms = [
      'trump',
      'biden',
      'election',
      'president',
      'congress',
      'russia',
      'ukraine',
      'china',
      'taiwan',
      'war',
      'sanction',
      'policy',
      'fed',
    ];

    const allMarkets: Array<{
      conditionId: string;
      title: string;
      slug: string;
      category: PoliticalCategory | null;
      matchedFigures: string[];
      matchedRegions: string[];
      confidence: number;
      currentPrice: { yes: number; no: number };
      volume24h: number;
      active: boolean;
    }> = [];

    // Fetch active markets sorted by 24h volume
    const fetchedMarkets = await sdk.gammaApi.getMarkets({
      active,
      closed: false,
      order: 'volume24hr',
      ascending: false,
      limit: 500,
    });

    // Filter by political terms
    for (const m of fetchedMarkets) {
      const questionLower = m.question.toLowerCase();
      const slugLower = m.slug.toLowerCase();
      const descLower = (m.description || '').toLowerCase();

      // Check if any political term matches
      const matchesTerm = politicalTerms.some(
        (term) =>
          questionLower.includes(term) ||
          slugLower.includes(term) ||
          descLower.includes(term)
      );

      if (!matchesTerm) {
        continue;
      }

      // Check if already added
      if (allMarkets.some((x) => x.conditionId === m.conditionId)) {
        continue;
      }

      // Categorize
      const result = categorizePoliticalMarket(m.question, m.description);
      if (typeof result === 'string' || !result.isPolitical) {
        continue;
      }

      // Filter by category if specified
      if (category !== 'all' && result.category !== category) {
        continue;
      }

      allMarkets.push({
        conditionId: m.conditionId,
        title: m.question,
        slug: m.slug,
        category: result.category,
        matchedFigures: result.matchedFigures || [],
        matchedRegions: result.matchedRegions || [],
        confidence: result.confidence || 0.8,
        currentPrice: {
          yes: m.outcomePrices?.[0] ?? 0.5,
          no: m.outcomePrices?.[1] ?? 0.5,
        },
        volume24h: m.volume24hr || 0,
        active: m.active,
      });
    }

    // Sort
    const sortBy = input.sortBy ?? 'volume';
    allMarkets.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'insiderActivity':
          return b.confidence - a.confidence; // Proxy for now
        case 'newest':
          return 0; // Would need endDate
        default:
          return 0;
      }
    });

    // Limit
    const markets = allMarkets.slice(0, limit);

    // Load insider candidates for activity summary
    const store = await loadCandidates();
    const candidateMarkets = new Set(
      Object.values(store.candidates).flatMap((c) => c.markets)
    );

    return {
      markets: markets.map((m) => ({
        conditionId: m.conditionId,
        title: m.title,
        slug: m.slug,
        category: m.category,
        categoryName: m.category
          ? {
              election: '选举',
              geopolitics: '地缘政治',
              policy: '政策',
              leadership: '领导人变动',
              international: '国际关系',
              other: '其他政治',
            }[m.category]
          : null,
        matchedFigures: m.matchedFigures,
        matchedRegions: m.matchedRegions,
        confidence: Math.round(m.confidence * 100) + '%',
        currentPrice: {
          yes: Math.round(m.currentPrice.yes * 100) + '¢',
          no: Math.round(m.currentPrice.no * 100) + '¢',
        },
        volume24h: Math.round(m.volume24h),
        hasInsiderActivity: candidateMarkets.has(m.conditionId),
        active: m.active,
      })),
      totalCount: markets.length,
      filters: {
        category,
        active,
        sortBy,
        limit,
      },
      insiderSummary: {
        totalCandidates: store.metadata.totalCandidates,
        marketsWithInsiderActivity: markets.filter((m) =>
          candidateMarkets.has(m.conditionId)
        ).length,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}
