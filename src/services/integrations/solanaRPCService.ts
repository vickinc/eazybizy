import { BlockchainTransaction, BlockchainBalance } from '@/types/blockchain.types';

interface SolanaTransactionOptions {
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  currency?: string;
}

interface AlchemyTransactionResponse {
  id: string;
  jsonrpc: string;
  result: {
    context: {
      slot: number;
    };
    value: Array<{
      signature: string;
      slot: number;
      err: any;
      memo: string | null;
      blockTime: number;
      confirmationStatus: string;
    }>;
  };
}

interface AlchemyTransactionDetail {
  blockTime: number;
  meta: {
    fee: number;
    preBalances: number[];
    postBalances: number[];
    err: any;
  };
  transaction: {
    message: {
      accountKeys: Array<{
        pubkey: string;
        signer: boolean;
        writable: boolean;
      }>;
      instructions: any[];
    };
    signatures: string[];
  };
  slot: number;
}

/**
 * Service for interacting with Solana blockchain via Alchemy REST API
 */
export class SolanaRPCService {
  private static readonly ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
  private static readonly ALCHEMY_BASE_URL = 'https://solana-mainnet.g.alchemy.com/v2';
  private static readonly LAMPORTS_PER_SOL = 1000000000;
  
  // Known token mints on Solana
  private static readonly TOKEN_MINTS = {
    'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana', decimals: 9 },
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS': { symbol: 'PYTH', name: 'Pyth Network', decimals: 6 },
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', name: 'Jupiter', decimals: 6 },
    '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': { symbol: 'RAY', name: 'Raydium', decimals: 6 },
    'xLebAypjbaQ9tmxUKHV6DZU4mY8ATAAP2sfkNNQLXjf': { symbol: 'UNKNOWN', name: 'Unknown Token', decimals: 6 },
    '3vHBov8jXEF2jKFh27XV8GBLofioXQesYXVvmiPkJq4a': { symbol: 'UNKNOWN', name: 'Unknown Token', decimals: 0 }
  };
  
  /**
   * Get Alchemy API key
   */
  private static getAlchemyApiKey(): string | undefined {
    return this.ALCHEMY_API_KEY;
  }

  /**
   * Get Alchemy Solana API URL
   */
  private static getAlchemyApiUrl(): string {
    const apiKey = this.getAlchemyApiKey();
    if (!apiKey) {
      throw new Error('ALCHEMY_API_KEY is required for Solana transactions');
    }
    return `${this.ALCHEMY_BASE_URL}/${apiKey}`;
  }
  
  /**
   * Check if the service is properly configured
   */
  static isConfigured(): boolean {
    try {
      const alchemyKey = this.getAlchemyApiKey();
      if (!alchemyKey) {
        console.error('❌ ALCHEMY_API_KEY is required for Solana transactions');
        return false;
      }
      console.log('✅ ALCHEMY_API_KEY found, will use Alchemy REST API for Solana');
      return true;
    } catch (error) {
      console.error('Solana Alchemy API configuration error:', error);
      return false;
    }
  }

  /**
   * Get transaction history for a Solana address via Alchemy REST API
   */
  static async getTransactionHistory(
    address: string,
    options: SolanaTransactionOptions = {}
  ): Promise<BlockchainTransaction[]> {
    try {
      console.log(`🚀 SolanaRPCService: Starting transaction history fetch via Alchemy API for ${address}`);
      console.log('📋 SolanaRPCService options:', options);
      
      const apiUrl = this.getAlchemyApiUrl();
      console.log('🔗 Using Alchemy API URL');
      
      // Get transaction signatures first
      const requestLimit = Math.min(options.limit || 100, 1000);
      console.log(`📊 Requesting ${requestLimit} transaction signatures`);
      
      const signaturesResponse = await this.makeAlchemyRequest(apiUrl, {
        jsonrpc: '2.0',
        id: '1',
        method: 'getSignaturesForAddress',
        params: [
          address,
          {
            limit: requestLimit,
            commitment: 'confirmed'
          }
        ]
      });
      
      if (!signaturesResponse.result || !Array.isArray(signaturesResponse.result)) {
        console.log('📭 No transaction signatures found');
        return [];
      }
      
      const signatures = signaturesResponse.result;
      console.log(`📊 Found ${signatures.length} transaction signatures`);
      
      const transactions: BlockchainTransaction[] = [];
      
      // Process signatures in smaller batches to respect rate limits
      const batchSize = 5;
      for (let i = 0; i < signatures.length; i += batchSize) {
        const batch = signatures.slice(i, i + batchSize);
        
        // Add delay between batches
        if (i > 0) {
          await this.sleep(300);
        }
        
        // Get transaction details for batch
        const batchTransactions = await Promise.all(
          batch.map(sig => this.getTransactionDetail(apiUrl, sig.signature, address, options.currency))
        );
        
        // Filter out null results and add to transactions
        batchTransactions.forEach(txArray => {
          if (txArray) {
            txArray.forEach(tx => {
              // Apply date filters if provided
              const txDate = new Date(tx.timestamp);
              if (options.startDate && txDate < options.startDate) return;
              if (options.endDate && txDate > options.endDate) return;
              
              transactions.push(tx);
            });
          }
        });
      }
      
      console.log(`✅ Parsed ${transactions.length} transactions for ${options.currency || 'all currencies'}`);
      return transactions;
      
    } catch (error) {
      console.error('❌ Error fetching Solana transactions via Alchemy API:', error);
      throw error;
    }
  }

  /**
   * Make a request to Alchemy API
   */
  private static async makeAlchemyRequest(apiUrl: string, payload: any): Promise<any> {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Alchemy API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Alchemy API error: ${data.error.message}`);
    }

    return data;
  }

  /**
   * Get detailed transaction information
   */
  private static async getTransactionDetail(
    apiUrl: string,
    signature: string,
    walletAddress: string,
    currencyFilter?: string
  ): Promise<BlockchainTransaction[] | null> {
    try {
      const response = await this.makeAlchemyRequest(apiUrl, {
        jsonrpc: '2.0',
        id: '1',
        method: 'getTransaction',
        params: [
          signature,
          {
            encoding: 'jsonParsed',
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
          }
        ]
      });

      if (!response.result) {
        return null;
      }

      const transactions = this.parseAlchemyTransactions(response.result, signature, walletAddress, currencyFilter);
      return transactions.length > 0 ? transactions : null;
    } catch (error) {
      console.warn(`⚠️ Failed to get transaction detail for ${signature}:`, error);
      return null;
    }
  }

  /**
   * Parse Alchemy transaction response into our standard format - extract ALL transfers
   */
  private static parseAlchemyTransactions(
    tx: any,
    signature: string,
    walletAddress: string,
    currencyFilter?: string
  ): BlockchainTransaction[] {
    try {
      if (!tx || !tx.blockTime) {
        return [];
      }

      const timestamp = tx.blockTime * 1000;
      const transactions: BlockchainTransaction[] = [];
      const status = tx.meta?.err ? 'failed' : 'success';
      const gasUsed = tx.meta?.fee ? tx.meta.fee / this.LAMPORTS_PER_SOL : 0;
      
      // Parse ALL SPL token transfers first
      const tokenTransfers = this.parseAllSplTokenTransfers(tx, walletAddress, currencyFilter);
      for (const tokenTransfer of tokenTransfers) {
        transactions.push({
          hash: signature,
          blockNumber: tx.slot || 0,
          timestamp,
          from: tokenTransfer.from,
          to: tokenTransfer.to,
          amount: tokenTransfer.amount,
          currency: tokenTransfer.currency,
          type: tokenTransfer.from === walletAddress ? 'outgoing' : 'incoming',
          status,
          gasUsed,
          gasPrice: 0,
          contractAddress: this.getTokenMintAddress(tokenTransfer.currency),
          tokenSymbol: tokenTransfer.currency,
          tokenName: this.getTokenName(tokenTransfer.currency),
          tokenDecimal: tokenTransfer.decimals,
          blockchain: 'solana'
        });
      }
      
      // Parse SOL transfers (only if no currency filter or SOL is requested)
      if (!currencyFilter || currencyFilter === 'SOL') {
        const solTransfer = this.parseSolTransfer(tx, walletAddress);
        if (solTransfer) {
          transactions.push({
            hash: signature,
            blockNumber: tx.slot || 0,
            timestamp,
            from: solTransfer.from,
            to: solTransfer.to,
            amount: solTransfer.amount,
            currency: 'SOL',
            type: solTransfer.from === walletAddress ? 'outgoing' : 'incoming',
            status,
            gasUsed,
            gasPrice: 0,
            contractAddress: undefined,
            tokenSymbol: 'SOL',
            tokenName: 'Solana',
            tokenDecimal: 9,
            blockchain: 'solana'
          });
        }
      }
      
      return transactions;
    } catch (error) {
      console.error('Error parsing Solana transaction:', error);
      return [];
    }
  }

  /**
   * Parse SOL native transfers
   */
  private static parseSolTransfer(
    tx: any,
    walletAddress: string
  ): { amount: number; currency: string; from: string; to: string; decimals: number } | null {
    if (!tx.meta || !tx.transaction) return null;
    
    // Look for system program transfers
    const instructions = tx.transaction.message.instructions;
    
    for (const instruction of instructions) {
      if ('parsed' in instruction && 
          instruction.parsed?.type === 'transfer' &&
          instruction.program === 'system') {
        const info = instruction.parsed.info;
        if (info.source === walletAddress || info.destination === walletAddress) {
          return {
            amount: info.lamports / this.LAMPORTS_PER_SOL,
            currency: 'SOL',
            from: info.source,
            to: info.destination,
            decimals: 9
          };
        }
      }
    }
    
    // Check balance changes as fallback
    const preBalances = tx.meta.preBalances;
    const postBalances = tx.meta.postBalances;
    const accountKeys = tx.transaction.message.accountKeys;
    
    for (let i = 0; i < accountKeys.length; i++) {
      const account = accountKeys[i];
      const accountStr = typeof account === 'string' ? account : (account.pubkey || account);
      
      if (accountStr === walletAddress) {
        const change = (postBalances[i] - preBalances[i]) / this.LAMPORTS_PER_SOL;
        if (Math.abs(change) > 0.000001) { // Ignore tiny changes
          return {
            amount: Math.abs(change),
            currency: 'SOL',
            from: change < 0 ? walletAddress : 'unknown',
            to: change > 0 ? walletAddress : 'unknown',
            decimals: 9
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Parse ALL SPL token transfers in a transaction
   */
  private static parseAllSplTokenTransfers(
    tx: any,
    walletAddress: string,
    currencyFilter?: string
  ): Array<{ amount: number; currency: string; from: string; to: string; decimals: number }> {
    if (!tx.meta || !tx.transaction) return [];
    
    const transfers: Array<{ amount: number; currency: string; from: string; to: string; decimals: number }> = [];
    const instructions = tx.transaction.message.instructions;
    
    for (const instruction of instructions) {
      if ('parsed' in instruction && 
          instruction.program === 'spl-token' &&
          (instruction.parsed?.type === 'transfer' || 
           instruction.parsed?.type === 'transferChecked')) {
        
        const info = instruction.parsed.info;
        
        // Determine currency from mint
        let currency = '';
        let decimals = 6; // Default decimals
        
        const mint = info.mint;
        if (mint && this.TOKEN_MINTS[mint]) {
          const tokenInfo = this.TOKEN_MINTS[mint];
          currency = tokenInfo.symbol;
          decimals = tokenInfo.decimals;
        } else {
          // Unknown token - try to use mint address as identifier
          if (mint) {
            currency = `TOKEN_${mint.substring(0, 8)}`;
            console.log(`🔍 Unknown Solana token mint: ${mint}`);
          }
        }
        
        // Apply currency filter
        if (currencyFilter && currency !== currencyFilter) continue;
        if (!currency) continue;
        
        // Get amount
        const amount = info.tokenAmount 
          ? Number(info.tokenAmount.amount) / Math.pow(10, info.tokenAmount.decimals)
          : Number(info.amount) / Math.pow(10, decimals);
        
        // Determine if this affects our wallet
        const source = info.source || info.authority;
        const destination = info.destination;
        
        if (this.isWalletInvolved(tx, walletAddress, source, destination)) {
          transfers.push({
            amount,
            currency,
            from: source,
            to: destination,
            decimals
          });
        }
      }
    }
    
    return transfers;
  }

  /**
   * Parse SPL token transfers (USDT, USDC, etc.) - Legacy method for single transfer
   */
  private static parseSplTokenTransfer(
    tx: any,
    walletAddress: string,
    currencyFilter?: string
  ): { amount: number; currency: string; from: string; to: string; decimals: number } | null {
    const transfers = this.parseAllSplTokenTransfers(tx, walletAddress, currencyFilter);
    return transfers.length > 0 ? transfers[0] : null;
  }

  /**
   * Check if wallet is involved in token transfer
   */
  private static isWalletInvolved(
    tx: any,
    walletAddress: string,
    source: string,
    destination: string
  ): boolean {
    // Direct involvement
    if (source === walletAddress || destination === walletAddress) {
      return true;
    }
    
    // Check if wallet owns the token accounts
    const accountKeys = tx.transaction.message.accountKeys;
    for (const account of accountKeys) {
      const accountStr = typeof account === 'string' ? account : (account.pubkey || account);
      if (accountStr === walletAddress) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get token info from transaction accounts
   */
  private static getTokenInfoFromAccounts(
    tx: any,
    info: any
  ): { symbol: string; decimals: number } | null {
    // This would need additional RPC calls to get token metadata
    // For now, return null and handle known tokens only
    return null;
  }

  /**
   * Get token mint address for currency
   */
  private static getTokenMintAddress(currency: string): string | undefined {
    for (const [mint, tokenInfo] of Object.entries(this.TOKEN_MINTS)) {
      if (tokenInfo.symbol === currency) {
        return mint;
      }
    }
    return undefined;
  }

  /**
   * Get token name for currency
   */
  private static getTokenName(currency: string): string {
    for (const [mint, tokenInfo] of Object.entries(this.TOKEN_MINTS)) {
      if (tokenInfo.symbol === currency) {
        return tokenInfo.name;
      }
    }
    return currency;
  }

  /**
   * Get token decimals for currency
   */
  private static getTokenDecimals(currency: string): number {
    for (const [mint, tokenInfo] of Object.entries(this.TOKEN_MINTS)) {
      if (tokenInfo.symbol === currency) {
        return tokenInfo.decimals;
      }
    }
    return 6; // Default decimals
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry request with exponential backoff
   */
  private static async retryRequest<T>(
    request: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await request();
      } catch (error: any) {
        lastError = error;
        
        // Check if it's a rate limit error
        if (error.message?.includes('429') || error.message?.includes('Too many requests')) {
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(`⏳ Rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
            await this.sleep(delay);
            continue;
          }
        }
        
        // For non-rate-limit errors, don't retry
        if (attempt === 0) {
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Get account balance via Alchemy API
   */
  static async getBalance(address: string): Promise<BlockchainBalance> {
    try {
      const apiUrl = this.getAlchemyApiUrl();
      
      const response = await this.makeAlchemyRequest(apiUrl, {
        jsonrpc: '2.0',
        id: '1',
        method: 'getBalance',
        params: [address, { commitment: 'confirmed' }]
      });
      
      const balance = response.result.value;
      const solBalance = balance / this.LAMPORTS_PER_SOL;
      
      console.log(`💰 Solana balance for ${address}: ${solBalance} SOL`);
      
      return {
        address,
        balance: solBalance,
        currency: 'SOL',
        blockchain: 'solana',
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching Solana balance:', error);
      throw error;
    }
  }

  /**
   * Get SPL token balance via Alchemy API
   */
  static async getTokenBalance(
    address: string,
    tokenMint: string
  ): Promise<BlockchainBalance> {
    try {
      const apiUrl = this.getAlchemyApiUrl();
      
      // Get token accounts for wallet
      const response = await this.makeAlchemyRequest(apiUrl, {
        jsonrpc: '2.0',
        id: '1',
        method: 'getParsedTokenAccountsByOwner',
        params: [
          address,
          { mint: tokenMint },
          { encoding: 'jsonParsed' }
        ]
      });
      
      let totalBalance = 0;
      let currency = '';
      
      for (const account of response.result.value) {
        const tokenAmount = account.account.data.parsed.info.tokenAmount;
        totalBalance += Number(tokenAmount.amount) / Math.pow(10, tokenAmount.decimals);
        
        // Determine currency from mint
        if (this.TOKEN_MINTS[tokenMint]) {
          currency = this.TOKEN_MINTS[tokenMint].symbol;
        }
      }
      
      console.log(`💰 Token balance for ${address}: ${totalBalance} ${currency}`);
      
      return {
        address,
        balance: totalBalance,
        currency,
        blockchain: 'solana',
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error fetching SPL token balance:', error);
      throw error;
    }
  }
}