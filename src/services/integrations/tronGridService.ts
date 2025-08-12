import { BlockchainBalance, BlockchainTransaction } from '@/types/blockchain.types';

interface CacheEntry {
  data: BlockchainBalance;
  timestamp: number;
}

interface CurrentBalanceCache {
  balance: number;
  timestamp: number;
  currency: string;
  address: string;
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

interface TronTransactionResponse {
  success: boolean;
  meta: {
    at: number;
    page_size: number;
    fingerprint?: string;
  };
  data: TronTransaction[];
}

interface TronTransaction {
  ret: Array<{
    contractRet: string;
    fee?: number;
  }>;
  signature: string[];
  txID: string;
  net_usage: number;
  raw_data_hex: string;
  net_fee: number;
  energy_usage: number;
  blockNumber: number;
  block_timestamp: number;
  energy_fee: number;
  energy_usage_total: number;
  raw_data: {
    contract: Array<{
      parameter: {
        value: {
          data?: string;
          owner_address: string;
          contract_address?: string;
          to_address?: string;
          amount?: number;
          asset_name?: string;
        };
        type_url: string;
      };
      type: string;
    }>;
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    fee_limit?: number;
    timestamp: number;
  };
  internal_transactions?: TronInternalTransaction[];
}

interface TronInternalTransaction {
  hash: string;
  caller_address: string;
  transferTo_address: string;
  callValueInfo: Array<{
    callValue: number;
    tokenId?: string;
  }>;
  note: string;
}

// BlockchainTransaction interface is now imported from types

/**
 * TronGrid Service for fetching Tron (TRX) and TRC-20 token balances and transactions
 * Uses official TronGrid API endpoints
 * 
 * IMPORTANT: API key is required for reliable operation
 * - Without API key: Severe rate limiting, 403 errors, 30-second blocks
 * - With free API key: 100K requests/day, 15 QPS limit
 * 
 * Get your free API key from: https://www.trongrid.io/
 */
export class TronGridService {
  private static readonly API_BASE_URL = 'https://api.trongrid.io';
  private static readonly API_KEY = process.env.TRONGRID_API_KEY;
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // In-memory cache for API responses
  private static cache = new Map<string, CacheEntry>();
  private static readonly currentBalanceCache = new Map<string, CurrentBalanceCache>();
  private static readonly CURRENT_BALANCE_CACHE_MS = 10 * 60 * 1000; // 10 minutes for current balances
  
  /**
   * Check if the TronGrid API is properly configured with an API key
   * 
   * @returns {boolean} True if API key is configured and valid
   */
  static isConfigured(): boolean {
    const hasApiKey = !!this.API_KEY && this.API_KEY.length > 10 && this.API_KEY !== 'your-actual-trongrid-api-key-here';
    
    if (!hasApiKey && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ TronGrid API key not configured. Add TRONGRID_API_KEY to environment variables to avoid rate limiting.');
      console.warn('🔗 Get a free API key from: https://www.trongrid.io/ (100K requests/day)');
    }
    
    return hasApiKey;
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
    
    // If it's hex format (41...), convert to consistent format for comparison
    if (address.startsWith('41') && address.length === 42) {
      return address.toLowerCase();
    }
    
    // For other formats, use as is
    return address;
  }
  
  /**
   * Convert address to consistent hex format for comparison
   * This ensures we can compare addresses regardless of input format
   */
  private static addressToHexFormat(address: string): string {
    // If already hex format, normalize to lowercase
    if (address.startsWith('41') && address.length === 42) {
      return address.toLowerCase();
    }
    
    // If base58 format (starts with T), we need to convert to hex
    // For now, return as lowercase for comparison
    // TODO: Implement proper base58 to hex conversion if needed
    return address.toLowerCase();
  }
  
