import { BlockchainBalance, BlockchainTransaction } from '@/types/blockchain.types';

interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string;
  error?: string;
}

interface AlchemyTokenMetadata {
  decimals: number;
  logo: string | null;
  name: string;
  symbol: string;
}

interface CurrentBalanceCache {
  balance: number;
  timestamp: number;
  currency: string;
  address: string;
}

/**
 * Alchemy Service for fetching Ethereum (ETH) and ERC-20 token balances
 * Uses Alchemy's enhanced APIs for better reliability and performance
 */
export class AlchemyService {
  private static readonly API_KEY = process.env.ALCHEMY_API_KEY;
  private static readonly API_BASE_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // In-memory cache
  private static cache = new Map<string, { data: BlockchainBalance; timestamp: number }>();
  private static readonly currentBalanceCache = new Map<string, CurrentBalanceCache>();
  private static readonly CURRENT_BALANCE_CACHE_MS = 10 * 60 * 1000; // 10 minutes

  // Well-known ERC-20 token contract addresses on Ethereum mainnet
  private static readonly TOKEN_CONTRACTS: Record<string, { address: string; decimals: number }> = {
    'USDT': { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },
    'USDC': { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
    'DAI': { address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18 },
    'WBTC': { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimals: 8 },
    'LINK': { address: '0x514910771af9ca656af840dff83e8264ecf986ca', decimals: 18 },
    'UNI': { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', decimals: 18 },
    'AAVE': { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', decimals: 18 },
    'MATIC': { address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', decimals: 18 },
    'SHIB': { address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', decimals: 18 },
    'CRO': { address: '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b', decimals: 8 },
    'SAND': { address: '0x3845badade8e6dff049820680d1f14bd3903a5d0', decimals: 18 },
    'MANA': { address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942', decimals: 18 },
    'APE': { address: '0x4d224452801aced8b2f0aebe155379bb5d594381', decimals: 18 },
    'LDO': { address: '0x5a98fcbea516cf06857215779fd812ca3bef1b32', decimals: 18 },
    'ARB': { address: '0xb50721bcf8d664c30412cfbc6cf7a15145234ad1', decimals: 18 },
    'BUSD': { address: '0x4fabb145d64652a948d72533023f6e7a623c7c53', decimals: 18 },
  };

  /**
   * Check if the API is configured
   */
  static isConfigured(): boolean {
    return !!this.API_KEY && this.API_KEY !== 'your-alchemy-api-key-here';
  }

  /**
   * Get current blockchain balance - unified interface
   */
  static async getCurrentBalance(address: string, currency: string, blockchain: string = 'ethereum', network: string = 'mainnet'): Promise<number> {
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

      console.log(`🔄 Fetching fresh ${currency} balance for ${address.substring(0, 10)}... via Alchemy`);
      
      let balance = 0;
      if (currency.toUpperCase() === 'ETH') {
        const balanceObj = await this.getNativeBalance(address, blockchain, network);
        balance = balanceObj?.balance || 0;
      } else {
        // ERC-20 tokens
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
   * Fetch native ETH balance using Alchemy
   */
  static async getNativeBalance(address: string, blockchain: string, network: string = 'mainnet'): Promise<BlockchainBalance> {
    // Check cache first
    const cacheKey = `eth:${address.toLowerCase()}:native`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    if (blockchain.toLowerCase() !== 'ethereum' && blockchain.toLowerCase() !== 'eth') {
      throw new Error(`Alchemy service only supports Ethereum blockchain, got: ${blockchain}`);
    }

    if (!this.isConfigured()) {
      return {
        address,
        blockchain: 'ethereum',
        network,
        balance: 0,
        unit: 'ETH',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: 'Alchemy API key not configured'
      };
    }

    try {
      console.log('🚀 Fetching ETH balance via Alchemy:', {
        address: address.substring(0, 10) + '...',
        network
      });

      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.result) {
        // Alchemy returns balance in hex WEI (1 ETH = 10^18 WEI)
        const balanceWei = BigInt(data.result);
        const balanceETH = Number(balanceWei) / 1e18;
        
        const balance: BlockchainBalance = {
          address,
          blockchain: 'ethereum',
          network,
          balance: balanceETH,
          unit: 'ETH',
          lastUpdated: new Date(),
          isLive: true,
          tokenType: 'native'
        };
        
        // Cache the result
        this.cache.set(cacheKey, { data: balance, timestamp: Date.now() });
        
        console.log('✅ ETH balance fetched via Alchemy:', { 
          address: address.substring(0, 10) + '...', 
          balance: balanceETH, 
          unit: 'ETH'
        });
        
        return balance;
      } else if (data.error) {
        throw new Error(data.error.message || 'Alchemy API error');
      } else {
        // Account might not exist or have no balance
        const balance: BlockchainBalance = {
          address,
          blockchain: 'ethereum',
          network,
          balance: 0,
          unit: 'ETH',
          lastUpdated: new Date(),
          isLive: true,
          tokenType: 'native'
        };
        
        this.cache.set(cacheKey, { data: balance, timestamp: Date.now() });
        return balance;
      }
    } catch (error) {
      console.error('❌ Error fetching ETH balance via Alchemy:', error);
      
      return {
        address,
        blockchain: 'ethereum',
        network,
        balance: 0,
        unit: 'ETH',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch ERC-20 token balance using Alchemy's Token API
   */
  static async getTokenBalance(
    address: string,
    tokenSymbol: string,
    blockchain: string,
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    const tokenInfo = this.TOKEN_CONTRACTS[tokenSymbol.toUpperCase()];
    if (!tokenInfo) {
      return {
        address,
        blockchain: 'ethereum',
        network,
        balance: 0,
        unit: tokenSymbol.toUpperCase(),
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'erc20',
        error: `ERC-20 token '${tokenSymbol}' is not supported. Supported tokens: ${Object.keys(this.TOKEN_CONTRACTS).join(', ')}`
      };
    }

    // Check cache first
    const cacheKey = `eth:${address.toLowerCase()}:${tokenInfo.address.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }

    if (blockchain.toLowerCase() !== 'ethereum' && blockchain.toLowerCase() !== 'eth') {
      throw new Error(`Alchemy service only supports Ethereum blockchain, got: ${blockchain}`);
    }

    if (!this.isConfigured()) {
      return {
        address,
        blockchain: 'ethereum',
        network,
        balance: 0,
        unit: tokenSymbol.toUpperCase(),
        lastUpdated: new Date(),
        isLive: false,
        tokenContract: tokenInfo.address,
        tokenType: 'erc20',
        error: 'Alchemy API key not configured'
      };
    }

    try {
      console.log('🚀 Fetching ERC-20 token balance via Alchemy:', {
        address: address.substring(0, 10) + '...',
        token: tokenSymbol,
        contract: tokenInfo.address,
        decimals: tokenInfo.decimals
      });

      // Use Alchemy's alchemy_getTokenBalances method for better performance
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getTokenBalances',
          params: [
            address,
            [tokenInfo.address] // Array of token contract addresses
          ],
          id: 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('🔍 Alchemy ERC-20 Response:', JSON.stringify(data, null, 2));
      
      if (data.result && data.result.tokenBalances && data.result.tokenBalances.length > 0) {
        const tokenBalance = data.result.tokenBalances[0];
        
        if (tokenBalance.tokenBalance && tokenBalance.tokenBalance !== '0x0') {
          // Parse the hex token balance
          const balanceRaw = BigInt(tokenBalance.tokenBalance);
          const balanceFormatted = Number(balanceRaw) / Math.pow(10, tokenInfo.decimals);
          
          const balance: BlockchainBalance = {
            address,
            blockchain: 'ethereum',
            network,
            balance: balanceFormatted,
            unit: tokenSymbol.toUpperCase(),
            lastUpdated: new Date(),
            isLive: true,
            tokenContract: tokenInfo.address,
            tokenType: 'erc20'
          };
          
          // Cache the result
          this.cache.set(cacheKey, { data: balance, timestamp: Date.now() });
          
          console.log('✅ ERC-20 token balance fetched via Alchemy:', { 
            address: address.substring(0, 10) + '...', 
            token: tokenSymbol, 
            balance: balanceFormatted,
            raw: balanceRaw.toString()
          });
          
          return balance;
        }
      }
      
      // Token balance is 0 or not found
      const balance: BlockchainBalance = {
        address,
        blockchain: 'ethereum',
        network,
        balance: 0,
        unit: tokenSymbol.toUpperCase(),
        lastUpdated: new Date(),
        isLive: true,
        tokenContract: tokenInfo.address,
        tokenType: 'erc20'
      };
      
      this.cache.set(cacheKey, { data: balance, timestamp: Date.now() });
      console.log('ℹ️ ERC-20 token balance is 0 or not found');
      return balance;
      
    } catch (error) {
      console.error('❌ Error fetching ERC-20 token balance via Alchemy:', error);
      
      return {
        address,
        blockchain: 'ethereum',
        network,
        balance: 0,
        unit: tokenSymbol.toUpperCase(),
        lastUpdated: new Date(),
        isLive: false,
        tokenContract: tokenInfo.address,
        tokenType: 'erc20',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch all token balances for an address at once
   */
  static async getAllTokenBalances(address: string): Promise<BlockchainBalance[]> {
    if (!this.isConfigured()) {
      console.error('❌ Alchemy API key not configured');
      return [];
    }

    try {
      console.log('🚀 Fetching all token balances via Alchemy for:', address.substring(0, 10) + '...');

      // Get ETH balance first
      const ethBalance = await this.getNativeBalance(address, 'ethereum');
      const balances: BlockchainBalance[] = [ethBalance];

      // Get all configured token balances
      const tokenAddresses = Object.values(this.TOKEN_CONTRACTS).map(t => t.address);
      
      const response = await fetch(this.API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getTokenBalances',
          params: [
            address,
            tokenAddresses
          ],
          id: 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.result && data.result.tokenBalances) {
        for (let i = 0; i < data.result.tokenBalances.length; i++) {
          const tokenBalance = data.result.tokenBalances[i];
          const contractAddress = tokenBalance.contractAddress.toLowerCase();
          
          // Find the token info
          const tokenEntry = Object.entries(this.TOKEN_CONTRACTS).find(
            ([_, info]) => info.address.toLowerCase() === contractAddress
          );
          
          if (tokenEntry && tokenBalance.tokenBalance && tokenBalance.tokenBalance !== '0x0') {
            const [symbol, info] = tokenEntry;
            const balanceRaw = BigInt(tokenBalance.tokenBalance);
            const balanceFormatted = Number(balanceRaw) / Math.pow(10, info.decimals);
            
            if (balanceFormatted > 0) {
              balances.push({
                address,
                blockchain: 'ethereum',
                network: 'mainnet',
                balance: balanceFormatted,
                unit: symbol,
                lastUpdated: new Date(),
                isLive: true,
                tokenContract: info.address,
                tokenType: 'erc20'
              });
            }
          }
        }
      }
      
      console.log(`✅ Found ${balances.length} token balances`);
      return balances;
      
    } catch (error) {
      console.error('❌ Error fetching all token balances via Alchemy:', error);
      return [];
    }
  }

  /**
   * Check if a blockchain is supported
   */
  static isSupportedBlockchain(blockchain: string): boolean {
    const chain = blockchain.toLowerCase();
    return chain === 'ethereum' || chain === 'eth';
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
}