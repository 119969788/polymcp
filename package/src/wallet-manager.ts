/**
 * Wallet Manager - Multi-wallet support for poly-mcp
 *
 * Supports multiple private keys configuration via environment variables:
 *
 * Option 1: JSON format (recommended)
 *   POLY_WALLETS='{"main":"0x...", "trading":"0x...", "arb":"0x..."}'
 *
 * Option 2: Single key (backward compatible)
 *   POLY_PRIVATE_KEY='0x...'
 *
 * Option 3: Indexed keys
 *   POLY_PRIVATE_KEY_1='0x...'
 *   POLY_PRIVATE_KEY_2='0x...'
 */

import { Wallet } from 'ethers';

export interface WalletInfo {
  name: string;
  address: string;
  wallet: Wallet;
}

export class WalletManager {
  private wallets: Map<string, WalletInfo> = new Map();
  private walletsByAddress: Map<string, WalletInfo> = new Map();
  private activeWalletName: string | null = null;

  constructor() {
    this.loadWalletsFromEnv();
  }

  private loadWalletsFromEnv(): void {
    // Debug: log all POLY_* env vars
    console.error('[WalletManager] Loading wallets from env...');
    console.error('[WalletManager] POLY_WALLETS:', process.env.POLY_WALLETS ? 'set' : 'not set');
    console.error('[WalletManager] POLY_PRIVATE_KEY:', process.env.POLY_PRIVATE_KEY ? 'set' : 'not set');
    console.error('[WalletManager] POLY_PRIVATE_KEY_1:', process.env.POLY_PRIVATE_KEY_1 ? 'set' : 'not set');
    console.error('[WalletManager] POLY_PRIVATE_KEY_2:', process.env.POLY_PRIVATE_KEY_2 ? 'set' : 'not set');

    // Option 1: JSON format POLY_WALLETS
    const walletsJson = process.env.POLY_WALLETS;
    if (walletsJson) {
      try {
        const walletsConfig = JSON.parse(walletsJson) as Record<string, string>;
        for (const [name, privateKey] of Object.entries(walletsConfig)) {
          this.addWallet(name, privateKey);
        }
      } catch (error) {
        console.error('Failed to parse POLY_WALLETS JSON:', error);
      }
    }

    // Option 2: Single POLY_PRIVATE_KEY (backward compatible)
    const singleKey = process.env.POLY_PRIVATE_KEY;
    if (singleKey && !this.wallets.has('default')) {
      this.addWallet('default', singleKey);
    }

    // Option 3: Indexed keys POLY_PRIVATE_KEY_1, POLY_PRIVATE_KEY_2, ...
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`POLY_PRIVATE_KEY_${i}`];
      if (key) {
        const name = process.env[`POLY_WALLET_NAME_${i}`] || `wallet${i}`;
        console.error(`[WalletManager] Found indexed key ${i}: name=${name}`);
        if (!this.wallets.has(name)) {
          this.addWallet(name, key);
        }
      }
    }

    // Set first wallet as active if any exist
    if (this.wallets.size > 0 && !this.activeWalletName) {
      this.activeWalletName = this.wallets.keys().next().value ?? null;
    }
  }

  private addWallet(name: string, privateKey: string): boolean {
    try {
      const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      const wallet = new Wallet(formattedKey);

      // Check for dummy wallet
      if (wallet.address === '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf') {
        console.error(`Skipping dummy wallet for "${name}"`);
        return false;
      }

      const info: WalletInfo = {
        name,
        address: wallet.address,
        wallet,
      };

      this.wallets.set(name, info);
      this.walletsByAddress.set(wallet.address.toLowerCase(), info);

      console.error(`Wallet "${name}" loaded: ${wallet.address}`);
      return true;
    } catch (error) {
      console.error(`Failed to create wallet "${name}":`, error);
      return false;
    }
  }

  /**
   * Get all available wallets
   */
  listWallets(): Array<{ name: string; address: string; isActive: boolean }> {
    return Array.from(this.wallets.values()).map((info) => ({
      name: info.name,
      address: info.address,
      isActive: info.name === this.activeWalletName,
    }));
  }

  /**
   * Get wallet by name or address
   */
  getWallet(nameOrAddress?: string): WalletInfo | undefined {
    if (!nameOrAddress) {
      // Return active wallet
      if (this.activeWalletName) {
        return this.wallets.get(this.activeWalletName);
      }
      return undefined;
    }

    // Try by name first
    const byName = this.wallets.get(nameOrAddress);
    if (byName) {
      return byName;
    }

    // Try by address
    const byAddress = this.walletsByAddress.get(nameOrAddress.toLowerCase());
    if (byAddress) {
      return byAddress;
    }

    return undefined;
  }

  /**
   * Get the active wallet
   */
  getActiveWallet(): WalletInfo | undefined {
    if (this.activeWalletName) {
      return this.wallets.get(this.activeWalletName);
    }
    return undefined;
  }

  /**
   * Set the active wallet by name or address
   */
  setActiveWallet(nameOrAddress: string): boolean {
    const wallet = this.getWallet(nameOrAddress);
    if (wallet) {
      this.activeWalletName = wallet.name;
      console.error(`Active wallet set to "${wallet.name}" (${wallet.address})`);
      return true;
    }
    return false;
  }

  /**
   * Get the private key for a wallet (for SDK initialization)
   */
  getPrivateKey(nameOrAddress?: string): string | undefined {
    const wallet = this.getWallet(nameOrAddress);
    if (wallet) {
      return wallet.wallet.privateKey;
    }
    return undefined;
  }

  /**
   * Check if any wallets are configured
   */
  hasWallets(): boolean {
    return this.wallets.size > 0;
  }

  /**
   * Get the count of configured wallets
   */
  get count(): number {
    return this.wallets.size;
  }

  /**
   * Get wallet addresses as array
   */
  getAddresses(): string[] {
    return Array.from(this.wallets.values()).map((w) => w.address);
  }
}

// Singleton instance
let walletManagerInstance: WalletManager | null = null;

export function getWalletManager(): WalletManager {
  if (!walletManagerInstance) {
    walletManagerInstance = new WalletManager();
  }
  return walletManagerInstance;
}
