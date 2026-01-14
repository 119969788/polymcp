/**
 * Wallet Tools - MCP tools for deposits, swaps, and authorization management
 *
 * These tools use SDK services:
 * - BridgeClient for deposit addresses and supported assets
 * - SwapService for DEX swaps on Polygon (QuickSwap V3)
 * - AuthorizationService for allowance checks and approvals
 * - depositUsdc() for executing USDC deposits
 * - swapAndDeposit() for swapping any token to USDC and depositing
 *
 * Multi-wallet support:
 * - Most wallet operations accept an optional `wallet` parameter
 * - Use wallet name or address to specify which wallet to use
 * - If not specified, the active wallet is used
 */

import { ethers } from 'ethers';
import type { PolymarketSDK } from '@catalyst-team/poly-sdk';
import {
  BridgeClient,
  AuthorizationService,
  depositUsdc,
  swapAndDeposit,
  SwapService,
  getSupportedDepositTokens,
} from '@catalyst-team/poly-sdk';
import type { ToolDefinition } from '../types.js';
import { wrapError, McpToolError, ErrorCode } from '../errors.js';
import { getWalletManager } from '../wallet-manager.js';

// Tool definitions
export const walletToolDefinitions: ToolDefinition[] = [
  // ===== Wallet Management Tools =====
  {
    name: 'list_wallets',
    description: 'List all configured wallets. Shows wallet names, addresses, and which one is currently active.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_active_wallet',
    description: 'Get the currently active wallet that will be used for trading operations.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'set_active_wallet',
    description: 'Set the active wallet by name or address. This wallet will be used for subsequent trading operations.',
    inputSchema: {
      type: 'object',
      properties: {
        wallet: {
          type: 'string',
          description: 'Wallet name or address to set as active',
        },
      },
      required: ['wallet'],
    },
  },
  // ===== Deposit and Asset Tools =====
  {
    name: 'get_supported_deposit_assets',
    description: 'Get all supported assets and chains for deposits to Polymarket',
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'Filter by chain ID (optional)',
        },
      },
    },
  },
  {
    name: 'get_deposit_addresses',
    description: 'Get deposit addresses (EVM, Solana, Bitcoin) for the configured wallet',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'deposit_usdc',
    description: 'Deposit USDC to Polymarket. Transfers USDC from your wallet to Polymarket via the Bridge.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Amount to deposit in USDC (minimum $2)',
        },
        token: {
          type: 'string',
          enum: ['NATIVE_USDC', 'USDC_E'],
          description: 'Which USDC token to deposit (default: NATIVE_USDC)',
        },
      },
      required: ['amount'],
    },
  },
  {
    name: 'check_allowances',
    description: 'Check all ERC20 and ERC1155 allowances required for trading',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'approve_trading',
    description: 'Set up all required ERC20 and ERC1155 approvals for trading on Polymarket',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'swap',
    description: 'Swap between tokens on Polygon using QuickSwap V3. Supports MATIC, WETH, USDC, USDC.e, USDT, DAI.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenIn: {
          type: 'string',
          description: 'Token to swap from (e.g., MATIC, WETH, USDT, DAI, USDC, USDC_E)',
        },
        tokenOut: {
          type: 'string',
          description: 'Token to swap to (e.g., USDC, USDC_E, WETH)',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap in token units',
        },
        slippage: {
          type: 'number',
          description: 'Slippage tolerance in percent (default: 0.5)',
        },
      },
      required: ['tokenIn', 'tokenOut', 'amount'],
    },
  },
  {
    name: 'swap_and_deposit',
    description: 'Swap any supported Polygon token to USDC and deposit to Polymarket. Supports MATIC, WETH, USDT, DAI, USDC, USDC.e.',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'Token to deposit (e.g., MATIC, WETH, USDT, DAI, USDC)',
        },
        amount: {
          type: 'string',
          description: 'Amount to deposit in token units',
        },
        slippage: {
          type: 'number',
          description: 'Slippage tolerance for swap in percent (default: 0.5)',
        },
      },
      required: ['token', 'amount'],
    },
  },
  {
    name: 'get_token_balances',
    description: 'Get balances for all supported tokens on Polygon for the configured wallet (requires private key)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_wallet_balances',
    description: 'Get Polygon token balances for any wallet address (MATIC, USDC, USDC.e, USDT, DAI, WETH). No private key required.',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Wallet address to check (0x...)',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'get_swap_quote',
    description: 'Get a swap quote to check if a route is available and estimate output amount. No private key required. Uses QuickSwap V3 Quoter contract.',
    inputSchema: {
      type: 'object',
      properties: {
        tokenIn: {
          type: 'string',
          description: 'Token to swap from (e.g., MATIC, WETH, USDT, DAI, USDC, USDC_E)',
        },
        tokenOut: {
          type: 'string',
          description: 'Token to swap to (e.g., USDC, USDC_E, WETH)',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap in token units',
        },
      },
      required: ['tokenIn', 'tokenOut', 'amount'],
    },
  },
  {
    name: 'get_available_pools',
    description: 'Get all available liquidity pools on QuickSwap V3. Shows which token pairs can be swapped directly.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Input/Output types
interface GetSupportedAssetsInput {
  chainId?: number;
}

interface DepositUsdcInput {
  amount: number;
  token?: 'NATIVE_USDC' | 'USDC_E';
}

// Default Polygon RPC for wallet operations
const POLYGON_RPC = 'https://polygon-rpc.com';

/**
 * Helper to get signer from SDK
 * Ensures the signer is connected to a Polygon provider
 */
function getSignerFromSdk(sdk: PolymarketSDK): ethers.Wallet {
  // Use new SDK API: tradingService.getWallet()
  const wallet = sdk.tradingService.getWallet();

  // Check if wallet is a dummy key (indicates no real private key was provided)
  if (wallet.address === '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf') {
    throw new McpToolError(
      ErrorCode.AUTH_REQUIRED,
      'Wallet not configured. Set POLY_PRIVATE_KEY to use wallet features.'
    );
  }

  // Ensure signer is connected to a provider
  if (!wallet.provider) {
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
    return wallet.connect(provider);
  }

  return wallet;
}

// ===== Wallet Management Handlers =====

/**
 * List all configured wallets
 */
export async function handleListWallets() {
  const walletManager = getWalletManager();
  const wallets = walletManager.listWallets();

  if (wallets.length === 0) {
    return {
      wallets: [],
      count: 0,
      message: 'No wallets configured. Set POLY_PRIVATE_KEY or POLY_WALLETS environment variable.',
    };
  }

  return {
    wallets: wallets.map((w) => ({
      name: w.name,
      address: w.address,
      isActive: w.isActive,
    })),
    count: wallets.length,
    activeWallet: wallets.find((w) => w.isActive)?.name || null,
  };
}

/**
 * Get the active wallet
 */
export async function handleGetActiveWallet() {
  const walletManager = getWalletManager();
  const activeWallet = walletManager.getActiveWallet();

  if (!activeWallet) {
    throw new McpToolError(
      ErrorCode.AUTH_REQUIRED,
      'No active wallet. Set POLY_PRIVATE_KEY or POLY_WALLETS environment variable.'
    );
  }

  return {
    name: activeWallet.name,
    address: activeWallet.address,
  };
}

/**
 * Set the active wallet
 */
export async function handleSetActiveWallet(input: { wallet: string }) {
  const walletManager = getWalletManager();

  if (!walletManager.hasWallets()) {
    throw new McpToolError(
      ErrorCode.AUTH_REQUIRED,
      'No wallets configured. Set POLY_PRIVATE_KEY or POLY_WALLETS environment variable.'
    );
  }

  const success = walletManager.setActiveWallet(input.wallet);

  if (!success) {
    const available = walletManager.listWallets().map((w) => `${w.name} (${w.address})`);
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      `Wallet "${input.wallet}" not found. Available wallets: ${available.join(', ')}`
    );
  }

  const activeWallet = walletManager.getActiveWallet();
  return {
    success: true,
    activeWallet: {
      name: activeWallet!.name,
      address: activeWallet!.address,
    },
    message: `Active wallet set to "${activeWallet!.name}"`,
  };
}

