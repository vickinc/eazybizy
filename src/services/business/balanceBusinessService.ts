import { 
  AccountBalance, 
  BalanceFilterState, 
  BalanceSummary, 
  GroupedBalances, 
  FilterPeriod,
  AccountTypeFilter,
  BalanceViewFilter,
  BalanceGroupBy
} from '@/types/balance.types';
import { BankAccount, DigitalWallet } from '@/types/payment.types';
import { Transaction } from '@/types/bookkeeping.types';
import { Company } from '@/types/company.types';
import { BlockchainBalance } from '@/types/blockchain.types';
import { balanceStorageService } from '@/services/storage/balanceStorageService';
import { banksWalletsStorageService } from '@/services/storage/banksWalletsStorageService';
import { TransactionsStorageService } from '@/services/storage/transactionsStorageService';
import { companiesCache } from '@/services/cache/companiesCache';
import { BanksWalletsBusinessService } from './banksWalletsBusinessService';
import { TransactionsBusinessService } from './transactionsBusinessService';
import { AlchemyAPIService } from '@/services/integrations/alchemyAPIService';
import { CryptoAPIsService } from '@/services/integrations/cryptoAPIsService';
import { TronGridService } from '@/services/integrations/tronGridService';
import { CurrencyService } from './currencyService';

export class BalanceBusinessService {
  // Helper method to determine if a token is native to a blockchain
  static isNativeTokenForBlockchain(tokenSymbol: string, blockchain: string): boolean {
    const nativeTokens: Record<string, string> = {
      'ethereum': 'ETH',
      'solana': 'SOL', 
      'bitcoin': 'BTC',
      'binance-smart-chain': 'BNB',
      'tron': 'TRX'
    };
    
    return nativeTokens[blockchain.toLowerCase()] === tokenSymbol.toUpperCase();
  }

  // Utility method to determine if an account is a bank account
  static isAccountBank(account: BankAccount | DigitalWallet): boolean {
    // First check for explicit type metadata (most reliable)
    if ('__accountType' in account) {
      return (account as any).__accountType === 'bank';
    }
    
    // Check for bank-specific fields
    if ('bankName' in account || 'iban' in account || 'swiftCode' in account) {
      return true;
    }
    
    // Check for wallet-specific fields
    if ('walletType' in account || 'walletAddress' in account) {
      return false;
    }
    
    // Fallback: check for accountNumber (though this is optional for banks)
    if ('accountNumber' in account) {
      return true;
    }
    
    // Default to false if unclear
    return false;
  }

  // Get all account balances with filtering
  static getAccountBalances(filters: BalanceFilterState, selectedCompany?: number | 'all'): AccountBalance[] {
    const allAccounts = BanksWalletsBusinessService.getAllAccounts();
    const companies = companiesCache.getCompanies();
    const initialBalances = balanceStorageService.getAllInitialBalances();
    
    // Apply company filter to accounts first
    const companyFilteredAccounts = allAccounts.filter(account => {
      if (selectedCompany === 'all' || selectedCompany === undefined) return true;
      return account.companyId === selectedCompany;
    });

    const accountBalances: AccountBalance[] = companyFilteredAccounts.map(account => {
      const company = companies.find(c => c.id === account.companyId);
      if (!company) return null;

      // Get initial balance for this account
      const initialBalance = initialBalances.find(
        ib => ib.accountId === account.id && 
             ib.accountType === (this.isAccountBank(account) ? 'bank' : 'wallet')
      );

      // Calculate transaction balance for the period
      const transactionData = this.calculateTransactionBalanceDetailed(
        account.id,
        this.isAccountBank(account) ? 'bank' : 'wallet',
        account.companyId,
        filters.selectedPeriod,
        filters.customDateRange
      );

      const initialAmount = initialBalance?.amount || 0;
      const finalBalance = initialAmount + transactionData.netAmount;

      return {
        account,
        company,
        initialBalance: initialAmount,
        transactionBalance: transactionData.netAmount,
        finalBalance,
        incomingAmount: transactionData.totalIncoming,
        outgoingAmount: transactionData.totalOutgoing,
        currency: account.currency,
        lastTransactionDate: this.getLastTransactionDate(account.id, this.isAccountBank(account) ? 'bank' : 'wallet')
      };
    }).filter(Boolean) as AccountBalance[];

    // Apply additional filters
    return this.applyFilters(accountBalances, filters);
  }

