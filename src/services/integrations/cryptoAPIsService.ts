import { BlockchainBalance, CryptoAPIsBalanceResponse, CryptoAPIsTokenResponse } from '@/types/blockchain.types';

interface CacheEntry {
  data: BlockchainBalance;
  timestamp: number;
}

/**
 * CryptoAPIs Service for fetching Bitcoin and Tron blockchain balances
 * Used for blockchains that Alchemy doesn't support
 */
export class CryptoAPIsService {
  private static readonly API_KEY = process.env.CRYPTO_APIS_KEY;
  private static readonly BASE_URL = 'https://rest.cryptoapis.io/v2';
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // In-memory cache for API responses
  private static cache = new Map<string, CacheEntry>();
  
  /**
   * Check if the API is configured
   */
  static isConfigured(): boolean {
    const isConfigured = !!this.API_KEY && this.API_KEY.length > 10;
    console.log('🔑 CryptoAPIsService configuration check:', {
      hasApiKey: !!this.API_KEY,
      apiKeyLength: this.API_KEY?.length || 0,
      isConfigured
    });
    return isConfigured;
  }
  
  /**
   * Generate cache key for a wallet
   */
  private static getCacheKey(address: string, blockchain: string, tokenContract?: string): string {
    return tokenContract 
      ? `cryptoapis:${blockchain}:${address.toLowerCase()}:${tokenContract.toLowerCase()}`
      : `cryptoapis:${blockchain}:${address.toLowerCase()}:native`;
  }
  
  /**
   * Get cached balance if available and not expired
   */
  private static getCachedBalance(address: string, blockchain: string, tokenContract?: string): BlockchainBalance | null {
    const key = this.getCacheKey(address, blockchain, tokenContract);
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    
    // Remove expired cache entry
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }
  
  /**
   * Cache a balance response
   */
  private static cacheBalance(balance: BlockchainBalance): void {
    const key = this.getCacheKey(balance.address, balance.blockchain, balance.tokenContract);
    this.cache.set(key, {
      data: balance,
      timestamp: Date.now()
    });
  }
  
  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Make authenticated request to CryptoAPIs
   */
  private static async makeRequest(endpoint: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('CryptoAPIs API key is not configured');
    }
    
