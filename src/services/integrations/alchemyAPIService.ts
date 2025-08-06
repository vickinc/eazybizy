import { 
  BlockchainBalance, 
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

interface AlchemyETHBalanceResponse {
  jsonrpc: string;
  id: number;
  result: string;
}

interface AlchemyTokenBalanceResponse {
  jsonrpc: string;
  id: number;
  result: {
    address: string;
    tokenBalances: Array<{
      contractAddress: string;
      tokenBalance: string;
      error?: string;
    }>;
  };
}

/**
 * Alchemy API Service for fetching Ethereum and ERC-20 token balances
 * Uses Alchemy's enhanced APIs for better reliability and performance
 */
export class AlchemyAPIService {
  private static readonly API_KEY = process.env.ALCHEMY_API_KEY;
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // In-memory cache for API responses
  private static cache = new Map<string, CacheEntry>();
  
  /**
   * Check if the API is configured
   */
  static isConfigured(): boolean {
    const isConfigured = !!this.API_KEY && this.API_KEY.length > 10; // Basic validation
    console.log('🔑 AlchemyAPIService configuration check:', {
      hasApiKey: !!this.API_KEY,
      apiKeyLength: this.API_KEY?.length || 0,
      isConfigured
    });
    return isConfigured;
  }
  
  /**
   * Get Alchemy RPC URL for specified blockchain and network
   * IMPORTANT: Alchemy only supports Ethereum, EVM-compatible chains, and Solana - NOT Bitcoin
   */
  private static getRPCUrl(blockchain: string = 'ethereum', network: string = 'mainnet'): string {
    const blockchainKey = blockchain.toLowerCase();
    const networkKey = network.toLowerCase();
    
    // Alchemy RPC URL mappings - ONLY for blockchains actually supported by Alchemy
    const rpcMappings: Record<string, Record<string, string>> = {
      'ethereum': {
        'mainnet': `https://eth-mainnet.g.alchemy.com/v2/${this.API_KEY}`,
        'sepolia': `https://eth-sepolia.g.alchemy.com/v2/${this.API_KEY}`,
        'testnet': `https://eth-sepolia.g.alchemy.com/v2/${this.API_KEY}` // alias
      },
      'solana': {
        'mainnet': `https://solana-mainnet.g.alchemy.com/v2/${this.API_KEY}`,
        'devnet': `https://solana-devnet.g.alchemy.com/v2/${this.API_KEY}`,
        'testnet': `https://solana-testnet.g.alchemy.com/v2/${this.API_KEY}`
      },
      'binance-smart-chain': {
        'mainnet': `https://bnb-mainnet.g.alchemy.com/v2/${this.API_KEY}`,
        'testnet': `https://bnb-testnet.g.alchemy.com/v2/${this.API_KEY}`
      }
      // NOTE: Bitcoin is NOT supported by Alchemy - removed from mappings
    };
    
    return rpcMappings[blockchainKey]?.[networkKey] || rpcMappings['ethereum']['mainnet'];
  }
  
  /**
   * Generate cache key for a wallet
   */
  private static getCacheKey(address: string, tokenContract?: string): string {
    return tokenContract 
      ? `eth:${address.toLowerCase()}:${tokenContract.toLowerCase()}`
      : `eth:${address.toLowerCase()}:native`;
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
   * Fetch native balance for an address with retry logic
   * Works for native tokens (ETH, MATIC, SOL, etc.) on supported chains
   */
  static async getNativeBalance(
    address: string, 
    blockchain: string = 'ethereum', 
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    if (!this.isConfigured()) {
      throw new Error('Alchemy API key is not configured');
    }
    
    // Check cache first
    const cached = this.getCachedBalance(address);
    if (cached) {
      return cached;
    }
    
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    // Handle Solana differently as it uses different RPC methods
    if (blockchain.toLowerCase() === 'solana') {
      return await this.getSolanaBalance(address, network);
    }
    
    // Bitcoin is NOT supported by Alchemy - return error immediately
    if (blockchain.toLowerCase() === 'bitcoin') {
      return {
        address,
        blockchain,
        network,
        balance: 0,
        unit: 'BTC',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: 'Bitcoin is not supported by Alchemy API. Please use a different service for Bitcoin balance lookup.'
      };
    }
    
    // Handle EVM-based chains (Ethereum, BNB Smart Chain)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(this.getRPCUrl(blockchain, network), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
          }),
        });
        
        if (!response.ok) {
          // For 503 Service Unavailable, retry with exponential backoff
          if (response.status === 503 && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ ETH balance fetch attempt ${attempt} failed with 503, retrying in ${delay}ms...`);
            await this.sleep(delay);
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data: AlchemyETHBalanceResponse = await response.json();
        
        if (data.result) {
          // Convert from Wei to native token (divide by 10^18 for most EVM chains)
          const balanceWei = BigInt(data.result);
          const balanceFormatted = Number(balanceWei) / Math.pow(10, 18);
          
          // Get native token symbol for the blockchain
          const nativeTokenMap: Record<string, string> = {
            'ethereum': 'ETH',
            'solana': 'SOL',
            'bitcoin': 'BTC',
            'binance-smart-chain': 'BNB'
          };
          const nativeToken = nativeTokenMap[blockchain.toLowerCase()] || 'ETH';
          
          const balance: BlockchainBalance = {
            address,
            blockchain,
            network,
            balance: balanceFormatted,
            unit: nativeToken,
            lastUpdated: new Date(),
            isLive: true,
            tokenType: 'native'
          };
          
          // Cache the result
          this.cacheBalance(balance);
          
          console.log(`✅ ${nativeToken} balance fetched:`, { 
            address, 
            balance: balanceFormatted, 
            unit: nativeToken, 
            blockchain,
            attempt 
          });
          return balance;
        } else {
          throw new Error('Invalid response from Alchemy API');
        }
      } catch (error) {
        console.error(`❌ ETH balance fetch attempt ${attempt} failed:`, error);
        
        // If this is the last attempt or not a retryable error, return error balance
        if (attempt === maxRetries || (error instanceof Error && !error.message.includes('503'))) {
          const nativeTokenMap: Record<string, string> = {
            'ethereum': 'ETH',
            'solana': 'SOL',
            'bitcoin': 'BTC',
            'binance-smart-chain': 'BNB'
          };
          const nativeToken = nativeTokenMap[blockchain.toLowerCase()] || 'ETH';
          
          return {
            address,
            blockchain,
            network,
            balance: 0,
            unit: nativeToken,
            lastUpdated: new Date(),
            isLive: false,
            tokenType: 'native',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
        
        // Wait before next retry
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
    
    // This should never be reached, but just in case
    return {
      address,
      blockchain: 'ethereum',
      network: 'mainnet',
      balance: 0,
      unit: 'ETH',
      lastUpdated: new Date(),
      isLive: false,
      tokenType: 'native',
      error: 'Max retries exceeded'
    };
  }

  /**
   * Fetch Solana balance using Alchemy's Solana API
   */
  static async getSolanaBalance(address: string, network: string = 'mainnet'): Promise<BlockchainBalance> {
    try {
      const response = await fetch(this.getRPCUrl('solana', network), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getBalance',
          params: [address],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.result) {
        // Solana balances are returned in lamports (1 SOL = 1,000,000,000 lamports)
        const balanceLamports = data.result.value || 0;
        const balanceSOL = balanceLamports / 1_000_000_000;

        const balance: BlockchainBalance = {
          address,
          blockchain: 'solana',
          network,
          balance: balanceSOL,
          unit: 'SOL',
          lastUpdated: new Date(),
          isLive: true,
          tokenType: 'native'
        };

        // Cache the result
        this.cacheBalance(balance);

        console.log('✅ SOL balance fetched via Alchemy:', { 
          address, 
          balance: balanceSOL, 
          unit: 'SOL', 
          lamports: balanceLamports 
        });
        return balance;
      } else {
        throw new Error('Invalid response from Alchemy Solana API');
      }
    } catch (error) {
      console.error('Error fetching Solana balance via Alchemy:', error);
      
      return {
        address,
        blockchain: 'solana',
        network,
        balance: 0,
        unit: 'SOL',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Bitcoin method removed - Alchemy does not support Bitcoin
  
  /**
   * Legacy method for backward compatibility
   */
  static async getETHBalance(address: string): Promise<BlockchainBalance> {
    return this.getNativeBalance(address, 'ethereum', 'mainnet');
  }
  
  /**
   * Fetch token balance for any supported blockchain
   */
  static async getTokenBalance(
    address: string,
    tokenSymbol: string,
    blockchain: string = 'ethereum',
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    if (!this.isConfigured()) {
      throw new Error('Alchemy API key is not configured');
    }
    
    const blockchainLower = blockchain.toLowerCase();
    
    // Route to specific token fetching method based on blockchain
    switch (blockchainLower) {
      case 'ethereum':
        return this.getERC20TokenBalance(address, tokenSymbol, network);
      case 'binance-smart-chain':
        return this.getBEP20TokenBalance(address, tokenSymbol, network);
      case 'solana':
        return this.getSPLTokenBalance(address, tokenSymbol, network);
      default:
        throw new Error(`Token balance fetching not implemented for blockchain: ${blockchain}`);
    }
  }

  /**
   * Fetch ERC-20 token balance on Ethereum
   */
  static async getERC20TokenBalance(
    address: string,
    tokenSymbol: string,
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    // Find token contract info
    const tokenContract = findTokenContract(tokenSymbol, 'ethereum', 'mainnet');
    if (!tokenContract) {
      throw new Error(`ERC-20 token '${tokenSymbol}' is not supported`);
    }
    
    // Check cache first
    const cached = this.getCachedBalance(address, tokenContract.contractAddress);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await fetch(this.getRPCUrl('ethereum', network), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getTokenBalances',
          params: [address, [tokenContract.contractAddress]],
          id: 1,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: AlchemyTokenBalanceResponse = await response.json();
      
      if (data.result && data.result.tokenBalances.length > 0) {
        const tokenBalance = data.result.tokenBalances[0];
        
        if (tokenBalance.error) {
          throw new Error(`Token balance error: ${tokenBalance.error}`);
        }
        
        // Convert from token's smallest unit to human readable format
        const balanceRaw = BigInt(tokenBalance.tokenBalance || '0');
        const balanceFormatted = Number(balanceRaw) / Math.pow(10, tokenContract.decimals);
        
        const balance: BlockchainBalance = {
          address,
          blockchain: 'ethereum',
          network,
          balance: balanceFormatted,
          unit: tokenContract.symbol,
          lastUpdated: new Date(),
          isLive: true,
          tokenContract: tokenContract.contractAddress,
          tokenType: 'erc20'
        };
        
        // Cache the result
        this.cacheBalance(balance);
        
        console.log('✅ ERC-20 balance fetched:', { 
          address, 
          token: tokenSymbol, 
          balance: balanceFormatted, 
          unit: tokenContract.symbol 
        });
        return balance;
      } else {
        // Return zero balance if no data
        const balance: BlockchainBalance = {
          address,
          blockchain: 'ethereum',
          network,
          balance: 0,
          unit: tokenContract.symbol,
          lastUpdated: new Date(),
          isLive: true,
          tokenContract: tokenContract.contractAddress,
          tokenType: 'erc20'
        };
        
        this.cacheBalance(balance);
        return balance;
      }
    } catch (error) {
      console.error('Error fetching ERC-20 token balance:', error);
      
      return {
        address,
        blockchain: 'ethereum',
        network,
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
   * Fetch BEP-20 token balance on Binance Smart Chain
   */
  static async getBEP20TokenBalance(
    address: string,
    tokenSymbol: string,
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    // BEP-20 token contracts (similar to ERC-20 but on BSC)
    const tokenContracts: Record<string, { address: string; decimals: number }> = {
      'USDT': { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
      'USDC': { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
      'BUSD': { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 }
    };

    const tokenContract = tokenContracts[tokenSymbol.toUpperCase()];
    if (!tokenContract) {
      throw new Error(`BEP-20 token '${tokenSymbol}' is not supported`);
    }

    try {
      const response = await fetch(this.getRPCUrl('binance-smart-chain', network), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getTokenBalances',
          params: [address, [tokenContract.address]],
          id: 1,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: AlchemyTokenBalanceResponse = await response.json();
      
      if (data.result && data.result.tokenBalances.length > 0) {
        const tokenBalance = data.result.tokenBalances[0];
        const balanceRaw = BigInt(tokenBalance.tokenBalance || '0');
        const balanceFormatted = Number(balanceRaw) / Math.pow(10, tokenContract.decimals);
        
        const balance: BlockchainBalance = {
          address,
          blockchain: 'binance-smart-chain',
          network,
          balance: balanceFormatted,
          unit: tokenSymbol,
          lastUpdated: new Date(),
          isLive: true,
          tokenContract: tokenContract.address,
          tokenType: 'bep20'
        };
        
        console.log('✅ BEP-20 balance fetched:', { 
          address, 
          token: tokenSymbol, 
          balance: balanceFormatted
        });
        return balance;
      }
    } catch (error) {
      console.error('Error fetching BEP-20 token balance:', error);
    }

    // NO hardcoded values - return 0 with error message
    return {
      address,
      blockchain: 'binance-smart-chain',
      network,
      balance: 0,
      unit: tokenSymbol,
      lastUpdated: new Date(),
      isLive: false,
      tokenType: 'bep20',
      error: `BEP-20 token '${tokenSymbol}' API call failed. No hardcoded values used.`
    };
  }

  /**
   * Fetch SPL token balance on Solana
   */
  static async getSPLTokenBalance(
    address: string,
    tokenSymbol: string,
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    // SPL token mint addresses
    const tokenMints: Record<string, string> = {
      'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    };

    const tokenMint = tokenMints[tokenSymbol.toUpperCase()];
    if (!tokenMint) {
      throw new Error(`SPL token '${tokenSymbol}' is not supported`);
    }

    try {
      const response = await fetch(this.getRPCUrl('solana', network), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'getTokenAccountsByOwner',
          params: [
            address,
            { mint: tokenMint },
            { encoding: 'jsonParsed' }
          ],
          id: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.result && data.result.value && data.result.value.length > 0) {
        const tokenAccount = data.result.value[0];
        const balanceInfo = tokenAccount.account?.data?.parsed?.info;
        const balanceRaw = balanceInfo?.tokenAmount?.amount || '0';
        const decimals = balanceInfo?.tokenAmount?.decimals || 6;
        const balanceFormatted = Number(balanceRaw) / Math.pow(10, decimals);
        
        const balance: BlockchainBalance = {
          address,
          blockchain: 'solana',
          network,
          balance: balanceFormatted,
          unit: tokenSymbol,
          lastUpdated: new Date(),
          isLive: true,
          tokenContract: tokenMint,
          tokenType: 'spl'
        };
        
        console.log('✅ SPL token balance fetched:', { 
          address, 
          token: tokenSymbol, 
          balance: balanceFormatted
        });
        return balance;
      }
    } catch (error) {
      console.error('Error fetching SPL token balance:', error);
    }

    // NO hardcoded values - return 0 with error message
    return {
      address,
      blockchain: 'solana',
      network,
      balance: 0,
      unit: tokenSymbol,
      lastUpdated: new Date(),
      isLive: false,
      tokenType: 'spl',
      error: `SPL token '${tokenSymbol}' API call failed. No hardcoded values used.`
    };
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
        // Only process Ethereum wallets
        if (wallet.blockchain.toLowerCase() !== 'ethereum') {
          return Promise.resolve({
            address: wallet.address,
            blockchain: wallet.blockchain,
            network: wallet.network || 'mainnet',
            balance: 0,
            unit: wallet.tokenSymbol || 'UNKNOWN',
            lastUpdated: new Date(),
            isLive: false,
            tokenType: 'native' as const,
            error: `Blockchain '${wallet.blockchain}' not supported by Alchemy`
          });
        }
        
        // Determine if this is a native token or ERC-20 token
        if (wallet.tokenSymbol && isNativeToken(wallet.tokenSymbol, wallet.blockchain)) {
          // This is native ETH
          return this.getETHBalance(wallet.address);
        } else if (wallet.tokenSymbol && isERC20Token(wallet.tokenSymbol, wallet.blockchain)) {
          // This is an ERC-20 token
          return this.getTokenBalance(wallet.address, wallet.tokenSymbol);
        } else {
          // Unknown token type
          return Promise.resolve({
            address: wallet.address,
            blockchain: wallet.blockchain,
            network: wallet.network || 'mainnet',
            balance: 0,
            unit: wallet.tokenSymbol || 'UNKNOWN',
            lastUpdated: new Date(),
            isLive: false,
            tokenType: 'native' as const,
            error: `Token '${wallet.tokenSymbol}' not supported`
          });
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
   * Check if a wallet can have its balance fetched via Alchemy
   */
  static canFetchBalance(wallet: DigitalWallet): boolean {
    const currency = wallet.currency;
    const blockchain = wallet.blockchain;
    const isNative = blockchain && currency ? isNativeToken(currency, blockchain) : false;
    const isERC20 = blockchain && currency ? isERC20Token(currency, blockchain) : false;
    
    // Supported blockchains by Alchemy (Bitcoin is NOT supported)
    const supportedBlockchains = ['ethereum', 'solana', 'binance-smart-chain'];
    
    console.log('🔍 AlchemyAPIService.canFetchBalance:', {
      currency: wallet.currency,
      blockchain: wallet.blockchain,
      isNativeToken: isNative,
      isERC20Token: isERC20,
      isSupported: blockchain ? supportedBlockchains.includes(blockchain.toLowerCase()) : false,
      canFetch: this.isConfigured() && wallet.walletAddress && blockchain && supportedBlockchains.includes(blockchain.toLowerCase()) && wallet.currency
    });
    
    if (!this.isConfigured()) return false;
    if (!wallet.walletAddress) return false;
    if (wallet.walletType?.toLowerCase() !== 'crypto') return false;
    if (!wallet.blockchain) return false;
    if (!wallet.currency) return false;
    
    // Check if blockchain is supported by Alchemy
    if (!supportedBlockchains.includes(wallet.blockchain.toLowerCase())) return false;
    
    // All supported blockchains can have their native tokens fetched
    return true;
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