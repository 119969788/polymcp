/**
 * Wallet Classification Tools - MCP tools for system-level wallet tagging
 *
 * These tools enable Agent to classify wallets with tags based on analysis.
 * Uses WalletClassificationService from @catalyst-team/smart-money package.
 *
 * Key features:
 * - System-level classification (not user-personal like StarList)
 * - 22 predefined tags across 7 categories
 * - Agent can dynamically add new tag definitions
 * - Persistent storage in ~/.polymarket/wallet-classifications.json
 */

import type { PolymarketSDK } from '@catalyst-team/poly-sdk';
import {
  WalletClassificationService,
  type TagCategory,
  type TagDefinition,
  type WalletClassification,
  type ClassifyWalletOptions,
  type AddTagDefinitionOptions,
  type ClassificationMetrics,
} from '@catalyst-team/smart-money';
import type { ToolDefinition } from '../types.js';
import { wrapError, McpToolError, ErrorCode } from '../errors.js';

// Singleton service instance
let classificationService: WalletClassificationService | null = null;

/**
 * Get or create the classification service singleton
 */
function getService(): WalletClassificationService {
  if (!classificationService) {
    classificationService = new WalletClassificationService();
  }
  return classificationService;
}

// Tool definitions
export const walletClassificationToolDefinitions: ToolDefinition[] = [
  // ===== Tag Definition Tools =====
  {
    name: 'get_tag_definitions',
    description:
      'Get all available tag definitions for wallet classification. Returns predefined system tags and any agent-created tags. Optionally filter by category.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: [
            'trading-style',
            'market-preference',
            'scale',
            'performance',
            'activity',
            'risk-profile',
            'special',
          ],
          description:
            'Filter by tag category. Categories: trading-style (High frequency, swing trader), market-preference (Crypto focused, politics focused), scale (Whale, shark, fish), performance (Profitable, losing), activity (Active, dormant), risk-profile (High conviction, risk averse), special (Insider suspected, copy worthy)',
        },
      },
    },
  },
  {
    name: 'add_tag_definition',
    description:
      'Add a new tag definition when discovering new wallet patterns. Use this when existing tags do not adequately describe a wallet behavior pattern. Tag ID must be kebab-case.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description:
            'Unique tag ID in kebab-case (e.g., "news-sensitive", "early-mover")',
        },
        name: {
          type: 'string',
          description: 'Display name (e.g., "News Sensitive", "Early Mover")',
        },
        description: {
          type: 'string',
          description: 'Detailed description of what this tag means',
        },
        category: {
          type: 'string',
          enum: [
            'trading-style',
            'market-preference',
            'scale',
            'performance',
            'activity',
            'risk-profile',
            'special',
          ],
          description: 'Category this tag belongs to',
        },
        criteria: {
          type: 'string',
          description:
            'Criteria for assigning this tag (e.g., "Trades within 1 hour of major news events")',
        },
      },
      required: ['id', 'name', 'description', 'category'],
    },
  },
  // ===== Wallet Classification Tools =====
  {
    name: 'get_wallet_classification',
    description:
      'Get the classification for a specific wallet address, including all assigned tags, confidence score, and analysis metrics.',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Wallet address (0x...)',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'classify_wallet',
    description:
      'Assign classification tags to a wallet based on analysis. Include confidence score (0-1), analysis metrics, and optional notes.',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Wallet address (0x...)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Array of tag IDs to assign (e.g., ["whale", "crypto-focused", "consistently-profitable"])',
        },
        confidence: {
          type: 'number',
          description: 'Classification confidence (0-1, default: 0.8)',
        },
        metrics: {
          type: 'object',
          properties: {
            totalPnL: {
              type: 'number',
              description: 'Total PnL in USD',
            },
            winRate: {
              type: 'number',
              description: 'Win rate (0-1)',
            },
            primaryCategory: {
              type: 'string',
              description: 'Primary market category (crypto, politics, sports, etc.)',
            },
            tradeCount: {
              type: 'number',
              description: 'Total number of trades',
            },
            avgHoldingDays: {
              type: 'number',
              description: 'Average holding period in days',
            },
          },
          description: 'Metrics captured during analysis',
        },
        notes: {
          type: 'string',
          description:
            'Additional notes from the analysis (e.g., "3 times precise positioning before ETH ETF events")',
        },
      },
      required: ['address', 'tags'],
    },
  },
  {
    name: 'get_wallets_by_tag',
    description:
      'Get all wallets with a specific tag. Useful for finding similar wallets or building watch lists.',
    inputSchema: {
      type: 'object',
      properties: {
        tagId: {
          type: 'string',
          description: 'Tag ID to search for (e.g., "whale", "insider-suspected")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of wallets to return (default: 50)',
        },
        sortBy: {
          type: 'string',
          enum: ['confidence', 'analyzedAt'],
          description: 'Sort by field (default: confidence)',
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order (default: desc)',
        },
      },
      required: ['tagId'],
    },
  },
  {
    name: 'remove_wallet_tag',
    description: 'Remove a specific tag from a wallet classification.',
    inputSchema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Wallet address (0x...)',
        },
        tagId: {
          type: 'string',
          description: 'Tag ID to remove',
        },
      },
      required: ['address', 'tagId'],
    },
  },
];

