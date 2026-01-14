/**
 * MCP Tools Index
 */

// Re-export all tool definitions and handlers
export {
  guideToolDefinitions,
  createGuideHandlers,
} from './guide.js';

export {
  traderToolDefinitions,
  handleGetTraderPositions,
  handleGetTraderTrades,
  handleGetTraderActivity,
  handleGetTraderProfile,
  handleGetLeaderboard,
  handleGetClosedPositions,
  handleGetAccountValue,
} from './trader.js';

export {
  marketToolDefinitions,
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
} from './market.js';

export {
  orderToolDefinitions,
  handleGetOrderbook,
  handleGetBestPrices,
  handleEstimateExecution,
} from './order.js';

export {
  tradeToolDefinitions,
  handlePlaceLimitOrder,
  handlePlaceMarketOrder,
  handleCancelOrder,
  handleGetMyOrders,
  handleCancelAllOrders,
  handleGetMyTrades,
  handleGetEarnings,
  handleGetCurrentRewards,
  handleCheckOrderScoring,
} from './trade.js';

export {
  walletToolDefinitions,
  // Wallet management handlers
  handleListWallets,
  handleGetActiveWallet,
  handleSetActiveWallet,
  // Deposit and swap handlers
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
} from './wallet.js';

export {
  onchainToolDefinitions,
  handleCtfSplit,
  handleCtfMerge,
  handleCtfRedeem,
  handleGetPositionBalance,
  handleGetMarketResolution,
  handleCheckCtfReady,
  handleEstimateGas,
  handleGetGasPrice,
} from './onchain.js';

export {
  walletClassificationToolDefinitions,
  handleGetTagDefinitions,
  handleAddTagDefinition,
  handleGetWalletClassification,
  handleClassifyWallet,
  handleGetWalletsByTag,
  handleRemoveWalletTag,
} from './wallet-classification.js';

export {
  insiderDetectionToolDefinitions,
  handleAnalyzeWalletInsider,
  handleScanInsiderWallets,
  handleGetInsiderCandidates,
  handleGetPoliticalMarkets,
} from './insider-detection.js';

export {
  insiderSignalsToolDefinitions,
  handleGetInsiderSignals,
  handleGetInsiderSignalCount,
  handleMarkInsiderSignalRead,
  handleMarkAllInsiderSignalsRead,
} from './insider-signals.js';

// Combined tool definitions
import { guideToolDefinitions } from './guide.js';
import { traderToolDefinitions } from './trader.js';
import { marketToolDefinitions } from './market.js';
import { orderToolDefinitions } from './order.js';
import { tradeToolDefinitions } from './trade.js';
import { walletToolDefinitions } from './wallet.js';
import { onchainToolDefinitions } from './onchain.js';
import { walletClassificationToolDefinitions } from './wallet-classification.js';
import { insiderDetectionToolDefinitions } from './insider-detection.js';
import { insiderSignalsToolDefinitions } from './insider-signals.js';

// Guide tool FIRST so AI sees it prominently
export const allToolDefinitions = [
  ...guideToolDefinitions,
  ...traderToolDefinitions,
  ...marketToolDefinitions,
  ...orderToolDefinitions,
  ...tradeToolDefinitions,
  ...walletToolDefinitions,
  ...onchainToolDefinitions,
  ...walletClassificationToolDefinitions,
  ...insiderDetectionToolDefinitions,
  ...insiderSignalsToolDefinitions,
];