  // Calculate detailed transaction balance for specific account and period
  private static calculateTransactionBalanceDetailed(
    accountId: string,
    accountType: 'bank' | 'wallet',
    companyId: number,
    period: FilterPeriod,
    customRange: { startDate: string; endDate: string }
  ): { netAmount: number; totalIncoming: number; totalOutgoing: number } {
    const transactions = TransactionsStorageService.getTransactions();
    
    // For multi-currency wallets, extract the original wallet ID
    const originalAccountId = accountType === 'wallet' && accountId.includes('-') 
      ? accountId.split('-')[0] 
      : accountId;
    
    // Filter transactions for this account and period
    const filteredTransactions = transactions.filter(transaction => {
      // Account filter - for multi-currency wallets, match original wallet ID
      if (transaction.accountType !== accountType) {
        return false;
      }
      
      if (accountType === 'wallet' && accountId.includes('-')) {
        // For multi-currency wallet entries, match original wallet ID
        if (transaction.accountId !== originalAccountId) {
          return false;
        }
      } else {
        // For regular accounts (banks or single-currency wallets), exact match
        if (transaction.accountId !== accountId) {
          return false;
        }
      }

      // Company filter
      if (transaction.companyId !== companyId) {
        return false;
      }

      // Period filter
      if (period !== 'allTime') {
        const periodTransactions = TransactionsBusinessService.filterTransactionsByPeriod(
          [transaction], 
          period, 
          period === 'custom' ? { start: customRange.startDate, end: customRange.endDate } : undefined
        );
        if (periodTransactions.length === 0) {
          return false;
        }
      }

      return true;
    });

    // Calculate detailed amounts
    const totalIncoming = filteredTransactions.reduce((sum, transaction) => sum + (transaction.incomingAmount || 0), 0);
    const totalOutgoing = filteredTransactions.reduce((sum, transaction) => sum + (transaction.outgoingAmount || 0), 0);
    const netAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.netAmount, 0);

