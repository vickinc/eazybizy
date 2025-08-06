import { BlockchainBalance } from '@/types/blockchain.types';

interface CacheEntry {
  data: BlockchainBalance;
  timestamp: number;
}

interface TronAccountResponse {
  address?: string;
  balance?: number;
  create_time?: number;
  latest_opration_time?: number;
  account_resource?: any;
  owner_permission?: any;
  active_permission?: any;
  frozenV2?: any[];
  account_id?: string;
  net_usage?: number;
  acquired_delegated_frozen_balance_for_bandwidth?: number;
  delegated_frozen_balance_for_bandwidth?: number;
  account_name?: string;
  type?: number;
  address_tag_logo?: string;
  latest_consume_time?: number;
  latest_consume_free_time?: number;
  account_resource_usage?: any;
  votes?: any[];
}

interface TronContractCallResponse {
  result: {
    result: boolean;
  };
  energy_used: number;
  constant_result: string[];
  transaction: any;
}

/**
 * TronGrid Service for fetching Tron (TRX) and TRC-20 token balances
 * Uses official TronGrid API endpoints
 */
export class TronGridService {
  private static readonly API_BASE_URL = 'https://api.trongrid.io';
  private static readonly API_KEY = process.env.TRON_API_KEY; // Optional but recommended
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // In-memory cache for API responses
  private static cache = new Map<string, CacheEntry>();
  
  /**
   * Check if the API is configured (API key is optional for TronGrid)
   */
  static isConfigured(): boolean {
    // TronGrid works without API key but with rate limits
    // API key is optional but recommended for higher limits
    return true;
  }
  
  /**
   * Generate cache key for a wallet
   */
  private static getCacheKey(address: string, tokenContract?: string): string {
    return tokenContract 
      ? `tron:${address.toLowerCase()}:${tokenContract.toLowerCase()}`
      : `tron:${address.toLowerCase()}:native`;
  }
  
  /**
   * Get cached balance if available and not expired
   */
  private static getCachedBalance(address: string, tokenContract?: string): BlockchainBalance | null {
    const key = this.getCacheKey(address, tokenContract);
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
    const key = this.getCacheKey(balance.address, balance.tokenContract);
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
   * Convert hex address to base58 format if needed
   */
  private static normalizeAddress(address: string): string {
    // If address starts with T, it's already in base58 format
    if (address.startsWith('T')) {
      return address;
    }
    
    // If it's hex, we'll use it as is for API calls (TronGrid accepts both formats)
    return address;
  }
  
  /**
   * Make authenticated request to TronGrid
   */
  private static async makeRequest(endpoint: string, data?: any): Promise<any> {
    const maxRetries = 3;
    const baseDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add API key if available
        if (this.API_KEY) {
          headers['TRON-PRO-API-KEY'] = this.API_KEY;
        }
        
        const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers,
          body: data ? JSON.stringify(data) : undefined,
        });
        
