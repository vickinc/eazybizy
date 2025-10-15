import { prisma } from '@/lib/prisma';
import { 
  BlockchainTransaction, 
  TransactionImportOptions, 
  TransactionImportResult, 
  TransactionImportStatus 
} from '@/types/blockchain.types';
import { TronGridService } from '@/services/integrations/tronGridService';
import { AlchemyAPIService } from '@/services/integrations/alchemyAPIService';
import { CryptoAPIsService } from '@/services/integrations/cryptoAPIsService';
import { SolanaRPCService } from '@/services/integrations/solanaRPCService';
import { CurrencyService } from './currencyService';

/**
 * Service for importing blockchain transaction history into the database
 */
export class BlockchainTransactionImportService {
  private static importStatuses = new Map<string, TransactionImportStatus>();
  
  /**
   * Import transaction history for a cryptocurrency wallet
   */
  static async importTransactionHistory(
    walletId: string,
    options: TransactionImportOptions
  ): Promise<TransactionImportResult> {
    const importId = this.generateImportId();
    
    try {
      // Initialize import status
      const status = this.initializeImportStatus(importId, walletId, options);
      this.importStatuses.set(importId, status);
      
      console.log('🚀 Starting blockchain transaction import:', {
        importId,
        walletId,
        walletAddress: options.walletAddress,
        blockchain: options.blockchain,
        currencies: options.currencies,
        dateRange: {
          start: options.startDate?.toISOString(),
          end: options.endDate?.toISOString()
        }
      });

      // Get wallet details from database
      const wallet = await prisma.digitalWallet.findUnique({
        where: { id: walletId },
        include: { company: true }
      });

      if (!wallet) {
        throw new Error(`Wallet ${walletId} not found`);
      }

      // Parse currencies to import
      const currencies = options.currencies || this.parseWalletCurrencies(wallet);
      status.progress.totalCurrencies = currencies.length;
      
      const allTransactions: BlockchainTransaction[] = [];
      const importResults = {
        totalTransactions: 0,
        importedTransactions: 0,
        duplicateTransactions: 0,
        failedTransactions: 0,
        errors: [] as string[]
      };

      // Import transactions for each currency
      for (const [index, currency] of currencies.entries()) {
        try {
          status.progress.currentCurrency = currency;
          status.progress.completedCurrencies = index;
          this.updateImportStatus(importId, status);

          console.log(`📊 Importing ${currency} transactions for wallet ${walletId}...`);
          
          const transactions = await this.fetchTransactionHistory(
            options.walletAddress,
            options.blockchain,
            currency,
            {
              startDate: options.startDate,
              endDate: options.endDate,
              limit: options.limit || 5000
            }
          );

          console.log(`🔍 Fetched ${transactions.length} total Tron transactions, filtering for ${currency}...`);
          
          // Filter transactions for the specific currency (important for Tron multi-currency)
          const filteredTransactions = transactions.filter(tx => 
            tx.currency.toUpperCase() === currency.toUpperCase()
          );
          
          console.log(`✅ Found ${filteredTransactions.length} ${currency} transactions after filtering`);
          
          allTransactions.push(...filteredTransactions);
          status.progress.totalTransactions += transactions.length;

        } catch (error) {
          console.error(`❌ Error fetching ${currency} transactions:`, error);
          importResults.errors.push(`Failed to fetch ${currency}: ${error.message}`);
          importResults.failedTransactions++;
        }
      }

      // Process and save transactions to database
      console.log(`💾 Processing ${allTransactions.length} total transactions...`);
      
      const processResults = await this.processTransactions(
        allTransactions,
        walletId,
        wallet,
        options
      );

      // Combine results
      importResults.totalTransactions = allTransactions.length;
      importResults.importedTransactions = processResults.imported;
      importResults.duplicateTransactions = processResults.duplicates;
      importResults.failedTransactions += processResults.failed;
      importResults.errors.push(...processResults.errors);

      // Update final status
      status.status = 'completed';
      status.progress.completedCurrencies = currencies.length;
      status.progress.processedTransactions = allTransactions.length;
      status.completedAt = new Date();
      status.result = {
        success: true,
        ...importResults,
        walletAddress: options.walletAddress,
        currencies,
        startDate: options.startDate,
        endDate: options.endDate
      };

      this.updateImportStatus(importId, status);

      console.log('🎉 Transaction import completed:', status.result);
      return status.result;

    } catch (error) {
      console.error('❌ Transaction import failed:', error);
      
      const status = this.importStatuses.get(importId);
      if (status) {
        status.status = 'failed';
        status.error = error.message;
        status.completedAt = new Date();
        this.updateImportStatus(importId, status);
      }

      return {
        success: false,
        totalTransactions: 0,
        importedTransactions: 0,
        duplicateTransactions: 0,
        failedTransactions: 0,
        errors: [error.message],
        walletAddress: options.walletAddress,
        currencies: options.currencies || []
      };
    }
  }