    return {
      netAmount,
      totalIncoming,
      totalOutgoing
    };
  }

  // Get last transaction date for an account
  private static getLastTransactionDate(accountId: string, accountType: 'bank' | 'wallet'): string | undefined {
    const transactions = TransactionsStorageService.getTransactions();
    
    // For multi-currency wallets, extract the original wallet ID
    const originalAccountId = accountType === 'wallet' && accountId.includes('-') 
      ? accountId.split('-')[0] 
      : accountId;
    
    const accountTransactions = transactions
      .filter(t => {
        if (t.accountType !== accountType) return false;
        
        if (accountType === 'wallet' && accountId.includes('-')) {
          // For multi-currency wallet entries, match original wallet ID
          return t.accountId === originalAccountId;
        } else {
          // For regular accounts (banks or single-currency wallets), exact match
          return t.accountId === accountId;
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return accountTransactions.length > 0 ? accountTransactions[0].date : undefined;
  }

  // Apply filters to account balances
  private static applyFilters(balances: AccountBalance[], filters: BalanceFilterState): AccountBalance[] {
    let filtered = [...balances];

    // Account type filter
    if (filters.accountTypeFilter !== 'all') {
      filtered = filtered.filter(balance => {
        const isBank = this.isAccountBank(balance.account);
        return filters.accountTypeFilter === 'banks' ? isBank : !isBank;
      });
    }

    // View filter (assets/liabilities/equity)
    if (filters.viewFilter !== 'all') {
      filtered = filtered.filter(balance => {
        switch (filters.viewFilter) {
          case 'assets':
            return balance.finalBalance >= 0;
          case 'liabilities':
            return balance.finalBalance < 0;
          case 'equity':
            // For now, treat equity as accounts with positive balance
            // This can be enhanced with account categorization
            return balance.finalBalance >= 0;
          default:
            return true;
        }
      });
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(balance => {
        const account = balance.account;
        const company = balance.company;
        
        return (
          account.name.toLowerCase().includes(searchLower) ||
          company.tradingName.toLowerCase().includes(searchLower) ||
          account.currency.toLowerCase().includes(searchLower) ||
          ('accountNumber' in account && account.accountNumber?.toLowerCase().includes(searchLower)) ||
          ('accountName' in account && account.accountName?.toLowerCase().includes(searchLower)) ||
          ('address' in account && account.address?.toLowerCase().includes(searchLower))
        );
      });
    }

    // Zero balances filter
    if (!filters.showZeroBalances) {
      filtered = filtered.filter(balance => Math.abs(balance.finalBalance) > 0.01);
    }

    return filtered;
  }

  // Group balances by specified criteria
  static groupBalances(balances: AccountBalance[], groupBy: BalanceGroupBy): GroupedBalances {
    if (groupBy === 'none') {
      return { 'All Accounts': balances };
    }

    const grouped: GroupedBalances = {};

    balances.forEach(balance => {
      let groupKey: string;

      switch (groupBy) {
        case 'account':
          groupKey = this.isAccountBank(balance.account) ? 'Bank Accounts' : 'Digital Wallets';
          break;
        case 'currency':
          groupKey = balance.currency;
          break;
        case 'type':
          // Enhanced grouping by account type
          if (this.isAccountBank(balance.account)) {
            groupKey = `Banks (${balance.currency})`;
          } else {
            groupKey = `Wallets (${balance.currency})`;
          }
          break;
        default:
          groupKey = 'Other';
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(balance);
    });

    // Sort groups alphabetically
    const sortedGrouped: GroupedBalances = {};
    Object.keys(grouped).sort().forEach(key => {
      sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  }

  // Calculate balance summary
  static async calculateBalanceSummary(balances: AccountBalance[]): Promise<BalanceSummary> {
    const summary: BalanceSummary = {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      totalAssetsUSD: 0,
      totalLiabilitiesUSD: 0,
      netWorthUSD: 0,
      baseCurrency: 'USD',
      accountCount: balances.length,
      bankAccountCount: 0,
      walletCount: 0,
      currencyBreakdown: {}
    };

    for (const balance of balances) {
      // Use blockchain balance if available and live, otherwise use calculated balance
      const amount = balance.blockchainBalance && balance.blockchainBalance.isLive 
        ? balance.blockchainBalance.balance 
        : balance.finalBalance;
      const currency = balance.currency;

      // Convert to USD for total calculations using database-backed rates
      const amountInUSD = await CurrencyService.convertToUSDAsync(amount, currency);
      

      // Count account types
      if (this.isAccountBank(balance.account)) {
        summary.bankAccountCount++;
      } else {
        summary.walletCount++;
      }

      // Calculate assets/liabilities in USD
      if (amountInUSD >= 0) {
        summary.totalAssetsUSD += amountInUSD;
      } else {
        summary.totalLiabilitiesUSD += Math.abs(amountInUSD);
      }
      
      // Also track original currency totals
      if (amount >= 0) {
        summary.totalAssets += amount;
      } else {
        summary.totalLiabilities += Math.abs(amount);
      }

      // Currency breakdown (keep original currency amounts)
      if (!summary.currencyBreakdown[currency]) {
        summary.currencyBreakdown[currency] = {
          assets: 0,
          liabilities: 0,
          netWorth: 0
        };
      }

      if (amount >= 0) {
        summary.currencyBreakdown[currency].assets += amount;
      } else {
        summary.currencyBreakdown[currency].liabilities += Math.abs(amount);
      }

      summary.currencyBreakdown[currency].netWorth += amount;
    }

    summary.netWorth = summary.totalAssets - summary.totalLiabilities;
    summary.netWorthUSD = summary.totalAssetsUSD - summary.totalLiabilitiesUSD;

    return summary;
  }

  // Get enhanced account with company information
  static getEnhancedAccount(accountId: string, accountType: 'bank' | 'wallet') {
    return BanksWalletsBusinessService.getEnhancedAccount(accountId, accountType);
  }

  /**
   * Enrich account balances with blockchain data for crypto wallets
   * @param balances Array of account balances to enrich
   * @param fetchBlockchain Whether to fetch blockchain data (default: false for performance)
   * @returns Promise of enriched balances
   */
  static async enrichWithBlockchainBalances(
    balances: AccountBalance[], 
    fetchBlockchain: boolean = false
  ): Promise<AccountBalance[]> {
    // Debug logging for development (can be removed in production)
    console.log('🚀 enrichWithBlockchainBalances called:', {
      balanceCount: balances.length,
      fetchBlockchain,
      alchemyConfigured: AlchemyAPIService.isConfigured(),
      alchemyApiKey: process.env.ALCHEMY_API_KEY ? 'SET' : 'NOT_SET',
      alchemyApiKeyLength: process.env.ALCHEMY_API_KEY?.length || 0,
      cryptoAPIsConfigured: CryptoAPIsService.isConfigured(),
      cryptoAPIsApiKey: process.env.CRYPTO_APIS_KEY ? 'SET' : 'NOT_SET',
      cryptoAPIsApiKeyLength: process.env.CRYPTO_APIS_KEY?.length || 0,
      tronGridConfigured: TronGridService.isConfigured(),
      tronGridApiKey: process.env.TRON_API_KEY ? 'SET' : 'NOT_SET (optional)',
      tronGridApiKeyLength: process.env.TRON_API_KEY?.length || 0
    });

    // Debug: Show all balance currencies and blockchains being processed
    console.log('🔍 All balances being processed:', balances.map(b => ({
      currency: b.currency,
      blockchain: (b.account as any).blockchain,
      walletType: (b.account as any).walletType,
      walletAddress: (b.account as any).walletAddress?.substring(0, 20) + '...',
      hasAddress: !!(b.account as any).walletAddress,
      isBank: this.isAccountBank(b.account),
      finalBalance: b.finalBalance
    })));
    
    if (!fetchBlockchain) {
      console.log('❌ Blockchain enrichment skipped: fetchBlockchain=false');
      return balances;
    }

    // Identify crypto wallets that can have blockchain balances fetched
    const cryptoWallets = balances.filter(balance => {
      if (this.isAccountBank(balance.account)) return false;
      const wallet = balance.account as DigitalWallet;
      const isCryptoWallet = wallet.walletType?.toLowerCase() === 'crypto' && wallet.walletAddress && wallet.blockchain && wallet.currency;
      
      console.log('🔍 Checking wallet for blockchain enrichment:', {
        walletName: wallet.walletName || 'unknown',
        walletType: wallet.walletType,
        walletAddress: wallet.walletAddress,
        blockchain: wallet.blockchain,
        currency: wallet.currency,
        isCryptoWallet
      });
      
      return isCryptoWallet;
    });

    if (cryptoWallets.length === 0) {
      console.log('❌ No crypto wallets found for blockchain enrichment');
      return balances;
    }
    
    console.log(`✅ Found ${cryptoWallets.length} crypto wallets for blockchain enrichment:`, 
      cryptoWallets.map(cw => ({
        walletName: (cw.account as any).walletName,
        blockchain: (cw.account as any).blockchain,
        currency: cw.currency,
        hasAddress: !!(cw.account as any).walletAddress
      }))
    );

    // Prepare wallet data for bulk fetching
    const walletRequests = cryptoWallets.map(balance => {
      const wallet = balance.account as DigitalWallet;
      return {
        address: wallet.walletAddress,
        blockchain: wallet.blockchain || 'ethereum',
        network: 'mainnet', // TODO: Add network field to wallet model
        tokenSymbol: balance.currency // Include the token symbol from the balance
      };
    });

    try {
      // Fetch blockchain balances using the unified API
      const blockchainBalances: BlockchainBalance[] = [];
      
      console.log('🔍 Processing wallet requests:', walletRequests.map(w => ({ 
        address: w.address, 
        blockchain: w.blockchain, 
        tokenSymbol: w.tokenSymbol 
      })));

      // Process each wallet request directly through Alchemy service
      for (const walletRequest of walletRequests) {
        console.log('📊 Fetching blockchain balance directly:', {
          address: walletRequest.address,
          blockchain: walletRequest.blockchain,
          tokenSymbol: walletRequest.tokenSymbol
        });
        
        try {
          let blockchainBalance: BlockchainBalance | null = null;
          
          // Check which API service can handle this blockchain
          const alchemySupportedChains = ['ethereum', 'solana', 'binance-smart-chain'];
          const cryptoApisSupportedChains = ['bitcoin']; // Note: CryptoAPIs doesn't support Tron
          const tronGridSupportedChains = ['tron'];
          const blockchainLower = walletRequest.blockchain.toLowerCase();
          
          console.log('🔍 Blockchain support check:', {
            blockchainLower,
            alchemySupported: alchemySupportedChains.includes(blockchainLower),
            cryptoApisSupported: cryptoApisSupportedChains.includes(blockchainLower),
            tronGridSupported: tronGridSupportedChains.includes(blockchainLower),
            alchemyConfigured: AlchemyAPIService.isConfigured(),
            cryptoApisConfigured: CryptoAPIsService.isConfigured(),
            tronGridConfigured: TronGridService.isConfigured()
          });
          
          if (alchemySupportedChains.includes(blockchainLower) && AlchemyAPIService.isConfigured()) {
            // Determine if this is a native token or a token on the chain
            const isNativeToken = this.isNativeTokenForBlockchain(walletRequest.tokenSymbol, blockchainLower);
            
            console.log('🎯 Token type check:', {
              tokenSymbol: walletRequest.tokenSymbol,
              blockchain: blockchainLower,
              isNativeToken
            });
            
            if (isNativeToken) {
              console.log('🚀 About to fetch NATIVE balance for:', walletRequest.blockchain);
              // Fetch native balance (ETH, SOL, BNB, BTC)
              blockchainBalance = await AlchemyAPIService.getNativeBalance(walletRequest.address, walletRequest.blockchain, walletRequest.network);
              console.log('✅ Native balance result:', blockchainBalance);
            } else {
              console.log('🚀 About to fetch TOKEN balance for:', walletRequest.tokenSymbol);
              // Fetch token balance (USDT, USDC, BUSD, etc.)
              blockchainBalance = await AlchemyAPIService.getTokenBalance(walletRequest.address, walletRequest.tokenSymbol, walletRequest.blockchain, walletRequest.network);
              console.log('✅ Token balance result:', blockchainBalance);
            }
          } else if (cryptoApisSupportedChains.includes(blockchainLower) && CryptoAPIsService.isConfigured()) {
            // Use CryptoAPIs for Bitcoin only
            const isNativeToken = this.isNativeTokenForBlockchain(walletRequest.tokenSymbol, blockchainLower);
            
            console.log('🎯 CryptoAPIs token type check:', {
              tokenSymbol: walletRequest.tokenSymbol,
              blockchain: blockchainLower,
              isNativeToken
            });
            
            if (isNativeToken) {
              console.log('🚀 About to fetch NATIVE balance via CryptoAPIs for:', walletRequest.blockchain);
              // Fetch native balance (BTC only)
              blockchainBalance = await CryptoAPIsService.getNativeBalance(walletRequest.address, walletRequest.blockchain, walletRequest.network);
              console.log('✅ CryptoAPIs native balance result:', blockchainBalance);
            } else {
              console.log('🚀 About to fetch TOKEN balance via CryptoAPIs for:', walletRequest.tokenSymbol);
              // Fetch token balance (Bitcoin doesn't have tokens)
              blockchainBalance = await CryptoAPIsService.getTokenBalance(walletRequest.address, walletRequest.tokenSymbol, walletRequest.blockchain, walletRequest.network);
              console.log('✅ CryptoAPIs token balance result:', blockchainBalance);
            }
          } else if (tronGridSupportedChains.includes(blockchainLower) && TronGridService.isConfigured()) {
            // Use TronGrid for Tron
            const isNativeToken = this.isNativeTokenForBlockchain(walletRequest.tokenSymbol, blockchainLower);
            
            console.log('🎯 TronGrid token type check:', {
              tokenSymbol: walletRequest.tokenSymbol,
              blockchain: blockchainLower,
              isNativeToken
            });
            
            if (isNativeToken) {
              console.log('🚀 About to fetch NATIVE TRX balance via TronGrid for:', walletRequest.blockchain);
              // Fetch native TRX balance
              blockchainBalance = await TronGridService.getNativeBalance(walletRequest.address, walletRequest.blockchain, walletRequest.network);
              console.log('✅ TronGrid native balance result:', blockchainBalance);
            } else {
              console.log('🚀 About to fetch TRC-20 TOKEN balance via TronGrid for:', walletRequest.tokenSymbol);
              // Fetch TRC-20 token balance (USDT, USDC on Tron)
              blockchainBalance = await TronGridService.getTokenBalance(walletRequest.address, walletRequest.tokenSymbol, walletRequest.blockchain, walletRequest.network);
              console.log('✅ TronGrid token balance result:', blockchainBalance);
            }
          } else {
            const alchemyConfigured = AlchemyAPIService.isConfigured();
            const cryptoAPIsConfigured = CryptoAPIsService.isConfigured();
            const tronGridConfigured = TronGridService.isConfigured();
            
            let errorMessage: string;
            if (cryptoApisSupportedChains.includes(blockchainLower) && !cryptoAPIsConfigured) {
              console.log(`❌ ${blockchainLower.toUpperCase()} wallet found but CryptoAPIs not configured:`, {
                blockchain: blockchainLower,
                address: walletRequest.address,
                tokenSymbol: walletRequest.tokenSymbol,
                needsApiKey: 'CRYPTO_APIS_KEY environment variable not set'
              });
              errorMessage = `${walletRequest.blockchain} balance requires CRYPTO_APIS_KEY environment variable to be configured. No hardcoded values used.`;
            } else if (tronGridSupportedChains.includes(blockchainLower) && !tronGridConfigured) {
              console.log(`❌ ${blockchainLower.toUpperCase()} wallet found but TronGrid not configured:`, {
                blockchain: blockchainLower,
                address: walletRequest.address,
                tokenSymbol: walletRequest.tokenSymbol,
                note: 'TronGrid works without API key but with rate limits'
              });
              errorMessage = `${walletRequest.blockchain} balance fetching failed. TronGrid service should be available without API key.`;
            } else {
              console.log('❌ Blockchain not supported by any configured API service:', blockchainLower);
              errorMessage = `Blockchain '${walletRequest.blockchain}' not supported by any configured API service (Alchemy: ${alchemyConfigured}, CryptoAPIs: ${cryptoAPIsConfigured}, TronGrid: ${tronGridConfigured}). No hardcoded values used.`;
            }
            
            // NO hardcoded values - only real API data
            blockchainBalance = {
              address: walletRequest.address,
              blockchain: walletRequest.blockchain,
              network: walletRequest.network,
              balance: 0,
              unit: walletRequest.tokenSymbol,
              lastUpdated: new Date(),
              isLive: false,
              tokenType: 'native',
              error: errorMessage
            };
          }
          
          if (blockchainBalance) {
            blockchainBalances.push(blockchainBalance);
            console.log('✅ Successfully fetched blockchain balance:', {
              address: walletRequest.address,
              blockchain: walletRequest.blockchain,
              balance: blockchainBalance.balance,
              unit: blockchainBalance.unit,
              isLive: blockchainBalance.isLive
            });
          }
        } catch (error) {
          console.error('❌ Error fetching blockchain balance for', walletRequest.address, error);
        }
      }

      // Create a map for quick lookup using address + token symbol as key
      const balanceMap = new Map<string, BlockchainBalance>();
      blockchainBalances.forEach(bb => {
        const key = `${bb.address.toLowerCase()}-${bb.unit.toUpperCase()}`;
        balanceMap.set(key, bb);
      });

      // Enrich original balances with blockchain data
      return balances.map(balance => {
        if (this.isAccountBank(balance.account)) {
          return balance;
        }

        const wallet = balance.account as DigitalWallet;
        if (!wallet.walletAddress || wallet.walletType?.toLowerCase() !== 'crypto') {
          return balance;
        }

        // Create lookup key using address + currency (token symbol)
        const lookupKey = `${wallet.walletAddress.toLowerCase()}-${balance.currency.toUpperCase()}`;
        const blockchainBalance = balanceMap.get(lookupKey);
        
        if (blockchainBalance) {
          console.log('🎯 Applying blockchain balance:', {
            address: wallet.walletAddress,
            currency: balance.currency,
            originalBalance: balance.finalBalance,
            blockchainBalance: blockchainBalance.balance,
            isLive: blockchainBalance.isLive
          });
          
          return {
            ...balance,
            blockchainBalance,
            blockchainSyncStatus: blockchainBalance.isLive ? 'synced' : 'error',
            // Update finalBalance to use blockchain balance for crypto wallets
            finalBalance: blockchainBalance.isLive ? blockchainBalance.balance : balance.finalBalance
          };
        } else {
          console.log('⚠️ No blockchain balance found for:', {
            address: wallet.walletAddress,
            currency: balance.currency,
            lookupKey
          });
        }

        return balance;
      });
    } catch (error) {
      console.error('Error enriching balances with blockchain data:', error);
      // Return original balances if blockchain fetching fails
      return balances;
    }
  }

  // Validate account balance data
  static validateBalanceData(balances: AccountBalance[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    balances.forEach((balance, index) => {
      // Check for missing company
      if (!balance.company) {
        errors.push(`Balance ${index + 1}: Missing company information`);
      }

      // Check for invalid amounts
      if (isNaN(balance.finalBalance) || !isFinite(balance.finalBalance)) {
        errors.push(`Balance ${index + 1}: Invalid final balance amount`);
      }

      // Check for missing currency
      if (!balance.currency) {
        errors.push(`Balance ${index + 1}: Missing currency information`);
      }

      // Warning for very old last transaction
      if (balance.lastTransactionDate) {
        const lastDate = new Date(balance.lastTransactionDate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (lastDate < sixMonthsAgo) {
          const accountName = this.isAccountBank(balance.account) 
            ? (balance.account as any).accountName || (balance.account as any).bankName || 'Unknown'
            : (balance.account as any).walletName || 'Unknown';
          warnings.push(`Account ${accountName}: Last transaction over 6 months ago`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Format currency amount
  static formatCurrency(amount: number, currency: string): string {
    return TransactionsBusinessService.formatCurrency(amount, currency);
  }

  // Export balance data
  static exportBalanceData(balances: AccountBalance[], format: 'csv' | 'json' = 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(balances, null, 2);
    }

    // CSV format
    const headers = [
      'Account Name',
      'Company',
      'Account Type',
      'Currency',
      'Initial Balance',
      'Transaction Balance',
      'Final Balance',
      'Last Transaction Date'
    ];

    const rows = balances.map(balance => [
      this.isAccountBank(balance.account) 
        ? (balance.account as any).accountName || (balance.account as any).bankName || 'Unknown'
        : (balance.account as any).walletName || 'Unknown',
      balance.company.tradingName,
      this.isAccountBank(balance.account) ? 'Bank' : 'Wallet',
      balance.currency,
      balance.initialBalance.toString(),
      balance.transactionBalance.toString(),
      balance.finalBalance.toString(),
      balance.lastTransactionDate || 'Never'
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}