  /**
   * Make authenticated request to TronGrid with proper API key handling
   */
  private static async makeRequest(endpoint: string, data?: any): Promise<any> {
    // Check if API key is configured for reliable requests
    if (!this.isConfigured()) {
      console.warn('⚠️ Making TronGrid request without API key - expect rate limiting');
    }
    
    const maxRetries = 3;
    const baseDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add API key if available and valid
        if (this.API_KEY && this.API_KEY !== 'your-actual-trongrid-api-key-here') {
          headers['TRON-PRO-API-KEY'] = this.API_KEY;
        }
        
        const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers,
          body: data ? JSON.stringify(data) : undefined,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          
          // Special handling for API key related errors
          if (response.status === 403) {
            const errorMessage = `TronGrid API access denied (403). This usually indicates:
              - No API key provided and rate limit exceeded
              - Invalid API key
              - Daily quota exceeded
              
              Solution: Configure TRONGRID_API_KEY in environment variables.
              Get free API key: https://www.trongrid.io/ (100K requests/day)
              
              Error details: ${errorText}`;
            throw new Error(errorMessage);
          }
          
          // For 429 Rate Limit or 503 Service Unavailable, retry with exponential backoff
          if ((response.status === 429 || response.status === 503) && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ TronGrid rate limited (${response.status}), retrying attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
            await this.sleep(delay);
            continue;
          }
          
          throw new Error(`TronGrid API error (${response.status}): ${response.statusText} - ${errorText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`❌ TronGrid request attempt ${attempt}/${maxRetries} failed:`, error);
        
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
   * Get current blockchain balance - unified interface for historical calculations
   */
  static async getCurrentBalance(address: string, currency: string, blockchain: string = 'tron', network: string = 'mainnet'): Promise<number> {
    try {
      // Generate cache key
      const cacheKey = `${address.toLowerCase()}-${currency.toLowerCase()}-${blockchain.toLowerCase()}`;
      
      // Check cache first
      const cached = this.currentBalanceCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CURRENT_BALANCE_CACHE_MS) {
        console.log(`📦 Using cached ${currency} balance for ${address.substring(0, 10)}...`);
        return cached.balance;
      }

      // Remove expired cache entry
      if (cached) {
        this.currentBalanceCache.delete(cacheKey);
      }

      console.log(`🔄 Fetching fresh ${currency} balance for ${address.substring(0, 10)}...`);
      
      let balance = 0;
      if (currency.toUpperCase() === 'TRX') {
        const balanceObj = await this.getNativeBalance(address, blockchain, network);
        balance = balanceObj?.balance || 0;
      } else {
        // TRC-20 tokens
        const balanceObj = await this.getTokenBalance(address, currency, blockchain, network);
        balance = balanceObj?.balance || 0;
      }

      // Cache the result
      this.currentBalanceCache.set(cacheKey, {
        balance,
        timestamp: Date.now(),
        currency: currency.toUpperCase(),
        address: address.toLowerCase()
      });

      console.log(`✅ Cached ${currency} balance: ${balance}`);
      return balance;
    } catch (error) {
      console.error(`❌ Error getting current ${currency} balance:`, error);
      return 0;
    }
  }

  /**
   * Normalize date to UTC for consistent timezone handling
   */
  static normalizeToUTC(date: Date): Date {
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(), 
      date.getDate(),
      23, 59, 59, 999 // End of day UTC for historical date cutoff
    ));
    return utcDate;
  }

  /**
   * Validate that historical date is in the past
   */
  static validateHistoricalDate(historicalDate: Date): { valid: boolean; error?: string } {
    const now = new Date();
    const normalizedHistorical = this.normalizeToUTC(historicalDate);
    const normalizedNow = this.normalizeToUTC(now);

    if (normalizedHistorical > normalizedNow) {
      return {
        valid: false,
        error: `Historical date ${historicalDate.toISOString()} cannot be in the future`
      };
    }

    // Check if date is too far in the past (more than 5 years)
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    if (normalizedHistorical < fiveYearsAgo) {
      return {
        valid: false, 
        error: `Historical date ${historicalDate.toISOString()} is too far in the past (>5 years)`
      };
    }

    return { valid: true };
  }

  /**
   * Validate that calculated balance is within realistic bounds
   */
  static validateBalanceRealistic(amount: number, currency: string, currentBalance: number): { valid: boolean; error?: string; adjustedAmount?: number } {
    const currencyUpper = currency.toUpperCase();
    
    // Define realistic ranges for different cryptocurrencies
    const ranges: Record<string, { min: number; max: number }> = {
      'TRX': { min: 0, max: 10_000_000 }, // 10M TRX max
      'USDT': { min: -100_000, max: 1_000_000 }, // 1M USDT max, allow negative
      'USDC': { min: -100_000, max: 1_000_000 }, // 1M USDC max, allow negative  
      'BTC': { min: 0, max: 1_000 }, // 1000 BTC max
      'ETH': { min: 0, max: 10_000 }, // 10K ETH max
      'BNB': { min: 0, max: 100_000 }, // 100K BNB max
      'SOL': { min: 0, max: 1_000_000 } // 1M SOL max
    };

    const range = ranges[currencyUpper];
    if (!range) {
      // For unknown currencies, use current balance as reference
      if (Math.abs(amount) > Math.abs(currentBalance) * 10) {
        return {
          valid: false,
          error: `Calculated ${currency} balance ${amount} seems unrealistic (>10x current balance)`,
          adjustedAmount: 0
        };
      }
      return { valid: true };
    }

    // Check if amount is within realistic range
    if (amount < range.min || amount > range.max) {
      return {
        valid: false,
        error: `Calculated ${currency} balance ${amount} is outside realistic range [${range.min}, ${range.max}]`,
        adjustedAmount: Math.max(range.min, Math.min(range.max, amount))
      };
    }

    // Additional check: historical balance shouldn't be dramatically different from current balance
    const percentageDiff = Math.abs((amount - currentBalance) / Math.max(Math.abs(currentBalance), 1)) * 100;
    if (percentageDiff > 1000) { // More than 1000% difference
      return {
        valid: false,
        error: `Calculated ${currency} balance ${amount} differs too much from current balance ${currentBalance} (${percentageDiff.toFixed(1)}%)`,
        adjustedAmount: currentBalance * 0.5 // Use 50% of current as conservative estimate
      };
    }

    return { valid: true };
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
              formattedBalance: balance,
              address,
              tokenContract: tokenInfo.address
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
   * Clear all caches
   */
  static clearCache(): void {
    this.cache.clear();
    this.currentBalanceCache.clear();
  }
  
  /**
   * Get cache statistics
   */
  static getCacheStats(): { 
    blockchainDataCache: { size: number; entries: string[] }; 
    currentBalanceCache: { size: number; entries: string[] };
  } {
    return {
      blockchainDataCache: {
        size: this.cache.size,
        entries: Array.from(this.cache.keys())
      },
      currentBalanceCache: {
        size: this.currentBalanceCache.size,
        entries: Array.from(this.currentBalanceCache.keys())
      }
    };
  }

  /**
   * Clean expired entries from current balance cache
   */
  static cleanCurrentBalanceCache(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, cached] of this.currentBalanceCache.entries()) {
      if ((now - cached.timestamp) >= this.CURRENT_BALANCE_CACHE_MS) {
        this.currentBalanceCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired current balance cache entries`);
    }
    
