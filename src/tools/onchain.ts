/**
 * Onchain Tools - MCP tools for CTF (Conditional Token Framework) operations
 *
 * These tools use the OnchainService from poly-sdk:
 * - Split: USDC -> YES + NO tokens
 * - Merge: YES + NO tokens -> USDC
 * - Redeem: Winning tokens -> USDC (after market resolution)
 * - Position balance queries
 * - Market resolution status
 * - Gas estimation
 *
 * ## Token ID Auto-Discovery
 *
 * Polymarket CLOB markets use custom ERC-1155 token IDs that differ from
 * standard CTF calculated positionIds. These tools auto-discover tokenIds
 * from the CLOB API when not explicitly provided.
 *
 * ## Dynamic Outcome Names
 *
 * Markets can have different outcome names:
 * - Yes/No (standard)
 * - Up/Down (crypto short-term)
 * - Team A/Team B (sports)
 *
 * The tools handle all outcome types dynamically.
 */

import {
  OnchainService,
  type TokenIds,
  type ResolvedMarketTokens,
} from '@catalyst-team/poly-sdk';
import type { ToolDefinition } from '../types.js';
import { wrapError, McpToolError, ErrorCode, validateConditionId } from '../errors.js';
import { getWalletManager } from '../wallet-manager.js';
import { getMarketService } from '../sdk-instance.js';

/**
 * Resolved market tokens with tokenIds for CTF operations
 */
interface ResolvedTokens {
  tokenIds: TokenIds;
  primaryOutcome: string;
  secondaryOutcome: string;
}

/**
 * Auto-discover tokenIds using poly-sdk's MarketService
 *
 * Uses MarketService.resolveMarketTokens() which fetches actual tokenIds from CLOB API.
 *
 * @param conditionId - Market condition ID
 * @returns Resolved tokens with IDs and outcome names, or null if not found
 */
async function resolveMarketTokens(conditionId: string): Promise<ResolvedTokens | null> {
  try {
    const marketService = getMarketService();
    const resolved = await marketService.resolveMarketTokens(conditionId);

    if (!resolved) {
      return null;
    }

    // Convert to CTFClient's TokenIds format (legacy naming)
    return {
      tokenIds: {
        yesTokenId: resolved.primaryTokenId,
        noTokenId: resolved.secondaryTokenId,
      },
      primaryOutcome: resolved.primaryOutcome,
      secondaryOutcome: resolved.secondaryOutcome,
    };
  } catch {
    return null;
  }
}

// ===== Tool Definitions =====

