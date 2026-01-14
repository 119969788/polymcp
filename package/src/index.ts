/**
 * Polymarket MCP Server
 *
 * This package provides MCP (Model Context Protocol) tools for interacting with Polymarket.
 * It can be used to build an MCP server that exposes Polymarket functionality to AI agents.
 *
 * Tool Categories:
 * - Trader Tools: Analyze traders/wallets (positions, trades, profiles, leaderboard)
 * - Market Tools: Discover and analyze markets (get, search, trending, trades)
 * - Order Tools: Analyze orderbooks (depth, best prices, execution estimates)
 * - Trade Tools: Execute trades (limit orders, market orders) - requires API credentials
 * - Wallet Tools: Deposits and authorization management
 *
 * Usage:
 * ```typescript
 * import { PolymarketSDK } from '@catalyst-team/poly-sdk';
 * import { createMcpHandler, allToolDefinitions } from '@catalyst-team/poly-mcp';
 *
 * const sdk = new PolymarketSDK();
 * const handler = createMcpHandler(sdk);
 *
 * // Use with MCP server
 * const result = await handler('get_trader_positions', { address: '0x...' });
 * ```
 */

import { PolymarketSDK } from '@catalyst-team/poly-sdk';
import { McpToolError, wrapError } from './errors.js';
import {
  allToolDefinitions,
  // Guide handlers
  createGuideHandlers,
  // Trader handlers
  handleGetTraderPositions,
  handleGetTraderTrades,
  handleGetTraderActivity,
  handleGetTraderProfile,
  handleGetLeaderboard,
  handleGetClosedPositions,
  handleGetAccountValue,
  // Market handlers
  handleGetMarket,
  handleSearchMarkets,
  handleGetTrendingMarkets,
  handleGetMarketTrades,
  handleGetKLines,
  handleGetPriceHistory,
  handleDetectArbitrage,
  handleDetectMarketSignals,
  handleGetRealtimeSpread,
  handleScanCryptoShortTermMarkets,
  // Order handlers
  handleGetOrderbook,
  handleGetBestPrices,
  handleEstimateExecution,
  // Trade handlers
  handlePlaceLimitOrder,
  handlePlaceMarketOrder,
  handleCancelOrder,
  handleGetMyOrders,
  handleCancelAllOrders,
  handleGetMyTrades,
  handleGetEarnings,
  handleGetCurrentRewards,
  handleCheckOrderScoring,
  // Wallet management handlers
  handleListWallets,
  handleGetActiveWallet,
  handleSetActiveWallet,
  // Wallet deposit/swap handlers
  handleGetSupportedAssets,
  handleGetDepositAddresses,
  handleDepositUsdc,
  handleCheckAllowances,
  handleApproveTrading,
  handleSwap,
  handleSwapAndDeposit,
  handleGetTokenBalances,
  handleGetWalletBalances,
  handleGetSwapQuote,
  handleGetAvailablePools,
  // Onchain (CTF) handlers
  handleCtfSplit,
  handleCtfMerge,
  handleCtfRedeem,
  handleGetPositionBalance,
  handleGetMarketResolution,
  handleCheckCtfReady,
  handleEstimateGas,
  handleGetGasPrice,
  // Wallet classification handlers
  handleGetTagDefinitions,
  handleAddTagDefinition,
  handleGetWalletClassification,
  handleClassifyWallet,
  handleGetWalletsByTag,
  handleRemoveWalletTag,
  // Insider detection handlers
  handleAnalyzeWalletInsider,
  handleScanInsiderWallets,
  handleGetInsiderCandidates,
  handleGetPoliticalMarkets,
  // Insider signals handlers
  handleGetInsiderSignals,
  handleGetInsiderSignalCount,
  handleMarkInsiderSignalRead,
  handleMarkAllInsiderSignalsRead,
} from './tools/index.js';

// Re-export types
export * from './types.js';
export * from './errors.js';
export { allToolDefinitions } from './tools/index.js';

// Tool handler type
export type ToolHandler = (
  toolName: string,
  args: Record<string, unknown>
) => Promise<unknown>;

/**
 * Create an MCP tool handler for the given SDK instance
 */