// ===== Input Types =====

interface GetTagDefinitionsInput {
  category?: TagCategory;
}

interface AddTagDefinitionInput {
  id: string;
  name: string;
  description: string;
  category: TagCategory;
  criteria?: string;
}

interface GetWalletClassificationInput {
  address: string;
}

interface ClassifyWalletInput {
  address: string;
  tags: string[];
  confidence?: number;
  metrics?: ClassificationMetrics;
  notes?: string;
}

interface GetWalletsByTagInput {
  tagId: string;
  limit?: number;
  sortBy?: 'confidence' | 'analyzedAt';
  sortOrder?: 'asc' | 'desc';
}

interface RemoveWalletTagInput {
  address: string;
  tagId: string;
}

// ===== Tag Definition Handlers =====

/**
 * Get all tag definitions
 */
export async function handleGetTagDefinitions(
  _sdk: PolymarketSDK,
  input: GetTagDefinitionsInput
) {
  try {
    const service = getService();
    const tags = await service.getTagDefinitions(input.category);

    // Group by category for better readability
    const byCategory: Record<string, TagDefinition[]> = {};
    for (const tag of tags) {
      if (!byCategory[tag.category]) {
        byCategory[tag.category] = [];
      }
      byCategory[tag.category].push(tag);
    }

    return {
      tags: tags.map((t: TagDefinition) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        criteria: t.criteria,
        createdBy: t.createdBy,
      })),
      totalCount: tags.length,
      byCategory: Object.entries(byCategory).map(([category, categoryTags]) => ({
        category,
        count: categoryTags.length,
        tags: categoryTags.map((t) => t.id),
      })),
      categories: [
        'trading-style',
        'market-preference',
        'scale',
        'performance',
        'activity',
        'risk-profile',
        'special',
      ],
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Add a new tag definition
 */
export async function handleAddTagDefinition(
  _sdk: PolymarketSDK,
  input: AddTagDefinitionInput
) {
  try {
    // Validate tag ID format
    if (!/^[a-z0-9-]+$/.test(input.id)) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        'Tag ID must be kebab-case (lowercase letters, numbers, and hyphens only)'
      );
    }

    const service = getService();

    // Check if tag already exists
    const existing = await service.getTagDefinition(input.id);
    if (existing) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        `Tag "${input.id}" already exists`
      );
    }

    const tag = await service.addTagDefinition({
      id: input.id,
      name: input.name,
      description: input.description,
      category: input.category,
      criteria: input.criteria,
    });

    return {
      success: true,
      tag: {
        id: tag.id,
        name: tag.name,
        description: tag.description,
        category: tag.category,
        criteria: tag.criteria,
        createdBy: tag.createdBy,
        createdAt: new Date(tag.createdAt).toISOString(),
      },
      message: `Tag "${tag.name}" (${tag.id}) created successfully`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

// ===== Wallet Classification Handlers =====

/**
 * Get wallet classification
 */
export async function handleGetWalletClassification(
  _sdk: PolymarketSDK,
  input: GetWalletClassificationInput
) {
  try {
    // Validate address
    if (!input.address || !input.address.startsWith('0x')) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        'Invalid wallet address. Must start with 0x'
      );
    }

    const service = getService();
    const classification = await service.getWalletClassification(input.address);

    if (!classification) {
      return {
        found: false,
        address: input.address.toLowerCase(),
        message: 'Wallet has not been classified yet',
      };
    }

    // Get tag details for each assigned tag
    const tagDetails = await Promise.all(
      classification.tags.map(async (tagId: string) => {
        const def = await service.getTagDefinition(tagId);
        return def
          ? { id: tagId, name: def.name, category: def.category }
          : { id: tagId, name: tagId, category: 'unknown' };
      })
    );

    return {
      found: true,
      address: classification.address,
      tags: tagDetails,
      tagIds: classification.tags,
      confidence: classification.confidence,
      analyzedAt: new Date(classification.analyzedAt).toISOString(),
      analyzedBy: classification.analyzedBy,
      metrics: classification.metrics || null,
      notes: classification.notes || null,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Classify a wallet with tags
 */
export async function handleClassifyWallet(
  _sdk: PolymarketSDK,
  input: ClassifyWalletInput
) {
  try {
    // Validate address
    if (!input.address || !input.address.startsWith('0x')) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        'Invalid wallet address. Must start with 0x'
      );
    }

    // Validate tags array
    if (!Array.isArray(input.tags) || input.tags.length === 0) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        'Tags must be a non-empty array of tag IDs'
      );
    }

    const service = getService();

    // Validate all tags exist
    const invalidTags: string[] = [];
    for (const tagId of input.tags) {
      const def = await service.getTagDefinition(tagId);
      if (!def) {
        invalidTags.push(tagId);
      }
    }

    if (invalidTags.length > 0) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        `Unknown tag IDs: ${invalidTags.join(', ')}. Use get_tag_definitions to see available tags or add_tag_definition to create new ones.`
      );
    }

    // Classify the wallet
    const classification = await service.classifyWallet({
      address: input.address,
      tags: input.tags,
      confidence: input.confidence,
      analyzedBy: 'agent',
      metrics: input.metrics,
      notes: input.notes,
    });

    // Get tag details
    const tagDetails = await Promise.all(
      classification.tags.map(async (tagId: string) => {
        const def = await service.getTagDefinition(tagId);
        return def
          ? { id: tagId, name: def.name, category: def.category }
          : { id: tagId, name: tagId, category: 'unknown' };
      })
    );

    return {
      success: true,
      address: classification.address,
      tags: tagDetails,
      confidence: classification.confidence,
      analyzedAt: new Date(classification.analyzedAt).toISOString(),
      analyzedBy: classification.analyzedBy,
      metrics: classification.metrics || null,
      notes: classification.notes || null,
      message: `Wallet ${classification.address} classified with ${classification.tags.length} tags`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get wallets by tag
 */
export async function handleGetWalletsByTag(
  _sdk: PolymarketSDK,
  input: GetWalletsByTagInput
) {
  try {
    const service = getService();

    // Check if tag exists
    const tagDef = await service.getTagDefinition(input.tagId);
    if (!tagDef) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        `Tag "${input.tagId}" not found. Use get_tag_definitions to see available tags.`
      );
    }

    const wallets = await service.getWalletsByTag(input.tagId, {
      limit: input.limit,
    });

    return {
      tag: {
        id: tagDef.id,
        name: tagDef.name,
        description: tagDef.description,
        category: tagDef.category,
      },
      wallets: wallets.map((w: WalletClassification) => ({
        address: w.address,
        allTags: w.tags,
        confidence: w.confidence,
        analyzedAt: new Date(w.analyzedAt).toISOString(),
        analyzedBy: w.analyzedBy,
        metrics: w.metrics || null,
      })),
      totalCount: wallets.length,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Remove a tag from a wallet
 */
export async function handleRemoveWalletTag(
  _sdk: PolymarketSDK,
  input: RemoveWalletTagInput
) {
  try {
    // Validate address
    if (!input.address || !input.address.startsWith('0x')) {
      throw new McpToolError(
        ErrorCode.INVALID_INPUT,
        'Invalid wallet address. Must start with 0x'
      );
    }

    const service = getService();
    const result = await service.removeWalletTag(input.address, input.tagId);

    if (!result) {
      return {
        success: false,
        address: input.address.toLowerCase(),
        message: `Wallet not found or tag "${input.tagId}" not assigned to this wallet`,
      };
    }

    return {
      success: true,
      address: result.address,
      remainingTags: result.tags,
      message: `Tag "${input.tagId}" removed from wallet ${result.address}`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}
