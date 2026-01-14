/**
 * Trade Tools - MCP tools for trading execution
 *
 * These tools enable actual trading on Polymarket when private key is configured.
 * API credentials are automatically derived from the private key using createOrDeriveApiKey().
 *
 * Required environment variable:
 * - POLY_PRIVATE_KEY: Wallet private key for signing transactions
 */

import type { PolymarketSDK } from '@catalyst-team/poly-sdk';
import type { ToolDefinition } from '../types.js';
import {
  validateConditionId,
  validateOutcome,
  validateSide,
  validatePrice,
  validatePositiveNumber,
  wrapError,
  McpToolError,
  ErrorCode,
} from '../errors.js';
import { TradingService, RateLimiter, createUnifiedCache } from '@catalyst-team/poly-sdk';
import type { OrderResult } from '@catalyst-team/poly-sdk';

// Singleton trading service instance (lazily initialized)
let tradingService: TradingService | null = null;
let tradingServiceInitialized = false;

/**
 * Get or create the TradingService instance
 * Uses the signer from SDK's tradingService
 */
async function getTradingService(sdk: PolymarketSDK): Promise<TradingService> {
  // Check if tradingService is available on SDK
  const sdkAny = sdk as unknown as { tradingService?: TradingService };

  // Try to use SDK's trading service first
  if (sdkAny.tradingService) {
    return sdkAny.tradingService;
  }

  // Fallback: Check environment variable for private key
  const privateKey = process.env.POLY_PRIVATE_KEY;

  if (!privateKey) {
    throw new McpToolError(
      ErrorCode.AUTH_REQUIRED,
      'Trading requires a private key. Configure POLY_PRIVATE_KEY environment variable.'
    );
  }

  // Create trading service if not exists
  if (!tradingService) {
    const chainId = 137;
    const rateLimiter = new RateLimiter();
    const cache = createUnifiedCache();

    tradingService = new TradingService(rateLimiter, cache, {
      privateKey,
      chainId,
    });
  }

  // Initialize if needed
  if (!tradingServiceInitialized) {
    await tradingService.initialize();
    tradingServiceInitialized = true;
  }

  return tradingService;
}

export const tradeToolDefinitions: ToolDefinition[] = [
  {
    name: 'place_limit_order',
    description: 'Place a limit order on a market (requires API key)',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
        },
        outcome: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
        side: {
          type: 'string',
          enum: ['BUY', 'SELL'],
        },
        price: {
          type: 'number',
          description: 'Limit price (0.001 to 0.999)',
        },
        size: {
          type: 'number',
          description: 'Number of shares',
        },
        orderType: {
          type: 'string',
          enum: ['GTC', 'GTD'],
          default: 'GTC',
        },
      },
      required: ['conditionId', 'outcome', 'side', 'price', 'size'],
    },
  },
  {
    name: 'place_market_order',
    description: 'Place a market order on a market (requires API key)',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
        },
        outcome: {
          type: 'string',
          enum: ['Yes', 'No'],
        },
        side: {
          type: 'string',
          enum: ['BUY', 'SELL'],
        },
        amount: {
          type: 'number',
          description: 'Amount in USDC',
        },
        maxSlippage: {
          type: 'number',
          description: 'Maximum acceptable slippage (e.g., 0.02 for 2%)',
          default: 0.02,
        },
      },
      required: ['conditionId', 'outcome', 'side', 'amount'],
    },
  },
  {
    name: 'cancel_order',
    description: 'Cancel an open order (requires API key)',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to cancel',
        },
      },
      required: ['orderId'],
    },
  },
  {
    name: 'get_my_orders',
    description: 'Get your open orders (requires API key)',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['LIVE', 'FILLED', 'CANCELLED'],
          default: 'LIVE',
        },
      },
    },
  },
  {
    name: 'cancel_all_orders',
    description: 'Cancel all open orders (requires API key)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_my_trades',
    description: 'Get your trading history (requires API key)',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of trades to return',
          default: 50,
        },
        market: {
          type: 'string',
          description: 'Filter by market conditionId (optional)',
        },
      },
    },
  },
  {
    name: 'get_earnings',
    description: 'Get market making earnings for a specific day (requires API key)',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'get_current_rewards',
    description: 'Get markets currently offering maker rewards (requires API key)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'check_order_scoring',
    description: 'Check if an order is scoring for rewards (requires API key)',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to check',
        },
      },
      required: ['orderId'],
    },
  },
];