export function createMcpHandler(sdk: PolymarketSDK): ToolHandler {
  // Create guide handlers (no SDK dependency)
  const guideHandlers = createGuideHandlers();

  return async (toolName: string, args: Record<string, unknown>): Promise<unknown> => {
    try {
      switch (toolName) {
        // Guide Tool - should be called FIRST
        case 'get_usage_guide':
          return await guideHandlers.get_usage_guide(args);

        // Trader Tools
        case 'get_trader_positions':
          return await handleGetTraderPositions(sdk, args as { address: string });

        case 'get_trader_trades':
          return await handleGetTraderTrades(sdk, args as {
            address: string;
            limit?: number;
            side?: 'BUY' | 'SELL';
          });

        case 'get_trader_activity':
          return await handleGetTraderActivity(sdk, args as {
            address: string;
            limit?: number;
            type?: 'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION';
            market?: string;
          });

        case 'get_trader_profile':
          return await handleGetTraderProfile(sdk, args as { address: string });

        case 'get_leaderboard':
          return await handleGetLeaderboard(sdk, args as {
            limit?: number;
            offset?: number;
          });

        case 'get_trader_closed_positions':
          return await handleGetClosedPositions(sdk, args as {
            address: string;
            limit?: number;
            sortBy?: 'REALIZEDPNL' | 'TIMESTAMP' | 'TITLE';
          });

        case 'get_account_value':
          return await handleGetAccountValue(sdk, args as {
            address: string;
            market?: string[];
          });

        // Market Tools
        case 'get_market':
          return await handleGetMarket(sdk, args as { identifier: string });

        case 'search_markets':
          return await handleSearchMarkets(sdk, args as {
            query: string;
            active?: boolean;
            limit?: number;
          });

        case 'get_trending_markets':
          return await handleGetTrendingMarkets(sdk, args as {
            limit?: number;
            sortBy?: 'volume' | 'liquidity' | 'newest';
          });

        case 'get_market_trades':
          return await handleGetMarketTrades(sdk, args as {
            conditionId: string;
            limit?: number;
          });

        case 'get_klines':
          return await handleGetKLines(sdk, args as {
            conditionId: string;
            interval: '30s' | '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '12h' | '1d';
            limit?: number;
            outcome?: 'Yes' | 'No' | 'both';
          });

        case 'get_price_history':
          return await handleGetPriceHistory(sdk, args as {
            tokenId: string;
            interval?: '1h' | '6h' | '1d' | '1w' | 'max';
          });

        case 'detect_arbitrage':
          return await handleDetectArbitrage(sdk, args as {
            conditionId: string;
            threshold?: number;
          });

        case 'detect_market_signals':
          return await handleDetectMarketSignals(sdk, args as {
            conditionId: string;
          });

        case 'get_realtime_spread':
          return await handleGetRealtimeSpread(sdk, args as {
            conditionId: string;
          });

        case 'scan_crypto_short_term_markets':
          return await handleScanCryptoShortTermMarkets(sdk, args as {
            minMinutesUntilEnd?: number;
            maxMinutesUntilEnd?: number;
            limit?: number;
            sortBy?: 'endDate' | 'volume' | 'liquidity';
            duration?: '5m' | '15m' | 'all';
            coin?: 'BTC' | 'ETH' | 'SOL' | 'XRP' | 'all';
          });

        // Order Tools
        case 'get_orderbook':
          return await handleGetOrderbook(sdk, args as {
            conditionId: string;
            outcome: 'Yes' | 'No';
            depth?: number;
          });

        case 'get_best_prices':
          return await handleGetBestPrices(sdk, args as {
            conditionId: string;
          });

        case 'estimate_execution':
          return await handleEstimateExecution(sdk, args as {
            conditionId: string;
            outcome: 'Yes' | 'No';
            side: 'BUY' | 'SELL';
            amount: number;
          });

        // Trade Tools
        case 'place_limit_order':
          return await handlePlaceLimitOrder(sdk, args as {
            conditionId: string;
            outcome: 'Yes' | 'No';
            side: 'BUY' | 'SELL';
            price: number;
            size: number;
            orderType?: 'GTC' | 'GTD';
          });

        case 'place_market_order':
          return await handlePlaceMarketOrder(sdk, args as {
            conditionId: string;
            outcome: 'Yes' | 'No';
            side: 'BUY' | 'SELL';
            amount: number;
            maxSlippage?: number;
          });

        case 'cancel_order':
          return await handleCancelOrder(sdk, args as { orderId: string });

        case 'get_my_orders':
          return await handleGetMyOrders(sdk, args as {
            status?: 'LIVE' | 'FILLED' | 'CANCELLED';
          });

        case 'cancel_all_orders':
          return await handleCancelAllOrders(sdk);

        case 'get_my_trades':
          return await handleGetMyTrades(sdk, args as {
            limit?: number;
            market?: string;
          });

        case 'get_earnings':
          return await handleGetEarnings(sdk, args as {
            date: string;
          });

        case 'get_current_rewards':
          return await handleGetCurrentRewards(sdk);

        case 'check_order_scoring':
          return await handleCheckOrderScoring(sdk, args as {
            orderId: string;
          });

        // Wallet Management Tools
        case 'list_wallets':
          return await handleListWallets();

        case 'get_active_wallet':
          return await handleGetActiveWallet();

        case 'set_active_wallet':
          return await handleSetActiveWallet(args as { wallet: string });

        // Wallet Tools
        case 'get_supported_deposit_assets':
          return await handleGetSupportedAssets(sdk, args as {
            chainId?: number;
          });

        case 'get_deposit_addresses':
          return await handleGetDepositAddresses(sdk);

        case 'deposit_usdc':
          return await handleDepositUsdc(sdk, args as {
            amount: number;
            token?: 'NATIVE_USDC' | 'USDC_E';
          });

        case 'check_allowances':
          return await handleCheckAllowances(sdk);

        case 'approve_trading':
          return await handleApproveTrading(sdk);

        case 'swap':
          return await handleSwap(sdk, args as {
            tokenIn: string;
            tokenOut: string;
            amount: string;
            slippage?: number;
          });

        case 'swap_and_deposit':
          return await handleSwapAndDeposit(sdk, args as {
            token: string;
            amount: string;
            slippage?: number;
          });

        case 'get_token_balances':
          return await handleGetTokenBalances(sdk);

        case 'get_wallet_balances':
          return await handleGetWalletBalances(sdk, args as { address: string });

        case 'get_swap_quote':
          return await handleGetSwapQuote(sdk, args as {
            tokenIn: string;
            tokenOut: string;
            amount: string;
          });

        case 'get_available_pools':
          return await handleGetAvailablePools(sdk);

        // Onchain (CTF) Tools
        case 'ctf_split':
          return await handleCtfSplit(args as {
            conditionId: string;
            amount: string;
          });

        case 'ctf_merge':
          return await handleCtfMerge(args as {
            conditionId: string;
            amount: string;
            tokenIds?: { yesTokenId: string; noTokenId: string };
          });

        case 'ctf_redeem':
          return await handleCtfRedeem(args as {
            conditionId: string;
            tokenIds?: { yesTokenId: string; noTokenId: string };
            outcome?: 'Yes' | 'No';
          });

        case 'get_position_balance':
          return await handleGetPositionBalance(args as {
            conditionId: string;
            tokenIds?: { yesTokenId: string; noTokenId: string };
          });

        case 'get_market_resolution':
          return await handleGetMarketResolution(args as {
            conditionId: string;
          });

        case 'check_ctf_ready':
          return await handleCheckCtfReady(args as {
            amount: string;
          });

        case 'estimate_gas':
          return await handleEstimateGas(args as {
            operation: 'split' | 'merge';
            conditionId: string;
            amount: string;
          });

        case 'get_gas_price':
          return await handleGetGasPrice();

        // Wallet Classification Tools
        case 'get_tag_definitions':
          return await handleGetTagDefinitions(sdk, args as {
            category?: 'trading-style' | 'market-preference' | 'scale' | 'performance' | 'activity' | 'risk-profile' | 'special';
          });

        case 'add_tag_definition':
          return await handleAddTagDefinition(sdk, args as {
            id: string;
            name: string;
            description: string;
            category: 'trading-style' | 'market-preference' | 'scale' | 'performance' | 'activity' | 'risk-profile' | 'special';
            criteria?: string;
          });

        case 'get_wallet_classification':
          return await handleGetWalletClassification(sdk, args as {
            address: string;
          });

        case 'classify_wallet':
          return await handleClassifyWallet(sdk, args as {
            address: string;
            tags: string[];
            confidence?: number;
            metrics?: {
              totalPnL: number;
              winRate: number;
              primaryCategory: string;
              tradeCount: number;
              avgHoldingDays: number;
            };
            notes?: string;
          });

        case 'get_wallets_by_tag':
          return await handleGetWalletsByTag(sdk, args as {
            tagId: string;
            limit?: number;
            sortBy?: 'confidence' | 'analyzedAt';
            sortOrder?: 'asc' | 'desc';
          });

        case 'remove_wallet_tag':
          return await handleRemoveWalletTag(sdk, args as {
            address: string;
            tagId: string;
          });

        // Insider Detection Tools
        case 'analyze_wallet_insider':
          return await handleAnalyzeWalletInsider(sdk, args as {
            address: string;
            targetMarket?: string;
            eventTimestamp?: number;
            saveCandidate?: boolean;
          });

        case 'scan_insider_wallets':
          return await handleScanInsiderWallets(sdk, args as {
            conditionId: string;
            minScore?: number;
            limit?: number;
          });

        case 'get_insider_candidates':
          return await handleGetInsiderCandidates(sdk, args as {
            minScore?: number;
            maxScore?: number;
            sortBy?: 'score' | 'analyzedAt' | 'potentialProfit';
            sortOrder?: 'asc' | 'desc';
            limit?: number;
          });

        case 'get_political_markets':
          return await handleGetPoliticalMarkets(sdk, args as {
            category?: 'election' | 'geopolitics' | 'policy' | 'leadership' | 'international' | 'all';
            active?: boolean;
            limit?: number;
            sortBy?: 'volume' | 'insiderActivity' | 'newest';
          });

        // Insider Signals Tools
        case 'get_insider_signals':
          return await handleGetInsiderSignals(sdk, args as {
            type?: 'insider_new' | 'insider_large_trade' | 'insider_cluster';
            severity?: 'low' | 'medium' | 'high';
            unreadOnly?: boolean;
            limit?: number;
            since?: number;
          });

        case 'get_insider_signal_count':
          return await handleGetInsiderSignalCount(sdk, {} as Record<string, never>);

        case 'mark_insider_signal_read':
          return await handleMarkInsiderSignalRead(sdk, args as { id: string });

        case 'mark_all_insider_signals_read':
          return await handleMarkAllInsiderSignalsRead(sdk, {} as Record<string, never>);

        default:
          throw new McpToolError(
            'INVALID_INPUT' as unknown as import('./errors.js').ErrorCode,
            `Unknown tool: ${toolName}`
          );
      }
    } catch (err) {
      if (err instanceof McpToolError) {
        return err.toResponse();
      }
      return wrapError(err).toResponse();
    }
  };
}

