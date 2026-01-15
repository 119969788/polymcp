/**
 * Local implementation of @catalyst-team/smart-money
 * This is a minimal implementation to replace the missing npm package
 */

// ============================================================================
// Types
// ============================================================================

export type MarketType = 'standard' | 'political' | 'crypto' | 'sports' | 'other';
export type PoliticalCategory = 'election' | 'geopolitics' | 'policy' | 'leadership' | 'international';

export interface InsiderCharacteristics {
  isNewWallet: boolean;
  hasNoHistory: boolean;
  singleSidedBet: boolean;
  largePosition: boolean;
  timingSensitive: boolean;
  shortDepositWindow: boolean;
  lowPriceSensitivity: boolean;
  twoPhasePattern: boolean;
  walletAgeDays: number;
  totalTradeCount: number;
  maxSingleTradeUsd: number;
  yesBetRatio: number;
  hoursBeforeEvent?: number;
  depositToTradeMinutes?: number;
  priceStandardDeviation?: number;
  hasFailedTrades?: boolean;
  successAfterFailure?: boolean;
  returnMultiple?: number;
  marketType?: MarketType;
}

export interface InsiderScoreResult {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  characteristics: InsiderCharacteristics;
  breakdown: {
    feature: string;
    weight: number;
    score: number;
    description: string;
  }[];
  bonusPoints: number;
  riskFactors: string[];
}

export interface InsiderCandidate {
  address: string;
  score: number;
  level: string;
  analyzedAt: number;
  potentialProfit?: number;
  markets: string[];
  characteristics: InsiderCharacteristics;
}