        if (!response.ok) {
          // For 429 Rate Limit or 503 Service Unavailable, retry with exponential backoff
          if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ TronGrid request attempt ${attempt} failed with ${response.status}, retrying in ${delay}ms...`);
            await this.sleep(delay);
            continue;
          }
          
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`❌ TronGrid request attempt ${attempt} failed:`, error);
        
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
   * Fetch native TRX balance using TronGrid API
   */
  static async getTronBalance(address: string, network: string = 'mainnet'): Promise<BlockchainBalance> {
    // Check cache first
    const cached = this.getCachedBalance(address);
    if (cached) {
      return cached;
    }
    
    // Only support mainnet for now (testnet would use different endpoints)
    if (network !== 'mainnet') {
      return {
        address,
        blockchain: 'tron',
        network,
        balance: 0,
        unit: 'TRX',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: 'Only mainnet is supported for TronGrid API'
      };
    }
    
    try {
      const normalizedAddress = this.normalizeAddress(address);
      
      console.log('🚀 Fetching TRX balance via TronGrid:', {
        address: normalizedAddress,
        network,
        hasApiKey: !!this.API_KEY
      });
      
      // Use wallet/getaccount endpoint to get account information including balance
      const data = await this.makeRequest('/wallet/getaccount', {
        address: normalizedAddress,
        visible: true // Use base58 address format
      });
      
      console.log('🔍 TronGrid API Response:', JSON.stringify(data, null, 2));
      
      if (data && typeof data.balance !== 'undefined') {
        // TronGrid returns balance in SUN (1 TRX = 1,000,000 SUN)
        const balanceSun = data.balance || 0;
        const balanceTRX = balanceSun / 1_000_000;
        
        const balance: BlockchainBalance = {
          address,
          blockchain: 'tron',
          network,
          balance: balanceTRX,
          unit: 'TRX',
          lastUpdated: new Date(),
          isLive: true,
          tokenType: 'native'
        };
        
        // Cache the result
        this.cacheBalance(balance);
        
        console.log('✅ TRX balance fetched via TronGrid:', { 
          address: normalizedAddress, 
          balance: balanceTRX, 
          unit: 'TRX',
          sun: balanceSun
        });
        return balance;
      } else if (data && data.Error) {
        throw new Error(data.Error);
      } else {
        // Account might not exist or have no balance
        const balance: BlockchainBalance = {
          address,
          blockchain: 'tron',
          network,
          balance: 0,
          unit: 'TRX',
          lastUpdated: new Date(),
          isLive: true,
          tokenType: 'native'
        };
        
        this.cacheBalance(balance);
        console.log('✅ TRX account not found or zero balance:', normalizedAddress);
        return balance;
      }
    } catch (error) {
      console.error('❌ Error fetching TRX balance via TronGrid:', error);
      
      return {
        address,
        blockchain: 'tron',
        network,
        balance: 0,
        unit: 'TRX',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Fetch TRC-20 token balance using TronGrid smart contract calls
   */
  static async getTRC20TokenBalance(address: string, tokenSymbol: string, network: string = 'mainnet'): Promise<BlockchainBalance> {
    // TRC-20 token contract addresses on Tron mainnet
    const tokenContracts: Record<string, { address: string; decimals: number }> = {
      'USDT': { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', decimals: 6 },
      'USDC': { address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8', decimals: 6 }
    };
    
    const tokenInfo = tokenContracts[tokenSymbol.toUpperCase()];
    if (!tokenInfo) {
      return {
        address,
        blockchain: 'tron',
        network,
        balance: 0,
        unit: tokenSymbol.toUpperCase(),
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'trc20',
        error: `TRC-20 token '${tokenSymbol}' is not supported. Supported tokens: ${Object.keys(tokenContracts).join(', ')}`
      };
    }
    
    // Check cache first
    const cached = this.getCachedBalance(address, tokenInfo.address);
    if (cached) {
      return cached;
    }
    
    try {
      const normalizedAddress = this.normalizeAddress(address);
      
      console.log('🚀 Fetching TRC-20 token balance via TronGrid:', {
        address: normalizedAddress,
        token: tokenSymbol,
        contract: tokenInfo.address,
        decimals: tokenInfo.decimals
      });
      
      // Use TronScan API for TRC-20 token balances (most reliable)
      let data;
      try {
        console.log('🔍 Fetching TRC-20 tokens via TronScan API...');
        const trc20Response = await fetch(`https://apilist.tronscanapi.com/api/account/tokens?address=${normalizedAddress}&start=0&limit=50&hidden=0&show=0&sortType=0&sortBy=0&token=`);
        
        if (trc20Response.ok) {
          const trc20Data = await trc20Response.json();
          console.log('🔍 TRC-20 tokens response from TronScan:', {
            total: trc20Data.total,
            tokenCount: trc20Data.data?.length
          });
          
          // Look for the specific token by contract address
          const tokenData = trc20Data.data?.find((token: any) => 
            token.tokenId === tokenInfo.address
          );
          
          if (tokenData && tokenData.tokenType === 'trc20') {
            // TronScan returns balance as a string with raw units (not divided by decimals)
            const rawBalance = parseFloat(tokenData.balance);
            const balance = rawBalance / Math.pow(10, tokenInfo.decimals);
            
            console.log('✅ Found TRC-20 token balance via TronScan:', {
              token: tokenSymbol,
              rawBalance,
              decimals: tokenInfo.decimals,
              formattedBalance: balance
            });
            
            return {
              address,
              blockchain: 'tron',
              network,
              balance,
              unit: tokenSymbol.toUpperCase(),
              lastUpdated: new Date(),
              isLive: true,
              tokenContract: tokenInfo.address,
              tokenType: 'trc20'
            };
          } else {
            console.log('⚠️ TRC-20 token not found in TronScan response');
            console.log('Available tokens:', trc20Data.data?.map((t: any) => ({ 
              name: t.tokenAbbr, 
              address: t.tokenId,
              type: t.tokenType 
            })));
          }
        }
        
        // If TronScan fails, fall back to TronGrid contract call
        throw new Error('TronScan API failed, trying TronGrid contract call');
      } catch (apiError) {
        console.log('🔄 TronScan failed, falling back to TronGrid smart contract call...');
        
        // Fallback to TronGrid smart contract call (may not work reliably)
        data = await this.makeRequest('/wallet/triggerconstantcontract', {
          owner_address: normalizedAddress,
          contract_address: tokenInfo.address,
          function_selector: 'balanceOf(address)',
          parameter: normalizedAddress,
          visible: true
        });
      }
      