/**
 * Get all tool definitions for MCP registration
 */
export function getToolDefinitions() {
  return allToolDefinitions;
}

/**
 * MCP Server factory (for use with @modelcontextprotocol/sdk)
 *
 * Example usage with MCP SDK:
 * ```typescript
 * import { Server } from '@modelcontextprotocol/sdk/server/index.js';
 * import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
 * import { PolymarketSDK } from '@catalyst-team/poly-sdk';
 * import { registerMcpTools } from '@catalyst-team/poly-mcp';
 *
 * const server = new Server(
 *   { name: 'poly-mcp', version: '1.0.0' },
 *   { capabilities: { tools: {} } }
 * );
 *
 * const sdk = new PolymarketSDK();
 * registerMcpTools(server, sdk);
 *
 * const transport = new StdioServerTransport();
 * await server.connect(transport);
 * ```
 */
export function registerMcpTools(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server: any,
  sdk: PolymarketSDK
): void {
  const handler = createMcpHandler(sdk);

  // Register list tools handler
  server.setRequestHandler(
    { method: 'tools/list' },
    async () => ({ tools: allToolDefinitions })
  );

  // Register call tool handler
  server.setRequestHandler(
    { method: 'tools/call' },
    async (request: { params: { name: string; arguments?: Record<string, unknown> } }) => {
      const { name, arguments: args = {} } = request.params;
      const result = await handler(name, args);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
