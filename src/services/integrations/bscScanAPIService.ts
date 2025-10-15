import { BlockchainTransaction, BlockchainBalance } from '@/types/blockchain.types';

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface BSCScanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  confirmations: string;
}

interface BSCScanTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
  gasPrice: string;
  gasUsed: string;
}

interface BSCScanResponse<T> {
  status: string;
  message: string;
  result: T[];
}

interface BSCScanBalanceResponse {
  status: string;
  message: string;
  result: string;
}

/**
 * Native BSCScan API Service for optimal BNB Smart Chain performance
 * Uses BSCScan's native API infrastructure for faster response times
 */
export class BSCScanAPIService {
  private static readonly API_KEY = process.env.BSCSCAN_API_KEY;
  private static readonly BASE_URL = 'https://api.bscscan.com/api';
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // In-memory cache for API responses
  private static cache = new Map<string, CacheEntry>();

  /**
   * Check if BSCScan API is configured
   */
  static isConfigured(): boolean {
    const hasKey = !!this.API_KEY && this.API_KEY.length > 10;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Checking BSCScan API config:', {
        hasAPIKey: hasKey,
        keyLength: this.API_KEY?.length || 0,
        usingNativeBSCScan: true
      });
    }
    
    return hasKey;
  }

  /**
   * Make a cached API request to BSCScan
   */
  private static async makeRequest<T>(
    params: Record<string, string | number>,
    cacheKey?: string
  ): Promise<BSCScanResponse<T>> {
    // Check cache first
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`📦 BSCScan cache hit for ${cacheKey}`);
        return cached.data;
      }
    }

    if (!this.API_KEY) {
      throw new Error('BSCScan API key not configured');
    }

    const requestParams = new URLSearchParams({
      ...params,
      apikey: this.API_KEY
    } as Record<string, string>);

    const url = `${this.BASE_URL}?${requestParams.toString()}`;
    
    console.log(`🌐 BSCScan API Request:`, url.replace(this.API_KEY, 'XXX'));

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'EazyBizy-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BSCScanResponse<T> = await response.json();

      if (data.status === '0' && data.message !== 'No transactions found') {
        // Check for API key errors first
        const isApiKeyError = data.message === 'NOTOK' && typeof data.result === 'string' && 
          (data.result.includes('Invalid API Key') || data.result.includes('#err2'));
        
        if (isApiKeyError) {
          console.error(`❌ BSCScan API key invalid: ${data.result}`);
          console.error(`💡 Get a valid BSCScan API key from: https://bscscan.com/apis`);
          console.error(`💡 BSCScan requires a separate API key from Etherscan`);
          throw new Error(`Invalid BSCScan API key: ${data.result}`);
        }
        
        // Enhanced error handling with retry logic
        const isRateLimitError = data.message === 'NOTOK' || 
          data.message.toLowerCase().includes('rate limit') ||
          data.message.toLowerCase().includes('max calls');
          
        if (isRateLimitError) {
          console.warn(`⚠️ BSCScan API rate limit detected: ${data.message}`);
          
          // Implement exponential backoff retry
          const maxRetries = 2; // Fewer retries for BSCScan due to better performance
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const backoffDelay = Math.min(500 * Math.pow(2, attempt - 1), 2000); // 500ms, 1s, max 2s
            console.log(`🔄 BSCScan retry attempt ${attempt}/${maxRetries}, waiting ${backoffDelay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            
            try {
              const retryResponse = await fetch(url, {
                method: 'GET',
                headers: {
                  'User-Agent': 'EazyBizy-App/1.0'
                }
              });
              
              if (retryResponse.ok) {
                const retryData: BSCScanResponse<T> = await retryResponse.json();
                
                if (retryData.status === '1' || retryData.message === 'No transactions found') {
                  console.log(`✅ BSCScan retry successful after ${attempt} attempt(s)`);
                  if (cacheKey) {
                    this.cache.set(cacheKey, { data: retryData, timestamp: Date.now() });
                  }
                  return retryData;
                }
              }
            } catch (retryError) {
              console.warn(`⚠️ BSCScan retry attempt ${attempt} failed:`, retryError.message);
              if (attempt === maxRetries) {
                console.error(`❌ All BSCScan retry attempts failed, returning empty result`);
                return { ...data, result: [] as T[] } as BSCScanResponse<T>;
              }
            }
          }
          
          return { ...data, result: [] as T[] } as BSCScanResponse<T>;
        }
        
        // Handle other API errors
        if (data.message === 'NOTOK') {
          const isApiKeyError = typeof data.result === 'string' && 
            (data.result.includes('Invalid API Key') || data.result.includes('#err2'));
          
          if (isApiKeyError) {
            console.error(`❌ BSCScan API key invalid: ${data.result}`);
            console.error(`💡 Get a valid BSCScan API key from: https://bscscan.com/apis`);
            console.error(`💡 BSCScan requires a separate API key from Etherscan`);
            // Throw error to trigger fallback to Etherscan v2
            throw new Error(`Invalid BSCScan API key: ${data.result}`);
          }
          
          return { ...data, result: [] as T[] } as BSCScanResponse<T>;
        }
        
        throw new Error(`BSCScan API error: ${data.message}`);
      }

      // Cache successful responses
      if (cacheKey) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error(`❌ BSCScan API request failed:`, error);
      throw error;
    }
  }

  /**
   * Convert Wei to Ether (18 decimals)
   */
  private static weiToEther(wei: string): number {
    return parseFloat(wei) / Math.pow(10, 18);
  }

  /**
   * Convert token value based on decimals
   */
  private static convertTokenValue(value: string, decimals: string): number {
    const decimalCount = parseInt(decimals) || 18;
    return parseFloat(value) / Math.pow(10, decimalCount);
  }

  /**
   * Convert BSCScan transaction to BlockchainTransaction format
   */
  private static convertTransaction(
    tx: BSCScanTransaction,
    walletAddress: string
  ): BlockchainTransaction {
    const timestamp = parseInt(tx.timeStamp) * 1000;
    const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
    const amount = this.weiToEther(tx.value);
    const gasUsed = parseInt(tx.gasUsed);
    const gasPrice = this.weiToEther(tx.gasPrice);
    const gasFee = gasUsed * gasPrice;

    return {
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber),
      timestamp,
      from: tx.from,
      to: tx.to,
      amount,
      currency: 'BNB',
      type: isIncoming ? 'incoming' : 'outgoing',
      status: tx.isError === '0' && tx.txreceipt_status === '1' ? 'success' : 'failed',
      gasUsed,
      gasFee,
      contractAddress: tx.contractAddress || undefined,
      tokenType: 'native',
      blockchain: 'bsc',
      network: 'mainnet'
    };
  }

  /**
   * Convert BSCScan token transfer to BlockchainTransaction format
   */
  private static convertTokenTransfer(
    tx: BSCScanTokenTransfer,
    walletAddress: string
  ): BlockchainTransaction {
    const timestamp = parseInt(tx.timeStamp) * 1000;
    const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
    const amount = this.convertTokenValue(tx.value, tx.tokenDecimal);
    
    const gasUsed = tx.gasUsed ? parseInt(tx.gasUsed) : 0;
    const gasPriceWei = tx.gasPrice ? tx.gasPrice : '0';
    const gasPrice = this.weiToEther(gasPriceWei);
    const gasFee = gasUsed * gasPrice;

    return {
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber),
      timestamp,
      from: tx.from,
      to: tx.to,
      amount,
      currency: tx.tokenSymbol,
      type: isIncoming ? 'incoming' : 'outgoing',
      status: 'success',
      gasUsed,
      gasFee,
      contractAddress: tx.contractAddress,
      tokenType: 'bep20',
      blockchain: 'bsc',
      network: 'mainnet'
    };
  }

  /**
   * Fetch normal BNB transactions for an address
   */
  static async getNormalTransactions(
    address: string,
    options: {
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
    } = {}
  ): Promise<BlockchainTransaction[]> {
    if (!this.isConfigured()) {
      console.warn(`⚠️ BSCScan API not configured`);
      return [];
    }

    const {
      startBlock = 0,
      endBlock = 99999999,
      page = 1,
      offset = 10000, // BSCScan supports larger batches
      sort = 'desc'
    } = options;

    const cacheKey = `bsc-normal-${address}-${startBlock}-${endBlock}-${page}-${offset}`;

    try {
      const response = await this.makeRequest<BSCScanTransaction>(
        {
          module: 'account',
          action: 'txlist',
          address,
          startblock: startBlock,
          endblock: endBlock,
          page,
          offset,
          sort
        },
        cacheKey
      );

      const transactions = response.result || [];
      return transactions.map(tx => this.convertTransaction(tx, address));
    } catch (error) {
      console.error(`❌ Failed to fetch BSC normal transactions for ${address}:`, error);
      // Re-throw API key errors to trigger fallback
      if (error instanceof Error && error.message.includes('Invalid BSCScan API key')) {
        throw error;
      }
      return [];
    }
  }

  /**
   * Fetch BEP-20 token transfers for an address
   */
  static async getTokenTransfers(
    address: string,
    options: {
      contractAddress?: string;
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
    } = {}
  ): Promise<BlockchainTransaction[]> {
    if (!this.isConfigured()) {
      console.warn(`⚠️ BSCScan API not configured`);
      return [];
    }

    const {
      contractAddress,
      startBlock = 0,
      endBlock = 99999999,
      page = 1,
      offset = 10000, // BSCScan supports larger batches
      sort = 'desc'
    } = options;

    const cacheKey = `bsc-tokens-${address}-${contractAddress || 'all'}-${startBlock}-${endBlock}-${page}-${offset}`;

    try {
      const params: Record<string, string | number> = {
        module: 'account',
        action: 'tokentx',
        address,
        startblock: startBlock,
        endblock: endBlock,
        page,
        offset,
        sort
      };

      if (contractAddress) {
        params.contractaddress = contractAddress;
      }

      const response = await this.makeRequest<BSCScanTokenTransfer>(
        params,
        cacheKey
      );

      const transfers = response.result || [];
      return transfers.map(tx => this.convertTokenTransfer(tx, address));
    } catch (error) {
      console.error(`❌ Failed to fetch BSC token transfers for ${address}:`, error);
      // Re-throw API key errors to trigger fallback
      if (error instanceof Error && error.message.includes('Invalid BSCScan API key')) {
        throw error;
      }
      return [];
    }
  }

  /**
   * Fetch internal BNB transactions for an address
   */
  static async getInternalTransactions(
    address: string,
    options: {
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
    } = {}
  ): Promise<BlockchainTransaction[]> {
    if (!this.isConfigured()) {
      console.warn(`⚠️ BSCScan API not configured`);
      return [];
    }

    const {
      startBlock = 0,
      endBlock = 99999999,
      page = 1,
      offset = 10000,
      sort = 'desc'
    } = options;

    const cacheKey = `bsc-internal-${address}-${startBlock}-${endBlock}-${page}-${offset}`;

    try {
      const response = await this.makeRequest<BSCScanTransaction>(
        {
          module: 'account',
          action: 'txlistinternal',
          address,
          startblock: startBlock,
          endblock: endBlock,
          page,
          offset,
          sort
        },
        cacheKey
      );

      const transactions = response.result || [];
      
      return transactions.map(tx => {
        const baseTx = this.convertTransaction(tx, address);
        const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
        
        return {
          ...baseTx,
          type: isIncoming ? 'incoming' : 'outgoing',
          tokenType: 'native',
          isInternal: true,
          description: `Internal transaction from contract ${tx.from.substring(0, 10)}...`
        };
      });
    } catch (error) {
      console.error(`❌ Failed to fetch BSC internal transactions for ${address}:`, error);
      // Re-throw API key errors to trigger fallback
      if (error instanceof Error && error.message.includes('Invalid BSCScan API key')) {
        throw error;
      }
      return [];
    }
  }

  /**
   * Get BNB balance for an address
   */
  static async getNativeBalance(
    address: string,
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    if (!this.isConfigured()) {
      return {
        address,
        blockchain: 'bsc',
        network,
        balance: 0,
        unit: 'BNB',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: 'BSCScan API not configured'
      };
    }

    const cacheKey = `bsc-balance-native-${address}`;
    
    try {
      const response = await this.makeRequest<never>(
        {
          module: 'account',
          action: 'balance',
          address,
          tag: 'latest'
        },
        cacheKey
      ) as any as BSCScanBalanceResponse;

      const balanceWei = response.result || '0';
      
      if (response.status !== '1' || !response.result) {
        console.warn(`⚠️ Invalid balance response from BSCScan:`, response);
        return {
          address,
          blockchain: 'bsc',
          network,
          balance: 0,
          unit: 'BNB',
          lastUpdated: new Date(),
          isLive: false,
          tokenType: 'native',
          error: 'Failed to fetch balance - API returned invalid response'
        };
      }
      
      const balance = this.weiToEther(balanceWei);

      const result: BlockchainBalance = {
        address,
        blockchain: 'bsc',
        network,
        balance,
        unit: 'BNB',
        lastUpdated: new Date(),
        isLive: true,
        tokenType: 'native'
      };

      console.log(`✅ BNB balance fetched via BSCScan:`, {
        address: address.substring(0, 10) + '...',
        balance,
        unit: 'BNB'
      });

      return result;
    } catch (error) {
      console.error(`❌ Error fetching BNB balance:`, error);
      
      return {
        address,
        blockchain: 'bsc',
        network,
        balance: 0,
        unit: 'BNB',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch comprehensive BSC transactions with optimized pagination
   */
  static async getAllTransactions(
    address: string,
    options: {
      startBlock?: number;
      endBlock?: number;
      limit?: number;
      includeInternal?: boolean;
    } = {}
  ): Promise<BlockchainTransaction[]> {
    const {
      startBlock = 0,
      endBlock = 99999999,
      limit = 1000,
      includeInternal = true
    } = options;

    console.log(`🚀 Fetching ALL BSC transactions for ${address} with optimized BSCScan API`);

    // BSCScan supports larger batches and faster requests
    const maxPerRequest = 10000; // Much larger batches than Etherscan v2
    const allNormalTransactions: BlockchainTransaction[] = [];
    const allTokenTransactions: BlockchainTransaction[] = [];
    
    try {
      // Fetch normal transactions with optimized pagination
      let normalPage = 1;
      let normalHasMore = true;
      
      while (normalHasMore && allNormalTransactions.length < 50000) {
        const normalBatch = await this.getNormalTransactions(address, { 
          startBlock, 
          endBlock, 
          page: normalPage, 
          offset: maxPerRequest,
          sort: 'desc'
        });
        
        if (normalBatch.length === 0) {
          normalHasMore = false;
        } else {
          allNormalTransactions.push(...normalBatch);
          console.log(`📄 BSC Normal: Fetched ${normalBatch.length} on page ${normalPage}, total: ${allNormalTransactions.length}`);
          
          if (normalBatch.length < maxPerRequest) {
            normalHasMore = false;
          }
        }
        
        normalPage++;
        
        // Optimized rate limiting for BSCScan
        if (normalHasMore) {
          await new Promise(r => setTimeout(r, 100)); // Much faster than Etherscan v2
        }
      }
      
      // Shorter delay between API types for BSCScan
      await new Promise(r => setTimeout(r, 200));
      
      // Fetch token transactions with optimized pagination
      let tokenPage = 1;
      let tokenHasMore = true;
      
      while (tokenHasMore && allTokenTransactions.length < 50000) {
        const tokenBatch = await this.getTokenTransfers(address, { 
          startBlock, 
          endBlock, 
          page: tokenPage, 
          offset: maxPerRequest,
          sort: 'desc'
        });
        
        if (tokenBatch.length === 0) {
          tokenHasMore = false;
        } else {
          allTokenTransactions.push(...tokenBatch);
          console.log(`📄 BSC Tokens: Fetched ${tokenBatch.length} on page ${tokenPage}, total: ${allTokenTransactions.length}`);
          
          if (tokenBatch.length < maxPerRequest) {
            tokenHasMore = false;
          }
        }
        
        tokenPage++;
        
        if (tokenHasMore) {
          await new Promise(r => setTimeout(r, 100));
        }
      }

      // Fetch internal transactions if requested
      let allInternalTransactions: BlockchainTransaction[] = [];
      
      if (includeInternal) {
        await new Promise(r => setTimeout(r, 200));
        
        let internalPage = 1;
        let internalHasMore = true;
        
        while (internalHasMore && allInternalTransactions.length < 50000) {
          const internalBatch = await this.getInternalTransactions(address, { 
            startBlock, 
            endBlock, 
            page: internalPage, 
            offset: maxPerRequest,
            sort: 'desc'
          });
          
          if (internalBatch.length === 0) {
            internalHasMore = false;
          } else {
            allInternalTransactions.push(...internalBatch);
            console.log(`📄 BSC Internal: Fetched ${internalBatch.length} on page ${internalPage}, total: ${allInternalTransactions.length}`);
            
            if (internalBatch.length < maxPerRequest) {
              internalHasMore = false;
            }
          }
          
          internalPage++;
          
          if (internalHasMore) {
            await new Promise(r => setTimeout(r, 100));
          }
        }
      }

      // Combine all transactions
      const allTransactions: BlockchainTransaction[] = [
        ...allNormalTransactions,
        ...allTokenTransactions,
        ...allInternalTransactions
      ];

      // Remove duplicates
      const uniqueTransactions = new Map<string, BlockchainTransaction>();
      
      allTransactions.forEach(tx => {
        const key = `${tx.hash}-${tx.currency}-${tx.type}`;
        const existing = uniqueTransactions.get(key);
        
        if (tx.isInternal) {
          uniqueTransactions.set(key, tx);
        } else if (!existing || (tx.gasFee && tx.gasFee > 0 && (!existing.gasFee || existing.gasFee === 0))) {
          uniqueTransactions.set(key, tx);
        }
      });

      const finalTransactions = Array.from(uniqueTransactions.values());
      finalTransactions.sort((a, b) => b.timestamp - a.timestamp);

      const limitedTransactions = finalTransactions.slice(0, limit);

      console.log(`✅ BSCScan: Fetched ${limitedTransactions.length} total transactions (much faster than Etherscan v2!)`);
      
      return limitedTransactions;
    } catch (error) {
      console.error(`❌ Failed to fetch BSC transactions for ${address}:`, error);
      // Re-throw API key errors to trigger fallback to Etherscan v2
      if (error instanceof Error && error.message.includes('Invalid BSCScan API key')) {
        throw error;
      }
      return [];
    }
  }

  /**
   * Clear the cache
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ BSCScan API cache cleared');
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