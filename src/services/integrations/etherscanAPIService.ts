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
    bsc: 'https://api.bscscan.com/api',
    'binance-smart-chain': 'https://api.bscscan.com/api'
  };

  /**
   * Check if the service is configured for a specific blockchain
   */
  static isConfigured(blockchain: string = 'ethereum'): boolean {
    const blockchainLower = blockchain.toLowerCase();
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Checking Etherscan API config for ${blockchainLower}:`, {
        ETH_API_KEY: this.ETH_API_KEY ? `${this.ETH_API_KEY.substring(0, 8)}...` : 'undefined',
        BSC_API_KEY: this.BSC_API_KEY ? `${this.BSC_API_KEY.substring(0, 8)}...` : 'undefined',
        envEtherscan: process.env.ETHERSCAN_API_KEY ? `${process.env.ETHERSCAN_API_KEY.substring(0, 8)}...` : 'undefined',
        envNextPublicEtherscan: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY ? `${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY.substring(0, 8)}...` : 'undefined',
        keyLength: this.ETH_API_KEY?.length || 0,
        isConfigured: blockchainLower === 'ethereum' ? (!!this.ETH_API_KEY && this.ETH_API_KEY.length > 10) : (!!this.BSC_API_KEY && this.BSC_API_KEY.length > 10)
      });
    }
    
    switch (blockchainLower) {
      case 'ethereum':
        return !!this.ETH_API_KEY && this.ETH_API_KEY.length > 10;
      case 'bsc':
      case 'binance-smart-chain':
        return !!this.BSC_API_KEY && this.BSC_API_KEY.length > 10;
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
    return this.BASE_URLS[blockchainLower] || this.BASE_URLS.ethereum;
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
    const searchParams = new URLSearchParams({
      ...params,
      apikey: apiKey
    } as Record<string, string>);

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
        // Handle specific BSC API error messages more gracefully
        if (data.message === 'NOTOK' && blockchain === 'bsc') {
          console.warn(`⚠️ BSC API returned NOTOK - likely rate limited or API key issue`);
          // Return empty result instead of throwing error
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
    return parseFloat(value) / Math.pow(10, decimalCount);
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
    const gasPrice = this.weiToEther(tx.gasPrice);
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
      currency: tx.tokenSymbol,
      type: isIncoming ? 'incoming' : 'outgoing',
      status: 'success', // Token transfers are usually successful if they exist
      gasUsed,
      gasFee,
      contractAddress: tx.contractAddress,
      tokenType: blockchain.toLowerCase() === 'ethereum' ? 'erc20' : 'bep20',
      blockchain: blockchain.toLowerCase(),
      network: 'mainnet'
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
      const balance = this.weiToEther(balanceWei);
      const currency = blockchain.toLowerCase() === 'ethereum' ? 'ETH' : 'BNB';

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
        'USDC': { address: '0xA0b86a33E6441b1c8e4b4c8d9Da4a93b60d5e9C3', decimals: 6 }
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
      return transactions.map(tx => ({
        ...this.convertTransaction(tx, blockchain, address),
        type: 'internal' as const
      }));
    } catch (error) {
      console.error(`❌ Failed to fetch internal transactions for ${address}:`, error);
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
      includeInternal = false
    } = options;

    console.log(`🚀 Fetching all transactions for ${address} on ${blockchain.toUpperCase()}`);

    const promises = [
      this.getNormalTransactions(address, blockchain, { startBlock, endBlock, offset: limit }),
      this.getTokenTransfers(address, blockchain, { startBlock, endBlock, offset: limit })
    ];

    if (includeInternal) {
      promises.push(
        this.getInternalTransactions(address, blockchain, { startBlock, endBlock, offset: limit })
      );
    }

    try {
      const results = await Promise.allSettled(promises);
      const allTransactions: BlockchainTransaction[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allTransactions.push(...result.value);
        } else {
          const types = ['normal', 'token', 'internal'];
          console.warn(`⚠️ Failed to fetch ${types[index]} transactions:`, result.reason);
        }
      });

      // Sort by timestamp (most recent first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      // Limit results if needed
      const finalTransactions = allTransactions.slice(0, limit);

      console.log(`✅ Fetched ${finalTransactions.length} total transactions for ${address}`);
      return finalTransactions;
    } catch (error) {
      console.error(`❌ Failed to fetch transactions for ${address}:`, error);
      return [];
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
    
    let startBlock = 0;
    let endBlock = 99999999;

    // Convert dates to approximate block numbers if provided
    if (startDate) {
      startBlock = await this.getBlockNumberFromDate(startDate, blockchain);
    }
    if (endDate) {
      endBlock = await this.getBlockNumberFromDate(endDate, blockchain);
    }

    console.log(`📅 Date range: ${startDate?.toISOString()} to ${endDate?.toISOString()}`);
    console.log(`🔢 Block range: ${startBlock} to ${endBlock}`);

    const transactions = await this.getAllTransactions(address, blockchain, {
      startBlock,
      endBlock,
      limit,
      includeInternal: true
    });

    // Additional client-side date filtering for precision
    let filteredTransactions = transactions;
    
    if (startDate || endDate) {
      filteredTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.timestamp);
        if (startDate && txDate < startDate) return false;
        if (endDate && txDate > endDate) return false;
        return true;
      });
    }

    // Filter by currency if specified
    if (currency) {
      const currencyUpper = currency.toUpperCase();
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.currency.toUpperCase() === currencyUpper
      );
    }

    return filteredTransactions.slice(0, limit);
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