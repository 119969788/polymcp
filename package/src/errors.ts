/**
 * MCP Error Handling for Polymarket Tools
 */

export enum ErrorCode {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  MARKET_NOT_FOUND = 'MARKET_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ORDER_REJECTED = 'ORDER_REJECTED',
  RATE_LIMITED = 'RATE_LIMITED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INVALID_INPUT = 'INVALID_INPUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class McpToolError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'McpToolError';
  }

  toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

export function validateAddress(address: string): void {
  if (!address || typeof address !== 'string') {
    throw new McpToolError(
      ErrorCode.INVALID_ADDRESS,
      'Address is required'
    );
  }
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new McpToolError(
      ErrorCode.INVALID_ADDRESS,
      'Address must be a valid Ethereum address (0x...)',
      { address }
    );
  }
}

export function validateConditionId(conditionId: string): void {
  if (!conditionId || typeof conditionId !== 'string') {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      'Condition ID is required'
    );
  }
  if (!conditionId.startsWith('0x')) {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      'Condition ID must start with 0x',
      { conditionId }
    );
  }
}

/**
 * Validate outcome string
 *
 * Accepts any non-empty string since markets can have different outcome names:
 * - Yes/No (standard markets)
 * - Up/Down (crypto short-term markets)
 * - Team A/Team B (sports markets)
 * - Custom outcomes (other markets)
 *
 * @param outcome - The outcome name to validate
 */
export function validateOutcome(outcome: string): void {
  if (!outcome || typeof outcome !== 'string' || outcome.trim().length === 0) {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      'Outcome must be a non-empty string (e.g., "Yes", "Up", "Team A")',
      { outcome }
    );
  }
}

export function validateSide(side: string): void {
  if (!['BUY', 'SELL'].includes(side)) {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      'Side must be "BUY" or "SELL"',
      { side }
    );
  }
}

export function validatePrice(price: number): void {
  if (typeof price !== 'number' || price < 0.001 || price > 0.999) {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      'Price must be between 0.001 and 0.999',
      { price }
    );
  }
}

export function validatePositiveNumber(value: number, name: string): void {
  if (typeof value !== 'number' || value <= 0) {
    throw new McpToolError(
      ErrorCode.INVALID_INPUT,
      `${name} must be a positive number`,
      { [name]: value }
    );
  }
}

export function wrapError(err: unknown): McpToolError {
  if (err instanceof McpToolError) {
    return err;
  }
  if (err instanceof Error) {
    // Check for known error types
    if (err.message.includes('rate limit')) {
      return new McpToolError(ErrorCode.RATE_LIMITED, 'Rate limit exceeded');
    }
    if (err.message.includes('not found')) {
      return new McpToolError(ErrorCode.MARKET_NOT_FOUND, err.message);
    }
    return new McpToolError(ErrorCode.INTERNAL_ERROR, err.message);
  }
  return new McpToolError(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
}
