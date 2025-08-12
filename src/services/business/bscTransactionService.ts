/**
 * Dedicated service for handling Binance Smart Chain (BSC) blockchain transactions
 * Provides clean separation from other blockchains
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
   */
  static async getTransactions(
    address: string, 
    options: BscTransactionOptions = {}
  ): Promise<BlockchainTransaction[]> {
    if (!address) {
      throw new Error('Wallet address is required');
    }

    if (!EtherscanAPIService.isConfigured('bsc')) {
      throw new Error('BSCScan API not configured');
    }

    const { currency, startDate, endDate, limit = 1000 } = options;

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
    const amount = Math.abs(blockchainTx.amount);
    
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
      description: `BSC ${blockchainTx.tokenType?.toUpperCase() || 'BNB'} ${isIncoming ? 'received from' : 'sent to'} ${isIncoming ? this.formatAddress(blockchainTx.from) : this.formatAddress(blockchainTx.to)}`,
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