// Check if trading is configured (basic check)
function checkTradingEnabled(sdk: PolymarketSDK): void {
  // Check if tradingService is available on SDK or env var is set
  const sdkAny = sdk as unknown as { tradingService?: TradingService };
  const hasEnvKey = !!process.env.POLY_PRIVATE_KEY;

  if (!sdkAny.tradingService && !hasEnvKey) {
    throw new McpToolError(
      ErrorCode.AUTH_REQUIRED,
      'Trading requires a private key. Configure POLY_PRIVATE_KEY environment variable.'
    );
  }
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

export interface GetMyTradesInput {
  limit?: number;
  market?: string;
}

export interface GetEarningsInput {
  date: string;
}

export interface CheckOrderScoringInput {
  orderId: string;
}

export async function handlePlaceLimitOrder(
  sdk: PolymarketSDK,
  input: PlaceLimitOrderInput
): Promise<unknown> {
  checkTradingEnabled(sdk);
  validateConditionId(input.conditionId);
  validateOutcome(input.outcome);
  validateSide(input.side);
  validatePrice(input.price);
  validatePositiveNumber(input.size, 'size');

  try {
    // Get trading service
    const client = await getTradingService(sdk);

    // Get token ID for the outcome using SDK's MarketService
    const market = await sdk.getMarket(input.conditionId);
    const token = market.tokens.find(
      (t: { outcome: string }) => t.outcome.toLowerCase() === input.outcome.toLowerCase()
    );

    if (!token) {
      throw new McpToolError(
        ErrorCode.MARKET_NOT_FOUND,
        `Token for outcome ${input.outcome} not found`
      );
    }

    // Place the limit order
    const result: OrderResult = await client.createLimitOrder({
      tokenId: token.tokenId,
      side: input.side,
      price: input.price,
      size: input.size,
      orderType: input.orderType || 'GTC',
    });

    return {
      success: result.success,
      orderId: result.orderId,
      orderIds: result.orderIds,
      market: {
        conditionId: input.conditionId,
        question: market.question,
        outcome: input.outcome,
      },
      order: {
        side: input.side,
        price: input.price,
        size: input.size,
        orderType: input.orderType || 'GTC',
      },
      transactionHashes: result.transactionHashes,
      errorMsg: result.errorMsg,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handlePlaceMarketOrder(
  sdk: PolymarketSDK,
  input: PlaceMarketOrderInput
): Promise<unknown> {
  checkTradingEnabled(sdk);
  validateConditionId(input.conditionId);
  validateOutcome(input.outcome);
  validateSide(input.side);
  validatePositiveNumber(input.amount, 'amount');

  try {
    // Get trading service
    const client = await getTradingService(sdk);

    // Get token ID for the outcome using SDK's MarketService
    const market = await sdk.getMarket(input.conditionId);
    const token = market.tokens.find(
      (t: { outcome: string; price: number }) => t.outcome.toLowerCase() === input.outcome.toLowerCase()
    );

    if (!token) {
      throw new McpToolError(
        ErrorCode.MARKET_NOT_FOUND,
        `Token for outcome ${input.outcome} not found`
      );
    }

    // Get current price for slippage calculation
    const currentPrice = token.price;
    const maxSlippage = input.maxSlippage || 0.02; // Default 2%

    // Calculate price limit based on side and slippage
    // For BUY: max price we're willing to pay = current * (1 + slippage)
    // For SELL: min price we're willing to accept = current * (1 - slippage)
    const priceLimit = input.side === 'BUY'
      ? Math.min(currentPrice * (1 + maxSlippage), 0.999)
      : Math.max(currentPrice * (1 - maxSlippage), 0.001);

    // Place the market order
    const result: OrderResult = await client.createMarketOrder({
      tokenId: token.tokenId,
      side: input.side,
      amount: input.amount,
      price: priceLimit,
      orderType: 'FOK', // Fill or Kill for market orders
    });

    return {
      success: result.success,
      orderId: result.orderId,
      orderIds: result.orderIds,
      market: {
        conditionId: input.conditionId,
        question: market.question,
        outcome: input.outcome,
      },
      order: {
        side: input.side,
        amount: input.amount,
        priceLimit,
        maxSlippage,
      },
      transactionHashes: result.transactionHashes,
      errorMsg: result.errorMsg,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleCancelOrder(
  sdk: PolymarketSDK,
  input: CancelOrderInput
): Promise<unknown> {
  checkTradingEnabled(sdk);

  if (!input.orderId) {
    throw new McpToolError(ErrorCode.INVALID_INPUT, 'Order ID is required');
  }

  try {
    // Get trading client (lazily initialized)
    const client = await getTradingService(sdk);

    // Cancel the order
    const result: OrderResult = await client.cancelOrder(input.orderId);

    return {
      success: result.success,
      orderId: input.orderId,
      message: result.success
        ? `Order ${input.orderId} cancelled successfully`
        : `Failed to cancel order ${input.orderId}`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetMyOrders(
  sdk: PolymarketSDK,
  input: GetMyOrdersInput
): Promise<unknown> {
  checkTradingEnabled(sdk);

  try {
    // Get trading client (lazily initialized)
    const client = await getTradingService(sdk);

    // Note: TradingClient only supports getting open (LIVE) orders
    // For FILLED/CANCELLED, we would need to query trades history
    const status = input.status || 'LIVE';

    if (status !== 'LIVE') {
      // For non-LIVE orders, return a note about limitation
      return {
        orders: [],
        status,
        note: `Currently only LIVE orders are supported. Use get_trader_trades for historical order information.`,
      };
    }

    // Get open orders
    const orders = await client.getOpenOrders();

    return {
      orders: orders.map(o => ({
        id: o.id,
        status: o.status,
        tokenId: o.tokenId,
        side: o.side,
        price: o.price,
        originalSize: o.originalSize,
        remainingSize: o.remainingSize,
        createdAt: o.createdAt,
      })),
      count: orders.length,
      status: 'LIVE',
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleCancelAllOrders(
  sdk: PolymarketSDK
): Promise<unknown> {
  checkTradingEnabled(sdk);

  try {
    const client = await getTradingService(sdk);
    const result = await client.cancelAllOrders();

    return {
      success: result.success,
      message: result.success
        ? 'All orders cancelled successfully'
        : 'Failed to cancel all orders',
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetMyTrades(
  sdk: PolymarketSDK,
  input: GetMyTradesInput
): Promise<unknown> {
  checkTradingEnabled(sdk);

  try {
    const client = await getTradingService(sdk);
    const trades = await client.getTrades(input.market);

    // Apply limit if specified
    const limit = input.limit || 50;
    const limitedTrades = trades.slice(0, limit);

    return {
      trades: limitedTrades.map(t => ({
        id: t.id,
        tokenId: t.tokenId,
        side: t.side,
        price: t.price,
        size: t.size,
        fee: t.fee,
        timestamp: t.timestamp,
      })),
      count: limitedTrades.length,
      total: trades.length,
      market: input.market || 'all',
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetEarnings(
  sdk: PolymarketSDK,
  input: GetEarningsInput
): Promise<unknown> {
  checkTradingEnabled(sdk);

  if (!input.date) {
    throw new McpToolError(ErrorCode.INVALID_INPUT, 'Date is required (YYYY-MM-DD format)');
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(input.date)) {
    throw new McpToolError(ErrorCode.INVALID_INPUT, 'Date must be in YYYY-MM-DD format');
  }

  try {
    const client = await getTradingService(sdk);
    const earnings = await client.getEarningsForDay(input.date);

    const totalEarnings = earnings.reduce((sum, e) => sum + e.earnings, 0);

    return {
      date: input.date,
      earnings: earnings.map(e => ({
        conditionId: e.conditionId,
        assetAddress: e.assetAddress,
        earnings: e.earnings,
        assetRate: e.assetRate,
      })),
      count: earnings.length,
      totalEarnings,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetCurrentRewards(
  sdk: PolymarketSDK
): Promise<unknown> {
  checkTradingEnabled(sdk);

  try {
    const client = await getTradingService(sdk);
    const rewards = await client.getCurrentRewards();

    return {
      markets: rewards.map(r => ({
        conditionId: r.conditionId,
        question: r.question,
        marketSlug: r.marketSlug,
        eventSlug: r.eventSlug,
        rewardsMaxSpread: r.rewardsMaxSpread,
        rewardsMinSize: r.rewardsMinSize,
        tokens: r.tokens,
        rewardsConfig: r.rewardsConfig,
      })),
      count: rewards.length,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleCheckOrderScoring(
  sdk: PolymarketSDK,
  input: CheckOrderScoringInput
): Promise<unknown> {
  checkTradingEnabled(sdk);

  if (!input.orderId) {
    throw new McpToolError(ErrorCode.INVALID_INPUT, 'Order ID is required');
  }

  try {
    const client = await getTradingService(sdk);
    const isScoring = await client.isOrderScoring(input.orderId);

    return {
      orderId: input.orderId,
      isScoring,
      message: isScoring
        ? 'Order is currently scoring for rewards'
        : 'Order is not scoring for rewards',
    };
  } catch (err) {
    throw wrapError(err);
  }
}
