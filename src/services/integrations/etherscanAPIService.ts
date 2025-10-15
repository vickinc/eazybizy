import { BlockchainTransaction, BlockchainBalance } from '@/types/blockchain.types';

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface EtherscanTransaction {
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

interface EtherscanTokenTransfer {
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

interface EtherscanResponse<T> {
  status: string;
  message: string;
  result: T[];
}

interface EtherscanBalanceResponse {
  status: string;
  message: string;
  result: string;
}

/**
 * Etherscan API Service for fetching Ethereum and BNB Smart Chain transaction data
 * Uses official Etherscan and BSCScan APIs for reliable blockchain data
 */
export class EtherscanAPIService {
  private static readonly ETH_API_KEY = process.env.ETHERSCAN_API_KEY;
  private static readonly BSC_API_KEY = process.env.BSCSCAN_API_KEY || process.env.ETHERSCAN_API_KEY; // Fallback to same key
  private static readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  
  // In-memory cache for API responses
  private static cache = new Map<string, CacheEntry>();
  
  // Base URLs for different networks
  private static readonly BASE_URLS = {
    ethereum: 'https://api.etherscan.io/api',
    bsc: 'https://api.etherscan.io/v2/api', // Use Etherscan v2 for BSC cross-chain support
    'binance-smart-chain': 'https://api.etherscan.io/v2/api'
  };
  
  // Chain IDs for Etherscan v2 multi-chain support
  private static readonly CHAIN_IDS = {
    ethereum: 1,
    bsc: 56,
    'binance-smart-chain': 56
  };

  /**
   * Check if the service is configured for a specific blockchain
   */
  static isConfigured(blockchain: string = 'ethereum'): boolean {
    const blockchainLower = blockchain.toLowerCase();
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      if (blockchainLower === 'ethereum') {
        console.log(`🔧 Checking API config for ${blockchainLower}:`, {
          hasAPIKey: !!this.ETH_API_KEY,
          keyLength: this.ETH_API_KEY?.length || 0
        });
      } else if (blockchainLower === 'bsc' || blockchainLower === 'binance-smart-chain') {
        console.log(`🔧 Checking API config for ${blockchainLower}:`, {
          hasAPIKey: !!this.BSC_API_KEY,
          keyLength: this.BSC_API_KEY?.length || 0,
          usingEtherscanV2ForBSC: true,
          hasSeparateBSCKey: !!process.env.BSCSCAN_API_KEY
        });
      }
    }
    
    switch (blockchainLower) {
      case 'ethereum':
        return !!this.ETH_API_KEY && this.ETH_API_KEY.length > 10;
      case 'bsc':
      case 'binance-smart-chain':
        // Use dedicated BSCSCAN_API_KEY for BSC (Etherscan v2 infrastructure)
        const hasBSCKey = !!this.BSC_API_KEY && this.BSC_API_KEY.length > 10;
        if (process.env.NODE_ENV === 'development') {
          if (hasBSCKey) {
            console.log(`✅ Using dedicated BSCSCAN_API_KEY for BNB Chain (Etherscan v2 infrastructure)`);
          } else {
            console.warn(`⚠️ BSCSCAN_API_KEY not configured. Add BSCSCAN_API_KEY to your .env.local file`);
          }
        }
        return hasBSCKey;
      default:
        return false;
    }
  }

  /**
   * Get the appropriate API key for a blockchain
   */
  private static getApiKey(blockchain: string): string {
    const blockchainLower = blockchain.toLowerCase();
    
    switch (blockchainLower) {
      case 'ethereum':
        return this.ETH_API_KEY || '';
      case 'bsc':
      case 'binance-smart-chain':
        // Use dedicated BSCSCAN_API_KEY for BSC (even though it uses Etherscan v2 infrastructure)
        return this.BSC_API_KEY || '';
      default:
        return '';
    }
  }

  /**
   * Get the base URL for a blockchain
   */
  private static getBaseUrl(blockchain: string): string {
    const blockchainLower = blockchain.toLowerCase();
    const validBlockchains = ['ethereum', 'bsc', 'binance-smart-chain'] as const;
    
    if (validBlockchains.includes(blockchainLower as any)) {
      return this.BASE_URLS[blockchainLower as keyof typeof this.BASE_URLS];
    }
    return this.BASE_URLS.ethereum;
  }
  
  /**
   * Get the chain ID for a blockchain (Etherscan v2)
   */
  private static getChainId(blockchain: string): number {
    const blockchainLower = blockchain.toLowerCase();
    const validBlockchains = ['ethereum', 'bsc', 'binance-smart-chain'] as const;
    
    if (validBlockchains.includes(blockchainLower as any)) {
      return this.CHAIN_IDS[blockchainLower as keyof typeof this.CHAIN_IDS];
    }
    return this.CHAIN_IDS.ethereum;
  }

  /**
   * Make a cached API request to Etherscan/BSCScan
   */
  private static async makeRequest<T>(
    blockchain: string,
    params: Record<string, string | number>,
    cacheKey?: string
  ): Promise<EtherscanResponse<T>> {
    // Check cache first
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`📦 Cache hit for ${cacheKey}`);
        return cached.data;
      }
    }

    const apiKey = this.getApiKey(blockchain);
    if (!apiKey) {
      throw new Error(`API key not configured for ${blockchain}`);
    }

    const baseUrl = this.getBaseUrl(blockchain);
    const requestParams: Record<string, string> = {
      ...params,
      apikey: apiKey
    } as Record<string, string>;
    
    // Add chain ID for Etherscan v2 cross-chain requests
    const blockchainLower = blockchain.toLowerCase();
    if (blockchainLower === 'bsc' || blockchainLower === 'binance-smart-chain') {
      requestParams.chainid = this.getChainId(blockchain).toString();
    }
    
    const searchParams = new URLSearchParams(requestParams);

    const url = `${baseUrl}?${searchParams.toString()}`;
    
    console.log(`🌐 ${blockchain.toUpperCase()} API Request:`, url.replace(apiKey, 'XXX'));

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

      const data: EtherscanResponse<T> = await response.json();

      if (data.status === '0' && data.message !== 'No transactions found') {
        // Enhanced error handling with exponential backoff retry
        const isRateLimitError = data.message === 'NOTOK' || 
          data.message.toLowerCase().includes('rate limit') ||
          data.message.toLowerCase().includes('max calls') ||
          JSON.stringify(data).toLowerCase().includes('rate limit');
          
        if (isRateLimitError) {
          console.warn(`⚠️ ${blockchain.toUpperCase()} API rate limit detected: ${data.message}`);
          
          // Implement exponential backoff retry with multiple attempts
          const maxRetries = 3;
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // 1s, 2s, 4s, max 8s
            console.log(`🔄 Rate limit retry attempt ${attempt}/${maxRetries}, waiting ${backoffDelay}ms...`);
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            
            try {
              const retryResponse = await fetch(url, {
                method: 'GET',
                headers: {
                  'User-Agent': 'EazyBizy-App/1.0'
                }
              });
              
              if (retryResponse.ok) {
                const retryData: EtherscanResponse<T> = await retryResponse.json();
                
                // Check if retry was successful
                if (retryData.status === '1') {
                  console.log(`✅ Retry successful after ${attempt} attempt(s)`);
                  // Cache successful retry responses
                  if (cacheKey) {
                    this.cache.set(cacheKey, { data: retryData, timestamp: Date.now() });
                  }
                  return retryData;
                } else if (retryData.status === '0' && retryData.message === 'No transactions found') {
                  // This is a valid response, not an error
                  console.log(`✅ Retry successful - no transactions found (valid response)`);
                  if (cacheKey) {
                    this.cache.set(cacheKey, { data: retryData, timestamp: Date.now() });
                  }
                  return retryData;
                } else if (retryData.message?.toLowerCase().includes('rate limit')) {
                  // Still rate limited, continue to next attempt
                  console.log(`⚠️ Still rate limited on attempt ${attempt}, will retry if attempts remain`);
                  continue;
                }
              }
            } catch (retryError) {
              console.warn(`⚠️ Retry attempt ${attempt} failed:`, retryError.message);
              if (attempt === maxRetries) {
                // Last attempt failed, return empty result for graceful degradation
                console.error(`❌ All ${maxRetries} retry attempts failed, returning empty result`);
                return { ...data, result: [] as T[] } as EtherscanResponse<T>;
              }
            }
          }
          
          // All retries exhausted, return empty result for graceful degradation
          console.error(`❌ Rate limit retries exhausted, returning empty result`);
          return { ...data, result: [] as T[] } as EtherscanResponse<T>;
        }
        
        // Handle other API errors (not rate limits)
        if (data.message === 'NOTOK') {
          // Check if it's an API key issue
          const isApiKeyError = typeof data.result === 'string' && 
            (data.result.includes('Invalid API Key') || data.result.includes('#err2'));
          
          if (isApiKeyError && blockchain.toLowerCase() === 'bsc') {
            console.error(`❌ ${blockchain.toUpperCase()} API key invalid: ${data.result}`);
            console.error(`💡 Get a valid BSCScan API key from: https://bscscan.com/apis`);
            console.error(`💡 Add BSCSCAN_API_KEY=your-key-here to your .env.local file`);
          } else {
            console.warn(`⚠️ ${blockchain.toUpperCase()} API returned NOTOK: ${data.message}`);
          }
          
          return { ...data, result: [] as T[] } as EtherscanResponse<T>;
        }
        
        throw new Error(`${blockchain.toUpperCase()} API error: ${data.message}`);
      }

      // Cache successful responses
      if (cacheKey) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error(`❌ ${blockchain.toUpperCase()} API request failed:`, error);
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
    const result = parseFloat(value) / Math.pow(10, decimalCount);
    
    // Debug logging for USDT conversion issues
    if (process.env.NODE_ENV === 'development' && decimalCount === 6) {
      console.log(`💰 Token decimal conversion (likely USDT/USDC):`, {
        rawValue: value,
        decimals: decimalCount,
        convertedAmount: result,
        calculation: `${value} / 10^${decimalCount} = ${result}`
      });
    }
    
    return result;
  }

  /**
   * Convert Etherscan transaction to BlockchainTransaction format
   */
  private static convertTransaction(
    tx: EtherscanTransaction,
    blockchain: string,
    walletAddress: string
  ): BlockchainTransaction {
    const timestamp = parseInt(tx.timeStamp) * 1000; // Convert to milliseconds
    const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
    const amount = this.weiToEther(tx.value);
    const gasUsed = parseInt(tx.gasUsed);
    
    // Apply BSC gas price correction for native transactions
    let rawGasPrice = tx.gasPrice;
    if (blockchain.toLowerCase().includes('bsc') && rawGasPrice === '0x0') {
      // Use estimated BSC gas price when API returns 0x0
      rawGasPrice = this.estimateBSCGasPrice(parseInt(tx.blockNumber));
      console.log(`⚡ Using BSC estimated gas price for native tx ${tx.hash.substring(0, 12)}...: ${parseInt(rawGasPrice, 16) / 1e9} Gwei`);
    }
    
    const gasPrice = this.weiToEther(rawGasPrice);
    const gasFee = gasUsed * gasPrice;

    return {
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber),
      timestamp,
      from: tx.from,
      to: tx.to,
      amount,
      currency: blockchain.toLowerCase() === 'ethereum' ? 'ETH' : 'BNB',
      type: isIncoming ? 'incoming' : 'outgoing',
      status: tx.isError === '0' && tx.txreceipt_status === '1' ? 'success' : 'failed',
      gasUsed,
      gasFee,
      contractAddress: tx.contractAddress || undefined,
      tokenType: 'native',
      blockchain: blockchain.toLowerCase(),
      network: 'mainnet'
    };
  }

  /**
   * Convert Etherscan token transfer to BlockchainTransaction format
   */
  private static convertTokenTransfer(
    tx: EtherscanTokenTransfer,
    blockchain: string,
    walletAddress: string
  ): BlockchainTransaction {
    const timestamp = parseInt(tx.timeStamp) * 1000;
    const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
    const amount = this.convertTokenValue(tx.value, tx.tokenDecimal);
    
    // Debug USDT/USDC transactions
    if (process.env.NODE_ENV === 'development' && (tx.tokenSymbol === 'USDT' || tx.tokenSymbol === 'USDC')) {
      console.log(`🔍 ${tx.tokenSymbol} transfer details:`, {
        hash: tx.hash.substring(0, 10) + '...',
        rawValue: tx.value,
        tokenDecimal: tx.tokenDecimal,
        convertedAmount: amount,
        direction: isIncoming ? 'incoming' : 'outgoing',
        from: tx.from.substring(0, 10) + '...',
        to: tx.to.substring(0, 10) + '...'
      });
    }
    
    // Enhanced gas fee handling for token transfers
    // Token transfer gas fees are critical for accurate balance calculations
    const gasUsed = tx.gasUsed ? parseInt(tx.gasUsed) : 0;
    const gasPriceWei = tx.gasPrice ? tx.gasPrice : '0';
    const gasPrice = this.weiToEther(gasPriceWei);
    let gasFee = gasUsed * gasPrice;
    
    // For token transfers, gas fees are often missing from the tokentx API
    // We need to flag these for later gas fee retrieval from normal transactions
    const needsGasFeeLookup = gasFee === 0 && !isIncoming;
    
    // Debug logging for gas fee issues - especially for USDT transfers
    if (process.env.NODE_ENV === 'development' && needsGasFeeLookup) {
      console.log(`⚠️ Token transfer needs gas fee lookup:`, {
        hash: tx.hash.substring(0, 10) + '...',
        tokenSymbol: tx.tokenSymbol,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        gasPriceWei,
        calculatedGasFee: gasFee,
        isUSDT: tx.tokenSymbol.toUpperCase() === 'USDT',
        contractAddress: tx.contractAddress
      });
    }

    return {
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber),
      timestamp,
      from: tx.from,
      to: tx.to,
      amount,
      currency: tx.tokenSymbol,
      type: isIncoming ? 'incoming' : 'outgoing',
      status: 'success', // Token transfers are usually successful if they exist
      gasUsed,
      gasFee,
      contractAddress: tx.contractAddress,
      tokenType: blockchain.toLowerCase() === 'ethereum' ? 'erc20' : 'bep20',
      blockchain: blockchain.toLowerCase(),
      network: 'mainnet',
      needsGasFeeLookup // Flag for later gas fee enhancement
    };
  }

  /**
   * Get native balance (ETH/BNB) for an address
   */
  static async getNativeBalance(
    address: string,
    blockchain: string = 'ethereum',
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    if (!this.isConfigured(blockchain)) {
      return {
        address,
        blockchain: blockchain.toLowerCase(),
        network,
        balance: 0,
        unit: blockchain.toLowerCase() === 'ethereum' ? 'ETH' : 'BNB',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: `${blockchain.toUpperCase()} API not configured`
      };
    }

    const cacheKey = `balance-native-${blockchain}-${address}`;
    
    try {
      const response = await this.makeRequest<never>(
        blockchain,
        {
          module: 'account',
          action: 'balance',
          address,
          tag: 'latest'
        },
        cacheKey
      ) as any as EtherscanBalanceResponse;

      const balanceWei = response.result || '0';
      
      // Define currency before checking response
      const currency = blockchain.toLowerCase() === 'ethereum' ? 'ETH' : 'BNB';
      
      // Check if the response is valid (not an error response)
      if (response.status !== '1' || !response.result || response.result === '') {
        console.warn(`⚠️ Invalid balance response from Etherscan:`, response);
        return {
          address,
          blockchain: blockchain.toLowerCase(),
          network,
          balance: 0,
          unit: currency,
          lastUpdated: new Date(),
          isLive: false,
          tokenType: 'native',
          error: 'Failed to fetch balance - API returned invalid response'
        };
      }
      
      const balance = this.weiToEther(balanceWei);

      const result: BlockchainBalance = {
        address,
        blockchain: blockchain.toLowerCase(),
        network,
        balance,
        unit: currency,
        lastUpdated: new Date(),
        isLive: true,
        tokenType: 'native'
      };

      console.log(`✅ ${currency} balance fetched via ${blockchain.toUpperCase()}:`, {
        address: address.substring(0, 10) + '...',
        balance,
        unit: currency
      });

      return result;
    } catch (error) {
      console.error(`❌ Error fetching ${blockchain.toUpperCase()} balance:`, error);
      
      return {
        address,
        blockchain: blockchain.toLowerCase(),
        network,
        balance: 0,
        unit: blockchain.toLowerCase() === 'ethereum' ? 'ETH' : 'BNB',
        lastUpdated: new Date(),
        isLive: false,
        tokenType: 'native',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get ERC-20/BEP-20 token balance for an address
   */
  static async getTokenBalance(
    address: string,
    tokenSymbol: string,
    blockchain: string = 'ethereum',
    network: string = 'mainnet'
  ): Promise<BlockchainBalance> {
    if (!this.isConfigured(blockchain)) {
      return {
        address,
        blockchain: blockchain.toLowerCase(),
        network,
        balance: 0,
        unit: tokenSymbol.toUpperCase(),
        lastUpdated: new Date(),
        isLive: false,
        tokenType: blockchain.toLowerCase() === 'ethereum' ? 'erc20' : 'bep20',
        error: `${blockchain.toUpperCase()} API not configured`
      };
    }

    // Common token contract addresses
    const tokenContracts: Record<string, Record<string, { address: string; decimals: number }>> = {
      ethereum: {
        'USDT': { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
        'USDC': { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 }
      },
      bsc: {
        'USDT': { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
        'USDC': { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
        'BUSD': { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 }
      }
    };

    const blockchainLower = blockchain.toLowerCase();
    const blockchainKey = blockchainLower === 'binance-smart-chain' ? 'bsc' : blockchainLower;
    const tokenInfo = tokenContracts[blockchainKey]?.[tokenSymbol.toUpperCase()];

    if (!tokenInfo) {
      const availableTokens = Object.keys(tokenContracts[blockchainKey] || {}).join(', ');
      return {
        address,
        blockchain: blockchainLower,
        network,
        balance: 0,
        unit: tokenSymbol.toUpperCase(),
        lastUpdated: new Date(),
        isLive: false,
        tokenType: blockchain.toLowerCase() === 'ethereum' ? 'erc20' : 'bep20',
        error: `Token '${tokenSymbol}' not supported on ${blockchain}. Available: ${availableTokens}`
      };
    }

    const cacheKey = `balance-token-${blockchain}-${address}-${tokenSymbol}`;
    
    try {
      const response = await this.makeRequest<never>(
        blockchain,
        {
          module: 'account',
          action: 'tokenbalance',
          contractaddress: tokenInfo.address,
          address,
          tag: 'latest'
        },
        cacheKey
      ) as any as EtherscanBalanceResponse;

      const rawBalance = response.result || '0';
      const balance = this.convertTokenValue(rawBalance, tokenInfo.decimals.toString());

      const result: BlockchainBalance = {
        address,
        blockchain: blockchainLower,
        network,
        balance,
        unit: tokenSymbol.toUpperCase(),
        lastUpdated: new Date(),
        isLive: true,
        tokenContract: tokenInfo.address,
        tokenType: blockchain.toLowerCase() === 'ethereum' ? 'erc20' : 'bep20'
      };

      console.log(`✅ ${tokenSymbol} balance fetched via ${blockchain.toUpperCase()}:`, {
        address: address.substring(0, 10) + '...',
        balance,
        unit: tokenSymbol.toUpperCase(),
        contract: tokenInfo.address
      });

      return result;
    } catch (error) {
      console.error(`❌ Error fetching ${tokenSymbol} balance on ${blockchain.toUpperCase()}:`, error);
      
      return {
        address,
        blockchain: blockchainLower,
        network,
        balance: 0,
        unit: tokenSymbol.toUpperCase(),
        lastUpdated: new Date(),
        isLive: false,
        tokenContract: tokenInfo.address,
        tokenType: blockchain.toLowerCase() === 'ethereum' ? 'erc20' : 'bep20',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a blockchain is supported by Etherscan service
   */
  static isSupportedBlockchain(blockchain: string): boolean {
    const supported = ['ethereum', 'bsc', 'binance-smart-chain'];
    return supported.includes(blockchain.toLowerCase());
  }

  /**
   * Fetch normal transactions for an address (ETH/BNB transfers)
   */
  static async getNormalTransactions(
    address: string,
    blockchain: string = 'ethereum',
    options: {
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
    } = {}
  ): Promise<BlockchainTransaction[]> {
    if (!this.isConfigured(blockchain)) {
      console.warn(`⚠️ ${blockchain.toUpperCase()} API not configured`);
      return [];
    }

    const {
      startBlock = 0,
      endBlock = 99999999,
      page = 1,
      offset = 100,
      sort = 'desc'
    } = options;

    const cacheKey = `normal-${blockchain}-${address}-${startBlock}-${endBlock}-${page}-${offset}`;

    try {
      const response = await this.makeRequest<EtherscanTransaction>(
        blockchain,
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
      return transactions.map(tx => this.convertTransaction(tx, blockchain, address));
    } catch (error) {
      console.error(`❌ Failed to fetch normal transactions for ${address}:`, error);
      return [];
    }
  }

  /**
   * Fetch specific USDT transactions with comprehensive gas fee capture
   * This addresses the specific issue of missing USDT transaction fees from late 2022
   */
  static async getUSDTTransactionsWithFees(
    address: string,
    blockchain: string = 'ethereum',
    options: {
      startBlock?: number;
      endBlock?: number;
      limit?: number;
    } = {}
  ): Promise<BlockchainTransaction[]> {
    if (!this.isConfigured(blockchain)) {
      console.warn(`⚠️ ${blockchain.toUpperCase()} API not configured for USDT`);
      return [];
    }

    const usdtContractAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT contract
    console.log(`🔍 Fetching comprehensive USDT transactions for ${address.substring(0, 10)}...`);

    // Get USDT token transfers first
    const usdtTransfers = await this.getTokenTransfers(address, blockchain, {
      contractAddress: usdtContractAddress,
      startBlock: options.startBlock,
      endBlock: options.endBlock,
      offset: options.limit || 10000
    });

    console.log(`📊 Found ${usdtTransfers.length} USDT token transfers`);

    // Enhanced gas fee lookup for USDT transfers
    const enhancedUsdtTransfers: BlockchainTransaction[] = [];
    
    for (const transfer of usdtTransfers) {
      let enhancedTransfer = transfer;
      
      // For outgoing USDT transfers, ensure we have accurate gas fees
      if (transfer.type === 'outgoing' && transfer.gasFee === 0) {
        try {
          // Rate limiting
          await new Promise(r => setTimeout(r, 100));
          
          // Try to get transaction receipt for accurate gas data
          const receipt = await this.getTransactionReceipt(transfer.hash, blockchain);
          if (receipt && receipt.gasUsed > 0) {
            const effectiveGasPrice = this.weiToEther(receipt.effectiveGasPrice);
            const calculatedGasFee = receipt.gasUsed * effectiveGasPrice;
            
            enhancedTransfer = {
              ...transfer,
              gasUsed: receipt.gasUsed,
              gasFee: calculatedGasFee
            };
            
            console.log(`✅ Enhanced USDT gas fee:`, {
              hash: transfer.hash.substring(0, 10) + '...',
              date: new Date(transfer.timestamp).toLocaleDateString(),
              gasUsed: receipt.gasUsed,
              gasFee: calculatedGasFee,
              usdtAmount: transfer.amount
            });
          } else {
            // Fallback: Use transaction details
            const txDetails = await this.getTransactionByHash(transfer.hash, blockchain);
            if (txDetails && txDetails.gasPrice !== '0') {
              const gasPrice = this.weiToEther(txDetails.gasPrice);
              // USDT transfers typically use 50000-70000 gas
              const estimatedGasUsed = 65000; 
              const estimatedGasFee = estimatedGasUsed * gasPrice;
              
              enhancedTransfer = {
                ...transfer,
                gasUsed: estimatedGasUsed,
                gasFee: estimatedGasFee
              };
              
              console.log(`⚡ Estimated USDT gas fee:`, {
                hash: transfer.hash.substring(0, 10) + '...',
                gasPrice: txDetails.gasPrice,
                estimatedGasFee
              });
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to enhance USDT gas fee for ${transfer.hash.substring(0, 10)}...:`, error.message);
        }
      }
      
      enhancedUsdtTransfers.push(enhancedTransfer);
    }

    // Check for specific missing transactions mentioned in the issue
    const targetDates = [
      '2022-12-12',
      '2022-12-02', 
      '2022-11-08',
      '2022-10-14',
      '2022-10-10'
    ];
    
    const targetFees = [
      0.00070922,
      0.00068789,
      0.00139059,
      0.00090641,
      0.00287672
    ];

    console.log(`🎯 Checking for specific missing USDT transactions from late 2022...`);
    
    targetDates.forEach((dateStr, index) => {
      const targetDate = new Date(dateStr);
      const dayStart = new Date(targetDate.setHours(0, 0, 0, 0));
      const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999));
      
      const transactionsOnDate = enhancedUsdtTransfers.filter(tx => {
        const txDate = new Date(tx.timestamp);
        return txDate >= dayStart && txDate <= dayEnd && tx.type === 'outgoing';
      });
      
      const expectedFee = targetFees[index];
      const matchingFee = transactionsOnDate.find(tx => 
        Math.abs(tx.gasFee - expectedFee) < 0.00001
      );
      
      console.log(`📅 ${dateStr}: ${transactionsOnDate.length} USDT transactions, expected fee: ${expectedFee} ETH`, {
        found: transactionsOnDate.length > 0,
        matchingFee: matchingFee ? `✅ ${matchingFee.gasFee} ETH` : '❌ No match',
        hashes: transactionsOnDate.map(tx => tx.hash.substring(0, 10) + '...')
      });
    });

    return enhancedUsdtTransfers;
  }

  /**
   * Fetch token transfers for an address (ERC-20/BEP-20 tokens)
   */
  static async getTokenTransfers(
    address: string,
    blockchain: string = 'ethereum',
    options: {
      contractAddress?: string;
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
    } = {}
  ): Promise<BlockchainTransaction[]> {
    if (!this.isConfigured(blockchain)) {
      console.warn(`⚠️ ${blockchain.toUpperCase()} API not configured`);
      return [];
    }

    const {
      contractAddress,
      startBlock = 0,
      endBlock = 99999999,
      page = 1,
      offset = 100,
      sort = 'desc'
    } = options;

    const cacheKey = `tokens-${blockchain}-${address}-${contractAddress || 'all'}-${startBlock}-${endBlock}-${page}-${offset}`;

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

      const response = await this.makeRequest<EtherscanTokenTransfer>(
        blockchain,
        params,
        cacheKey
      );

      const transfers = response.result || [];
      return transfers.map(tx => this.convertTokenTransfer(tx, blockchain, address));
    } catch (error) {
      console.error(`❌ Failed to fetch token transfers for ${address}:`, error);
      return [];
    }
  }

  /**
   * Fetch internal transactions for an address
   */
  static async getInternalTransactions(
    address: string,
    blockchain: string = 'ethereum',
    options: {
      startBlock?: number;
      endBlock?: number;
      page?: number;
      offset?: number;
      sort?: 'asc' | 'desc';
    } = {}
  ): Promise<BlockchainTransaction[]> {
    if (!this.isConfigured(blockchain)) {
      console.warn(`⚠️ ${blockchain.toUpperCase()} API not configured`);
      return [];
    }

    const {
      startBlock = 0,
      endBlock = 99999999,
      page = 1,
      offset = 100,
      sort = 'desc'
    } = options;

    const cacheKey = `internal-${blockchain}-${address}-${startBlock}-${endBlock}-${page}-${offset}`;

    try {
      const response = await this.makeRequest<EtherscanTransaction>(
        blockchain,
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
      
      console.log(`🔍 Raw internal transactions API response:`, {
        status: response.status,
        message: response.message,
        transactionCount: transactions.length,
        apiEndpoint: 'txlistinternal'
      });
      
      if (transactions.length === 0 && process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ No internal transactions returned for ${address} - this may cause balance discrepancies`);
        console.warn(`⚠️ API Response details:`, response);
      }
      
      const convertedTransactions = transactions.map(tx => {
        // Debug: Log raw transaction data for our target transactions
        const targetHashes = [
          '0x65775048660b3c3d0c92c09d27e8f6ec5d49fa4887efa273cd1798f518115c4f',
          '0x2fc04baaa16828cb540306fc8ac544cf2345a31baf2e6a2b46010f3abf0ecc7c'
        ];
        
        if (targetHashes.some(hash => tx.hash.toLowerCase() === hash.toLowerCase())) {
          console.log(`🔍 Raw internal transaction data for ${tx.hash.substring(0, 12)}...`, {
            isError: tx.isError,
            txreceipt_status: tx.txreceipt_status,
            type: tx.type,
            traceId: tx.traceId
          });
        }
        
        const baseTx = this.convertTransaction(tx, blockchain, address);
        // Internal transactions are incoming ETH from contract interactions
        const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
        
        // Override tokenType to ensure it's set correctly for internal transactions
        baseTx.tokenType = 'native';
        
        // Internal transactions that transferred value successfully should be marked as success
        // Internal transactions don't have the same status fields as normal transactions
        const isSuccessfulInternal = tx.isError === '0' || !tx.isError; // Internal txs may not have isError field
        
        return {
          ...baseTx,
          type: isIncoming ? 'incoming' : 'outgoing', // Use incoming/outgoing instead of 'internal'
          description: `Internal transaction from contract ${tx.from.substring(0, 10)}...`,
          isInternal: true, // Flag to identify internal transactions
          status: isSuccessfulInternal ? 'success' : 'failed' // Override status for internal transactions
        };
      });
      
      console.log(`✅ Fetched ${convertedTransactions.length} internal transactions for ${address.substring(0, 10)}...`);
      
      // Debug: Log details of internal transactions with value
      if (process.env.NODE_ENV === 'development' && convertedTransactions.length > 0) {
        const valuableInternalTxs = convertedTransactions.filter(tx => tx.amount > 0);
        if (valuableInternalTxs.length > 0) {
          console.log(`💰 Internal transactions with ETH value:`, valuableInternalTxs.slice(0, 3).map(tx => ({
            hash: tx.hash.substring(0, 10) + '...',
            amount: tx.amount,
            type: tx.type,
            from: tx.from.substring(0, 10) + '...',
            to: tx.to.substring(0, 10) + '...'
          })));
        }
      }
      return convertedTransactions;
    } catch (error) {
      console.error(`❌ Failed to fetch internal transactions for ${address}:`, error);
      console.warn(`⚠️ Balance calculations may be inaccurate due to missing internal transactions`);
      return [];
    }
  }

  /**
   * Fetch mining/block rewards for an address
   */
  static async getMinedBlocks(
    address: string,
    blockchain: string = 'ethereum',
    blockType: 'blocks' | 'uncles' = 'blocks'
  ): Promise<BlockchainTransaction[]> {
    if (!this.isConfigured(blockchain)) {
      console.warn(`⚠️ Etherscan API not configured for ${blockchain}`);
      return [];
    }

    const cacheKey = `mined-${blockType}-${blockchain}-${address}`;

    try {
      const response = await this.makeRequest<any>(
        blockchain,
        {
          module: 'account',
          action: 'getminedblocks',
          address,
          blocktype: blockType,
          page: 1,
          offset: 100,
          sort: 'desc'
        },
        cacheKey
      );

      const minedBlocks = response.result || [];
      
      console.log(`🔍 Mining ${blockType} API response:`, {
        status: response.status,
        message: response.message,
        blockCount: minedBlocks.length
      });

      if (minedBlocks.length === 0) {
        console.log(`ℹ️ No ${blockType} rewards found for ${address}`);
        return [];
      }

      const convertedRewards = minedBlocks.map(block => {
        const amountETH = parseFloat(block.blockReward) / Math.pow(10, 18);
        
        return {
          hash: `${blockType}-${block.blockNumber}`,
          from: 'Ethereum Network',
          to: address,
          amount: amountETH,
          currency: 'ETH',
          timestamp: parseInt(block.timeStamp) * 1000,
          status: 'success',
          type: 'incoming' as const,
          fee: 0,
          blockchain: blockchain,
          tokenType: 'native',
          contractAddress: undefined,
          description: `Mining reward from ${blockType === 'blocks' ? 'block' : 'uncle block'} ${block.blockNumber}`,
          blockNumber: parseInt(block.blockNumber),
          gasUsed: 0,
          gasFee: 0,
          gasPrice: 0,
          internalId: `${blockType}-${block.blockNumber}`,
          isInternal: false
        };
      });

      console.log(`✅ Converted ${convertedRewards.length} ${blockType} rewards`);
      return convertedRewards;

    } catch (error) {
      console.warn(`⚠️ Failed to fetch ${blockType} rewards for ${address}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch mined blocks (mining rewards) for an address
   */
  static async getMinedBlocks(
    address: string,
    blockchain: string = 'ethereum',
    blocktype: 'blocks' | 'uncles' = 'blocks'
  ): Promise<BlockchainTransaction[]> {
    if (!this.isConfigured(blockchain)) {
      console.warn(`⚠️ Etherscan API not configured for ${blockchain}`);
      return [];
    }

    const cacheKey = `mined-${blocktype}-${blockchain}-${address}`;

    try {
      const response = await this.makeRequest<any>(
        blockchain,
        {
          module: 'account',
          action: 'getminedblocks',
          address,
          blocktype,
          page: 1,
          offset: 100
        },
        cacheKey
      );

      const blocks = response.result || [];
      
      console.log(`🔍 Mined ${blocktype} API response:`, {
        status: response.status,
        message: response.message,
        blockCount: blocks.length
      });

      if (blocks.length === 0) {
        console.log(`ℹ️ No mined ${blocktype} found for ${address}`);
        return [];
      }

      const convertedBlocks = blocks.map(block => {
        // Block rewards are typically 2-6.25 ETH historically
        const rewardETH = parseFloat(block.blockReward) / Math.pow(10, 18);
        
        return {
          hash: `${blocktype}-${block.blockNumber}`,
          from: 'Network Reward',
          to: address,
          amount: rewardETH,
          currency: 'ETH',
          timestamp: parseInt(block.timeStamp) * 1000,
          status: 'success',
          type: 'incoming' as const,
          fee: 0,
          blockchain: blockchain,
          tokenType: 'native',
          contractAddress: undefined,
          description: `${blocktype === 'blocks' ? 'Block mining' : 'Uncle block'} reward for block ${block.blockNumber}`,
          blockNumber: parseInt(block.blockNumber),
          gasUsed: 0,
          gasFee: 0,
          gasPrice: 0,
          internalId: `${blocktype}-${block.blockNumber}`,
          isInternal: false
        };
      });

      console.log(`✅ Converted ${convertedBlocks.length} mining ${blocktype} rewards`);
      if (convertedBlocks.length > 0) {
        console.log(`💰 Total ${blocktype} rewards: ${convertedBlocks.reduce((sum, b) => sum + b.amount, 0)} ETH`);
      }
      
      return convertedBlocks;

    } catch (error) {
      console.warn(`⚠️ Failed to fetch mined ${blocktype} for ${address}:`, error.message);
      return [];
    }
  }

  /**
   * Get transaction receipt for accurate gas fee data
   * This is crucial for token transfers that don't have gas data in tokentx API
   */
  static async getTransactionReceipt(
    txHash: string,
    blockchain: string = 'ethereum'
  ): Promise<{ gasUsed: number; effectiveGasPrice: string; status: string } | null> {
    if (!this.isConfigured(blockchain)) {
      return null;
    }

    const cacheKey = `receipt-${blockchain}-${txHash}`;

    try {
      const response = await this.makeRequest<any>(
        blockchain,
        {
          module: 'proxy',
          action: 'eth_getTransactionReceipt',
          txhash: txHash
        },
        cacheKey
      );

      const receipt = response.result;
      if (!receipt || typeof receipt !== 'object') {
        return null;
      }
      
      // Debug BSC receipt data
      if (process.env.NODE_ENV === 'development' && blockchain.toLowerCase().includes('bsc')) {
        console.log(`🔍 BSC receipt debug for ${txHash.substring(0, 12)}...`, {
          effectiveGasPrice: receipt.effectiveGasPrice,
          gasPrice: receipt.gasPrice,
          gasUsed: receipt.gasUsed,
          status: receipt.status
        });
      }

      // For BSC, effectiveGasPrice might be 0x0, so we need to use gasPrice
      let gasPrice = receipt.effectiveGasPrice || receipt.gasPrice || '0';
      
      // If still 0x0, try to get transaction details for actual gas price
      if (gasPrice === '0x0' && blockchain.toLowerCase().includes('bsc')) {
        console.log(`⚠️ BSC transaction ${txHash.substring(0, 12)}... has 0x0 gas price, trying transaction details...`);
        try {
          const txDetails = await this.getTransactionByHash(txHash, blockchain);
          if (txDetails && txDetails.gasPrice !== '0') {
            gasPrice = txDetails.gasPrice;
            console.log(`✅ Retrieved gas price from transaction details: ${gasPrice}`);
          } else {
            // Fallback: Use historical BSC gas price based on block number
            gasPrice = this.estimateBSCGasPrice(parseInt((receipt as any).blockNumber, 16));
            console.log(`⚡ Using BSC estimated gas price: ${parseInt(gasPrice, 16) / 1e9} Gwei for ${txHash.substring(0, 12)}...`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get transaction details for gas price: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Fallback: Use historical BSC gas price based on block number
          gasPrice = this.estimateBSCGasPrice(parseInt((receipt as any).blockNumber, 16));
          console.log(`⚡ Using BSC estimated gas price: ${parseInt(gasPrice, 16) / 1e9} Gwei for ${txHash.substring(0, 12)}...`);
        }
      }

      return {
        gasUsed: parseInt(receipt.gasUsed, 16),
        effectiveGasPrice: gasPrice,
        status: receipt.status || '0x1'
      };
    } catch (error) {
      console.warn(`⚠️ Failed to fetch receipt for ${txHash}:`, error.message);
      return null;
    }
  }

  /**
   * Get transaction details for accurate gas fee data
   * Fallback when receipt API is not available
   */
  static async getTransactionByHash(
    txHash: string,
    blockchain: string = 'ethereum'
  ): Promise<{ gasPrice: string; gas: string } | null> {
    if (!this.isConfigured(blockchain)) {
      return null;
    }

    const cacheKey = `tx-${blockchain}-${txHash}`;

    try {
      const response = await this.makeRequest<any>(
        blockchain,
        {
          module: 'proxy',
          action: 'eth_getTransactionByHash',
          txhash: txHash
        },
        cacheKey
      );

      const tx = response.result;
      if (!tx) {
        return null;
      }

      return {
        gasPrice: tx.gasPrice || '0',
        gas: tx.gas || '0'
      };
    } catch (error) {
      console.warn(`⚠️ Failed to fetch transaction ${txHash}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch beacon chain withdrawals for an address
   */
  static async getBeaconWithdrawals(
    address: string,
    blockchain: string = 'ethereum'
  ): Promise<BlockchainTransaction[]> {
    if (!this.isConfigured(blockchain)) {
      console.warn(`⚠️ Etherscan API not configured for ${blockchain}`);
      return [];
    }

    const cacheKey = `beacon-withdrawals-${blockchain}-${address}`;

    try {
      const response = await this.makeRequest<any>(
        blockchain,
        {
          module: 'account',
          action: 'txsBeaconWithdrawal',
          address,
          page: 1,
          offset: 100,
          sort: 'desc'
        },
        cacheKey
      );

      const withdrawals = response.result || [];
      
      console.log(`🔍 Beacon chain withdrawals API response:`, {
        status: response.status,
        message: response.message,
        withdrawalCount: withdrawals.length
      });

      if (withdrawals.length === 0) {
        console.log(`ℹ️ No beacon chain withdrawals found for ${address}`);
        return [];
      }

      const convertedWithdrawals = withdrawals.map(withdrawal => {
        const amountETH = parseFloat(withdrawal.amount) / Math.pow(10, 18);
        
        return {
          hash: `beacon-${withdrawal.validatorIndex}-${withdrawal.withdrawalIndex}`,
          from: 'Beacon Chain',
          to: address,
          amount: amountETH,
          currency: 'ETH',
          timestamp: parseInt(withdrawal.timestamp) * 1000,
          status: 'success',
          type: 'incoming' as const,
          fee: 0,
          blockchain: blockchain,
          tokenType: 'native',
          contractAddress: undefined,
          description: `Beacon chain withdrawal from validator ${withdrawal.validatorIndex}`,
          blockNumber: parseInt(withdrawal.blockNumber),
          gasUsed: 0,
          gasFee: 0,
          gasPrice: 0,
          internalId: `beacon-${withdrawal.validatorIndex}-${withdrawal.withdrawalIndex}`,
          isInternal: false
        };
      });

      console.log(`✅ Converted ${convertedWithdrawals.length} beacon chain withdrawals`);
      return convertedWithdrawals;

    } catch (error) {
      console.warn(`⚠️ Failed to fetch beacon withdrawals for ${address}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch all transaction types for an address (comprehensive)
   */
  static async getAllTransactions(
    address: string,
    blockchain: string = 'ethereum',
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
      limit = 100,
      includeInternal = true // Always include internal transactions by default to catch missing ETH transfers
    } = options;

    console.log(`🚀 Fetching ALL transactions for ${address} on ${blockchain.toUpperCase()} with pagination`);

    // Implement comprehensive pagination to fetch ALL transactions
    // Etherscan API limits to 10,000 transactions per request, but use smaller batches for BSC to avoid rate limits
    const maxPerRequest = blockchain.toLowerCase().includes('bsc') ? 1000 : 10000; // Smaller batches for BSC
    const allNormalTransactions: BlockchainTransaction[] = [];
    const allTokenTransactions: BlockchainTransaction[] = [];
    
    // Fetch normal transactions with pagination
    let normalPage = 1;
    let normalHasMore = true;
    console.log(`📄 Fetching normal transactions with pagination...`);
    
    while (normalHasMore && allNormalTransactions.length < 50000) { // Safety limit of 50k transactions
      try {
        const normalBatch = await this.getNormalTransactions(address, blockchain, { 
          startBlock, 
          endBlock, 
          page: normalPage, 
          offset: maxPerRequest,
          sort: 'desc' // Most recent first
        });
        
        if (normalBatch.length === 0) {
          normalHasMore = false;
          console.log(`📄 Normal transactions: No more results on page ${normalPage}`);
        } else {
          allNormalTransactions.push(...normalBatch);
          console.log(`📄 Normal transactions: Fetched ${normalBatch.length} on page ${normalPage}, total: ${allNormalTransactions.length}`);
          
          // If we got fewer than max, we've reached the end
          if (normalBatch.length < maxPerRequest) {
            normalHasMore = false;
            console.log(`📄 Normal transactions: Reached end with ${normalBatch.length} transactions on final page`);
          }
        }
        
        normalPage++;
        
        // Rate limiting: Wait between requests
        if (normalHasMore) {
          const delay = 200; // Unified 200ms delay for all chains on Etherscan v2
          await new Promise(r => setTimeout(r, delay));
        }
      } catch (error) {
        console.error(`❌ Error fetching normal transactions page ${normalPage}:`, error);
        normalHasMore = false;
      }
    }
    
    // Rate limiting between different API calls
    const apiTypeDelay = 400; // Unified 400ms delay between API types for all chains
    await new Promise(r => setTimeout(r, apiTypeDelay));
    
    // Fetch token transactions with pagination
    let tokenPage = 1;
    let tokenHasMore = true;
    console.log(`📄 Fetching token transactions with pagination...`);
    
    while (tokenHasMore && allTokenTransactions.length < 50000) { // Safety limit of 50k transactions
      try {
        const tokenBatch = await this.getTokenTransfers(address, blockchain, { 
          startBlock, 
          endBlock, 
          page: tokenPage, 
          offset: maxPerRequest,
          sort: 'desc' // Most recent first
        });
        
        if (tokenBatch.length === 0) {
          tokenHasMore = false;
          console.log(`📄 Token transactions: No more results on page ${tokenPage}`);
        } else {
          allTokenTransactions.push(...tokenBatch);
          console.log(`📄 Token transactions: Fetched ${tokenBatch.length} on page ${tokenPage}, total: ${allTokenTransactions.length}`);
          
          // If we got fewer than max, we've reached the end
          if (tokenBatch.length < maxPerRequest) {
            tokenHasMore = false;
            console.log(`📄 Token transactions: Reached end with ${tokenBatch.length} transactions on final page`);
          }
        }
        
        tokenPage++;
        
        // Rate limiting: Wait between requests
        if (tokenHasMore) {
          const delay = 200; // Unified 200ms delay for all chains on Etherscan v2
          await new Promise(r => setTimeout(r, delay));
        }
      } catch (error) {
        console.error(`❌ Error fetching token transactions page ${tokenPage}:`, error);
        tokenHasMore = false;
      }
    }
    
    // SPECIAL: Fetch enhanced USDT transactions to address specific late 2022 missing fees
    console.log(`🔶 Fetching enhanced USDT transactions for comprehensive gas fee coverage...`);
    await new Promise(r => setTimeout(r, 600)); // Rate limiting
    
    try {
      const enhancedUsdtTransactions = await this.getUSDTTransactionsWithFees(address, blockchain, {
        startBlock,
        endBlock,
        limit: 10000
      });
      
      if (enhancedUsdtTransactions.length > 0) {
        console.log(`✅ Enhanced USDT transactions: ${enhancedUsdtTransactions.length} found`);
        
        // Replace any existing USDT transactions with enhanced versions
        const nonUsdtTokens = allTokenTransactions.filter(tx => 
          tx.currency.toUpperCase() !== 'USDT'
        );
        
        allTokenTransactions = [...nonUsdtTokens, ...enhancedUsdtTransactions];
        console.log(`🔄 Replaced USDT transactions with enhanced versions. Total token transactions: ${allTokenTransactions.length}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch enhanced USDT transactions:`, error.message);
    }
    
    console.log(`✅ Pagination complete: ${allNormalTransactions.length} normal, ${allTokenTransactions.length} token transactions`);
    
    // Convert to promises format for compatibility with existing code
    const promises = [
      Promise.resolve(allNormalTransactions),
      Promise.resolve(allTokenTransactions)
    ];

    // Wait for normal and token transactions first
    const [normalResult, tokenResult] = await Promise.allSettled(promises);
    
    // Fetch internal transactions with pagination (most important for missing ETH transfers)
    await new Promise(r => setTimeout(r, 600)); // Wait 600ms for rate limiting
    
    const allInternalTransactions: BlockchainTransaction[] = [];
    let internalPage = 1;
    let internalHasMore = true;
    console.log(`📄 Fetching internal transactions with pagination...`);
    
    while (internalHasMore && allInternalTransactions.length < 50000) { // Safety limit of 50k transactions
      try {
        const internalBatch = await this.getInternalTransactions(address, blockchain, { 
          startBlock, 
          endBlock, 
          page: internalPage, 
          offset: maxPerRequest,
          sort: 'desc' // Most recent first
        });
        
        if (internalBatch.length === 0) {
          internalHasMore = false;
          console.log(`📄 Internal transactions: No more results on page ${internalPage}`);
        } else {
          allInternalTransactions.push(...internalBatch);
          console.log(`📄 Internal transactions: Fetched ${internalBatch.length} on page ${internalPage}, total: ${allInternalTransactions.length}`);
          
          // If we got fewer than max, we've reached the end
          if (internalBatch.length < maxPerRequest) {
            internalHasMore = false;
            console.log(`📄 Internal transactions: Reached end with ${internalBatch.length} transactions on final page`);
          }
        }
        
        internalPage++;
        
        // Rate limiting: Wait between requests
        if (internalHasMore) {
          const delay = 200; // Unified 200ms delay for all chains on Etherscan v2
          await new Promise(r => setTimeout(r, delay));
        }
      } catch (error) {
        console.error(`❌ Error fetching internal transactions page ${internalPage}:`, error);
        internalHasMore = false;
      }
    }
    
    console.log(`✅ Internal transaction pagination complete: ${allInternalTransactions.length} total internal transactions`);
    
    if (allInternalTransactions.length > 0) {
      console.log(`📋 Sample internal transactions with isInternal flag:`, 
        allInternalTransactions.slice(0, 3).map(tx => ({
          hash: tx.hash.substring(0, 12) + '...',
          amount: tx.amount,
          type: tx.type,
          isInternal: tx.isInternal
        }))
      );
    }

    try {
      const normalTransactions: BlockchainTransaction[] = [];
      const tokenTransactions: BlockchainTransaction[] = [];
      const internalTransactions: BlockchainTransaction[] = [...allInternalTransactions];

      // Process the results from parallel fetch
      if (normalResult.status === 'fulfilled') {
        normalTransactions.push(...normalResult.value);
        console.log(`✅ Fetched ${normalResult.value.length} normal transactions`);
      } else {
        console.warn(`⚠️ Failed to fetch normal transactions:`, normalResult.reason);
      }
      
      if (tokenResult.status === 'fulfilled') {
        tokenTransactions.push(...tokenResult.value);
        console.log(`✅ Fetched ${tokenResult.value.length} token transactions`);
      } else {
        console.warn(`⚠️ Failed to fetch token transactions:`, tokenResult.reason);
      }

      console.log(`✅ Have ${internalTransactions.length} internal transactions to process`);

      // Create a map of normal transactions by hash for quick lookup
      const normalTxMap = new Map<string, BlockchainTransaction>();
      normalTransactions.forEach(tx => {
        normalTxMap.set(tx.hash.toLowerCase(), tx);
      });

      // Enhanced gas fee merging for token transfers - critical for USDT transactions
      const mergedTokenTransactions: BlockchainTransaction[] = [];
      
      for (const tokenTx of tokenTransactions) {
        const normalTx = normalTxMap.get(tokenTx.hash.toLowerCase());
        let finalTokenTx = tokenTx;
        
        // Step 1: Try to merge from normal transaction
        if (normalTx && normalTx.gasFee && normalTx.gasFee > 0) {
          finalTokenTx = {
            ...tokenTx,
            gasUsed: normalTx.gasUsed,
            gasFee: normalTx.gasFee
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Merged gas fee from normal tx for ${tokenTx.currency} transfer:`, {
              hash: tokenTx.hash.substring(0, 10) + '...',
              originalGasFee: tokenTx.gasFee,
              mergedGasFee: normalTx.gasFee
            });
          }
        }
        // Step 2: For outgoing token transfers without gas fees, try transaction receipt lookup
        else if (tokenTx.type === 'outgoing' && (tokenTx.gasFee === 0 || (tokenTx as any).needsGasFeeLookup)) {
          try {
            // Rate limiting for receipt requests
            await new Promise(r => setTimeout(r, 50));
            
            const receipt = await this.getTransactionReceipt(tokenTx.hash, blockchain);
            if (receipt && receipt.gasUsed > 0) {
              const effectiveGasPrice = this.weiToEther(receipt.effectiveGasPrice);
              const calculatedGasFee = receipt.gasUsed * effectiveGasPrice;
              
              finalTokenTx = {
                ...tokenTx,
                gasUsed: receipt.gasUsed,
                gasFee: calculatedGasFee
              };
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Enhanced gas fee from receipt for ${tokenTx.currency} transfer:`, {
                  hash: tokenTx.hash.substring(0, 10) + '...',
                  gasUsed: receipt.gasUsed,
                  effectiveGasPrice: receipt.effectiveGasPrice,
                  calculatedGasFee,
                  isUSDT: tokenTx.currency.toUpperCase() === 'USDT'
                });
              }
            } else {
              // Fallback: Try getTransactionByHash
              const txDetails = await this.getTransactionByHash(tokenTx.hash, blockchain);
              if (txDetails && txDetails.gasPrice !== '0') {
                const gasPrice = this.weiToEther(txDetails.gasPrice);
                const estimatedGasUsed = 21000; // Standard ERC-20 transfer gas usage
                const estimatedGasFee = estimatedGasUsed * gasPrice;
                
                finalTokenTx = {
                  ...tokenTx,
                  gasUsed: estimatedGasUsed,
                  gasFee: estimatedGasFee
                };
                
                if (process.env.NODE_ENV === 'development') {
                  console.log(`⚡ Estimated gas fee for ${tokenTx.currency} transfer:`, {
                    hash: tokenTx.hash.substring(0, 10) + '...',
                    gasPrice: txDetails.gasPrice,
                    estimatedGasFee
                  });
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ Failed to enhance gas fee for token tx ${tokenTx.hash.substring(0, 10)}...:`, error.message);
          }
        }
        
        // Log if we still couldn't get gas fee for important tokens like USDT
        if (process.env.NODE_ENV === 'development' && 
            finalTokenTx.type === 'outgoing' && 
            finalTokenTx.gasFee === 0 && 
            ['USDT', 'USDC', 'DAI'].includes(finalTokenTx.currency.toUpperCase())) {
          console.warn(`⚠️ Still missing gas fee for major token transfer:`, {
            hash: finalTokenTx.hash.substring(0, 10) + '...',
            currency: finalTokenTx.currency,
            hasNormalTx: !!normalTx,
            normalTxGasFee: normalTx?.gasFee
          });
        }
        
        mergedTokenTransactions.push(finalTokenTx);
      }

      // Fetch beacon chain withdrawals (ETH2 validator withdrawals)
      await new Promise(r => setTimeout(r, 600)); // Rate limiting
      let beaconWithdrawals: BlockchainTransaction[] = [];
      
      try {
        beaconWithdrawals = await this.getBeaconWithdrawals(address, blockchain);
        console.log(`✅ Fetched ${beaconWithdrawals.length} beacon chain withdrawals`);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch beacon withdrawals:`, error.message);
      }

      // Fetch mining rewards (block and uncle rewards)
      await new Promise(r => setTimeout(r, 600)); // Rate limiting
      let miningRewards: BlockchainTransaction[] = [];
      let uncleRewards: BlockchainTransaction[] = [];
      
      try {
        miningRewards = await this.getMinedBlocks(address, blockchain, 'blocks');
        console.log(`✅ Fetched ${miningRewards.length} block mining rewards`);
        
        await new Promise(r => setTimeout(r, 300)); // Rate limiting between mining calls
        uncleRewards = await this.getMinedBlocks(address, blockchain, 'uncles');
        console.log(`✅ Fetched ${uncleRewards.length} uncle block rewards`);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch mining rewards:`, error.message);
      }

      // Combine all transactions
      const allTransactions: BlockchainTransaction[] = [
        ...normalTransactions,
        ...mergedTokenTransactions,
        ...internalTransactions,
        ...beaconWithdrawals,
        ...miningRewards,
        ...uncleRewards
      ];
      
      // Debug: Check for our target internal transactions before deduplication
      const debugTargetHashes = [
        '0x65775048660b3c3d0c92c09d27e8f6ec5d49fa4887efa273cd1798f518115c4f',
        '0x2fc04baaa16828cb540306fc8ac544cf2345a31baf2e6a2b46010f3abf0ecc7c'
      ];
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 BEFORE deduplication - checking for target transactions:');
        debugTargetHashes.forEach(hash => {
          const found = allTransactions.find(tx => tx.hash.toLowerCase() === hash.toLowerCase());
          if (found) {
            console.log(`✅ PRE-DEDUP: Found ${hash.substring(0, 12)}...`, {
              amount: found.amount,
              type: found.type,
              currency: found.currency,
              isInternal: found.isInternal
            });
          } else {
            console.log(`❌ PRE-DEDUP: Missing ${hash.substring(0, 12)}...`);
          }
        });
        
        console.log('🔍 Internal transactions count before deduplication:', internalTransactions.length);
        if (internalTransactions.length > 0) {
          console.log('🔍 Sample internal transactions:', internalTransactions.slice(0, 2).map(tx => ({
            hash: tx.hash.substring(0, 12) + '...',
            amount: tx.amount,
            type: tx.type,
            isInternal: tx.isInternal
          })));
        }
      }

      // Remove duplicates (keep the one with more complete data)
      const uniqueTransactions = new Map<string, BlockchainTransaction>();
      
      // Debug: Track what happens to our target transactions
      const targetHashes = [
        '0x65775048660b3c3d0c92c09d27e8f6ec5d49fa4887efa273cd1798f518115c4f',
        '0x2fc04baaa16828cb540306fc8ac544cf2345a31baf2e6a2b46010f3abf0ecc7c'
      ];
      
      allTransactions.forEach(tx => {
        const key = `${tx.hash}-${tx.currency}-${tx.type}`;
        const existing = uniqueTransactions.get(key);
        
        // Debug logging for target transactions
        if (targetHashes.some(h => tx.hash.toLowerCase() === h.toLowerCase())) {
          console.log(`🔍 DEDUP processing ${tx.hash.substring(0, 12)}...`, {
            key,
            currency: tx.currency,
            type: tx.type,
            isInternal: tx.isInternal,
            hasExisting: !!existing,
            willKeep: tx.isInternal || !existing
          });
        }
        
        // Always keep internal transactions - they represent unique value transfers
        // that are separate from the normal transactions that triggered them
        if (tx.isInternal) {
          uniqueTransactions.set(key, tx);
        }
        // Keep the transaction with gas fee data if one exists, unless we already have an internal tx
        else if (!existing || (tx.gasFee && tx.gasFee > 0 && (!existing.gasFee || existing.gasFee === 0))) {
          uniqueTransactions.set(key, tx);
        }
      });

      const finalTransactions = Array.from(uniqueTransactions.values());
      
      // Debug: Check for our target internal transactions after deduplication
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 AFTER deduplication - checking for target transactions:');
        
        // Check what's in the unique map for our target hashes
        targetHashes.forEach(hash => {
          const allWithHash = finalTransactions.filter(tx => tx.hash.toLowerCase() === hash.toLowerCase());
          console.log(`📋 Transactions with hash ${hash.substring(0, 12)}...: ${allWithHash.length}`);
          allWithHash.forEach(tx => {
            console.log(`   - ${tx.currency} ${tx.type} amount=${tx.amount} isInternal=${tx.isInternal}`);
          });
        });
        
        const internalCount = finalTransactions.filter(tx => tx.isInternal).length;
        console.log('🔍 Internal transactions count after deduplication:', internalCount);
      }

      // Sort by timestamp (most recent first)
      finalTransactions.sort((a, b) => b.timestamp - a.timestamp);

      // Limit results if needed
      const limitedTransactions = finalTransactions.slice(0, limit);

      // Final debug check for internal transactions and mining rewards
      const finalInternalCount = limitedTransactions.filter(tx => tx.isInternal).length;
      const finalMiningCount = limitedTransactions.filter(tx => tx.hash?.startsWith('blocks-') || tx.hash?.startsWith('uncles-')).length;
      console.log(`✅ Fetched ${limitedTransactions.length} total transactions for ${address}`);
      console.log(`   📊 Internal transactions in final result: ${finalInternalCount}`);
      console.log(`   ⛏️ Mining rewards in final result: ${finalMiningCount}`);
      
      if (finalInternalCount === 0 && internalTransactions.length > 0) {
        console.error(`❌ WARNING: Internal transactions were lost during processing!`);
        console.error(`   Had ${internalTransactions.length} internal txs, but 0 in final result`);
      }
      
      return limitedTransactions;
    } catch (error) {
      console.error(`❌ Failed to fetch transactions for ${address}:`, error);
      return [];
    }
  }

  /**
   * Estimate BSC gas price based on block number (historical data)
   * BSC gas prices have varied over time, this provides reasonable estimates
   */
  private static estimateBSCGasPrice(blockNumber: number): string {
    // BSC block numbers and approximate gas prices (in Gwei)
    // These are based on historical BSC network conditions
    
    if (blockNumber < 10000000) { // Early BSC (2020-2021)
      return '0x4a817c800'; // 20 Gwei
    } else if (blockNumber < 20000000) { // Mid 2021
      return '0x2540be400'; // 10 Gwei  
    } else if (blockNumber < 30000000) { // Late 2021 - 2022
      return '0x12a05f200'; // 5 Gwei
    } else if (blockNumber < 35000000) { // 2022 - 2023
      return '0x12a05f200'; // 5 Gwei
    } else { // 2023 onwards (current era)
      return '0xba43b7400'; // 3 Gwei - BSC is very cheap now
    }
  }

  /**
   * Convert date range to approximate block numbers (simplified)
   * TODO: Implement proper block number lookup for exact date filtering
   */
  static async getBlockNumberFromDate(
    date: Date,
    blockchain: string = 'ethereum'
  ): Promise<number> {
    // For now, use a simple approximation
    // Ethereum: ~12 seconds per block
    // BSC: ~3 seconds per block
    const blockTime = blockchain.toLowerCase() === 'ethereum' ? 12 : 3;
    const genesisTime = blockchain.toLowerCase() === 'ethereum' ? 
      new Date('2015-07-30T00:00:00Z').getTime() : // Ethereum genesis
      new Date('2020-09-01T00:00:00Z').getTime();  // BSC approximate start

    const timeDiff = date.getTime() - genesisTime;
    const approxBlockNumber = Math.floor(timeDiff / (blockTime * 1000));
    
    return Math.max(0, approxBlockNumber);
  }

  /**
   * Fetch transactions with date range filtering
   */
  static async getTransactionHistory(
    address: string,
    blockchain: string = 'ethereum',
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      currency?: string;
    } = {}
  ): Promise<BlockchainTransaction[]> {
    const { startDate, endDate, limit = 100, currency } = options;
    
    // For comprehensive transaction fetching, don't use block number filtering initially
    // Instead, fetch all transactions and filter by date client-side for accuracy
    let startBlock = 0;
    let endBlock = 99999999;

    // Only use block filtering if we have very specific recent date ranges to optimize API calls
    const isRecentDateRange = startDate && endDate && 
      (Date.now() - startDate.getTime()) < (365 * 24 * 60 * 60 * 1000); // Less than 1 year ago

    if (isRecentDateRange) {
      // Convert dates to approximate block numbers only for recent transactions
      if (startDate) {
        startBlock = await this.getBlockNumberFromDate(startDate, blockchain);
      }
      if (endDate) {
        endBlock = await this.getBlockNumberFromDate(endDate, blockchain);
      }
      console.log(`📅 Recent date range: ${startDate?.toISOString()} to ${endDate?.toISOString()}`);
      console.log(`🔢 Block range: ${startBlock} to ${endBlock}`);
    } else {
      console.log(`📅 Fetching comprehensive transaction history (all time) for better coverage`);
    }

    // Use pagination-enabled getAllTransactions for comprehensive fetching
    // The limit parameter is now handled by pagination within getAllTransactions
    console.log(`🔄 Calling getAllTransactions with comprehensive pagination (requested limit: ${limit})`);

    const transactions = await this.getAllTransactions(address, blockchain, {
      startBlock,
      endBlock,
      limit: limit, // Let getAllTransactions handle pagination for this limit
      includeInternal: true
    });

    console.log(`🔍 Raw transactions fetched: ${transactions.length}`);

    // ALWAYS apply client-side date filtering for precision, regardless of block filtering
    let filteredTransactions = transactions;
    
    if (startDate || endDate) {
      const beforeFiltering = filteredTransactions.length;
      filteredTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
        return true;
      });
      console.log(`🔍 Date filtering: ${beforeFiltering} -> ${filteredTransactions.length} transactions`);
    }

    // Filter by currency if specified
    if (currency) {
      const currencyUpper = currency.toUpperCase();
      const beforeCurrencyFiltering = filteredTransactions.length;
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.currency.toUpperCase() === currencyUpper
      );
      console.log(`🔍 Currency filtering (${currencyUpper}): ${beforeCurrencyFiltering} -> ${filteredTransactions.length} transactions`);
    }

    // Debug: Show sample of what we're returning
    if (process.env.NODE_ENV === 'development' && filteredTransactions.length > 0) {
      console.log(`🔍 Sample transactions:`, filteredTransactions.slice(0, 3).map(tx => ({
        hash: tx.hash.substring(0, 10) + '...',
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        date: new Date(tx.timestamp).toISOString(),
        gasFee: tx.gasFee
      })));
      
      // Check for specific missing transaction hashes
      const targetHashes = [
        '0x65775048660b3c3d0c92c09d27e8f6ec5d49fa4887efa273cd1798f518115c4f',
        '0x2fc04baaa16828cb540306fc8ac544cf2345a31baf2e6a2b46010f3abf0ecc7c'
      ];
      
      const foundHashes = new Set(filteredTransactions.map(tx => tx.hash.toLowerCase()));
      targetHashes.forEach(hash => {
        const isFound = foundHashes.has(hash.toLowerCase());
        console.log(`🎯 Target transaction ${hash.substring(0, 10)}... ${isFound ? '✅ FOUND' : '❌ MISSING'}`);
        
        if (!isFound) {
          // Check if it was in the raw transactions before filtering
          const wasInRaw = transactions.some(tx => tx.hash.toLowerCase() === hash.toLowerCase());
          console.log(`   Was in raw results: ${wasInRaw ? 'YES' : 'NO'}`);
          
          if (wasInRaw) {
            const rawTx = transactions.find(tx => tx.hash.toLowerCase() === hash.toLowerCase());
            console.log(`   Raw transaction details:`, {
              amount: rawTx?.amount,
              currency: rawTx?.currency,
              type: rawTx?.type,
              timestamp: rawTx ? new Date(rawTx.timestamp).toISOString() : 'unknown',
              passedDateFilter: rawTx ? (!startDate || new Date(rawTx.timestamp) >= startDate) && (!endDate || new Date(rawTx.timestamp) <= endDate) : 'unknown',
              passedCurrencyFilter: rawTx ? !currency || rawTx.currency.toUpperCase() === currency.toUpperCase() : 'unknown'
            });
          }
        }
      });
    }

    const finalResult = filteredTransactions.slice(0, limit);
    console.log(`✅ Returning ${finalResult.length} transactions (limited from ${filteredTransactions.length})`);
    
    return finalResult;
  }

  /**
   * Clear the cache (useful for force refresh)
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Etherscan API cache cleared');
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