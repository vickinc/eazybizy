import { 
  BlockchainBalance
} from '@/types/blockchain.types';
import { DigitalWallet } from '@/types/payment.types';

// Helper functions for token type detection
function isNativeToken(tokenSymbol: string, blockchain: string): boolean {
  const nativeTokens: Record<string, string> = {
    'ethereum': 'ETH',
    'binance-smart-chain': 'BNB',
    'bsc': 'BNB',
    'polygon': 'MATIC',
    'avalanche': 'AVAX',
    'arbitrum': 'ETH',
    'optimism': 'ETH'
  };
  
  const blockchainLower = blockchain.toLowerCase();
  const nativeToken = nativeTokens[blockchainLower];
  return nativeToken ? tokenSymbol.toUpperCase() === nativeToken : false;
}

function isERC20Token(tokenSymbol: string, blockchain: string): boolean {
  const blockchainLower = blockchain.toLowerCase();
  
  // If it's a native token, it's not ERC20
  if (isNativeToken(tokenSymbol, blockchain)) {
    return false;
  }
  
  // ERC20 tokens are on Ethereum-compatible chains
  const erc20Chains = ['ethereum', 'binance-smart-chain', 'bsc', 'polygon', 'avalanche', 'arbitrum', 'optimism'];
  
  // Common ERC20 tokens
  const erc20Tokens = ['USDT', 'USDC', 'DAI', 'LINK', 'UNI', 'AAVE', 'COMP', 'MKR', 'SNX', 'YFI'];
  
  return erc20Chains.includes(blockchainLower) && erc20Tokens.includes(tokenSymbol.toUpperCase());
}

