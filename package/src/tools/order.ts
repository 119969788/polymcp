/**
 * Order Tools - MCP tools for orderbook analysis
 */

import type { PolymarketSDK } from '@catalyst-team/poly-sdk';
import type {
  ToolDefinition,
  GetOrderbookInput,
  GetOrderbookOutput,
  GetBestPricesInput,
  GetBestPricesOutput,
  EstimateExecutionInput,
  EstimateExecutionOutput,
} from '../types.js';
import {
  validateConditionId,
  validateOutcome,
  validateSide,
  validatePositiveNumber,
  wrapError,
  McpToolError,
  ErrorCode,
} from '../errors.js';

export const orderToolDefinitions: ToolDefinition[] = [
  {
    name: 'get_orderbook',
    description: 'Get orderbook depth for a market outcome',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID',
        },
        outcome: {
          type: 'string',
          enum: ['Yes', 'No'],
          description: "Which outcome's orderbook to fetch",
        },
        depth: {
          type: 'number',
          description: 'Number of price levels',
          default: 10,
        },
      },
      required: ['conditionId', 'outcome'],
    },
  },
  {
    name: 'get_best_prices',
    description: 'Get best bid/ask prices for both outcomes',
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
    name: 'estimate_execution',
    description: 'Estimate execution price and slippage for a trade',
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
      },
      required: ['conditionId', 'outcome', 'side', 'amount'],
    },
  },
];