export const onchainToolDefinitions: ToolDefinition[] = [
  {
    name: 'ctf_split',
    description: 'Split USDC into YES + NO tokens for a market. Requires USDC.e (bridged USDC) balance.',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID (0x...)',
        },
        amount: {
          type: 'string',
          description: 'Amount of USDC to split (e.g., "100" for 100 USDC)',
        },
      },
      required: ['conditionId', 'amount'],
    },
  },
  {
    name: 'ctf_merge',
    description: `Merge primary + secondary tokens back to USDC.

TokenIds are auto-discovered from CLOB API if not provided.
Works with any outcome types (Yes/No, Up/Down, Team A/B, etc.).`,
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID (0x...)',
        },
        amount: {
          type: 'string',
          description: 'Number of token pairs to merge (e.g., "100" for 100 pairs)',
        },
        tokenIds: {
          type: 'object',
          description: 'Optional: Explicit token IDs {yesTokenId: string, noTokenId: string}. Auto-discovered if not provided.',
        },
      },
      required: ['conditionId', 'amount'],
    },
  },
  {
    name: 'ctf_redeem',
    description: `Redeem winning tokens after market resolution.

TokenIds are auto-discovered from CLOB API if not provided.
Outcome names are dynamic (Yes/No, Up/Down, Team A/B, etc.).`,
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID (0x...)',
        },
        tokenIds: {
          type: 'object',
          description: 'Optional: Explicit token IDs {yesTokenId: string, noTokenId: string}. Auto-discovered if not provided.',
        },
        outcome: {
          type: 'string',
          description: 'Optional: Specific outcome to redeem (e.g., "Yes", "Up", "Team A"). Uses market\'s actual outcome names.',
        },
      },
      required: ['conditionId'],
    },
  },
  {
    name: 'get_position_balance',
    description: `Get token balances for a market position.

TokenIds are auto-discovered from CLOB API if not provided.
Returns balances for both primary and secondary outcome tokens.`,
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID (0x...)',
        },
        tokenIds: {
          type: 'object',
          description: 'Optional: Explicit token IDs {yesTokenId: string, noTokenId: string}. Auto-discovered if not provided.',
        },
      },
      required: ['conditionId'],
    },
  },
  {
    name: 'get_market_resolution',
    description: 'Check if a market is resolved and get payout information.',
    inputSchema: {
      type: 'object',
      properties: {
        conditionId: {
          type: 'string',
          description: 'Market condition ID (0x...)',
        },
      },
      required: ['conditionId'],
    },
  },
  {
    name: 'check_ctf_ready',
    description: 'Check if wallet is ready for CTF trading (balances, approvals, gas).',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'string',
          description: 'Amount of USDC to check readiness for (e.g., "100")',
        },
      },
      required: ['amount'],
    },
  },
  {
    name: 'estimate_gas',
    description: 'Estimate gas cost for a CTF operation (split or merge).',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['split', 'merge'],
          description: 'Type of operation to estimate',
        },
        conditionId: {
          type: 'string',
          description: 'Market condition ID (0x...)',
        },
        amount: {
          type: 'string',
          description: 'Amount for the operation',
        },
      },
      required: ['operation', 'conditionId', 'amount'],
    },
  },
  {
    name: 'get_gas_price',
    description: 'Get current gas price on Polygon network.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ===== Input Types =====

interface CtfSplitInput {
  conditionId: string;
  amount: string;
}

interface CtfMergeInput {
  conditionId: string;
  amount: string;
  tokenIds?: TokenIds;
}

interface CtfRedeemInput {
  conditionId: string;
  tokenIds?: TokenIds;
  /** Dynamic outcome name - can be Yes/No, Up/Down, Team A/B, etc. */
  outcome?: string;
}

/**
 * Convert user outcome to SDK format (uppercase)
 *
 * The SDK expects uppercase outcome names.
 * This function normalizes any outcome name to uppercase.
 */
function toSdkOutcome(outcome?: string): string | undefined {
  if (!outcome) return undefined;
  return outcome.toUpperCase();
}

interface GetPositionBalanceInput {
  conditionId: string;
  tokenIds?: TokenIds;
}

interface GetMarketResolutionInput {
  conditionId: string;
}

interface CheckCtfReadyInput {
  amount: string;
}

interface EstimateGasInput {
  operation: 'split' | 'merge';
  conditionId: string;
  amount: string;
}

// ===== Helper: Get OnchainService =====

// Cache OnchainService instances by wallet address to avoid re-creating
const onchainServiceCache = new Map<string, OnchainService>();

function getOnchainService(): OnchainService {
  const walletManager = getWalletManager();
  const activeWallet = walletManager.getActiveWallet();

  if (!activeWallet) {
    throw new McpToolError(
      ErrorCode.AUTH_REQUIRED,
      'No wallet configured. Set POLY_PRIVATE_KEY or POLY_WALLETS environment variable.'
    );
  }

  // Check cache first
  const cacheKey = activeWallet.address.toLowerCase();
  const cached = onchainServiceCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Create new service for active wallet
  const service = new OnchainService({
    privateKey: activeWallet.wallet.privateKey,
    rpcUrl: process.env.POLY_RPC_URL || 'https://polygon-rpc.com',
  });

  onchainServiceCache.set(cacheKey, service);
  return service;
}

// ===== Handler Functions =====

/**
 * Split USDC into YES + NO tokens
 */
export async function handleCtfSplit(input: CtfSplitInput) {
  validateConditionId(input.conditionId);

  if (!input.amount || parseFloat(input.amount) <= 0) {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      'Amount must be a positive number'
    );
  }

  try {
    const service = getOnchainService();

    // Check if can split
    const canSplitCheck = await service.canSplit(input.amount);
    if (!canSplitCheck.canSplit) {
      return {
        success: false,
        error: canSplitCheck.reason,
        wallet: service.getAddress(),
        conditionId: input.conditionId,
        amount: input.amount,
      };
    }

    // Execute split
    const result = await service.split(input.conditionId, input.amount);

    return {
      success: result.success,
      wallet: service.getAddress(),
      conditionId: input.conditionId,
      amount: input.amount,
      yesTokens: result.yesTokens,
      noTokens: result.noTokens,
      txHash: result.txHash,
      gasUsed: result.gasUsed,
      explorerUrl: `https://polygonscan.com/tx/${result.txHash}`,
      message: `Split ${input.amount} USDC into ${result.yesTokens} YES + ${result.noTokens} NO tokens`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Merge primary + secondary tokens back to USDC
 *
 * Automatically discovers tokenIds from CLOB API if not provided.
 */
export async function handleCtfMerge(input: CtfMergeInput) {
  validateConditionId(input.conditionId);

  if (!input.amount || parseFloat(input.amount) <= 0) {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      'Amount must be a positive number'
    );
  }

  try {
    const service = getOnchainService();

    // Auto-discover tokenIds if not provided
    let tokenIds = input.tokenIds;
    let resolvedTokens: ResolvedTokens | null = null;
    let tokenIdsSource: 'provided' | 'auto-discovered' | 'calculated' = 'provided';

    if (!tokenIds) {
      resolvedTokens = await resolveMarketTokens(input.conditionId);
      if (resolvedTokens) {
        tokenIds = resolvedTokens.tokenIds;
        tokenIdsSource = 'auto-discovered';
      } else {
        tokenIdsSource = 'calculated';
      }
    }

    // Check if can merge
    let canMergeCheck;
    if (tokenIds) {
      canMergeCheck = await service.canMergeWithTokenIds(
        input.conditionId,
        tokenIds,
        input.amount
      );
    } else {
      canMergeCheck = await service.canMerge(input.conditionId, input.amount);
    }

    if (!canMergeCheck.canMerge) {
      // Replace hardcoded YES/NO in error message with dynamic outcome names
      let errorMessage = canMergeCheck.reason || 'Insufficient tokens';
      if (resolvedTokens) {
        errorMessage = errorMessage
          .replace(/YES tokens/g, `${resolvedTokens.primaryOutcome} tokens`)
          .replace(/NO tokens/g, `${resolvedTokens.secondaryOutcome} tokens`);
      }

      return {
        success: false,
        error: errorMessage,
        wallet: service.getAddress(),
        conditionId: input.conditionId,
        amount: input.amount,
        tokenIdsSource,
        outcomeNames: resolvedTokens
          ? { primary: resolvedTokens.primaryOutcome, secondary: resolvedTokens.secondaryOutcome }
          : undefined,
        hint: tokenIdsSource === 'calculated'
          ? 'TokenIds could not be auto-discovered. This market may require explicit tokenIds.'
          : undefined,
      };
    }

    // Execute merge
    let result;
    if (tokenIds) {
      result = await service.mergeByTokenIds(
        input.conditionId,
        tokenIds,
        input.amount
      );
    } else {
      result = await service.merge(input.conditionId, input.amount);
    }

    // Use dynamic outcome names if available
    const primaryName = resolvedTokens?.primaryOutcome ?? 'YES';
    const secondaryName = resolvedTokens?.secondaryOutcome ?? 'NO';

    return {
      success: result.success,
      wallet: service.getAddress(),
      conditionId: input.conditionId,
      amount: input.amount,
      usdcReceived: result.usdcReceived,
      txHash: result.txHash,
      gasUsed: result.gasUsed,
      explorerUrl: `https://polygonscan.com/tx/${result.txHash}`,
      tokenIdsSource,
      outcomeNames: resolvedTokens
        ? { primary: resolvedTokens.primaryOutcome, secondary: resolvedTokens.secondaryOutcome }
        : undefined,
      message: `Merged ${input.amount} ${primaryName} + ${input.amount} ${secondaryName} tokens into ${result.usdcReceived} USDC`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Redeem winning tokens after market resolution
 *
 * Automatically discovers tokenIds from CLOB API if not provided.
 */
export async function handleCtfRedeem(input: CtfRedeemInput) {
  validateConditionId(input.conditionId);

  try {
    const service = getOnchainService();

    // Check market resolution first
    const resolution = await service.getMarketResolution(input.conditionId);
    if (!resolution.isResolved) {
      return {
        success: false,
        error: 'Market is not yet resolved. Cannot redeem tokens.',
        wallet: service.getAddress(),
        conditionId: input.conditionId,
        isResolved: false,
      };
    }

    // Auto-discover tokenIds if not provided
    let tokenIds = input.tokenIds;
    let resolvedTokens: ResolvedTokens | null = null;
    let tokenIdsSource: 'provided' | 'auto-discovered' | 'calculated' = 'provided';

    if (!tokenIds) {
      resolvedTokens = await resolveMarketTokens(input.conditionId);
      if (resolvedTokens) {
        tokenIds = resolvedTokens.tokenIds;
        tokenIdsSource = 'auto-discovered';
      } else {
        tokenIdsSource = 'calculated';
      }
    }

    // Execute redeem - convert outcome format for SDK
    const sdkOutcome = toSdkOutcome(input.outcome);
    let result;
    if (tokenIds) {
      result = await service.redeemByTokenIds(
        input.conditionId,
        tokenIds,
        sdkOutcome
      );
    } else {
      // Fallback to calculated positionIds (may fail for CLOB markets)
      result = await service.redeem(input.conditionId, sdkOutcome);
    }

    // Use dynamic outcome names if available
    const primaryName = resolvedTokens?.primaryOutcome ?? 'YES';
    const secondaryName = resolvedTokens?.secondaryOutcome ?? 'NO';
    const winningOutcomeName = resolution.winningOutcome === 'YES'
      ? primaryName
      : resolution.winningOutcome === 'NO'
        ? secondaryName
        : resolution.winningOutcome;

    return {
      success: result.success,
      wallet: service.getAddress(),
      conditionId: input.conditionId,
      winningOutcome: winningOutcomeName,
      tokensRedeemed: result.tokensRedeemed,
      usdcReceived: result.usdcReceived,
      txHash: result.txHash,
      gasUsed: result.gasUsed,
      explorerUrl: `https://polygonscan.com/tx/${result.txHash}`,
      tokenIdsSource,
      outcomeNames: resolvedTokens
        ? { primary: resolvedTokens.primaryOutcome, secondary: resolvedTokens.secondaryOutcome }
        : undefined,
      message: `Redeemed ${result.tokensRedeemed} winning ${winningOutcomeName} tokens for ${result.usdcReceived} USDC`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get token balances for a market position
 *
 * Automatically discovers tokenIds from CLOB API if not provided.
 */
export async function handleGetPositionBalance(input: GetPositionBalanceInput) {
  validateConditionId(input.conditionId);

  try {
    const service = getOnchainService();

    // Auto-discover tokenIds if not provided
    let tokenIds = input.tokenIds;
    let resolvedTokens: ResolvedTokens | null = null;
    let tokenIdsSource: 'provided' | 'auto-discovered' | 'calculated' = 'provided';

    if (!tokenIds) {
      resolvedTokens = await resolveMarketTokens(input.conditionId);
      if (resolvedTokens) {
        tokenIds = resolvedTokens.tokenIds;
        tokenIdsSource = 'auto-discovered';
      } else {
        tokenIdsSource = 'calculated';
      }
    }

    let balance;
    if (tokenIds) {
      balance = await service.getPositionBalanceByTokenIds(
        input.conditionId,
        tokenIds
      );
    } else {
      balance = await service.getPositionBalance(input.conditionId);
    }

    // Use dynamic outcome names if available
    const primaryName = resolvedTokens?.primaryOutcome ?? 'yes';
    const secondaryName = resolvedTokens?.secondaryOutcome ?? 'no';

    return {
      wallet: service.getAddress(),
      conditionId: input.conditionId,
      balances: {
        [primaryName.toLowerCase()]: balance.yesBalance,
        [secondaryName.toLowerCase()]: balance.noBalance,
      },
      positionIds: {
        [primaryName.toLowerCase()]: balance.yesPositionId,
        [secondaryName.toLowerCase()]: balance.noPositionId,
      },
      outcomeNames: resolvedTokens
        ? { primary: resolvedTokens.primaryOutcome, secondary: resolvedTokens.secondaryOutcome }
        : undefined,
      tokenIdsSource,
      hasPosition: parseFloat(balance.yesBalance) > 0 || parseFloat(balance.noBalance) > 0,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Check if market is resolved
 */
export async function handleGetMarketResolution(input: GetMarketResolutionInput) {
  validateConditionId(input.conditionId);

  try {
    const service = getOnchainService();
    const resolution = await service.getMarketResolution(input.conditionId);

    return {
      conditionId: input.conditionId,
      isResolved: resolution.isResolved,
      winningOutcome: resolution.winningOutcome,
      payoutNumerators: resolution.payoutNumerators,
      payoutDenominator: resolution.payoutDenominator,
      message: resolution.isResolved
        ? `Market resolved: ${resolution.winningOutcome} wins`
        : 'Market is not yet resolved',
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Check if wallet is ready for CTF trading
 */
export async function handleCheckCtfReady(input: CheckCtfReadyInput) {
  if (!input.amount || parseFloat(input.amount) <= 0) {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      'Amount must be a positive number'
    );
  }

  try {
    const service = getOnchainService();
    const status = await service.checkReadyForCTF(input.amount);

    return {
      wallet: service.getAddress(),
      ready: status.ready,
      balances: {
        usdcE: status.usdcEBalance,
        nativeUsdc: status.nativeUsdcBalance,
        matic: status.maticBalance,
      },
      tradingReady: status.tradingReady,
      issues: status.issues,
      suggestion: status.suggestion,
      message: status.ready
        ? `Ready to trade with ${input.amount} USDC`
        : `Not ready: ${status.issues.join(', ')}`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Estimate gas for CTF operation
 */
export async function handleEstimateGas(input: EstimateGasInput) {
  validateConditionId(input.conditionId);

  if (!input.amount || parseFloat(input.amount) <= 0) {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      'Amount must be a positive number'
    );
  }

  if (!['split', 'merge'].includes(input.operation)) {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      'Operation must be "split" or "merge"'
    );
  }

  try {
    const service = getOnchainService();

    let estimate;
    if (input.operation === 'split') {
      estimate = await service.estimateSplitGas(input.conditionId, input.amount);
    } else {
      estimate = await service.estimateMergeGas(input.conditionId, input.amount);
    }

    return {
      operation: input.operation,
      conditionId: input.conditionId,
      amount: input.amount,
      gas: {
        gasUnits: estimate.gasUnits,
        gasPriceGwei: estimate.gasPriceGwei,
        costMatic: estimate.costMatic,
        costUsdc: estimate.costUsdc,
        maticPrice: estimate.maticPrice,
      },
      message: `Estimated gas for ${input.operation}: ${estimate.costMatic} MATIC (~$${estimate.costUsdc})`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get current gas price
 */
export async function handleGetGasPrice() {
  try {
    const service = getOnchainService();
    const gasPrice = await service.getGasPrice();

    return {
      gwei: gasPrice.gwei,
      wei: gasPrice.wei,
      message: `Current gas price: ${gasPrice.gwei} Gwei`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}