export const INSIDER_THRESHOLDS = {
  NEW_WALLET_DAYS: 7,
  MIN_TRADE_COUNT: 3,
  SINGLE_SIDED_THRESHOLD: 0.9,
  LARGE_POSITION_USD: 1000,
  TIMING_HOURS: 24,
  DEPOSIT_WINDOW_MINUTES: 1440, // 24 hours
  PRICE_SENSITIVITY_THRESHOLD: 0.05,
  RETURN_MULTIPLE_THRESHOLD: 5,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

export function isNewWallet(walletAgeDays: number): boolean {
  return walletAgeDays < INSIDER_THRESHOLDS.NEW_WALLET_DAYS;
}

export function hasNoHistory(tradeCount: number): boolean {
  return tradeCount < INSIDER_THRESHOLDS.MIN_TRADE_COUNT;
}

export function isSingleSidedBet(yesBetRatio: number): boolean {
  return yesBetRatio >= INSIDER_THRESHOLDS.SINGLE_SIDED_THRESHOLD || 
         yesBetRatio <= (1 - INSIDER_THRESHOLDS.SINGLE_SIDED_THRESHOLD);
}

export function isLargePosition(maxSingleTradeUsd: number, totalVolume: number): boolean {
  return maxSingleTradeUsd >= INSIDER_THRESHOLDS.LARGE_POSITION_USD || 
         (totalVolume > 0 && maxSingleTradeUsd / totalVolume > 0.5);
}

export function isTimingSensitive(hoursBeforeEvent?: number): boolean {
  if (hoursBeforeEvent === undefined) return false;
  return hoursBeforeEvent <= INSIDER_THRESHOLDS.TIMING_HOURS && hoursBeforeEvent >= 0;
}

export function hasShortDepositWindow(depositToTradeMinutes?: number): boolean {
  if (depositToTradeMinutes === undefined) return false;
  return depositToTradeMinutes < INSIDER_THRESHOLDS.DEPOSIT_WINDOW_MINUTES;
}

export function hasLowPriceSensitivity(priceStandardDeviation?: number): boolean {
  if (priceStandardDeviation === undefined) return false;
  return priceStandardDeviation < INSIDER_THRESHOLDS.PRICE_SENSITIVITY_THRESHOLD;
}

export function calculatePriceStandardDeviation(prices: number[]): number {
  if (prices.length === 0) return 0;
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  return Math.sqrt(variance);
}

export function calculateReturnMultiple(avgPrice: number, currentPrice: number): number {
  if (avgPrice === 0) return 0;
  return currentPrice / avgPrice;
}

export function isPoliticalMarket(marketTitle: string, description?: string): boolean {
  const text = `${marketTitle} ${description || ''}`.toLowerCase();
  const politicalKeywords = [
    'election', 'president', 'vote', 'candidate', 'party', 'senate', 'congress',
    'geopolitics', 'war', 'conflict', 'sanction', 'embargo', 'diplomacy',
    'policy', 'law', 'bill', 'legislation', 'regulation',
    'leadership', 'minister', 'prime minister', 'chancellor',
    'international', 'treaty', 'alliance', 'summit'
  ];
  return politicalKeywords.some(keyword => text.includes(keyword));
}

export function categorizePoliticalMarket(marketTitle: string, description?: string): PoliticalCategory {
  const text = `${marketTitle} ${description || ''}`.toLowerCase();
  
  if (text.match(/\b(election|vote|candidate|party|senate|congress|president|governor)\b/)) {
    return 'election';
  }
  if (text.match(/\b(war|conflict|sanction|embargo|diplomacy|geopolitics)\b/)) {
    return 'geopolitics';
  }
  if (text.match(/\b(policy|law|bill|legislation|regulation)\b/)) {
    return 'policy';
  }
  if (text.match(/\b(leadership|minister|prime minister|chancellor|president|leader)\b/)) {
    return 'leadership';
  }
  if (text.match(/\b(treaty|alliance|summit|international|un|nato)\b/)) {
    return 'international';
  }
  
  return 'election'; // default
}

// ============================================================================
// Score Calculation
// ============================================================================

export function calculateInsiderScore(characteristics: InsiderCharacteristics): InsiderScoreResult {
  let score = 0;
  const breakdown: InsiderScoreResult['breakdown'] = [];
  let bonusPoints = 0;
  const riskFactors: string[] = [];

  // Base features with weights
  if (characteristics.isNewWallet) {
    const featureScore = 15;
    score += featureScore;
    breakdown.push({
      feature: 'New Wallet',
      weight: 15,
      score: featureScore,
      description: `Wallet age: ${characteristics.walletAgeDays} days`,
    });
    riskFactors.push('New wallet created recently');
  }

  if (characteristics.hasNoHistory) {
    const featureScore = 10;
    score += featureScore;
    breakdown.push({
      feature: 'No History',
      weight: 10,
      score: featureScore,
      description: `Only ${characteristics.totalTradeCount} trades`,
    });
    riskFactors.push('Minimal trading history');
  }

  if (characteristics.singleSidedBet) {
    const featureScore = 20;
    score += featureScore;
    breakdown.push({
      feature: 'Single-Sided Bet',
      weight: 20,
      score: featureScore,
      description: `YES ratio: ${(characteristics.yesBetRatio * 100).toFixed(1)}%`,
    });
    riskFactors.push('Only betting on one outcome');
  }

  if (characteristics.largePosition) {
    const featureScore = 15;
    score += featureScore;
    breakdown.push({
      feature: 'Large Position',
      weight: 15,
      score: featureScore,
      description: `Max trade: $${characteristics.maxSingleTradeUsd.toFixed(2)}`,
    });
    riskFactors.push('Large position size');
  }

  if (characteristics.timingSensitive) {
    const featureScore = 10;
    score += featureScore;
    breakdown.push({
      feature: 'Timing Sensitive',
      weight: 10,
      score: featureScore,
      description: `Traded ${characteristics.hoursBeforeEvent}h before event`,
    });
    riskFactors.push('Traded close to event time');
  }

  if (characteristics.shortDepositWindow) {
    const featureScore = 25;
    score += featureScore;
    breakdown.push({
      feature: 'Short Deposit Window',
      weight: 25,
      score: featureScore,
      description: `Deposit to trade: ${characteristics.depositToTradeMinutes} minutes`,
    });
    riskFactors.push('Deposited and traded quickly');
  }

  if (characteristics.lowPriceSensitivity) {
    const featureScore = 10;
    score += featureScore;
    breakdown.push({
      feature: 'Low Price Sensitivity',
      weight: 10,
      score: featureScore,
      description: `Price std dev: ${characteristics.priceStandardDeviation?.toFixed(4) || 'N/A'}`,
    });
    riskFactors.push('Not price-sensitive');
  }

  if (characteristics.twoPhasePattern) {
    const featureScore = 15;
    score += featureScore;
    breakdown.push({
      feature: 'Two-Phase Pattern',
      weight: 15,
      score: featureScore,
      description: 'Failed trades followed by success',
    });
    riskFactors.push('Two-phase trading pattern');
  }

  // Bonus points
  if (characteristics.returnMultiple && characteristics.returnMultiple >= INSIDER_THRESHOLDS.RETURN_MULTIPLE_THRESHOLD) {
    bonusPoints += 10;
    breakdown.push({
      feature: 'High Return Multiple',
      weight: 0,
      score: 10,
      description: `Return: ${(characteristics.returnMultiple * 100).toFixed(1)}%`,
    });
    riskFactors.push('High return multiple');
  }

  if (characteristics.marketType === 'political') {
    bonusPoints += 5;
    breakdown.push({
      feature: 'Political Market',
      weight: 0,
      score: 5,
      description: 'Trading in political market',
    });
  }

  // Cap score at 100
  const totalScore = Math.min(100, score + bonusPoints);

  return {
    score: totalScore,
    level: getInsiderLevel(totalScore),
    characteristics,
    breakdown,
    bonusPoints,
    riskFactors,
  };
}

export function getInsiderLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function getInsiderLevelColor(level: string): string {
  switch (level) {
    case 'critical': return '🔴';
    case 'high': return '🟡';
    case 'medium': return '🟠';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

export function getInsiderLevelDescription(level: string): string {
  switch (level) {
    case 'critical': return '高度可疑，需要重点关注';
    case 'high': return '中度可疑，建议跟踪';
    case 'medium': return '轻度可疑，可能是投机者';
    case 'low': return '正常交易者';
    default: return '未知';
  }
}

// ============================================================================
// Services (Minimal implementations)
// ============================================================================

export class WalletClassificationService {
  private storagePath: string;

  constructor() {
    const os = require('os');
    const path = require('path');
    this.storagePath = path.join(os.homedir(), '.polymarket', 'wallet-classifications.json');
  }

  async getTagDefinitions(category?: string): Promise<any[]> {
    // Return predefined tags
    return [];
  }

  async addTagDefinition(options: any): Promise<any> {
    return { success: true };
  }

  async getWalletClassification(address: string): Promise<any> {
    return null;
  }

  async classifyWallet(options: any): Promise<any> {
    return { success: true };
  }

  async getWalletsByTag(tagId: string, options?: any): Promise<any[]> {
    return [];
  }

  async removeWalletTag(address: string, tagId: string): Promise<boolean> {
    return true;
  }
}

export class InsiderSignalService {
  private dataDir: string;

  constructor(options: { dataDir: string }) {
    this.dataDir = options.dataDir;
  }

  async getSignals(options?: any): Promise<any[]> {
    return [];
  }

  async getSignalCount(): Promise<number> {
    return 0;
  }

  async markRead(id: string): Promise<boolean> {
    return true;
  }

  async markAllRead(): Promise<number> {
    return 0;
  }
}

export type TagCategory = 'trading-style' | 'market-preference' | 'scale' | 'performance' | 'activity' | 'risk-profile' | 'special';
export type TagDefinition = any;
export type WalletClassification = any;
export type ClassifyWalletOptions = any;
export type AddTagDefinitionOptions = any;
export type ClassificationMetrics = any;
export type InsiderSignalType = 'insider_new' | 'insider_large_trade' | 'insider_cluster';
export type InsiderSignalSeverity = 'low' | 'medium' | 'high';