/**
 * Helper to get signer from WalletManager by name/address
 * Returns a wallet connected to Polygon provider
 */
export function getSignerFromWalletManager(walletNameOrAddress?: string): ethers.Wallet {
  const walletManager = getWalletManager();
  const walletInfo = walletManager.getWallet(walletNameOrAddress);

  if (!walletInfo) {
    if (walletNameOrAddress) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        `Wallet "${walletNameOrAddress}" not found.`
      );
    }
    throw new McpToolError(
      ErrorCode.AUTH_REQUIRED,
      'No wallet configured. Set POLY_PRIVATE_KEY or POLY_WALLETS environment variable.'
    );
  }

  // Ensure signer is connected to a provider
  if (!walletInfo.wallet.provider) {
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
    return walletInfo.wallet.connect(provider);
  }

  return walletInfo.wallet;
}

// ===== Deposit and Asset Handlers =====

/**
 * Get supported deposit assets
 */
export async function handleGetSupportedAssets(
  _sdk: PolymarketSDK,
  input: GetSupportedAssetsInput
) {
  try {
    const bridge = new BridgeClient();
    const assets = await bridge.getSupportedAssets();

    // Filter by chainId if provided
    const filtered = input.chainId
      ? assets.filter((a) => a.chainId === input.chainId)
      : assets;

    // Get unique chains
    const chainSet = new Set<string>();
    for (const asset of filtered) {
      chainSet.add(asset.chainName);
    }

    return {
      assets: filtered.map((a) => ({
        chainId: a.chainId,
        chainName: a.chainName,
        tokenSymbol: a.tokenSymbol,
        tokenName: a.tokenName,
        tokenAddress: a.tokenAddress,
        decimals: a.decimals,
        minDeposit: a.minDeposit,
        minDepositUsd: a.minDepositUsd,
      })),
      summary: {
        totalChains: chainSet.size,
        totalAssets: filtered.length,
        chains: Array.from(chainSet),
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get deposit addresses for the wallet
 */
export async function handleGetDepositAddresses(_sdk: PolymarketSDK) {
  const signer = getSignerFromWalletManager();
  const walletAddress = signer.address;

  try {
    const bridge = new BridgeClient();
    const result = await bridge.createDepositAddresses(walletAddress);

    const evmChains = ['Ethereum', 'Polygon', 'Arbitrum', 'Base', 'Optimism'];

    return {
      wallet: walletAddress,
      addresses: {
        evm: result.address.evm,
        solana: result.address.svm,
        bitcoin: result.address.btc,
      },
      evmChains,
      instructions: `Send assets to these addresses to deposit to your Polymarket account.

EVM Chains (Ethereum, Polygon, Arbitrum, Base, Optimism):
  ${result.address.evm}

Solana:
  ${result.address.svm}

Bitcoin:
  ${result.address.btc}

Assets will be automatically converted to USDC.e on Polygon.`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Deposit USDC to Polymarket
 */
export async function handleDepositUsdc(
  _sdk: PolymarketSDK,
  input: DepositUsdcInput
) {
  const signer = getSignerFromWalletManager();

  try {
    const result = await depositUsdc(signer, input.amount, {
      token: input.token || 'NATIVE_USDC',
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        wallet: signer.address,
        amount: input.amount,
      };
    }

    return {
      success: true,
      wallet: signer.address,
      amount: result.amount,
      txHash: result.txHash,
      depositAddress: result.depositAddress,
      message: `Successfully deposited $${result.amount} USDC. The bridge will automatically convert it to USDC.e on Polygon (typically 1-5 minutes).`,
      explorerUrl: `https://polygonscan.com/tx/${result.txHash}`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Check all allowances required for trading
 */
export async function handleCheckAllowances(_sdk: PolymarketSDK) {
  const signer = getSignerFromWalletManager();

  try {
    const authService = new AuthorizationService(signer);
    const result = await authService.checkAllowances();

    return {
      wallet: result.wallet,
      erc20: {
        usdc: {
          balance: result.usdcBalance,
          allowances: result.erc20Allowances,
        },
      },
      erc1155: {
        conditionalTokens: {
          approvals: result.erc1155Approvals,
        },
      },
      tradingReady: result.tradingReady,
      issues: result.issues,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Set up all required approvals for trading
 */
export async function handleApproveTrading(_sdk: PolymarketSDK) {
  const signer = getSignerFromWalletManager();

  try {
    const authService = new AuthorizationService(signer);
    const result = await authService.approveAll();

    return {
      wallet: result.wallet,
      erc20Approvals: result.erc20Approvals,
      erc1155Approvals: result.erc1155Approvals,
      allApproved: result.allApproved,
      summary: result.summary,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

// Input types for new tools
interface SwapInput {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippage?: number;
}

interface SwapAndDepositInput {
  token: string;
  amount: string;
  slippage?: number;
}

/**
 * Swap between tokens on Polygon using QuickSwap V3
 */
export async function handleSwap(_sdk: PolymarketSDK, input: SwapInput) {
  const signer = getSignerFromWalletManager();

  try {
    const swapService = new SwapService(signer);

    // Check balance first
    const balance = await swapService.getBalance(input.tokenIn);
    if (parseFloat(balance) < parseFloat(input.amount)) {
      return {
        success: false,
        error: `Insufficient ${input.tokenIn} balance. Have: ${balance}, Need: ${input.amount}`,
        wallet: signer.address,
      };
    }

    // Execute swap
    const result = await swapService.swap(input.tokenIn, input.tokenOut, input.amount, {
      slippage: input.slippage || 0.5,
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Swap failed',
        wallet: signer.address,
        txHash: result.transactionHash,
      };
    }

    return {
      success: true,
      wallet: signer.address,
      tokenIn: result.tokenIn,
      tokenOut: result.tokenOut,
      amountIn: result.amountIn,
      amountOut: result.amountOut,
      txHash: result.transactionHash,
      gasUsed: result.gasUsed,
      explorerUrl: `https://polygonscan.com/tx/${result.transactionHash}`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Swap any token to USDC and deposit to Polymarket
 */
export async function handleSwapAndDeposit(_sdk: PolymarketSDK, input: SwapAndDepositInput) {
  const signer = getSignerFromWalletManager();

  try {
    const result = await swapAndDeposit(signer, input.token, input.amount, {
      slippage: input.slippage || 0.5,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        wallet: signer.address,
        token: input.token,
        amount: input.amount,
      };
    }

    return {
      success: true,
      wallet: signer.address,
      tokenIn: result.tokenIn,
      amountIn: result.amountIn,
      usdcAmount: result.usdcAmount,
      swapTxHash: result.swapTxHash || null,
      depositTxHash: result.depositTxHash,
      depositAddress: result.depositAddress,
      message: result.swapTxHash
        ? `Swapped ${result.amountIn} ${result.tokenIn} to ${result.usdcAmount} USDC, then deposited to Polymarket.`
        : `Deposited ${result.usdcAmount} USDC to Polymarket.`,
      explorerUrl: result.depositTxHash
        ? `https://polygonscan.com/tx/${result.depositTxHash}`
        : undefined,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get balances for all supported tokens (requires configured wallet)
 */
export async function handleGetTokenBalances(_sdk: PolymarketSDK) {
  const signer = getSignerFromWalletManager();

  try {
    const swapService = new SwapService(signer);
    const balances = await swapService.getBalances();

    // Filter out zero balances
    const nonZeroBalances = balances.filter((b) => parseFloat(b.balance) > 0);

    return {
      wallet: signer.address,
      balances: balances.map((b) => ({
        token: b.token,
        symbol: b.symbol,
        balance: b.balance,
        decimals: b.decimals,
      })),
      nonZeroBalances: nonZeroBalances.map((b) => ({
        token: b.token,
        balance: b.balance,
      })),
      supportedTokens: getSupportedDepositTokens(),
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get balances for any wallet address (no private key required)
 */
export async function handleGetWalletBalances(
  _sdk: PolymarketSDK,
  input: { address: string }
) {
  try {
    // Validate address
    if (!input.address || !input.address.startsWith('0x') || input.address.length !== 42) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        'Invalid wallet address. Must be a valid Ethereum address (0x...)'
      );
    }

    const balances = await SwapService.getWalletBalances(input.address);

    // Filter out zero balances
    const nonZeroBalances = balances.filter((b) => parseFloat(b.balance) > 0);

    // Calculate total USD value (simplified, assumes stablecoins = $1)
    let totalUsdValue = 0;
    for (const b of nonZeroBalances) {
      const amount = parseFloat(b.balance);
      if (['USDC', 'USDC_E', 'USDT', 'DAI'].includes(b.token)) {
        totalUsdValue += amount;
      }
      // For MATIC/WETH, would need price oracle for accurate value
    }

    return {
      address: input.address,
      balances: balances.map((b) => ({
        token: b.token,
        symbol: b.symbol,
        balance: b.balance,
        decimals: b.decimals,
      })),
      nonZeroBalances: nonZeroBalances.map((b) => ({
        token: b.token,
        balance: b.balance,
      })),
      summary: {
        totalTokens: nonZeroBalances.length,
        stablecoinValue: totalUsdValue.toFixed(2),
      },
      supportedTokens: getSupportedDepositTokens(),
    };
  } catch (err) {
    throw wrapError(err);
  }
}

// Input types for quote tools
interface GetSwapQuoteInput {
  tokenIn: string;
  tokenOut: string;
  amount: string;
}

/**
 * Get a swap quote (check route availability and estimate output)
 * No private key required - uses read-only provider
 */
export async function handleGetSwapQuote(
  _sdk: PolymarketSDK,
  input: GetSwapQuoteInput
) {
  try {
    // Validate inputs
    if (!input.tokenIn || !input.tokenOut || !input.amount) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        'tokenIn, tokenOut, and amount are all required'
      );
    }

    // Create a read-only SwapService with a dummy wallet
    // The getQuote method only uses the provider, not the signer
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
    const dummyWallet = ethers.Wallet.createRandom().connect(provider);
    const swapService = new SwapService(dummyWallet);

    const quote = await swapService.getQuote(input.tokenIn, input.tokenOut, input.amount);

    if (quote.possible) {
      return {
        possible: true,
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
        amountIn: quote.amountIn,
        amountOut: quote.amountOut,
        route: quote.route,
        routeDescription: quote.route.length === 2
          ? `Direct swap: ${quote.route.join(' → ')}`
          : `Multi-hop: ${quote.route.join(' → ')}`,
        message: `Can swap ${quote.amountIn} ${quote.tokenIn} for ~${quote.amountOut} ${quote.tokenOut}`,
      };
    } else {
      return {
        possible: false,
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
        amountIn: quote.amountIn,
        amountOut: null,
        route: quote.route,
        poolExists: quote.poolExists,
        reason: quote.reason,
        suggestion: quote.tokenOut === 'USDC_E'
          ? 'For USDC.e, use: MATIC → USDC via swap, then USDC → USDC.e via deposit_usdc (Bridge)'
          : 'Try swapping through USDC as an intermediate token',
      };
    }
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get all available liquidity pools on QuickSwap V3
 */
export async function handleGetAvailablePools(_sdk: PolymarketSDK) {
  try {
    // Create a read-only SwapService
    const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
    const dummyWallet = ethers.Wallet.createRandom().connect(provider);
    const swapService = new SwapService(dummyWallet);

    const pools = await swapService.getAvailablePools();

    return {
      pools: pools.map((p) => ({
        pair: `${p.tokenA}/${p.tokenB}`,
        tokenA: p.tokenA,
        tokenB: p.tokenB,
        poolAddress: p.poolAddress,
      })),
      totalPools: pools.length,
      supportedTokens: swapService.getSupportedTokens().filter(
        (t) => t !== 'NATIVE_USDC' && t !== 'WMATIC' // Exclude aliases
      ),
      note: 'These are direct swap pairs. For pairs not listed, multi-hop routing through USDC or WMATIC may be available. Use get_swap_quote to check.',
    };
  } catch (err) {
    throw wrapError(err);
  }
}
