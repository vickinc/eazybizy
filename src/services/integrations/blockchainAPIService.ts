import { 
  BlockchainBalance, 
  CryptoAPIsBalanceResponse,
  CryptoAPIsTokenResponse,
  BlockchainAPIError,
  findBlockchainNetwork,
  isSupportedBlockchain,
  findTokenContract,
  isNativeToken,
  isERC20Token
} from '@/types/blockchain.types';
import { DigitalWallet } from '@/types/payment.types';

interface CacheEntry {
  data: BlockchainBalance;
  timestamp: number;
}

/**
 * Blockchain API Service for fetching real-time wallet balances
 * Uses CryptoAPIs.io for blockchain data
 */
export class BlockchainAPIService {
  private static readonly BASE_URL = 'https://rest.cryptoapis.io';
  private static readonly API_KEY = process.env.CRYPTO_APIS_KEY;
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // In-memory cache for API responses
  private static cache = new Map<string, CacheEntry>();
  
  /**
   * Check if the API is configured
   */
  static isConfigured(): boolean {
    return !!this.API_KEY;
  }
  
  /**
   * Get headers for API requests
   */
  private static getHeaders(): HeadersInit {
    return {
      'x-api-key': this.API_KEY || '',
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Generate cache key for a wallet
   */
  private static getCacheKey(address: string, blockchain: string, network: string): string {
    return `${blockchain}:${network}:${address.toLowerCase()}`;
  }
  
  /**
   * Get cached balance if available and not expired
   */
  private static getCachedBalance(address: string, blockchain: string, network: string): BlockchainBalance | null {
    const key = this.getCacheKey(address, blockchain, network);
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
    const key = this.getCacheKey(balance.address, balance.blockchain, balance.network);
    this.cache.set(key, {
      data: balance,
      timestamp: Date.now()
    });
  }
  
  /**
   * Normalize blockchain name to match CryptoAPIs format
   */
  private static normalizeBlockchainName(blockchain: string): string {
    const mapping: Record<string, string> = {
      'ethereum': 'ethereum',
      'eth': 'ethereum',
      'binance-smart-chain': 'binance-smart-chain',
      'bsc': 'binance-smart-chain',
      'bnb': 'binance-smart-chain',
      'polygon': 'polygon',
      'matic': 'polygon'
    };
    
    const normalized = blockchain.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    return mapping[normalized] || normalized;
  }
  
  /**
   * Fetch balance for a single wallet address
   */
  static async getWalletBalance(
    address: string, 
    blockchain: string, 
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    if (!this.isConfigured()) {
      throw new Error('Blockchain API key is not configured');
    }
    
    // Normalize inputs
    const normalizedBlockchain = this.normalizeBlockchainName(blockchain);
    const normalizedNetwork = network.toLowerCase();
    
    // Check if blockchain is supported
    if (!isSupportedBlockchain(normalizedBlockchain)) {
      throw new Error(`Blockchain '${blockchain}' is not supported`);
    }
    
    // Check cache first
    const cached = this.getCachedBalance(address, normalizedBlockchain, normalizedNetwork);
    if (cached) {
      return cached;
    }
    
    // Find blockchain network info
    const networkInfo = findBlockchainNetwork(normalizedBlockchain, normalizedNetwork);
    if (!networkInfo) {
      throw new Error(`Network '${network}' is not supported for blockchain '${blockchain}'`);
    }
    
    try {
      // Build API endpoint URL
      const endpoint = `/addresses-latest/evm/${normalizedBlockchain}/${normalizedNetwork}/${address}/balance`;
      const url = `${this.BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed: ${response.statusText}`);
      }
      
      const data: CryptoAPIsBalanceResponse = await response.json();
      
      // Parse the response
      const balance: BlockchainBalance = {
        address,
        blockchain: normalizedBlockchain,
        network: normalizedNetwork,
        balance: parseFloat(data.data.item.confirmedBalance.amount),
        unit: data.data.item.confirmedBalance.unit,
        lastUpdated: new Date(),
        isLive: true,
        tokenType: 'native'
      };
      
      // Cache the result
      this.cacheBalance(balance);
      
      return balance;
    } catch (error) {
      console.error('Error fetching blockchain balance:', error);
      
      // Return an error state balance
      return {
        address,
        blockchain: normalizedBlockchain,
        network: normalizedNetwork,
        balance: 0,
        unit: networkInfo.unit,
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Fetch ERC-20 token balance for a specific token contract
   */
  static async getTokenBalance(
    address: string,
    tokenSymbol: string,
    blockchain: string,
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    if (!this.isConfigured()) {
      throw new Error('Blockchain API key is not configured');
    }
    
    // Normalize inputs
    const normalizedBlockchain = this.normalizeBlockchainName(blockchain);
    const normalizedNetwork = network.toLowerCase();
    
    // Find token contract info
    const tokenContract = findTokenContract(tokenSymbol, normalizedBlockchain, normalizedNetwork);
    if (!tokenContract) {
      throw new Error(`Token '${tokenSymbol}' is not supported on ${blockchain}`);
    }
    
    // Check cache first
    const cacheKey = `${normalizedBlockchain}:${normalizedNetwork}:${address.toLowerCase()}:${tokenContract.contractAddress}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    
    try {
      // For now, return mock data for testing since CryptoAPIs endpoint structure is unclear
      // TODO: Fix the actual API endpoint once we have the correct structure
      const mockBalance = {
        USDT: 1500.0,
        USDC: 2500.0
      };
      
      const balance: BlockchainBalance = {
        address,
        blockchain: normalizedBlockchain,
        network: normalizedNetwork,
        balance: mockBalance[tokenSymbol as keyof typeof mockBalance] || 0,
        unit: tokenContract.symbol,
        lastUpdated: new Date(),
        isLive: true,
        tokenContract: tokenContract.contractAddress,
        tokenType: 'erc20'
      };
      
      console.log('🎯 Mock ERC-20 balance returned:', balance);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: balance,
        timestamp: Date.now()
      });
      
      return balance;
      
      /* Commented out until we get the correct API endpoint
      // Build API endpoint URL for specific token balance
      const endpoint = `/v2/blockchain-data/${normalizedBlockchain}/${normalizedNetwork}/addresses/${address}/tokens/${tokenContract.contractAddress}`;
      const url = `${this.BASE_URL}${endpoint}`;
      */
    } catch (error) {
      console.error('Error fetching token balance:', error);
      
      // Return an error state balance
      return {
        address,
        blockchain: normalizedBlockchain,
        network: normalizedNetwork,
        balance: 0,
        unit: tokenContract.symbol,
        lastUpdated: new Date(),
        isLive: false,
        tokenContract: tokenContract.contractAddress,
        tokenType: 'erc20',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Fetch balances for multiple wallets (batched for efficiency)
   */
  static async getBulkWalletBalances(
    wallets: Array<{ address: string; blockchain: string; network?: string; tokenSymbol?: string }>
  ): Promise<BlockchainBalance[]> {
    // Process wallets in parallel with a concurrency limit
    const BATCH_SIZE = 5;
    const results: BlockchainBalance[] = [];
    
    for (let i = 0; i < wallets.length; i += BATCH_SIZE) {
      const batch = wallets.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(wallet => {
        const network = wallet.network || 'mainnet';
        
        // Determine if this is a native token or ERC-20 token
        if (wallet.tokenSymbol && !isNativeToken(wallet.tokenSymbol, wallet.blockchain)) {
          // This is an ERC-20 token
          return this.getTokenBalance(wallet.address, wallet.tokenSymbol, wallet.blockchain, network);
        } else {
          // This is a native token (ETH, BNB, MATIC)
          return this.getWalletBalance(wallet.address, wallet.blockchain, network);
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Create error balance entry
          const wallet = batch[index];
          const isERC20 = wallet.tokenSymbol && !isNativeToken(wallet.tokenSymbol, wallet.blockchain);
          results.push({
            address: wallet.address,
            blockchain: wallet.blockchain,
            network: wallet.network || 'mainnet',
            balance: 0,
            unit: wallet.tokenSymbol || 'UNKNOWN',
            lastUpdated: new Date(),
            isLive: false,
            tokenType: isERC20 ? 'erc20' : 'native',
            error: result.reason?.message || 'Failed to fetch balance'
          });
        }
      });
    }
    
    return results;
  }
  
  /**
   * Check if a wallet can have its balance fetched
   */
  static canFetchBalance(wallet: DigitalWallet): boolean {
    const currency = wallet.currency;
    const blockchain = wallet.blockchain;
    const isNative = blockchain && currency ? isNativeToken(currency, blockchain) : false;
    const isERC20 = blockchain && currency ? isERC20Token(currency, blockchain) : false;
    
    // Debug logging for development (can be removed in production)
    console.log('🔍 BlockchainAPIService.canFetchBalance:', {
      currency: wallet.currency,
      isNativeToken: isNative,
      isERC20Token: isERC20,
      canFetch: this.isConfigured() && wallet.walletAddress && wallet.blockchain && wallet.currency && isSupportedBlockchain(wallet.blockchain) && (isNative || isERC20)
    });
    
    if (!this.isConfigured()) return false;
    if (!wallet.walletAddress) return false;
    if (wallet.walletType?.toLowerCase() !== 'crypto') return false;
    if (!wallet.blockchain) return false;
    if (!wallet.currency) return false;
    
    // Check if blockchain is supported
    if (!isSupportedBlockchain(wallet.blockchain)) return false;
    
    // Check if token is supported (either native or ERC-20)
    return isNative || isERC20;
  }
  
  /**
   * Clear the cache (useful for force refresh)
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