  /**
   * Fix existing fee transactions that were incorrectly stored with outgoing amounts
   */
  static async fixExistingFeeTransactions(): Promise<void> {
    console.log('🔧 Fixing existing fee transactions...');
    
    try {
      // Find transactions that are likely fee transactions based on their description or category
      const feeTransactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { description: { contains: 'Gas fee' } },
            { description: { contains: 'Transaction fee' } },
            { category: 'Fee' },
            { subcategory: 'Transaction Fee' },
            // Also check for transactions with "Network Fee" in paidTo field
            { paidTo: 'Network Fee' }
          ],
          accountType: 'wallet',
          // Only fix transactions that have incorrect outgoing amounts
          outgoingAmount: { gt: 0 }
        }
      });

      console.log(`Found ${feeTransactions.length} fee transactions to fix`);

      for (const tx of feeTransactions) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            incomingAmount: 0,
            outgoingAmount: 0,
            category: 'Fee',
            subcategory: 'Transaction Fee'
          }
        });
      }

      console.log(`✅ Fixed ${feeTransactions.length} fee transactions`);
    } catch (error) {
      console.error('❌ Error fixing fee transactions:', error);
      throw error;
    }
  }

  /**
   * Fetch transaction history from blockchain APIs
   */
  private static async fetchTransactionHistory(
    address: string,
    blockchain: string,
    currency: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<BlockchainTransaction[]> {
    const blockchainLower = blockchain.toLowerCase();
    
    try {
      switch (blockchainLower) {
        case 'tron':
          // For Tron, always fetch ALL transactions and let the parser determine currency
          // This ensures we get both TRX and TRC-20 transactions with proper currency detection
          return await TronGridService.getTransactionHistory(address, {
            limit: options.limit,
            startDate: options.startDate,
            endDate: options.endDate
          });
          
        case 'ethereum':
          if (currency.toUpperCase() === 'ETH') {
            // Native ETH transactions
            return await AlchemyAPIService.getTransactionHistory(address, {
              limit: options.limit,
              startDate: options.startDate,
              endDate: options.endDate,
              currency: 'ETH',
              blockchain: 'ethereum'
            });
          } else {
            // ERC-20 token transactions
            return await AlchemyAPIService.getERC20TransactionHistory(address, currency, {
              limit: options.limit,
              startDate: options.startDate,
              endDate: options.endDate
            });
          }
          
        case 'binance-smart-chain':
          // TODO: Implement BSC transaction history via Alchemy or other service
          console.warn(`Transaction history not yet implemented for ${blockchain}`);
          return [];
          
        case 'solana':
          // Fetch Solana transactions via RPC
          return await SolanaRPCService.getTransactionHistory(address, {
            limit: options.limit,
            startDate: options.startDate,
            endDate: options.endDate,
            currency: currency.toUpperCase()
          });
          
        default:
          throw new Error(`Unsupported blockchain: ${blockchain}`);
      }
    } catch (error) {
      console.error(`Error fetching ${currency} transactions on ${blockchain}:`, error);
      throw error;
    }
  }

  /**
   * Process blockchain transactions and save to database
   */
  private static async processTransactions(
    transactions: BlockchainTransaction[],
    walletId: string,
    wallet: any,
    options: TransactionImportOptions
  ): Promise<{
    imported: number;
    duplicates: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      imported: 0,
      duplicates: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Note: We now check for duplicates individually per transaction 
    // to properly handle hash+currency uniqueness

    for (const blockchainTx of transactions) {
      try {
        // Check for duplicates - each hash+currency+walletId should be unique
        const existingTx = await prisma.transaction.findFirst({
          where: {
            accountId: walletId,
            accountType: 'wallet',
            reference: blockchainTx.hash,
            currency: blockchainTx.currency
          }
        });

        if (existingTx) {
          if (!options.overwriteDuplicates) {
            results.duplicates++;
            console.log(`⏭️ Skipping duplicate transaction: ${blockchainTx.hash} (${blockchainTx.currency})`);
            continue;
          }
          
          // Update existing transaction if overwriting
          console.log(`🔄 Updating existing transaction: ${blockchainTx.hash} (${blockchainTx.currency})`);
          
          const dbTransaction = await this.convertToDbTransaction(
            blockchainTx,
            walletId,
            wallet
          );
          
          await prisma.transaction.update({
            where: { id: existingTx.id },
            data: dbTransaction
          });
          
          results.imported++;
        } else {
          // Create new transaction
          console.log(`✅ Creating new transaction: ${blockchainTx.hash} (${blockchainTx.currency})`);
          
          const dbTransaction = await this.convertToDbTransaction(
            blockchainTx,
            walletId,
            wallet
          );

          await prisma.transaction.create({
            data: dbTransaction
          });

          results.imported++;
        }
        
      } catch (error) {
        console.error('Error processing transaction:', blockchainTx.hash, error);
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Transaction ${blockchainTx.hash}: ${errorMessage}`);
      }
    }

    return results;
  }

  /**
   * Convert blockchain transaction to database transaction format
   */
  private static async convertToDbTransaction(
    blockchainTx: BlockchainTransaction,
    walletId: string,
    wallet: any
  ) {
    const isIncoming = blockchainTx.type === 'incoming';
    const isFee = blockchainTx.type === 'fee';
    
    // For native transactions with 0 value (contract interactions), 
    // include gas fee in the total amount for outgoing transactions
    let amount = blockchainTx.amount;
    if (!isIncoming && !isFee && blockchainTx.tokenType === 'native' && 
        amount === 0 && blockchainTx.gasFee && blockchainTx.gasFee > 0) {
      amount = blockchainTx.gasFee; // Use gas fee as the amount for zero-value native transactions
    }
    
    // Convert to USD for base currency amount
    const baseCurrencyAmount = await CurrencyService.convertToUSDAsync(
      amount, 
      blockchainTx.currency
    );
    
    // Get current exchange rate
    const exchangeRate = blockchainTx.currency === 'USD' ? 1 : 
      (Math.abs(amount) > 0 ? Math.abs(baseCurrencyAmount) / Math.abs(amount) : 1);

    // Calculate incoming/outgoing amounts correctly
    // Fee transactions should not count as incoming or outgoing transfers
    let incomingAmount = 0;
    let outgoingAmount = 0;
    let netAmount = 0;

    if (isFee) {
      // Fee transactions: no incoming/outgoing amounts, negative net amount
      incomingAmount = 0;
      outgoingAmount = 0;
      netAmount = -amount; // Fees are always a cost
    } else if (isIncoming) {
      // Incoming transfers: positive amounts
      incomingAmount = amount;
      outgoingAmount = 0;
      netAmount = amount;
    } else {
      // Outgoing transfers: negative amounts
      incomingAmount = 0;
      outgoingAmount = amount;
      netAmount = -amount;
    }

    return {
      companyId: wallet.companyId,
      date: new Date(blockchainTx.timestamp),
      paidBy: isIncoming ? blockchainTx.from : wallet.walletName || 'Wallet',
      paidTo: isIncoming ? wallet.walletName || 'Wallet' : blockchainTx.to,
      netAmount,
      incomingAmount,
      outgoingAmount,
      currency: blockchainTx.currency,
      baseCurrency: 'USD',
      baseCurrencyAmount: isFee ? -baseCurrencyAmount : (isIncoming ? baseCurrencyAmount : -baseCurrencyAmount),
      exchangeRate,
      accountId: walletId,
      accountType: 'wallet',
      reference: blockchainTx.hash,
      category: isFee ? 'Fee' : 'Transfer',
      subcategory: isFee ? 'Transaction Fee' : (isIncoming ? 'Incoming' : 'Outgoing'),
      description: isFee 
        ? `Transaction fee for ${blockchainTx.description || 'blockchain transaction'}`
        : this.generateDescription(blockchainTx, isIncoming),
      notes: JSON.stringify({
        blockNumber: blockchainTx.blockNumber,
        gasUsed: blockchainTx.gasUsed,
        gasFee: blockchainTx.gasFee,
        contractAddress: blockchainTx.contractAddress,
        tokenType: blockchainTx.tokenType,
        blockchain: blockchainTx.blockchain,
        network: blockchainTx.network
      }),
      status: blockchainTx.status === 'success' ? 'CLEARED' : 'FAILED',
      linkedEntryType: 'BLOCKCHAIN_IMPORT'
    };
  }

  /**
   * Generate transaction description based on type and amount
   */
  private static generateDescription(
    blockchainTx: BlockchainTransaction, 
    isIncoming: boolean
  ): string {
    const tokenType = blockchainTx.tokenType?.toUpperCase() || 'Blockchain';
    
    // Special handling for zero-value native transactions (contract interactions)
    if (!isIncoming && blockchainTx.tokenType === 'native' && 
        blockchainTx.amount === 0 && blockchainTx.gasFee && blockchainTx.gasFee > 0) {
      return `${blockchainTx.blockchain.toUpperCase()} Contract interaction (gas fee) with ${blockchainTx.to}`;
    }
    
    return `${tokenType} ${isIncoming ? 'received from' : 'sent to'} ${
      isIncoming ? blockchainTx.from : blockchainTx.to
    }`;
  }

  /**
   * Parse wallet currencies from the currencies field
   */
  private static parseWalletCurrencies(wallet: any): string[] {
    const currencies: string[] = [];
    
    if (wallet.currencies) {
      if (Array.isArray(wallet.currencies)) {
        currencies.push(...wallet.currencies);
      } else if (typeof wallet.currencies === 'string') {
        currencies.push(...wallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0));
      }
    }
    
    // Fallback to primary currency if no multi-currency support
    if (currencies.length === 0 && wallet.currency) {
      currencies.push(wallet.currency);
    }
    
    return currencies;
  }

  /**
   * Generate unique import ID
   */
  private static generateImportId(): string {
    return `import_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Initialize import status tracking
   */
  private static initializeImportStatus(
    importId: string,
    walletId: string,
    options: TransactionImportOptions
  ): TransactionImportStatus {
    return {
      id: importId,
      walletId,
      walletAddress: options.walletAddress,
      blockchain: options.blockchain,
      status: 'running',
      progress: {
        totalCurrencies: 0,
        completedCurrencies: 0,
        totalTransactions: 0,
        processedTransactions: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Update import status
   */
  private static updateImportStatus(importId: string, status: TransactionImportStatus): void {
    status.updatedAt = new Date();
    this.importStatuses.set(importId, status);
  }

  /**
   * Get import status by ID
   */
  static getImportStatus(importId: string): TransactionImportStatus | null {
    return this.importStatuses.get(importId) || null;
  }

  /**
   * Get all import statuses for a wallet
   */
  static getWalletImportStatuses(walletId: string): TransactionImportStatus[] {
    return Array.from(this.importStatuses.values())
      .filter(status => status.walletId === walletId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Clean up old import statuses (keep last 50 per wallet)
   */
  static cleanupImportStatuses(): void {
    const walletStatuses = new Map<string, TransactionImportStatus[]>();
    
    // Group by wallet
    for (const status of this.importStatuses.values()) {
      if (!walletStatuses.has(status.walletId)) {
        walletStatuses.set(status.walletId, []);
      }
      walletStatuses.get(status.walletId)!.push(status);
    }
    
    // Keep only recent statuses per wallet
    for (const [walletId, statuses] of walletStatuses.entries()) {
      statuses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const toRemove = statuses.slice(50); // Keep 50 most recent
      
      for (const status of toRemove) {
        this.importStatuses.delete(status.id);
      }
    }
    
    console.log(`🧹 Cleaned up import statuses. Active: ${this.importStatuses.size}`);
  }
}

// Clean up old statuses every hour
setInterval(() => {
  BlockchainTransactionImportService.cleanupImportStatuses();
}, 60 * 60 * 1000);