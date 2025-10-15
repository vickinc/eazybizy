import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis';
import { TronGridService } from '@/services/integrations/tronGridService';
import { AlchemyService } from '@/services/integrations/alchemyService';

/**
 * Blockchain Balance Cache Service
 *
 * Wraps blockchain API calls with Redis caching to improve performance
 * and reduce API calls to external blockchain services.
 *
 * Cache Strategy:
 * - Current balances: 5 minutes TTL (balances change frequently)
 * - Historical balances: 60 minutes TTL (historical data doesn't change)
 *
 * Fallback: If Redis is unavailable, calls go directly to blockchain services
 */
export class BlockchainBalanceCacheService {

  /**
   * Get current balance for a wallet with caching
   *
   * @param address - Wallet address
   * @param currency - Token/currency symbol (e.g., 'TRX', 'USDT', 'ETH')
   * @param blockchain - Blockchain name (e.g., 'tron', 'ethereum')
   * @returns Promise<number> - Current balance
   */
  static async getCurrentBalance(
    address: string,
    currency: string,
    blockchain: string
  ): Promise<number> {
    const cacheKey = CacheKeys.blockchain.balance(address, blockchain, currency);

    try {
      // Try to get from cache first
      const cachedBalance = await CacheService.get<number>(cacheKey);
      if (cachedBalance !== null) {
        console.log('✅ Blockchain balance cache HIT:', { address: address.substring(0, 10) + '...', currency, blockchain });
        return cachedBalance;
      }

      console.log('⚠️ Blockchain balance cache MISS:', { address: address.substring(0, 10) + '...', currency, blockchain });

      // Cache miss - fetch from blockchain
      let balance = 0;
      const blockchainLower = blockchain.toLowerCase();

      switch (blockchainLower) {
        case 'tron':
          balance = await TronGridService.getCurrentBalance(address, currency, blockchain);
          break;
        case 'ethereum':
        case 'eth':
          balance = await AlchemyService.getCurrentBalance(address, currency, blockchain);
          break;
        default:
          console.warn(`Unsupported blockchain for balance fetching: ${blockchain}`);
          return 0;
      }

      // Cache the result
      await CacheService.set(cacheKey, balance, CacheTTL.blockchain.balance);
      console.log('💾 Cached blockchain balance:', { address: address.substring(0, 10) + '...', currency, blockchain, balance });

      return balance;
    } catch (error) {
      console.error('Error fetching blockchain balance with cache:', error);

      // On error, try direct call without caching
      try {
        const blockchainLower = blockchain.toLowerCase();
        switch (blockchainLower) {
          case 'tron':
            return await TronGridService.getCurrentBalance(address, currency, blockchain);
          case 'ethereum':
          case 'eth':
            return await AlchemyService.getCurrentBalance(address, currency, blockchain);
          default:
            return 0;
        }
      } catch (fallbackError) {
        console.error('Fallback blockchain balance fetch also failed:', fallbackError);
        return 0;
      }
    }
  }

  /**
   * Get historical balance for a specific date with caching
   * Historical balances are cached longer since they don't change
   *
   * @param address - Wallet address
   * @param blockchain - Blockchain name
   * @param currency - Token/currency symbol
   * @param asOfDate - Historical date
   * @returns Promise with transaction data
   */
  static async getHistoricalBalance(
    address: string,
    blockchain: string,
    currency: string,
    asOfDate: Date
  ): Promise<{ netAmount: number; totalIncoming: number; totalOutgoing: number } | null> {
    const dateKey = asOfDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const cacheKey = CacheKeys.blockchain.historicalBalance(address, blockchain, currency, dateKey);

    try {
      // Try to get from cache first
      const cachedData = await CacheService.get<{ netAmount: number; totalIncoming: number; totalOutgoing: number }>(cacheKey);
      if (cachedData !== null) {
        console.log('✅ Historical blockchain balance cache HIT:', { address: address.substring(0, 10) + '...', currency, blockchain, date: dateKey });
        return cachedData;
      }

      console.log('⚠️ Historical blockchain balance cache MISS:', { address: address.substring(0, 10) + '...', currency, blockchain, date: dateKey });

      // Cache miss - fetch from blockchain (this would need to be implemented in the services)
      // For now, return null to indicate no cached data
      // This can be extended when historical balance fetching is fully implemented
      return null;
    } catch (error) {
      console.error('Error fetching historical blockchain balance with cache:', error);
      return null;
    }
  }

  /**
   * Invalidate cache for a specific wallet
   * Useful when we know a balance has changed (e.g., after a transaction)
   *
   * @param address - Wallet address
   * @param blockchain - Blockchain name
   * @param currency - Optional currency to invalidate specific cache
   */
  static async invalidateCache(
    address: string,
    blockchain: string,
    currency?: string
  ): Promise<void> {
    try {
      if (currency) {
        const cacheKey = CacheKeys.blockchain.balance(address, blockchain, currency);
        await CacheService.del(cacheKey);
        console.log('🗑️ Invalidated blockchain balance cache:', { address: address.substring(0, 10) + '...', currency, blockchain });
      } else {
        // Invalidate all currencies for this address
        const pattern = `blockchain:balance:${blockchain}:${address}:*`;
        const deletedCount = await CacheService.delPattern(pattern);
        console.log('🗑️ Invalidated blockchain balance caches:', { address: address.substring(0, 10) + '...', blockchain, count: deletedCount });
      }
    } catch (error) {
      console.error('Error invalidating blockchain balance cache:', error);
    }
  }

  /**
   * Prefetch and cache balances for multiple wallets
   * Useful for optimizing balance page loads
   *
   * @param wallets - Array of wallet configs
   */
  static async prefetchBalances(
    wallets: Array<{ address: string; currency: string; blockchain: string }>
  ): Promise<void> {
    console.log(`🚀 Prefetching ${wallets.length} blockchain balances...`);

    const fetchPromises = wallets.map(wallet =>
      this.getCurrentBalance(wallet.address, wallet.currency, wallet.blockchain)
        .catch(error => {
          console.error(`Failed to prefetch balance for ${wallet.address}:`, error);
          return 0;
        })
    );

    await Promise.all(fetchPromises);
    console.log(`✅ Prefetch complete for ${wallets.length} wallets`);
  }
}
