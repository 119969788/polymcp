/**
 * Insider Signals MCP Tools
 *
 * Tools for managing insider detection signals.
 */

import type { ToolDefinition } from '../types.js';
import type { PolymarketSDK } from '@catalyst-team/poly-sdk';
import {
  InsiderSignalService,
  type InsiderSignalType,
  type InsiderSignalSeverity,
} from '@catalyst-team/smart-money';
import { join } from 'node:path';
import { wrapError } from '../errors.js';

// Initialize service
let signalService: InsiderSignalService | null = null;

function getSignalService(): InsiderSignalService {
  if (!signalService) {
    const dataDir = process.env.DATA_DIR || join(process.cwd(), 'data');
    signalService = new InsiderSignalService({
      dataDir: join(dataDir, 'signals'),
    });
  }
  return signalService;
}

// ============= Tool Definitions =============

export const insiderSignalsToolDefinitions: ToolDefinition[] = [
  {
    name: 'get_insider_signals',
    description: 'Get insider detection signals with optional filtering. Returns alerts for new insider wallets discovered, large trades by insiders, and cluster activity.',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['insider_new', 'insider_large_trade', 'insider_cluster'],
          description: 'Filter by signal type. insider_new: new wallet discovered, insider_large_trade: large trade detected, insider_cluster: multiple insiders trading same market.',
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Filter by severity level.',
        },
        unreadOnly: {
          type: 'boolean',
          default: false,
          description: 'Only return unread signals.',
        },
        limit: {
          type: 'number',
          default: 20,
          description: 'Maximum signals to return (max 100).',
        },
        since: {
          type: 'number',
          description: 'Only return signals after this Unix timestamp (milliseconds).',
        },
      },
    },
  },
  {
    name: 'get_insider_signal_count',
    description: 'Get the count of unread insider signals. Useful for displaying notification badges.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'mark_insider_signal_read',
    description: 'Mark an insider signal as read.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Signal ID to mark as read.',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'mark_all_insider_signals_read',
    description: 'Mark all insider signals as read.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ============= Input Types =============

interface GetInsiderSignalsInput {
  type?: InsiderSignalType;
  severity?: InsiderSignalSeverity;
  unreadOnly?: boolean;
  limit?: number;
  since?: number;
}

interface MarkInsiderSignalReadInput {
  id: string;
}

// ============= Handlers =============

/**
 * Get insider signals with optional filtering
 */
export async function handleGetInsiderSignals(
  _sdk: PolymarketSDK,
  input: GetInsiderSignalsInput
) {
  try {
    const service = getSignalService();

    const result = service.getSignals({
      type: input.type,
      severity: input.severity,
      unreadOnly: input.unreadOnly ?? false,
      limit: Math.min(input.limit ?? 20, 100),
      since: input.since,
    });

    return {
      signals: result.signals,
      total: result.total,
      unreadCount: result.unreadCount,
      filters: {
        type: input.type || 'all',
        severity: input.severity || 'all',
        unreadOnly: input.unreadOnly ?? false,
        limit: input.limit ?? 20,
      },
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Get count of unread insider signals
 */
export async function handleGetInsiderSignalCount(
  _sdk: PolymarketSDK,
  _input: Record<string, never>
) {
  try {
    const service = getSignalService();
    const count = service.getUnreadCount();

    return {
      unreadCount: count,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Mark a single insider signal as read
 */
export async function handleMarkInsiderSignalRead(
  _sdk: PolymarketSDK,
  input: MarkInsiderSignalReadInput
) {
  try {
    const service = getSignalService();
    const success = service.markAsRead(input.id);

    if (!success) {
      return {
        success: false,
        message: 'Signal not found or already read',
      };
    }

    return {
      success: true,
      message: `Signal ${input.id} marked as read`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

/**
 * Mark all insider signals as read
 */
export async function handleMarkAllInsiderSignalsRead(
  _sdk: PolymarketSDK,
  _input: Record<string, never>
) {
  try {
    const service = getSignalService();
    const count = service.markAllAsRead();

    return {
      success: true,
      markedCount: count,
      message: `Marked ${count} signals as read`,
    };
  } catch (err) {
    throw wrapError(err);
  }
}