function findTokenContract(tokenSymbol: string, blockchain: string, network: string): string | undefined {
  // Known token contracts for common tokens
  const tokenContracts: Record<string, Record<string, string>> = {
    'ethereum': {
      'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
      'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',
      'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',
      'UNI': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
    },
    'binance-smart-chain': {
      'USDT': '0x55d398326f99059ff775485246999027b3197955',
      'USDC': '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      'DAI': '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
      'BUSD': '0xe9e7cea3dedca5984780bafc599bd69add087d56'
    }
  };
  
  const blockchainLower = blockchain.toLowerCase();
  const contracts = tokenContracts[blockchainLower] || {};
  return contracts[tokenSymbol.toUpperCase()];
}

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
    const supportedBlockchains = ['ethereum', 'solana', 'binance-smart-chain', 'base'];
    
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
   * Fetch transaction history for an Ethereum address
   * Supports both native ETH and ERC-20 token transactions
   */
  static async getTransactionHistory(
    address: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      currency?: string;
      blockchain?: string;
    } = {}
  ): Promise<import('@/types/blockchain.types').BlockchainTransaction[]> {
    if (!this.isConfigured()) {
      throw new Error('Alchemy API key is not configured');
    }

    const blockchain = options.blockchain || 'ethereum';
    const limit = options.limit || 100;
    const currency = options.currency?.toUpperCase() || 'ETH';

    // Support Ethereum and Solana transaction history
    const blockchainLower = blockchain.toLowerCase();
    if (blockchainLower !== 'ethereum' && blockchainLower !== 'solana') {
      console.warn(`Transaction history for ${blockchain} not yet implemented via Alchemy`);
      return [];
    }

    try {
      if (blockchainLower === 'ethereum') {
        return this.getEthereumTransactionHistory(address, options);
      } else if (blockchainLower === 'solana') {
        return this.getSolanaTransactionHistory(address, options);
      }

      return [];

    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * Fetch Ethereum transaction history using Alchemy's asset transfers API
   */
  private static async getEthereumTransactionHistory(
    address: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      currency?: string;
    } = {}
  ): Promise<import('@/types/blockchain.types').BlockchainTransaction[]> {
    const { limit = 100, currency = 'ETH' } = options;
    const currencyUpper = currency.toUpperCase();

    // Use Alchemy's getAssetTransfers method for comprehensive transaction data
    const requestBody = {
      jsonrpc: '2.0',
      method: 'alchemy_getAssetTransfers',
      params: [{
        fromAddress: address,
        toAddress: address,
        category: currencyUpper === 'ETH' ? ['external', 'internal'] : ['erc20'],
        maxCount: `0x${limit.toString(16)}`,
        order: 'desc'
      }],
      id: 1
    };

    const response = await fetch(this.getRPCUrl('ethereum', 'mainnet'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Alchemy API error: ${data.error.message}`);
    }

    const transfers = data.result?.transfers || [];
    const transactions: import('@/types/blockchain.types').BlockchainTransaction[] = [];

    for (const transfer of transfers) {
      // Filter by currency if specified and not ETH
      if (currencyUpper !== 'ETH' && transfer.asset !== currencyUpper) {
        continue;
      }

      // Convert Alchemy transfer format to our blockchain transaction format
      const transaction: import('@/types/blockchain.types').BlockchainTransaction = {
        hash: transfer.hash,
        blockNumber: parseInt(transfer.blockNum, 16),
        timestamp: new Date(transfer.metadata?.blockTimestamp || Date.now()),
        from: transfer.from,
        to: transfer.to,
        amount: parseFloat(transfer.value || '0'),
        currency: transfer.asset || 'ETH',
        type: transfer.from.toLowerCase() === address.toLowerCase() ? 'outgoing' : 'incoming',
        status: 'success',
        blockchain: 'ethereum',
        network: 'mainnet',
        gasUsed: transfer.metadata?.gasUsed ? parseInt(transfer.metadata.gasUsed, 16) : 0,
        gasFee: 0, // Would need separate call to get gas fee
        contractAddress: transfer.rawContract?.address,
        tokenType: currencyUpper === 'ETH' ? 'native' : 'erc20'
      };

      // Apply date filtering on the client side
      if (options.startDate && transaction.timestamp < options.startDate) {
        continue;
      }
      if (options.endDate && transaction.timestamp > options.endDate) {
        continue;
      }

      transactions.push(transaction);
    }

    console.log(`✅ Fetched ${transactions.length} ETH transactions for address ${address}`);
    return transactions;
  }

  /**
   * Fetch Solana transaction history using Alchemy's Solana API
   */
  private static async getSolanaTransactionHistory(
    address: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      currency?: string;
    } = {}
  ): Promise<import('@/types/blockchain.types').BlockchainTransaction[]> {
    const { limit = 100, currency = 'SOL' } = options;

    // Use Solana getSignaturesForAddress method to get transaction signatures
    const requestBody = {
      jsonrpc: '2.0',
      method: 'getSignaturesForAddress',
      params: [
        address,
        {
          limit: limit,
          commitment: 'finalized'
        }
      ],
      id: 1
    };

    const response = await fetch(this.getRPCUrl('solana', 'mainnet'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Solana API error: ${data.error.message}`);
    }

    const signatures = data.result || [];
    const transactions: import('@/types/blockchain.types').BlockchainTransaction[] = [];

    // For each signature, get the full transaction details
    for (const sigInfo of signatures.slice(0, Math.min(limit, 20))) { // Limit detailed fetches
      try {
        const txRequestBody = {
          jsonrpc: '2.0',
          method: 'getTransaction',
          params: [
            sigInfo.signature,
            {
              encoding: 'jsonParsed',
              commitment: 'finalized',
              maxSupportedTransactionVersion: 0
            }
          ],
          id: 1
        };

        const txResponse = await fetch(this.getRPCUrl('solana', 'mainnet'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(txRequestBody),
        });

        if (!txResponse.ok) continue;

        const txData = await txResponse.json();
        
        if (txData.error || !txData.result) continue;

        const tx = txData.result;
        const meta = tx.meta;
        const message = tx.transaction?.message;

        if (!message || !meta) continue;

        // Parse Solana transaction details
        const timestamp = tx.blockTime ? new Date(tx.blockTime * 1000) : new Date();
        const fee = meta.fee || 0;
        const feeSol = fee / 1_000_000_000; // Convert lamports to SOL

        // Determine transaction type and amount based on balance changes
        const preBalances = meta.preBalances || [];
        const postBalances = meta.postBalances || [];
        const accountKeys = message.accountKeys || [];
        
        let amount = 0;
        let type: 'incoming' | 'outgoing' = 'outgoing';
        let fromAddress = '';
        let toAddress = '';

        // Find the account index for our address
        const accountIndex = accountKeys.findIndex((key: any) => 
          (typeof key === 'string' ? key : key.pubkey) === address
        );

        if (accountIndex >= 0 && preBalances[accountIndex] !== undefined && postBalances[accountIndex] !== undefined) {
          const balanceChange = postBalances[accountIndex] - preBalances[accountIndex];
          amount = Math.abs(balanceChange) / 1_000_000_000; // Convert lamports to SOL
          type = balanceChange > 0 ? 'incoming' : 'outgoing';
          
          // Set from/to addresses (simplified)
          if (type === 'incoming') {
            toAddress = address;
            fromAddress = accountKeys[0] ? (typeof accountKeys[0] === 'string' ? accountKeys[0] : accountKeys[0].pubkey) : '';
          } else {
            fromAddress = address;
            toAddress = accountKeys[1] ? (typeof accountKeys[1] === 'string' ? accountKeys[1] : accountKeys[1].pubkey) : '';
          }
        }

        // Apply date filtering
        if (options.startDate && timestamp < options.startDate) {
          continue;
        }
        if (options.endDate && timestamp > options.endDate) {
          continue;
        }

        const transaction: import('@/types/blockchain.types').BlockchainTransaction = {
          hash: sigInfo.signature,
          blockNumber: tx.slot || 0,
          timestamp: timestamp,
          from: fromAddress,
          to: toAddress,
          amount: amount,
          currency: 'SOL',
          type: type,
          status: meta.err ? 'failed' : 'success',
          blockchain: 'solana',
          network: 'mainnet',
          gasUsed: 0, // Solana doesn't use gas
          gasFee: feeSol,
          tokenType: 'native'
        };

        transactions.push(transaction);
      } catch (error) {
        console.error('Error parsing Solana transaction:', sigInfo.signature, error);
        continue;
      }
    }

    console.log(`✅ Fetched ${transactions.length} SOL transactions for address ${address}`);
    return transactions;
  }

  /**
   * Fetch ERC-20 token transaction history for an address
   */
  static async getERC20TransactionHistory(
    address: string,
    tokenSymbol: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<import('@/types/blockchain.types').BlockchainTransaction[]> {
    return this.getTransactionHistory(address, {
      ...options,
      currency: tokenSymbol,
      blockchain: 'ethereum'
    });
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