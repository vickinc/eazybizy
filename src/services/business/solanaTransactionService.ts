import { SolanaRPCService } from '@/services/integrations/solanaRPCService';
import { BlockchainTransaction } from '@/types/blockchain.types';
import { prisma } from '@/lib/prisma';
import { CurrencyService } from './currencyService';

interface SolanaTransactionOptions {
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  currency?: string;
}

interface ProcessedTransaction {
  hash: string;
  date: Date;
  from: string;
  to: string;
  amount: number;
  currency: string;
  type: 'incoming' | 'outgoing';
  status: 'success' | 'failed';
  fee: number;
  blockchain: string;
}

/**
 * Business service for handling Solana transactions
 */
export class SolanaTransactionService {
  
  /**
   * Check if Solana service is configured
   */
  static isConfigured(): boolean {
    return SolanaRPCService.isConfigured();
  }

  /**
   * Get Solana transactions for an address
   */
  static async getTransactions(
    address: string,
    options: SolanaTransactionOptions = {}
  ): Promise<BlockchainTransaction[]> {
    try {
      console.log(`🚀 SolanaTransactionService: Fetching transactions for ${address} with options:`, options);
      
      // Fetch transactions from Solana RPC
      console.log('📞 Calling SolanaRPCService.getTransactionHistory...');
      const transactions = await SolanaRPCService.getTransactionHistory(address, options);
      console.log('📨 SolanaRPCService call completed successfully');
      
      // Sort by timestamp descending
      transactions.sort((a, b) => b.timestamp - a.timestamp);
      
      console.log(`✅ SolanaTransactionService: Retrieved ${transactions.length} Solana transactions`);
      
      return transactions;
    } catch (error) {
      console.error('❌ SolanaTransactionService error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  /**
   * Import Solana transactions to database
   */
  static async importTransactions(
    walletId: string,
    address: string,
    options: SolanaTransactionOptions = {}
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

    try {
      // Get wallet details
      const wallet = await prisma.digitalWallet.findUnique({
        where: { id: walletId },
        include: { company: true }
      });

      if (!wallet) {
        throw new Error(`Wallet ${walletId} not found`);
      }

      // Fetch transactions
      const transactions = await this.getTransactions(address, options);
      
      console.log(`📊 Processing ${transactions.length} Solana transactions for import`);

      // Process each transaction
      for (const tx of transactions) {
        try {
          const processed = await this.processTransaction(tx, wallet);
          
          // Check for duplicates
          const existingTx = await prisma.transaction.findFirst({
            where: {
              reference: tx.hash,
              companyId: wallet.companyId,
              currency: tx.currency
            }
          });

          if (existingTx) {
            results.duplicates++;
            continue;
          }

          // Create transaction record
          await this.createTransactionRecord(processed, wallet);
          results.imported++;
          
        } catch (error) {
          results.failed++;
          results.errors.push(`Failed to import tx ${tx.hash}: ${error}`);
          console.error(`Error importing transaction ${tx.hash}:`, error);
        }
      }

      console.log(`✅ Import complete:`, results);
      return results;
      
    } catch (error) {
      console.error('Error importing Solana transactions:', error);
      throw error;
    }
  }

  /**
   * Process a blockchain transaction into our format
   */
  private static async processTransaction(
    tx: BlockchainTransaction,
    wallet: any
  ): Promise<ProcessedTransaction> {
    const walletAddress = wallet.walletAddress.toLowerCase();
    const isIncoming = tx.to.toLowerCase() === walletAddress;
    
    return {
      hash: tx.hash,
      date: new Date(tx.timestamp),
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      currency: tx.currency,
      type: isIncoming ? 'incoming' : 'outgoing',
      status: tx.status,
      fee: tx.gasUsed || 0,
      blockchain: 'solana'
    };
  }

  /**
   * Create transaction record in database
   */
  private static async createTransactionRecord(
    tx: ProcessedTransaction,
    wallet: any
  ): Promise<void> {
    const isIncoming = tx.type === 'incoming';
    const walletInfo = {
      walletName: wallet.walletName,
      walletAddress: wallet.walletAddress
    };
    
    // Get base currency conversion rate
    const baseCurrencyRate = await CurrencyService.getExchangeRate(
      tx.currency,
      wallet.company.baseCurrency,
      tx.date
    );
    
    const baseCurrencyAmount = tx.amount * baseCurrencyRate;
    
    // Format addresses
    const formatAddress = (address: string) => {
      if (address.length > 10) {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      }
      return address;
    };
    
    // Create main transaction
    await prisma.transaction.create({
      data: {
        companyId: wallet.companyId,
        date: tx.date,
        paidBy: isIncoming ? 
          formatAddress(tx.from) : 
          walletInfo.walletName || formatAddress(walletInfo.walletAddress),
        paidTo: isIncoming ? 
          walletInfo.walletName || formatAddress(walletInfo.walletAddress) : 
          formatAddress(tx.to),
        netAmount: isIncoming ? tx.amount : -tx.amount,
        incomingAmount: isIncoming ? tx.amount : 0,
        outgoingAmount: isIncoming ? 0 : tx.amount,
        currency: tx.currency,
        baseCurrency: wallet.company.baseCurrency,
        baseCurrencyAmount: isIncoming ? baseCurrencyAmount : -baseCurrencyAmount,
        accountId: wallet.id,
        accountType: 'wallet',
        reference: tx.hash,
        description: `${tx.currency} ${isIncoming ? 'received' : 'sent'} on Solana`,
        notes: JSON.stringify({
          blockchain: 'solana',
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          status: tx.status,
          fee: tx.fee
        }),
        linkedEntryType: 'BLOCKCHAIN_IMPORT',
        linkedEntry: {
          blockchain: 'solana',
          hash: tx.hash,
          originalAmount: tx.amount
        }
      }
    });
    
    // Create fee transaction if applicable
    if (tx.fee > 0 && !isIncoming) {
      await prisma.transaction.create({
        data: {
          companyId: wallet.companyId,
          date: tx.date,
          paidBy: walletInfo.walletName || formatAddress(walletInfo.walletAddress),
          paidTo: 'Network Fee',
          netAmount: -tx.fee,
          outgoingAmount: tx.fee,
          currency: 'SOL', // Fees are always in SOL
          baseCurrency: wallet.company.baseCurrency,
          baseCurrencyAmount: -(tx.fee * await CurrencyService.getExchangeRate(
            'SOL',
            wallet.company.baseCurrency,
            tx.date
          )),
          accountId: wallet.id,
          accountType: 'wallet',
          reference: `${tx.hash}-fee`,
          description: 'Solana transaction fee',
          category: 'Fees',
          subcategory: 'Transaction Fee'
        }
      });
    }
  }

  /**
   * Format address for display
   */
  static formatAddress(address: string): string {
    if (!address) return 'Unknown';
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Validate Solana address
   */
  static isValidAddress(address: string): boolean {
    try {
      // Solana addresses are base58 encoded and typically 32-44 characters
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      return base58Regex.test(address);
    } catch {
      return false;
    }
  }
}