/**
 * Service for fetching live cryptocurrency transactions from blockchain APIs
 * Used by transactions page to show real-time crypto transaction data for selected periods
 */

// Counter to ensure truly unique IDs across all transactions
let transactionIdCounter = 0;

import { TronGridService } from '@/services/integrations/tronGridService';
import { CurrencyService } from './currencyService';
import { PeriodFilterService, DateRange } from '@/services/utils/periodFilterService';
import { TransactionItem } from '@/services/api/transactionApiService';
import { DigitalWallet } from '@/types/payment.types';
import { BlockchainTransaction } from '@/types/blockchain.types';

export interface CryptoWallet extends DigitalWallet {
  // Multi-currency wallet support
  supportedCurrencies: string[];
  originalId: string; // For multi-currency wallets, this is the original wallet ID
}

export interface LiveTransactionOptions {
  dateRange: DateRange;
  limit?: number;
  companyId?: number | 'all';
}

/**
 * Service for fetching live cryptocurrency transactions from blockchain APIs
 * Follows the same pattern as the balances page for consistency
 */
export class LiveCryptoTransactionService {
  
  /**
   * Fetch live crypto transactions for multiple wallets and selected period
   */
  static async fetchTransactionsForPeriod(
    wallets: CryptoWallet[],
    options: LiveTransactionOptions
  ): Promise<TransactionItem[]> {
    console.log('🚀 Fetching live crypto transactions for period:', {
      walletCount: wallets.length,
      dateRange: {
        start: options.dateRange.startDate.toISOString(),
        end: options.dateRange.endDate.toISOString()
      },
      limit: options.limit
    });

    // Filter wallets that can actually be processed (have proper API configuration)
    const supportedWallets = wallets.filter(wallet => {
      const canFetch = this.canFetchTransactions(wallet);
      if (!canFetch) {
        console.log(`⚠️ Skipping wallet ${wallet.walletName} - API not configured for ${wallet.blockchain}`);
      }
      return canFetch;
    });

    if (supportedWallets.length === 0) {
      console.log('📝 No supported crypto wallets found for the selected filters');
      return [];
    }

    console.log(`✅ Processing ${supportedWallets.length} out of ${wallets.length} crypto wallets`);
    
    // Debug: Show which wallets are being processed
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Wallets being processed:', supportedWallets.map(w => ({
        name: w.walletName,
        currency: w.currency,
        blockchain: w.blockchain,
        address: w.walletAddress
      })));
    }

    const allTransactions: TransactionItem[] = [];
    const walletPromises = supportedWallets.map(wallet => 
      this.fetchWalletTransactions(wallet, options)
    );

    try {
      const walletResults = await Promise.allSettled(walletPromises);
      
      walletResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allTransactions.push(...result.value);
        } else {
          console.error(`❌ Failed to fetch transactions for wallet ${wallets[index].walletName}:`, result.reason);
        }
      });

      // Sort by date descending (most recent first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log(`✅ Fetched ${allTransactions.length} live crypto transactions total`);
      return allTransactions;

    } catch (error) {
      console.error('❌ Error fetching live crypto transactions:', error);
      return [];
    }
  }

  /**
   * Fetch live crypto transactions for a single wallet
   */
  static async fetchWalletTransactions(
    wallet: CryptoWallet, 
    options: LiveTransactionOptions
  ): Promise<TransactionItem[]> {
    if (!wallet.walletAddress || !wallet.blockchain) {
      console.warn(`⚠️ Wallet ${wallet.walletName} missing address or blockchain`);
      return [];
    }

    const blockchainLower = wallet.blockchain.toLowerCase();
    const currency = wallet.currency;
    
    console.log(`🔍 Fetching transactions for wallet: ${wallet.walletName} (${currency}) on ${blockchainLower}`);

    try {
      let blockchainTransactions: BlockchainTransaction[] = [];

      // Fetch from appropriate blockchain service
      switch (blockchainLower) {
        case 'tron':
          try {
            // Use server-side API endpoint for Tron calls to avoid CORS issues
            const params = new URLSearchParams({
              address: wallet.walletAddress,
              blockchain: 'tron',
              currency: currency.toUpperCase(),
              startDate: options.dateRange.startDate.toISOString(),
              endDate: options.dateRange.endDate.toISOString(),
              limit: (options.limit || 1000).toString()
            });

            const response = await fetch(`/api/tron-transactions?${params}`, {
              method: 'GET',
              credentials: 'include'
            });

            if (!response.ok) {
              const error = await response.json();
              console.warn(`⚠️ Tron API error for wallet ${wallet.walletName}:`, error.error);
              
              // If it's a configuration error, provide helpful guidance
              if (error.error && error.error.includes('not configured')) {
                console.error('❌ TronGrid API configuration issue detected');
                console.log('📝 Please ensure:');
                console.log('   1. TRONGRID_API_KEY is set in your .env.local file');
                console.log('   2. The Next.js server has been restarted after adding the key');
                console.log('   3. The API key is valid (get one free from https://www.trongrid.io/)');
              }
              
              return [];
            }

            const data = await response.json();
            blockchainTransactions = data.data || [];
            
            console.log(`✅ Fetched ${blockchainTransactions.length} Tron transactions for ${wallet.walletName} (${currency})`);
      
      // Debug: Show currency breakdown
      if (process.env.NODE_ENV === 'development') {
        const currencyBreakdown = blockchainTransactions.reduce((acc, tx) => {
          acc[tx.currency] = (acc[tx.currency] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log(`🔍 Tron currency breakdown for ${wallet.walletName}:`, currencyBreakdown);
      }
          } catch (tronError) {
            console.warn(`⚠️ TRON API error for wallet ${wallet.walletName}:`, tronError.message);
            return [];
          }
          break;

        case 'ethereum':
          try {
            // Use dedicated Ethereum API endpoint
            const params = new URLSearchParams({
              address: wallet.walletAddress,
              currency: currency.toUpperCase(),
              startDate: options.dateRange.startDate.toISOString(),
              endDate: options.dateRange.endDate.toISOString(),
              limit: (options.limit || 1000).toString()
            });

            const response = await fetch(`/api/ethereum-transactions?${params}`, {
              method: 'GET',
              credentials: 'include'
            });

            if (!response.ok) {
              const error = await response.json();
              if (error.error === 'Etherscan API not configured') {
                console.warn(`⚠️ Etherscan API not configured - skipping Ethereum wallet ${wallet.walletName}`);
                return [];
              }
              throw new Error(error.error || 'Failed to fetch Ethereum transactions');
            }

            const data = await response.json();
            blockchainTransactions = data.data || [];
            
            // Debug: Show detailed Ethereum API response
            if (process.env.NODE_ENV === 'development') {
              console.log(`🔍 Ethereum API response for ${wallet.walletName} (${currency}):`, {
                status: data.success,
                count: blockchainTransactions.length,
                currencies: blockchainTransactions.map(tx => tx.currency),
                sample: blockchainTransactions.slice(0, 2).map(tx => ({
                  hash: tx.hash.substring(0, 10) + '...',
                  currency: tx.currency,
                  amount: tx.amount,
                  type: tx.type
                }))
              });
            }
          } catch (etherscanError) {
            console.warn(`⚠️ Ethereum API error for wallet ${wallet.walletName}:`, etherscanError.message);
            return [];
          }
          break;

        case 'bsc':
        case 'binance-smart-chain':
          try {
            // Use dedicated BSC API endpoint
            const params = new URLSearchParams({
              address: wallet.walletAddress,
              currency: currency.toUpperCase(),
              startDate: options.dateRange.startDate.toISOString(),
              endDate: options.dateRange.endDate.toISOString(),
              limit: (options.limit || 1000).toString()
            });

            const response = await fetch(`/api/bsc-transactions?${params}`, {
              method: 'GET',
              credentials: 'include'
            });

            if (!response.ok) {
              const error = await response.json();
              if (error.error === 'BSCScan API not configured') {
                console.warn(`⚠️ BSCScan API not configured - skipping BNB wallet ${wallet.walletName}`);
                return [];
              }
              throw new Error(error.error || 'Failed to fetch BSC transactions');
            }

            const data = await response.json();
            blockchainTransactions = data.data || [];
          } catch (bscError) {
            console.warn(`⚠️ BSCScan API error for wallet ${wallet.walletName}:`, bscError.message);
            return [];
          }
          break;

        default:
          console.warn(`⚠️ Blockchain ${blockchainLower} not supported for live transactions yet`);
          return [];
      }

      // Convert blockchain transactions to standard transaction format
      const standardTransactions = await Promise.all(
        blockchainTransactions.map(blockchainTx => 
          this.convertToStandardTransaction(blockchainTx, wallet)
        )
      );

      console.log(`✅ Converted ${standardTransactions.length} transactions for ${wallet.walletName}`);
      
      // Debug: Show final transaction currency breakdown
      if (process.env.NODE_ENV === 'development') {
        const finalCurrencyBreakdown = standardTransactions.reduce((acc, tx) => {
          acc[tx.currency] = (acc[tx.currency] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log(`🔍 Final converted transactions for ${wallet.walletName}:`, finalCurrencyBreakdown);
      }
      return standardTransactions;

    } catch (error) {
      console.error(`❌ Error fetching transactions for wallet ${wallet.walletName}:`, error);
      return [];
    }
  }

  /**
   * Convert blockchain transaction to standard transaction format
   * This ensures consistency with database transactions
   */
  private static async convertToStandardTransaction(
    blockchainTx: BlockchainTransaction,
    wallet: CryptoWallet
  ): Promise<TransactionItem> {
    const isIncoming = blockchainTx.type === 'incoming';
    const amount = Math.abs(blockchainTx.amount);
    
    // Debug: Log transaction conversion details
    console.log(`💰 Converting blockchain transaction to standard format:`, {
      hash: `${blockchainTx.hash?.substring(0, 10)}...`,
      currency: blockchainTx.currency,
      wallet: wallet.walletName,
      '=== DIRECTION LOGIC ===': '==================',
      blockchainType: blockchainTx.type,
      isIncoming,
      rawAmount: blockchainTx.amount,
      absAmount: amount,
      '=== RESULT AMOUNTS ===': '==================',
      netAmount: isIncoming ? amount : -amount,
      incomingAmount: isIncoming ? amount : 0,
      outgoingAmount: isIncoming ? 0 : amount,
      finalSign: isIncoming ? 'POSITIVE' : 'NEGATIVE'
    });
    
    // Convert to USD for base currency amount
    let baseCurrencyAmount = 0;
    let exchangeRate = 1;
    
    try {
      baseCurrencyAmount = await CurrencyService.convertToUSDAsync(
        amount, 
        blockchainTx.currency
      );
      exchangeRate = blockchainTx.currency === 'USD' ? 1 : 
        (amount > 0 ? Math.abs(baseCurrencyAmount) / amount : 1);
    } catch (error) {
      console.warn(`⚠️ Currency conversion failed for ${blockchainTx.currency}:`, error);
      baseCurrencyAmount = amount; // Fallback to original amount
    }

    // Generate a truly unique ID to prevent React key conflicts
    // Using incremental counter + timestamp + random ensures uniqueness even for identical transactions
    transactionIdCounter++;
    const uniqueId = `live-${transactionIdCounter}-${blockchainTx.hash}-${blockchainTx.currency}-${blockchainTx.type}-${wallet.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: uniqueId,
      date: new Date(blockchainTx.timestamp).toISOString(),
      paidBy: isIncoming ? 
        this.formatAddress(blockchainTx.from) : 
        wallet.walletName || this.formatAddress(wallet.walletAddress),
      paidTo: isIncoming ? 
        wallet.walletName || this.formatAddress(wallet.walletAddress) : 
        this.formatAddress(blockchainTx.to),
      netAmount: isIncoming ? amount : -amount,
      incomingAmount: isIncoming ? amount : 0,
      outgoingAmount: isIncoming ? 0 : amount,
      currency: blockchainTx.currency,
      baseCurrency: 'USD',
      baseCurrencyAmount: isIncoming ? baseCurrencyAmount : -baseCurrencyAmount,
      exchangeRate,
      accountId: wallet.originalId, // Use original wallet ID for multi-currency wallets
      accountType: 'wallet' as const,
      reference: blockchainTx.hash,
      category: 'Cryptocurrency',
      description: `${blockchainTx.tokenType?.toUpperCase() || 'Blockchain'} ${isIncoming ? 'received from' : 'sent to'} ${isIncoming ? this.formatAddress(blockchainTx.from) : this.formatAddress(blockchainTx.to)}`,
      status: blockchainTx.status === 'success' ? 'CLEARED' as const : 'PENDING' as const,
      reconciliationStatus: 'UNRECONCILED' as const,
      approvalStatus: 'APPROVED' as const,
      companyId: wallet.companyId,
      isDeleted: false,
      createdAt: new Date(blockchainTx.timestamp).toISOString(),
      updatedAt: new Date(blockchainTx.timestamp).toISOString(),
      
      // Optional linked entry info to indicate this is live blockchain data
      linkedEntry: {
        id: blockchainTx.hash,
        type: 'BLOCKCHAIN_LIVE',
        category: 'Cryptocurrency',
        amount: blockchainTx.amount,
        currency: blockchainTx.currency,
        description: `Live ${blockchainTx.blockchain} transaction`,
        blockchain: blockchainTx.blockchain // Store blockchain info for explorer URLs
      }
    };
  }

  /**
   * Format blockchain address for display
   */
  private static formatAddress(address: string): string {
    if (!address || address.length < 10) {
      return address || 'Unknown';
    }
    
    // Show first 6 and last 4 characters
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Get crypto wallets for a company with multi-currency support
   * Follows the same pattern as the balances page
   */
  static async getCryptoWalletsForCompany(companyId: number | 'all'): Promise<CryptoWallet[]> {
    try {
      const response = await fetch(`/api/digital-wallets?companyId=${companyId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch digital wallets');
      }

      const data = await response.json();
      const digitalWallets = data.data || [];
      
      // Already filtered by company from the API endpoint
      const filteredWallets = digitalWallets;

      // Process wallets with multi-currency support (same as balances page)
      const cryptoWallets: CryptoWallet[] = [];

      filteredWallets.forEach((wallet: DigitalWallet) => {
        // Only process crypto wallets
        if (wallet.walletType?.toLowerCase() !== 'crypto' || !wallet.walletAddress || !wallet.blockchain) {
          return;
        }

        // Parse currencies array
        let currenciesArray: string[] = [];
        if (wallet.currencies) {
          if (Array.isArray(wallet.currencies)) {
            currenciesArray = wallet.currencies;
          } else if (typeof wallet.currencies === 'string') {
            currenciesArray = wallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0);
          }
        }

        if (currenciesArray.length > 0) {
          // Multi-currency wallet - create separate entries for each currency
          // Filter out unsupported or unwanted currencies
          const validCurrencies = currenciesArray.filter(currency => {
            // Validate currency is supported for this blockchain
            const isSupported = this.isCurrencySupportedForBlockchain(currency, wallet.blockchain);
            if (!isSupported && process.env.NODE_ENV === 'development') {
              console.log(`⚠️ Skipping unsupported currency ${currency} for ${wallet.walletName} on ${wallet.blockchain}`);
            }
            return isSupported;
          });
          
          if (validCurrencies.length === 0) {
            console.warn(`⚠️ No valid currencies found for wallet ${wallet.walletName}`);
            return; // Skip this wallet entirely
          }
          
          validCurrencies.forEach(currency => {
            cryptoWallets.push({
              ...wallet,
              id: `${wallet.id}-${currency}`, // Unique ID for each currency
              walletName: `${wallet.walletName} (${currency})`,
              currency: currency,
              supportedCurrencies: validCurrencies,
              originalId: wallet.id // Keep reference to original wallet
            });
          });
        } else {
          // Single currency wallet
          cryptoWallets.push({
            ...wallet,
            supportedCurrencies: wallet.currency ? [wallet.currency] : [],
            originalId: wallet.id
          });
        }
      });

      console.log(`✅ Found ${cryptoWallets.length} crypto wallet entries for company ${companyId}`);
      return cryptoWallets;

    } catch (error) {
      console.error('❌ Error fetching crypto wallets:', error);
      return [];
    }
  }

  /**
   * Check if a currency is supported for a specific blockchain
   */
  static isCurrencySupportedForBlockchain(currency: string, blockchain: string): boolean {
    if (!currency || !blockchain) return false;
    
    const currencyUpper = currency.toUpperCase();
    const blockchainLower = blockchain.toLowerCase();
    
    // Define supported currencies per blockchain
    // Only include currencies that we have API support for
    const supportedCurrencies: Record<string, string[]> = {
      'tron': ['TRX', 'USDT', 'USDC'], // TRX native and TRC-20 tokens we can fetch
      'ethereum': ['ETH', 'USDT', 'USDC'], // ETH native and ERC-20 tokens we can fetch
      'bsc': ['BNB', 'USDT', 'USDC', 'BUSD'], // BNB native and BEP-20 tokens
      'binance-smart-chain': ['BNB', 'USDT', 'USDC', 'BUSD'],
      'bitcoin': ['BTC'],
      'solana': ['SOL', 'USDT', 'USDC']
    };
    
    const supported = supportedCurrencies[blockchainLower] || [];
    const isSupported = supported.includes(currencyUpper);
    
    if (!isSupported && process.env.NODE_ENV === 'development') {
      console.log(`⚠️ Currency ${currencyUpper} not supported for ${blockchainLower} blockchain`);
    }
    
    return isSupported;
  }
  
  /**
   * Validate if wallet supports transaction fetching
   */
  static canFetchTransactions(wallet: CryptoWallet): boolean {
    if (!wallet.walletAddress || !wallet.blockchain || !wallet.currency) {
      return false;
    }

    const blockchainLower = wallet.blockchain.toLowerCase();
    
    // Debug logging for wallet configuration
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Checking wallet: ${wallet.walletName} (${wallet.currency}) blockchain: ${blockchainLower}`);
    }
    
    // Check if the blockchain is supported and the corresponding API is configured
    switch (blockchainLower) {
      case 'tron':
        // For Tron, we always use the server-side API endpoint which has access to the API key
        // Client-side check would fail because TRONGRID_API_KEY is not exposed to the client
        if (process.env.NODE_ENV === 'development') {
          console.log(`  TRON: Using server-side API endpoint`);
        }
        return true; // Always return true since we use server-side API
      case 'ethereum':
        // For Ethereum, we always return true since we're using server-side API
        if (process.env.NODE_ENV === 'development') {
          console.log(`  Ethereum: Using server-side API endpoint`);
        }
        return true;
      case 'bsc':
      case 'binance-smart-chain':
        // For BSC, we always return true since we're using server-side API
        if (process.env.NODE_ENV === 'development') {
          console.log(`  BSC: Using server-side API endpoint`);
        }
        return true;
      default:
        if (process.env.NODE_ENV === 'development') {
          console.log(`  Blockchain ${blockchainLower} not supported`);
        }
        return false;
    }
  }
}