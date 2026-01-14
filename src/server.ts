#!/usr/bin/env node
/**
 * Polymarket MCP Server
 *
 * A standalone MCP server that exposes Polymarket functionality to AI agents.
 *
 * Usage:
 *   npx @catalyst-team/poly-mcp
 *   # or
 *   node dist/server.js
 *
 * Configuration via environment variables:
 *
 * Single wallet (backward compatible):
 *   - POLY_PRIVATE_KEY: Wallet private key
 *
 * Multiple wallets (recommended):
 *   - POLY_WALLETS: JSON object with named wallets
 *     Example: POLY_WALLETS='{"main":"0x...","trading":"0x...","arb":"0x..."}'
 *
 * Indexed wallets:
 *   - POLY_PRIVATE_KEY_1, POLY_PRIVATE_KEY_2, etc.
 *   - POLY_WALLET_NAME_1, POLY_WALLET_NAME_2, etc. (optional names)
 *
 * Other options:
 *   - POLY_CHAIN_ID: Chain ID (137 for mainnet, 80002 for testnet, default: 137)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { PolymarketSDK } from '@catalyst-team/poly-sdk';
import { allToolDefinitions } from './tools/index.js';
import { createMcpHandler } from './index.js';
import { getWalletManager } from './wallet-manager.js';

// Server metadata
const SERVER_NAME = 'polymarket-mcp';
const SERVER_VERSION = '0.1.0';

/**
 * Create and configure the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Initialize wallet manager (supports multiple wallets)
  const walletManager = getWalletManager();

  // Get active wallet's private key for SDK initialization
  const activeWallet = walletManager.getActiveWallet();
  const privateKey = activeWallet?.wallet.privateKey;

  // Initialize SDK with environment configuration
  // API credentials are derived automatically from private key via createOrDeriveApiKey()
  const sdk = new PolymarketSDK({
    chainId: process.env.POLY_CHAIN_ID ? parseInt(process.env.POLY_CHAIN_ID) : 137,
    privateKey,
  });

  // Log wallet status
  if (walletManager.hasWallets()) {
    const wallets = walletManager.listWallets();
    console.error(`Trading enabled with ${wallets.length} wallet(s):`);
    for (const w of wallets) {
      const marker = w.isActive ? '* ' : '  ';
      console.error(`${marker}${w.name}: ${w.address}`);
    }
  } else {
    console.error('Trading disabled (set POLY_PRIVATE_KEY or POLY_WALLETS to enable)');
  }

  // Create the tool handler
  const handler = createMcpHandler(sdk);

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: allToolDefinitions.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      const result = await handler(name, args as Record<string, unknown>);

      // Check if result is an error response
      if (result && typeof result === 'object' && 'error' in result) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: {
                  code: 'INTERNAL_ERROR',
                  message: errorMessage,
                },
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  // Handle shutdown gracefully
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });

  // Connect and run
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);
  console.error(`Available tools: ${allToolDefinitions.length}`);
}

// Run the server
main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
