/**
 * Dedicated service for handling Binance Smart Chain (BSC) blockchain transactions
 * Uses Etherscan v2 infrastructure (BSCScan has been migrated to Etherscan v2)
 */

import { EtherscanAPIService } from '@/services/integrations/etherscanAPIService';
import { BlockchainTransaction } from '@/types/blockchain.types';
import { TransactionItem } from '@/services/api/transactionApiService';
import { CurrencyService } from './currencyService';

export interface BscTransactionOptions {
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export class BscTransactionService {
  /**
   * Fetch BSC transactions for a wallet address
   * Uses Etherscan v2 infrastructure with BSCSCAN_API_KEY
   */
  static async getTransactions(
    address: string, 
    options: BscTransactionOptions = {}
  ): Promise<BlockchainTransaction[]> {
    if (!address) {
      throw new Error('Wallet address is required');
    }

    const { currency, startDate, endDate, limit = 1000 } = options;

    // BSCScan is now part of Etherscan v2 infrastructure
    if (!EtherscanAPIService.isConfigured('bsc')) {
      throw new Error('BSC API not configured. Please set BSCSCAN_API_KEY or BSC_API_KEY in environment variables.');
    }

    console.log('🚀 Using Etherscan v2 for BSC transactions');
    const startTime = Date.now();

    try {
      const transactions = await EtherscanAPIService.getTransactionHistory(
        address,
        'bsc',
        {
          currency,
          startDate,
          endDate,
          limit
        }
      );

      const endTime = Date.now();
      console.log(`✅ BSC transactions fetched via Etherscan v2 in ${endTime - startTime}ms`);

      return transactions;
    } catch (error) {
      console.error('❌ Error fetching BSC transactions:', error);
      throw error;
    }
  }

  /**
   * Convert BSC blockchain transaction to standard transaction format
   */
  static async convertToStandardTransaction(
    blockchainTx: BlockchainTransaction,
    walletInfo: {
      id: string;
      walletName: string;
      walletAddress: string;
      companyId: number;
    }
  ): Promise<TransactionItem> {
    const isIncoming = blockchainTx.type === 'incoming';
    
    // For native BNB transactions with 0 value (contract interactions), 
    // include gas fee in the total amount for outgoing transactions
    let amount = Math.abs(blockchainTx.amount);
    if (!isIncoming && blockchainTx.tokenType === 'native' && amount === 0 && blockchainTx.gasFee && blockchainTx.gasFee > 0) {
      amount = blockchainTx.gasFee; // Use gas fee as the amount for zero-value native transactions
    }
    
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

    // Generate unique ID for the transaction
    const uniqueId = `bsc-${blockchainTx.hash}-${blockchainTx.currency}-${blockchainTx.type}-${walletInfo.id}-${Date.now()}`;
    
    return {
      id: uniqueId,
      date: new Date(blockchainTx.timestamp).toISOString(),
      paidBy: isIncoming ? 
        this.formatAddress(blockchainTx.from) : 
        walletInfo.walletName || this.formatAddress(walletInfo.walletAddress),
      paidTo: isIncoming ? 
        walletInfo.walletName || this.formatAddress(walletInfo.walletAddress) : 
        this.formatAddress(blockchainTx.to),
      netAmount: isIncoming ? amount : -amount,
      incomingAmount: isIncoming ? amount : 0,
      outgoingAmount: isIncoming ? 0 : amount,
      currency: blockchainTx.currency,
      baseCurrency: 'USD',
      baseCurrencyAmount: isIncoming ? baseCurrencyAmount : -baseCurrencyAmount,
      exchangeRate,
      accountId: walletInfo.id,
      accountType: 'wallet' as const,
      reference: blockchainTx.hash,
      category: 'Cryptocurrency',
      description: this.generateDescription(blockchainTx, isIncoming),
      status: blockchainTx.status === 'success' ? 'CLEARED' as const : 'PENDING' as const,
      reconciliationStatus: 'UNRECONCILED' as const,
      approvalStatus: 'APPROVED' as const,
      companyId: walletInfo.companyId,
      isDeleted: false,
      createdAt: new Date(blockchainTx.timestamp).toISOString(),
      updatedAt: new Date(blockchainTx.timestamp).toISOString(),
      
      // Optional linked entry info
      linkedEntry: {
        id: blockchainTx.hash,
        type: 'BLOCKCHAIN_LIVE',
        category: 'Cryptocurrency',
        amount: blockchainTx.amount,
        currency: blockchainTx.currency,
        description: `Live BSC transaction`,
        blockchain: 'bsc'
      }
    };
  }

  /**
   * Generate transaction description based on type and amount
   */
  private static generateDescription(
    blockchainTx: BlockchainTransaction, 
    isIncoming: boolean
  ): string {
    const tokenType = blockchainTx.tokenType?.toUpperCase() || 'BNB';
    
    // Special handling for zero-value native transactions (contract interactions)
    if (!isIncoming && blockchainTx.tokenType === 'native' && 
        blockchainTx.amount === 0 && blockchainTx.gasFee && blockchainTx.gasFee > 0) {
      return `BSC Contract interaction (gas fee) with ${this.formatAddress(blockchainTx.to)}`;
    }
    
    return `BSC ${tokenType} ${isIncoming ? 'received from' : 'sent to'} ${
      isIncoming ? this.formatAddress(blockchainTx.from) : this.formatAddress(blockchainTx.to)
    }`;
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
   * Check if BSC API is properly configured
   */
  static isConfigured(): boolean {
    return EtherscanAPIService.isConfigured('bsc');
  }

  /**
   * Get supported currencies for BSC blockchain
   */
  static getSupportedCurrencies(): string[] {
    return ['BNB', 'USDT', 'USDC', 'BUSD'];
  }

  /**
   * Validate if a currency is supported on BSC
   */
  static isCurrencySupported(currency: string): boolean {
    return this.getSupportedCurrencies().includes(currency.toUpperCase());
  }
}