export async function handleGetOrderbook(
  sdk: PolymarketSDK,
  input: GetOrderbookInput
): Promise<GetOrderbookOutput> {
  validateConditionId(input.conditionId);
  validateOutcome(input.outcome);

  try {
    // Get market to find the token ID
    const market = await sdk.markets.getClobMarket(input.conditionId);
    if (!market) {
      throw new McpToolError(
        ErrorCode.MARKET_NOT_FOUND,
        `Market not found for conditionId: ${input.conditionId}`
      );
    }
    // Note: isYes uses case-insensitive comparison for flexibility
    const isYes = input.outcome.toLowerCase() === 'yes';
    const token = market.tokens.find(
      (t: { outcome: string }) => t.outcome.toLowerCase() === input.outcome.toLowerCase()
    );

    if (!token) {
      throw new McpToolError(
        ErrorCode.MARKET_NOT_FOUND,
        `Token for outcome ${input.outcome} not found`
      );
    }

    // Get the raw orderbook for this token
    const orderbook = await sdk.markets.getTokenOrderbook(token.tokenId);
    const depth = input.depth || 10;

    // Get market title
    let marketTitle = input.conditionId;
    try {
      const unifiedMarket = await sdk.getMarket(input.conditionId);
      marketTitle = unifiedMarket.question;
    } catch {
      // Use conditionId as fallback
    }

    // Calculate totals for each level
    let bidTotal = 0;
    let askTotal = 0;

    const bids = orderbook.bids.slice(0, depth).map((level: { size: number; price: number }) => {
      bidTotal += level.size * level.price;
      return {
        price: level.price,
        size: level.size,
        total: bidTotal,
      };
    });

    const asks = orderbook.asks.slice(0, depth).map((level: { size: number; price: number }) => {
      askTotal += level.size * level.price;
      return {
        price: level.price,
        size: level.size,
        total: askTotal,
      };
    });

    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 1;
    const spread = bestAsk - bestBid;
    const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    const bidDepth = orderbook.bids.slice(0, depth).reduce((sum: number, l: { size: number }) => sum + l.size, 0);
    const askDepth = orderbook.asks.slice(0, depth).reduce((sum: number, l: { size: number }) => sum + l.size, 0);

    return {
      market: {
        conditionId: input.conditionId,
        title: marketTitle,
      },
      outcome: input.outcome,
      tokenId: token.tokenId,
      orderbook: {
        bids,
        asks,
      },
      summary: {
        bestBid,
        bestAsk,
        spread,
        spreadPercent,
        bidDepth,
        askDepth,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleGetBestPrices(
  sdk: PolymarketSDK,
  input: GetBestPricesInput
): Promise<GetBestPricesOutput> {
  validateConditionId(input.conditionId);

  try {
    const processedOrderbook = await sdk.markets.getProcessedOrderbook(input.conditionId);

    // Get market title
    let marketTitle = input.conditionId;
    try {
      const market = await sdk.getMarket(input.conditionId);
      marketTitle = market.question;
    } catch {
      // Use conditionId as fallback
    }

    const yes = processedOrderbook.yes;
    const no = processedOrderbook.no;

    return {
      market: marketTitle,
      yes: {
        bestBid: yes.bid,
        bestAsk: yes.ask,
        midPrice: (yes.bid + yes.ask) / 2,
        spread: yes.spread,
      },
      no: {
        bestBid: no.bid,
        bestAsk: no.ask,
        midPrice: (no.bid + no.ask) / 2,
        spread: no.spread,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function handleEstimateExecution(
  sdk: PolymarketSDK,
  input: EstimateExecutionInput
): Promise<EstimateExecutionOutput> {
  validateConditionId(input.conditionId);
  validateOutcome(input.outcome);
  validateSide(input.side);
  validatePositiveNumber(input.amount, 'amount');

  try {
    // Get market to find the token ID
    const market = await sdk.markets.getClobMarket(input.conditionId);
    if (!market) {
      throw new McpToolError(
        ErrorCode.MARKET_NOT_FOUND,
        `Market not found for conditionId: ${input.conditionId}`
      );
    }
    const token = market.tokens.find(
      (t: { outcome: string }) => t.outcome.toLowerCase() === input.outcome.toLowerCase()
    );

    if (!token) {
      throw new McpToolError(
        ErrorCode.MARKET_NOT_FOUND,
        `Token for outcome ${input.outcome} not found`
      );
    }

    // Get the raw orderbook
    const orderbook = await sdk.markets.getTokenOrderbook(token.tokenId);

    // Get market title
    let marketTitle = input.conditionId;
    try {
      const unifiedMarket = await sdk.getMarket(input.conditionId);
      marketTitle = unifiedMarket.question;
    } catch {
      // Use conditionId as fallback
    }

    // Simulate execution
    const isBuy = input.side === 'BUY';
    const levels = isBuy ? orderbook.asks : orderbook.bids;

    if (levels.length === 0) {
      throw new McpToolError(
        ErrorCode.MARKET_NOT_FOUND,
        'No liquidity available for this order'
      );
    }

    let remainingAmount = input.amount;
    let totalShares = 0;
    let worstPrice = levels[0].price;

    for (const level of levels) {
      const levelValue = level.size * level.price;

      if (remainingAmount <= levelValue) {
        // This level can fill the remaining order
        const sharesToBuy = remainingAmount / level.price;
        totalShares += sharesToBuy;
        worstPrice = level.price;
        remainingAmount = 0;
        break;
      } else {
        // Consume entire level
        totalShares += level.size;
        remainingAmount -= levelValue;
        worstPrice = level.price;
      }
    }

    // If we couldn't fill the entire order
    if (remainingAmount > 0) {
      throw new McpToolError(
        ErrorCode.INSUFFICIENT_BALANCE,
        'Not enough liquidity to fill the entire order',
        { remainingAmount, totalShares }
      );
    }

    const avgPrice = input.amount / totalShares;
    const bestPrice = levels[0].price;
    const priceImpact = Math.abs(avgPrice - bestPrice) / bestPrice;

    let warning: string | null = null;
    if (priceImpact > 0.05) {
      warning = `High price impact (${(priceImpact * 100).toFixed(1)}%)`;
    }

    return {
      market: marketTitle,
      order: {
        side: input.side,
        outcome: input.outcome,
        usdcAmount: input.amount,
      },
      estimate: {
        avgPrice,
        sharesReceived: totalShares,
        priceImpact,
        worstPrice,
      },
      warning,
    };
  } catch (err) {
    throw wrapError(err);
  }
}
