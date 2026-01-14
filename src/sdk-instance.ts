/**
 * SDK Instance Management
 *
 * Provides singleton instances of poly-sdk services for use across MCP tools.
 * This ensures consistent configuration and efficient resource usage.
 */

import {
  MarketService,
  RateLimiter,
  createUnifiedCache,
  type UnifiedCache,
} from '@catalyst-team/poly-sdk';

// ===== Singleton Instances =====

let marketService: MarketService | null = null;
let rateLimiter: RateLimiter | null = null;
let cache: UnifiedCache | null = null;

/**
 * Get or create shared RateLimiter instance
 */
function getRateLimiter(): RateLimiter {
  if (!rateLimiter) {
    rateLimiter = new RateLimiter();
  }
  return rateLimiter;
}

/**
 * Get or create shared UnifiedCache instance
 */
function getCache(): UnifiedCache {
  if (!cache) {
    cache = createUnifiedCache();
  }
  return cache;
}

/**
 * Get or create shared MarketService instance
 *
 * The MarketService provides:
 * - CLOB market data (getClobMarket)
 * - Token resolution (resolveMarketTokens)
 * - Orderbook data
 * - K-Line aggregation
 *
 * Note: This creates a read-only MarketService without GammaApiClient or DataApiClient.
 * For full functionality, use the PolymarketSDK directly.
 */
export function getMarketService(): MarketService {
  if (!marketService) {
    // Create MarketService with minimal dependencies
    // GammaApiClient and DataApiClient are optional for basic token resolution
    marketService = new MarketService(
      undefined, // gammaApi - not needed for token resolution
      undefined, // dataApi - not needed for token resolution
      getRateLimiter(),
      getCache(),
      undefined, // config - uses default CLOB settings
      undefined  // binanceService - not needed for token resolution
    );
  }
  return marketService;
}

/**
 * Clear all cached SDK instances
 *
 * Useful for testing or when configuration changes.
 */
export function clearSdkInstances(): void {
  marketService = null;
  rateLimiter = null;
  cache = null;
}