      console.log('🔍 TronGrid TRC-20 Response:', JSON.stringify(data, null, 2));
      
      if (data && data.result && data.result.result && data.constant_result && data.constant_result[0]) {
        // Parse hex result to get balance
        const hexBalance = data.constant_result[0];
        const balanceRaw = parseInt(hexBalance, 16);
        const balanceFormatted = balanceRaw / Math.pow(10, tokenInfo.decimals);
        
        const balance: BlockchainBalance = {
          address,
          blockchain: 'tron',
          network,
          balance: balanceFormatted,
          unit: tokenSymbol.toUpperCase(),
          lastUpdated: new Date(),
          isLive: true,
          tokenContract: tokenInfo.address,
          tokenType: 'trc20'
        };
        
        // Cache the result
        this.cacheBalance(balance);
        
        console.log('✅ TRC-20 token balance fetched via TronGrid:', { 
          address: normalizedAddress, 
          token: tokenSymbol, 
          balance: balanceFormatted,
          raw: balanceRaw,
          decimals: tokenInfo.decimals
        });
        return balance;
      } else {
        // Return zero balance
        const balance: BlockchainBalance = {
          address,
          blockchain: 'tron',
          network,
          balance: 0,
          unit: tokenSymbol.toUpperCase(),
          lastUpdated: new Date(),
          isLive: true,
          tokenContract: tokenInfo.address,
          tokenType: 'trc20'
        };
        
        this.cacheBalance(balance);
        return balance;
      }
    } catch (error) {
      console.error('❌ Error fetching TRC-20 token balance via TronGrid:', error);
      
      return {
        address,
        blockchain: 'tron',
        network,
        balance: 0,
        unit: tokenSymbol.toUpperCase(),
        lastUpdated: new Date(),
        isLive: false,
        tokenContract: tokenInfo.address,
        tokenType: 'trc20',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get native balance for Tron
   */
  static async getNativeBalance(address: string, blockchain: string, network: string = 'mainnet'): Promise<BlockchainBalance> {
    if (blockchain.toLowerCase() !== 'tron') {
      throw new Error(`TronGrid service only supports Tron blockchain, got: ${blockchain}`);
    }
    
    return this.getTronBalance(address, network);
  }
  
  /**
   * Get token balance for Tron
   */
  static async getTokenBalance(
    address: string,
    tokenSymbol: string,
    blockchain: string,
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    if (blockchain.toLowerCase() !== 'tron') {
      throw new Error(`TronGrid service only supports Tron blockchain, got: ${blockchain}`);
    }
    
    return this.getTRC20TokenBalance(address, tokenSymbol, network);
  }
  
  /**
   * Check if a blockchain is supported by TronGrid service
   */
  static isSupportedBlockchain(blockchain: string): boolean {
    return blockchain.toLowerCase() === 'tron';
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