    return cleanedCount;
  }



  /**
   * Get transaction history for a Tron address using TronGrid v1 API
   */
  static async getTransactionHistory(
    address: string,
    options: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      tokenContracts?: string[];
      onlyConfirmed?: boolean;
    } = {}
  ): Promise<BlockchainTransaction[]> {
    const {
      limit = 5000, // Increased default limit to get more transactions
      startDate,
      endDate,
      onlyConfirmed = true
    } = options;

    try {
      const normalizedAddress = this.normalizeAddress(address);
      
      console.log('🚀 Fetching transaction history via TronGrid v1 API:', {
        address: normalizedAddress,
        limit,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      });

      // Use TronGrid v1 API endpoint
      const endpoint = `/v1/accounts/${normalizedAddress}/transactions`;
      const params = new URLSearchParams();
      
      // Add query parameters
      params.append('limit', Math.min(limit, 200).toString()); // Max 200 per request
      
      if (onlyConfirmed) {
        params.append('only_confirmed', 'true');
      }
      
      if (startDate) {
        params.append('min_block_timestamp', startDate.getTime().toString());
      }
      
      if (endDate) {
        params.append('max_block_timestamp', endDate.getTime().toString());
      }

      // Fetch all pages if needed
      const allTransactions: BlockchainTransaction[] = [];
      let fingerprint: string | undefined;
      const maxPages = Math.ceil(limit / 200);
      
      for (let page = 0; page < maxPages && allTransactions.length < limit; page++) {
        const pageParams = new URLSearchParams(params);
        if (fingerprint) {
          pageParams.append('fingerprint', fingerprint);
        }
        
        const response = await fetch(`${this.API_BASE_URL}${endpoint}?${pageParams}`, {
          headers: this.API_KEY ? {
            'TRON-PRO-API-KEY': this.API_KEY
          } : {}
        });
      
        if (!response.ok) {
          throw new Error(`TronGrid API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('📊 TronGrid v1 API response:', {
          page: page + 1,
          transactionCount: data.data?.length || 0,
          hasMore: !!data.meta?.fingerprint
        });

        if (!data.data || !Array.isArray(data.data)) {
          break; // No more data
        }

        // Parse transactions from this page
        for (const tx of data.data) {
          if (allTransactions.length >= limit) break;
          
          try {
            const parsedTx = this.parseTronGridTransaction(tx, address);
            if (parsedTx) {
              allTransactions.push(parsedTx);
            }
          } catch (error) {
            console.error('Error parsing transaction:', tx.txID, error);
          }
        }
        
        // Check if there are more pages
        fingerprint = data.meta?.fingerprint;
        if (!fingerprint) {
          break; // No more pages
        }
      }

      // Final filter: only include native TRX and TRC-20 transactions
      const filteredTransactions = allTransactions.filter(tx => 
        tx.tokenType === 'native' || tx.tokenType === 'trc20'
      );

      console.log(`✅ Fetched ${allTransactions.length} transactions from TronGrid`);
      console.log(`🔍 Filtered to ${filteredTransactions.length} transactions (native TRX + TRC-20 only)`);
      return filteredTransactions;

    } catch (error) {
      console.error('❌ Error fetching Tron transaction history:', error);
      throw error;
    }
  }

  /**
   * Parse TronGrid v1 API transaction data into standardized format
   */
  private static parseTronGridTransaction(tx: TronTransaction, walletAddress: string): BlockchainTransaction | null {
    try {
      const normalizedWallet = this.addressToHexFormat(walletAddress);
      
      // Debug specific transaction
      const txHash = tx.txID;
      if (txHash && txHash.includes('ae6c073acfbb486d4efed5de3d5a6b0ab45a55526c4709d0B4b8e74f2d1d61')) {
        console.log(`🎯 PROCESSING SPECIFIC TRANSACTION: ${txHash}`, {
          walletAddress: normalizedWallet,
          rawTransaction: tx
        });
      }
      
      // Basic transaction info
      const hash = tx.txID;
      const blockNumber = tx.blockNumber;
      const timestamp = tx.block_timestamp;
      const status = (tx.ret && tx.ret[0] && tx.ret[0].contractRet === 'SUCCESS') ? 'success' : 'failed';
      
      // Get the first contract from raw_data
      const contract = tx.raw_data?.contract?.[0];
      if (!contract) {
        return null;
      }
      
      const contractType = contract.type;
      const contractParams = contract.parameter?.value;
      
      if (!contractParams) {
        return null;
      }
      
      // Handle different contract types
      if (contractType === 'TransferContract') {
        const fromAddress = this.addressToHexFormat(contractParams.owner_address || '');
        const toAddress = this.addressToHexFormat(contractParams.to_address || '');
        const amount = (contractParams.amount || 0) / 1_000_000; // Convert from SUN to TRX
        
        // Calculate total fees (energy + network fees)
        const energyFee = (tx.energy_fee || 0) / 1_000_000;
        const netFee = (tx.net_fee || 0) / 1_000_000;
        const totalFee = energyFee + netFee;
        
        // Detect fee-only transactions: amount is 0 or very small but fees are present
        const isFeeOnlyTransaction = amount === 0 && totalFee > 0;
        
        console.log(`🔧 TRX Transaction Analysis:`, {
          wallet: normalizedWallet,
          from: fromAddress,
          to: toAddress,
          amount,
          totalFee,
          energyFee,
          netFee,
          isFeeOnlyTransaction,
          isOutgoing: fromAddress === normalizedWallet,
          isIncoming: toAddress === normalizedWallet
        });
        
        if (isFeeOnlyTransaction) {
          // This is a fee payment for a token transfer, not an actual TRX transfer
          // Create a fee transaction record
          return {
            hash,
            blockNumber,
            timestamp,
            from: fromAddress,
            to: toAddress,
            amount: totalFee, // Show the total fee amount
            currency: 'TRX',
            type: 'fee' as const, // Use the new fee type
            status: status as 'success' | 'failed',
            gasUsed: tx.net_usage,
            gasFee: totalFee,
            tokenType: 'native',
            blockchain: 'tron',
            network: 'mainnet'
          };
        } else {
          // This is an actual native TRX transfer
          const type = fromAddress === normalizedWallet ? 'outgoing' : 'incoming';
          
          return {
            hash,
            blockNumber,
            timestamp,
            from: fromAddress,
            to: toAddress,
            amount: Math.abs(amount),
            currency: 'TRX',
            type,
            status: status as 'success' | 'failed',
            gasUsed: tx.net_usage,
            gasFee: totalFee,
            tokenType: 'native',
            blockchain: 'tron',
            network: 'mainnet'
          };
        }
        
      } else if (contractType === 'TriggerSmartContract') {
        // Smart contract interaction (could be TRC-20)
        const ownerAddress = contractParams.owner_address?.toLowerCase() || '';
        const contractAddress = contractParams.contract_address || '';
        const data = contractParams.data || '';
        
        // Calculate total fees (energy + network fees)
        const energyFee = (tx.energy_fee || 0) / 1_000_000;
        const netFee = (tx.net_fee || 0) / 1_000_000;
        const totalFee = energyFee + netFee;
        
        // Try to parse TRC-20 transfer
        const trc20Transfer = this.parseTRC20TransferFromData(data, ownerAddress, walletAddress, contractAddress);
        if (trc20Transfer) {
          return {
            hash,
            blockNumber, 
            timestamp,
            from: trc20Transfer.from,
            to: trc20Transfer.to,
            amount: trc20Transfer.amount,
            currency: trc20Transfer.currency,
            type: trc20Transfer.type,
            status: status as 'success' | 'failed',
            gasUsed: tx.net_usage,
            gasFee: totalFee, // Use total fee instead of just energy_fee
            contractAddress,
            tokenType: 'trc20',
            blockchain: 'tron',
            network: 'mainnet'
          };
        }
        
        // If we can't parse it as TRC-20 but it's a smart contract call, 
        // try to determine token from contract address
        const tokenInfo = this.getTokenInfoFromContract(contractAddress);
        if (tokenInfo) {
          return {
            hash,
            blockNumber,
            timestamp,
            from: ownerAddress,
            to: contractAddress,
            amount: 0, // We couldn't parse the amount, but we know it's a token transfer
            currency: tokenInfo.symbol,
            type: 'outgoing', // Default to outgoing for contract interactions
            status: status as 'success' | 'failed',
            gasUsed: tx.net_usage,
            gasFee: totalFee, // Use total fee instead of just energy_fee
            contractAddress,
            tokenType: 'trc20',
            blockchain: 'tron',
            network: 'mainnet'
          };
        }
        
        // If it's not a recognized token contract, filter out generic contract interactions
        // We only want to show Native TRX and TRC-20 token transactions
        console.log(`🚫 Filtering out unrecognized contract interaction: ${contractAddress}`);
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing TronGrid transaction:', error);
      return null;
    }
  }

  /**
   * Get token info from Tron contract address
   */
  private static getTokenInfoFromContract(contractAddress: string): { symbol: string; decimals: number } | null {
    // Known TRC-20 token contracts on Tron mainnet (all lowercase)
    const tokenContracts: Record<string, { symbol: string; decimals: number }> = {
      // USDT TRC-20
      'tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t': { symbol: 'USDT', decimals: 6 },
      // USDC TRC-20
      'tekxitehnsmsezxqrbj4w32run966rdz8': { symbol: 'USDC', decimals: 6 },
      // WIN
      'tla2f6vpqdgre67v1736s7bj8ray5wyju7': { symbol: 'WIN', decimals: 6 },
      // JUST (JST)
      'tcfll5dx5zjdknwuesxxi1vpwjlvmwzzy9': { symbol: 'JST', decimals: 18 },
      // APE NFT
      'tkkeibotkxxkjpbmvfbv4a8ov5rafrdmf9': { symbol: 'APENFT', decimals: 6 },
      // BitTorrent (BTT)
      'ta9t8fsmaupvb1gc4o6gg3j3kpccrv8czh': { symbol: 'BTT', decimals: 18 },
      // SUN Token
      'tksxda8hz8e5f3y1lgkvr9bp7mx9dczqgn': { symbol: 'SUN', decimals: 18 },
      // WTRX (Wrapped TRX)
      'tnuc9qxpxyqqrxhz4wq13rs8s49ahe87cr': { symbol: 'WTRX', decimals: 6 },
      // TUSD
      'teusx7hzq2g5vxz4xmhw8jqm7snpctqxwz': { symbol: 'TUSD', decimals: 18 },
      // USDJ
      'tmz2sza6ntsaddrctafkvhcm2a5gnrj8f7': { symbol: 'USDJ', decimals: 18 },
      // WBTC (Wrapped Bitcoin)
      'txlaq63xefl6ktzb1eejqyje2yybyyeazr': { symbol: 'WBTC', decimals: 8 },
      // WETH (Wrapped Ethereum) 
      'thb4cqfrpaytoggzzg5dmruwbqz3ub6w1f': { symbol: 'WETH', decimals: 18 },
      // Default fallback - if contract not recognized, try to parse anyway
      // Note: This should be expanded based on actual tokens encountered
    };
    
    const normalizedAddress = contractAddress.toLowerCase();
    
    // Return known token info if available
    if (tokenContracts[normalizedAddress]) {
      return tokenContracts[normalizedAddress];
    }
    
    // For unknown tokens, try to create a fallback entry with default decimals
    // This prevents transactions from being completely ignored
    console.log(`⚠️ Unknown TRC-20 contract: ${contractAddress}, using fallback with 18 decimals`);
    return {
      symbol: `TRC20_${normalizedAddress.substring(0, 8).toUpperCase()}`, // Short identifier
      decimals: 18 // Common default for TRC-20 tokens
    };
  }

  /**
   * Parse TRC-20 transfer data from smart contract call data
   */
  private static parseTRC20TransferFromData(
    data: string, 
    fromAddress: string, 
    walletAddress: string, 
    contractAddress: string
  ): {
    from: string;
    to: string;
    amount: number;
    currency: string;
    type: 'incoming' | 'outgoing';
  } | null {
    try {
      if (!data || data.length < 8) return null;
      
      // TRC-20 transfer function signature is: transfer(address,uint256)
      // Method ID: a9059cbb (first 4 bytes)
      const methodId = data.substring(0, 8);
      if (methodId.toLowerCase() !== 'a9059cbb') return null;
      
      // Parse parameters: address (32 bytes) + amount (32 bytes)
      const toAddressHex = data.substring(8, 72); // 32 bytes for address
      const amountHex = data.substring(72, 136); // 32 bytes for amount
      
      // Convert hex amount to decimal
      const amountRaw = parseInt(amountHex, 16);
      
      // Convert hex address to Tron base58 format (simplified)
      // Remove leading zeros from address and add Tron prefix
      const cleanAddressHex = toAddressHex.replace(/^0+/, '') || '0';
      const toAddress = '41' + cleanAddressHex.padStart(40, '0');
      
      // Convert all addresses to consistent format for comparison
      const normalizedWallet = this.addressToHexFormat(walletAddress);
      const normalizedFrom = this.addressToHexFormat(fromAddress);
      const normalizedTo = this.addressToHexFormat(toAddress);
      
      console.log(`🔧 Address normalization for comparison:`, {
        original: { wallet: walletAddress, from: fromAddress, to: toAddress },
        normalized: { wallet: normalizedWallet, from: normalizedFrom, to: normalizedTo },
        comparison: {
          isWalletFrom: normalizedWallet === normalizedFrom,
          isWalletTo: normalizedWallet === normalizedTo
        }
      });
      
      // For TRC-20 transfers:
      // - fromAddress is the transaction owner (who initiated the transaction)
      // - toAddress is parsed from contract data (who receives the tokens)
      // - The actual token sender is the transaction owner (fromAddress)
      // - The actual token receiver is the parsed toAddress
      
      let actualFrom, actualTo, type;
      
      if (normalizedFrom === normalizedWallet) {
        // Our wallet is the transaction owner = we're sending tokens
        actualFrom = normalizedWallet;
        actualTo = normalizedTo;
        type = 'outgoing';
      } else if (normalizedTo === normalizedWallet) {
        // Our wallet is the recipient = we're receiving tokens
        actualFrom = normalizedFrom;
        actualTo = normalizedWallet;
        type = 'incoming';
      } else {
        // Neither sender nor receiver is our wallet - shouldn't happen in our transaction list
        actualFrom = normalizedFrom;
        actualTo = normalizedTo;
        type = 'outgoing'; // Default fallback
      }
      
      // Determine token info from contract address
      const tokenInfo = this.getTokenInfoFromContract(contractAddress);
      if (!tokenInfo) {
        // This should not happen anymore since we added fallback logic
        console.error(`❌ Failed to get token info for contract: ${contractAddress}`);
        return null;
      }
      
      const formattedAmount = amountRaw / Math.pow(10, tokenInfo.decimals);
      
      console.log(`🔍 TRC-20 Transfer Analysis:`, {
        hash: `${hash?.substring(0, 10)}...`,
        token: tokenInfo.symbol,
        amount: formattedAmount,
        contract: `${contractAddress?.substring(0, 10)}...`,
        '=== ADDRESS COMPARISON ===': '================',
        ourWallet: normalizedWallet,
        txOwner: normalizedFrom,
        tokenReceiver: normalizedTo,
        '=== DETECTION LOGIC ===': '================',
        isOurWalletTxOwner: normalizedFrom === normalizedWallet,
        isOurWalletReceiver: normalizedTo === normalizedWallet,
        '=== FINAL RESULT ===': '================',
        direction: type,
        from: actualFrom,
        to: actualTo,
        expectedSign: type === 'outgoing' ? 'NEGATIVE (-amount)' : 'POSITIVE (+amount)',
        '=== VERIFICATION ===': '================',
        walletInvolved: (normalizedFrom === normalizedWallet || normalizedTo === normalizedWallet) ? 'YES' : 'NO'
      });
      
      return {
        from: actualFrom,
        to: actualTo,
        amount: Math.abs(formattedAmount),
        currency: tokenInfo.symbol,
        type
      };
    } catch (error) {
      console.error('Error parsing TRC-20 transfer data:', error);
      return null;
    }
  }

  /**
   * Parse TronScan transaction data into standardized format
   * @deprecated Use parseTronGridTransaction for TronGrid v1 API responses
   */
  private static parseTronScanTransaction(tx: any, walletAddress: string): BlockchainTransaction | null {
    try {
      const normalizedWallet = this.normalizeAddress(walletAddress).toLowerCase();
      
      // Basic transaction info
      const hash = tx.hash;
      const blockNumber = tx.block;
      const timestamp = tx.timestamp;
      const status = tx.confirmed ? 'success' : 'failed';

      // Handle different contract types
      if (tx.contractType === 1) {
        // TRX transfer
        const fromAddress = tx.ownerAddress?.toLowerCase() || '';
        const toAddress = tx.toAddress?.toLowerCase() || '';
        const amount = (tx.amount || 0) / 1_000_000; // Convert from SUN to TRX

        const type = fromAddress === normalizedWallet ? 'outgoing' : 'incoming';

        return {
          hash,
          blockNumber,
          timestamp,
          from: fromAddress,
          to: toAddress,
          amount: Math.abs(amount),
          currency: 'TRX',
          type,
          status: status as 'success' | 'failed',
          gasUsed: tx.cost?.net_usage,
          gasFee: (tx.cost?.energy_fee || 0) / 1_000_000,
          tokenType: 'native',
          blockchain: 'tron',
          network: 'mainnet'
        };

      } else if (tx.contractType === 31 && tx.trigger_info) {
        // TRC-20 token transfer
        const trigger = tx.trigger_info;
        const contractAddress = trigger.contract;
        
        // Parse token transfer details
        const fromAddress = trigger.parameter?._owner?.toLowerCase() || '';
        const toAddress = trigger.parameter?._to?.toLowerCase() || '';
        const amount = parseFloat(trigger.parameter?._value || '0');

        // Get token info
        const tokenInfo = tx.tokenInfo || {};
        const tokenSymbol = tokenInfo.tokenAbbr || 'UNKNOWN';
        const tokenDecimals = tokenInfo.tokenDecimal || 6;
        
        const formattedAmount = amount / Math.pow(10, tokenDecimals);
        const type = fromAddress === normalizedWallet ? 'outgoing' : 'incoming';

        return {
          hash,
          blockNumber,
          timestamp,
          from: fromAddress,
          to: toAddress,
          amount: Math.abs(formattedAmount),
          currency: tokenSymbol,
          type,
          status: status as 'success' | 'failed',
          gasUsed: tx.cost?.net_usage,
          gasFee: (tx.cost?.energy_fee || 0) / 1_000_000,
          contractAddress,
          tokenType: 'trc20',
          blockchain: 'tron',
          network: 'mainnet'
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing TronScan transaction:', error);
      return null;
    }
  }

  /**
   * Parse TRC-20 transaction from TronGrid API response
   */
  private static parseTRC20Transaction(tx: any, walletAddress: string): BlockchainTransaction {
    // Normalize addresses for comparison (keep in original format but lowercase)
    const normalizedWallet = walletAddress.toLowerCase();
    const fromAddress = (tx.from || '').toLowerCase();
    const toAddress = (tx.to || '').toLowerCase();
    
    // Determine transaction direction
    const isIncoming = toAddress === normalizedWallet;
    
    // Get token info
    const tokenInfo = tx.token_info || {};
    const symbol = tokenInfo.symbol || 'UNKNOWN';
    const decimals = tokenInfo.decimals || 6;
    
    // Calculate amount
    const rawAmount = parseFloat(tx.value || '0');
    const amount = rawAmount / Math.pow(10, decimals);
    
    console.log(`💰 Parsing TRC-20 transaction:`, {
      hash: tx.transaction_id,
      from: fromAddress,
      to: toAddress,
      wallet: normalizedWallet,
      isIncoming,
      amount,
      symbol
    });
    
    return {
      hash: tx.transaction_id,
      from: tx.from,
      to: tx.to,
      amount: isIncoming ? amount : -amount,
      currency: symbol,
      timestamp: tx.block_timestamp || Date.now(),
      status: 'success',
      type: isIncoming ? 'incoming' : 'outgoing',
      fee: 0, // TRC-20 fees are paid in TRX
      blockchain: 'tron',
      tokenType: 'trc20',
      contractAddress: tokenInfo.address
    };
  }

  /**
   * Get transaction history for specific TRC-20 tokens using TronGrid v1 API
   */
  static async getTRC20TransactionHistory(
    address: string,
    tokenSymbol: string,
    options: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<BlockchainTransaction[]> {
    try {
      console.log('🚀 Fetching TRC-20 transaction history via TronGrid v1 API:', {
        address,
        token: tokenSymbol,
        ...options
      });

      const normalizedAddress = TronGridService.normalizeAddress(address);
      const { limit = 1000, startDate, endDate } = options;
      
      // Get the token contract address for the symbol
      const tokenInfo = TronGridService.TOKEN_CONTRACTS[tokenSymbol.toUpperCase()];
      if (!tokenInfo) {
        console.warn(`⚠️ Unknown token symbol: ${tokenSymbol}`);
        return [];
      }

      // Use TronGrid v1 API endpoint for TRC20 transactions
      const endpoint = `/v1/accounts/${normalizedAddress}/transactions/trc20`;
      const params = new URLSearchParams();
      
      // Add query parameters
      params.append('limit', Math.min(limit, 200).toString());
      params.append('contract_address', tokenInfo.address);
      
      if (startDate) {
        params.append('min_timestamp', startDate.getTime().toString());
      }
      
      if (endDate) {
        params.append('max_timestamp', endDate.getTime().toString());
      }

      const url = `${TronGridService.API_BASE_URL}${endpoint}?${params.toString()}`;
      console.log('🔍 Fetching TRC-20 transactions from:', url);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add API key if configured
      if (TronGridService.API_KEY) {
        headers['TRON-PRO-API-KEY'] = TronGridService.API_KEY;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`TronGrid API error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const transactions = responseData.data || [];
      
      console.log(`📊 Received ${transactions.length} TRC-20 transactions from API`);

      // Parse TRC-20 transactions
      const parsedTransactions = transactions.map((tx: any) => TronGridService.parseTRC20Transaction(tx, normalizedAddress));
      
      console.log(`✅ Parsed ${parsedTransactions.length} TRC-20 ${tokenSymbol} transactions`);
      return parsedTransactions;

    } catch (error) {
      console.error(`❌ Error fetching TRC-20 ${tokenSymbol} transaction history:`, error);
      throw error;
    }
  }

  /**
   * Parse TronScan TRC-20 transfer data
   * @deprecated This method is kept for compatibility but TronGrid v1 API is now preferred
   */
  private static parseTronScanTRC20Transfer(transfer: any, walletAddress: string, expectedTokenSymbol?: string): BlockchainTransaction | null {
    try {
      const normalizedWallet = this.normalizeAddress(walletAddress).toLowerCase();
      
      const hash = transfer.transaction_id;
      const blockNumber = transfer.block;
      const timestamp = transfer.block_ts;
      const fromAddress = transfer.from_address?.toLowerCase() || '';
      const toAddress = transfer.to_address?.toLowerCase() || '';
      const amount = parseFloat(transfer.quant || '0');
      
      // Try to get token symbol from response, fallback to expected symbol
      let tokenSymbol = transfer.tokenInfo?.tokenAbbr || transfer.tokenAbbr || expectedTokenSymbol || 'UNKNOWN';
      const tokenDecimals = transfer.tokenInfo?.tokenDecimal || transfer.tokenDecimal || 6;
      const contractAddress = transfer.contract_address;
      
      // Map known contract addresses to token symbols as fallback
      const knownContracts: Record<string, string> = {
        'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t': 'USDT',
        'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8': 'USDC'
      };
      
      if (tokenSymbol === 'UNKNOWN' && contractAddress && knownContracts[contractAddress]) {
        tokenSymbol = knownContracts[contractAddress];
      }
      
      console.log('🔍 Parsing TRC-20 transfer:', {
        hash: hash.substring(0, 10) + '...',
        tokenSymbol,
        tokenInfo: transfer.tokenInfo,
        contractAddress,
        amount
      });

      const formattedAmount = amount / Math.pow(10, tokenDecimals);
      const type = fromAddress === normalizedWallet ? 'outgoing' : 'incoming';

      return {
        hash,
        blockNumber,
        timestamp,
        from: fromAddress,
        to: toAddress,
        amount: Math.abs(formattedAmount),
        currency: tokenSymbol,
        type,
        status: transfer.confirmed ? 'success' : 'failed',
        contractAddress,
        tokenType: 'trc20',
        blockchain: 'tron',
        network: 'mainnet'
      };
    } catch (error) {
      console.error('Error parsing TRC-20 transfer:', error);
      return null;
    }
  }
}