    const maxRetries = 3;
    const baseDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'X-API-Key': this.API_KEY!,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          // For 429 Rate Limit or 503 Service Unavailable, retry with exponential backoff
          if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ CryptoAPIs request attempt ${attempt} failed with ${response.status}, retrying in ${delay}ms...`);
            await this.sleep(delay);
            continue;
          }
          
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`❌ CryptoAPIs request attempt ${attempt} failed:`, error);
        
        // If this is the last attempt or not a retryable error, throw
        if (attempt === maxRetries || (error instanceof Error && !error.message.includes('429') && !error.message.includes('503'))) {
          throw error;
        }
        
        // Wait before next retry
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
    
    throw new Error('Max retries exceeded');
  }
  
  /**
   * Sync Bitcoin address with CryptoAPIs (required before first balance check)
   */
  static async syncBitcoinAddress(address: string, network: string = 'mainnet'): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('CryptoAPIs API key is not configured');
    }
    
    try {
      const cryptoApiNetwork = network === 'mainnet' ? 'mainnet' : 'testnet';
      const endpoint = `/addresses-historical/manage/bitcoin/${cryptoApiNetwork}`;
      
      console.log('🔄 Syncing Bitcoin address with CryptoAPIs:', { address, network });
      
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: "bitcoin-address-sync",
          data: {
            item: {
              address: address,
              callbackUrl: "https://example.com" // Optional callback URL
            }
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to sync Bitcoin address:', errorText);
        return false;
      }
      
      const result = await response.json();
      console.log('✅ Bitcoin address sync initiated:', result);
      return true;
    } catch (error) {
      console.error('❌ Error syncing Bitcoin address:', error);
      return false;
    }
  }

  /**
   * Fetch Bitcoin balance using CryptoAPIs UTXO endpoint
   */
  static async getBitcoinBalance(address: string, network: string = 'mainnet'): Promise<BlockchainBalance> {
    // Check cache first
    const cached = this.getCachedBalance(address, 'bitcoin');
    if (cached) {
      return cached;
    }
    
    try {
      // Use the working UTXO historical endpoint
      const cryptoApiNetwork = network === 'mainnet' ? 'mainnet' : 'testnet';
      const endpoint = `/addresses-historical/utxo/bitcoin/${cryptoApiNetwork}/${address}/balance`;
      
      console.log('🚀 Fetching Bitcoin balance via CryptoAPIs:', {
        address,
        network,
        cryptoApiNetwork,
        endpoint
      });
      
      const data = await this.makeRequest(endpoint);
      
      console.log('🔍 Bitcoin API Response:', JSON.stringify(data, null, 2));
      
      if (data.data && data.data.item && data.data.item.confirmedBalance) {
        // Bitcoin balances are already returned in BTC format, not satoshis!
        const balanceBTC = parseFloat(data.data.item.confirmedBalance.amount);
        
        const balance: BlockchainBalance = {
          address,
          blockchain: 'bitcoin',
          network,
          balance: balanceBTC,
          unit: 'BTC',
          lastUpdated: new Date(),
          isLive: true,
          tokenType: 'native'
        };
        
        // Cache the result
        this.cacheBalance(balance);
        
        console.log('✅ Bitcoin balance fetched via CryptoAPIs:', { 
          address, 
          balance: balanceBTC, 
          unit: 'BTC',
          originalAmount: data.data.item.confirmedBalance.amount
        });
        return balance;
      } else {
        throw new Error('Invalid response structure from CryptoAPIs');
      }
    } catch (error) {
      console.error('❌ Error fetching Bitcoin balance via CryptoAPIs:', error);
      
      // If error is "address_not_synced", try to sync the address
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('address_not_synced')) {
        console.log('🔄 Address not synced, attempting to sync...');
        try {
          const syncSuccess = await this.syncBitcoinAddress(address, network);
          if (syncSuccess) {
            return {
              address,
              blockchain: 'bitcoin',
              network,
              balance: 0,
              unit: 'BTC',
              lastUpdated: new Date(),
              isLive: false,
              tokenType: 'native',
              error: 'Address sync initiated. Please refresh in a few minutes to see the balance.'
            };
          }
        } catch (syncError) {
          console.error('❌ Failed to sync address:', syncError);
        }
      }
      
      return {
        address,
        blockchain: 'bitcoin',
        network,
        balance: 0,
        unit: 'BTC',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: errorMessage
      };
    }
  }
  
  /**
   * Fetch Tron balance using CryptoAPIs
   * NOTE: After comprehensive testing, CryptoAPIs does not appear to support Tron
   */
  static async getTronBalance(address: string, network: string = 'mainnet'): Promise<BlockchainBalance> {
    console.log('⚠️ Tron balance requested, but CryptoAPIs does not support Tron blockchain');
    
    return {
      address,
      blockchain: 'tron',
      network,
      balance: 0,
      unit: 'TRX',
      lastUpdated: new Date(),
      isLive: false,
      tokenType: 'native',
      error: 'Tron blockchain is not supported by CryptoAPIs. After testing 18+ endpoint patterns, no working Tron endpoints were found. Consider using a different API service for Tron balance data.'
    };
  }
  
  /**
   * Fetch Tron token balance (TRC-20 tokens like USDT on Tron)
   * NOTE: CryptoAPIs does not support Tron, so this will return an error
   */
  static async getTronTokenBalance(address: string, tokenSymbol: string, network: string = 'mainnet'): Promise<BlockchainBalance> {
    console.log('⚠️ Tron token balance requested, but CryptoAPIs does not support Tron blockchain');
    
    return {
      address,
      blockchain: 'tron',
      network,
      balance: 0,
      unit: tokenSymbol.toUpperCase(),
      lastUpdated: new Date(),
      isLive: false,
      tokenType: 'trc20',
      error: `Tron TRC-20 token '${tokenSymbol}' cannot be fetched because CryptoAPIs does not support Tron blockchain. Consider using TronGrid API or another service for Tron token balances.`
    };
  }

  // Placeholder for future Tron token contracts when using a different API service
  private static getTronTokenContracts(): Record<string, string> {
    return {
      'USDT': 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      'USDC': 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8'
    };
  }
  
  /**
   * Get native balance for supported blockchains (Bitcoin, Tron)
   */
  static async getNativeBalance(address: string, blockchain: string, network: string = 'mainnet'): Promise<BlockchainBalance> {
    const blockchainLower = blockchain.toLowerCase();
    
    switch (blockchainLower) {
      case 'bitcoin':
        return this.getBitcoinBalance(address, network);
      case 'tron':
        return this.getTronBalance(address, network);
      default:
        throw new Error(`Blockchain '${blockchain}' is not supported by CryptoAPIs service`);
    }
  }
  
  /**
   * Get token balance for supported blockchains
   */
  static async getTokenBalance(
    address: string,
    tokenSymbol: string,
    blockchain: string,
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    const blockchainLower = blockchain.toLowerCase();
    
    switch (blockchainLower) {
      case 'tron':
        return this.getTronTokenBalance(address, tokenSymbol, network);
      case 'bitcoin':
        // Bitcoin doesn't have tokens like Ethereum, only native BTC
        throw new Error('Bitcoin does not support tokens, only native BTC');
      default:
        throw new Error(`Token balance fetching not implemented for blockchain: ${blockchain}`);
    }
  }
  
  /**
   * Check if a blockchain is supported by CryptoAPIs service
   */
  static isSupportedBlockchain(blockchain: string): boolean {
    const supportedChains = ['bitcoin', 'tron'];
    return supportedChains.includes(blockchain.toLowerCase());
  }
  
  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}