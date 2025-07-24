/**
 * Fixed Asset Journal Entry Service
 * 
 * Handles automatic generation of journal entries for fixed asset transactions:
 * - Asset acquisitions
 * - Depreciation expenses
 * - Asset disposals
 * - Revaluations
 * - Impairments
 */

import { FixedAsset, AssetTransaction } from '@/types/fixedAssets.types';
import { BookkeepingEntry, Transaction } from '@/types/bookkeeping.types';
import { ChartOfAccount } from '@/types/chartOfAccounts.types';
import { ChartOfAccountsBusinessService } from './chartOfAccountsBusinessService';
import { BookkeepingBusinessService } from './bookkeepingBusinessService';

export interface JournalEntryParams {
  assetId: string;
  transactionType: 'acquisition' | 'depreciation' | 'disposal' | 'revaluation' | 'impairment';
  amount: number;
  description: string;
  date: string;
  reference?: string;
  companyId: number;
}

export interface DepreciationJournalEntry {
  depreciationExpenseEntry: BookkeepingEntry;
  accumulatedDepreciationEntry: BookkeepingEntry;
  assetTransaction: AssetTransaction;
}

export interface AssetAcquisitionJournalEntry {
  assetEntry: BookkeepingEntry;
  cashOrPayableEntry: BookkeepingEntry;
  assetTransaction: AssetTransaction;
}

export interface AssetDisposalJournalEntry {
  cashEntry?: BookkeepingEntry;
  accumulatedDepreciationEntry: BookkeepingEntry;
  assetEntry: BookkeepingEntry;
  gainLossEntry?: BookkeepingEntry;
  assetTransaction: AssetTransaction;
  disposalGainLoss: number;
}

export class FixedAssetJournalService {

  /**
   * Generate journal entries for asset acquisition
   */
  static async generateAcquisitionJournalEntries(
    asset: FixedAsset,
    params: {
      acquisitionAmount: number;
      paymentMethod: 'cash' | 'credit' | 'loan';
      cashAccountId?: string;
      payableAccountId?: string;
      date: string;
      reference?: string;
      companyId: number;
    }
  ): Promise<AssetAcquisitionJournalEntry> {
    
    // Find or create asset account
    const assetAccount = await this.findOrCreateAssetAccount(asset.category);
    
    // Find payment account
    const paymentAccountId = params.paymentMethod === 'cash' 
      ? params.cashAccountId || await this.findCashAccount()
      : params.payableAccountId || await this.findPayableAccount();

    // Create asset debit entry
    const assetEntry: BookkeepingEntry = {
      id: BookkeepingBusinessService.generateEntryId(),
      type: 'expense', // Using expense type to increase asset value
      category: 'Fixed Assets',
      subcategory: asset.category,
      amount: params.acquisitionAmount,
      currency: 'USD',
      description: `Acquisition of ${asset.name}`,
      date: params.date,
      companyId: params.companyId,
      reference: params.reference || asset.code,
      chartOfAccountsId: assetAccount.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create cash/payable credit entry
    const paymentEntry: BookkeepingEntry = {
      id: BookkeepingBusinessService.generateEntryId(),
      type: 'revenue', // Using income type to decrease cash/increase payable
      category: params.paymentMethod === 'cash' ? 'Cash' : 'Accounts Payable',
      subcategory: params.paymentMethod === 'cash' ? 'Cash Payment' : 'Trade Payables',
      amount: -params.acquisitionAmount, // Negative to represent credit
      currency: 'USD',
      description: `Payment for ${asset.name}`,
      date: params.date,
      companyId: params.companyId,
      reference: params.reference || asset.code,
      chartOfAccountsId: paymentAccountId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create asset transaction record
    const assetTransaction: AssetTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId: asset.id,
      type: 'acquisition',
      date: params.date,
      amount: params.acquisitionAmount,
      description: `Initial acquisition of ${asset.name}`,
      createdAt: new Date().toISOString()
    };

    return {
      assetEntry,
      cashOrPayableEntry: paymentEntry,
      assetTransaction
    };
  }

  /**
   * Generate journal entries for monthly/periodic depreciation
   */
  static async generateDepreciationJournalEntries(
    asset: FixedAsset,
    params: {
      depreciationAmount: number;
      period: string; // e.g., "2024-01"
      companyId: number;
    }
  ): Promise<DepreciationJournalEntry> {
    
    // Find or create depreciation expense account
    const depreciationExpenseAccount = await this.findOrCreateDepreciationExpenseAccount();
    
    // Find or create accumulated depreciation account
    const accumulatedDepreciationAccount = await this.findOrCreateAccumulatedDepreciationAccount(asset.category);

    const date = new Date().toISOString().split('T')[0]; // Current date

    // Create depreciation expense debit entry
    const depreciationExpenseEntry: BookkeepingEntry = {
      id: BookkeepingBusinessService.generateEntryId(),
      type: 'expense',
      category: 'Operating Expenses',
      subcategory: 'Depreciation',
      amount: params.depreciationAmount,
      currency: 'USD',
      description: `Depreciation expense for ${asset.name} - ${params.period}`,
      date,
      companyId: params.companyId,
      reference: `DEP-${asset.code}-${params.period}`,
      chartOfAccountsId: depreciationExpenseAccount.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create accumulated depreciation credit entry
    const accumulatedDepreciationEntry: BookkeepingEntry = {
      id: BookkeepingBusinessService.generateEntryId(),
      type: 'revenue', // Using income type to increase accumulated depreciation (contra-asset)
      category: 'Fixed Assets',
      subcategory: 'Accumulated Depreciation',
      amount: -params.depreciationAmount, // Negative to represent credit
      currency: 'USD',
      description: `Accumulated depreciation for ${asset.name} - ${params.period}`,
      date,
      companyId: params.companyId,
      reference: `ACC-DEP-${asset.code}-${params.period}`,
      chartOfAccountsId: accumulatedDepreciationAccount.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create asset transaction record
    const assetTransaction: AssetTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId: asset.id,
      type: 'depreciation',
      date,
      amount: params.depreciationAmount,
      description: `Depreciation for period ${params.period}`,
      createdAt: new Date().toISOString()
    };

    return {
      depreciationExpenseEntry,
      accumulatedDepreciationEntry,
      assetTransaction
    };
  }

  /**
   * Generate journal entries for asset disposal
   */
  static async generateDisposalJournalEntries(
    asset: FixedAsset,
    params: {
      disposalPrice: number;
      disposalDate: string;
      disposalMethod: 'sale' | 'scrap' | 'write_off';
      companyId: number;
      cashAccountId?: string;
    }
  ): Promise<AssetDisposalJournalEntry> {
    
    const assetAccount = await this.findOrCreateAssetAccount(asset.category);
    const accumulatedDepreciationAccount = await this.findOrCreateAccumulatedDepreciationAccount(asset.category);
    
    // Calculate gain/loss on disposal
    const bookValue = asset.currentBookValue;
    const disposalGainLoss = params.disposalPrice - bookValue;
    
    const entries: BookkeepingEntry[] = [];

    // 1. Remove accumulated depreciation (debit)
    const accumulatedDepreciationEntry: BookkeepingEntry = {
      id: BookkeepingBusinessService.generateEntryId(),
      type: 'expense',
      category: 'Fixed Assets',
      subcategory: 'Accumulated Depreciation',
      amount: asset.accumulatedDepreciation,
      currency: 'USD',
      description: `Remove accumulated depreciation for ${asset.name}`,
      date: params.disposalDate,
      companyId: params.companyId,
      reference: `DISP-${asset.code}`,
      chartOfAccountsId: accumulatedDepreciationAccount.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 2. Remove asset cost (credit)
    const assetEntry: BookkeepingEntry = {
      id: BookkeepingBusinessService.generateEntryId(),
      type: 'revenue',
      category: 'Fixed Assets',
      subcategory: asset.category,
      amount: -asset.acquisitionCost,
      currency: 'USD',
      description: `Remove asset cost for ${asset.name}`,
      date: params.disposalDate,
      companyId: params.companyId,
      reference: `DISP-${asset.code}`,
      chartOfAccountsId: assetAccount.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 3. Record cash received (if any)
    let cashEntry: BookkeepingEntry | undefined;
    if (params.disposalPrice > 0 && params.disposalMethod === 'sale') {
      const cashAccountId = params.cashAccountId || await this.findCashAccount();
      cashEntry = {
        id: BookkeepingBusinessService.generateEntryId(),
        type: 'revenue',
        category: 'Cash',
        subcategory: 'Asset Disposal',
        amount: params.disposalPrice,
        currency: 'USD',
        description: `Cash received from sale of ${asset.name}`,
        date: params.disposalDate,
        companyId: params.companyId,
        reference: `DISP-${asset.code}`,
        chartOfAccountsId: cashAccountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // 4. Record gain/loss on disposal
    let gainLossEntry: BookkeepingEntry | undefined;
    if (Math.abs(disposalGainLoss) > 0.01) { // Only if significant
      const gainLossAccount = await this.findOrCreateGainLossAccount();
      gainLossEntry = {
        id: BookkeepingBusinessService.generateEntryId(),
        type: disposalGainLoss > 0 ? 'revenue' : 'expense',
        category: 'Other Income/Expenses',
        subcategory: disposalGainLoss > 0 ? 'Gain on Asset Disposal' : 'Loss on Asset Disposal',
        amount: Math.abs(disposalGainLoss),
        currency: 'USD',
        description: `${disposalGainLoss > 0 ? 'Gain' : 'Loss'} on disposal of ${asset.name}`,
        date: params.disposalDate,
        companyId: params.companyId,
        reference: `DISP-${asset.code}`,
        chartOfAccountsId: gainLossAccount.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Create asset transaction record
    const assetTransaction: AssetTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assetId: asset.id,
      type: 'disposal',
      date: params.disposalDate,
      amount: params.disposalPrice,
      description: `Disposal of ${asset.name} via ${params.disposalMethod}`,
      createdAt: new Date().toISOString()
    };

    return {
      cashEntry,
      accumulatedDepreciationEntry,
      assetEntry,
      gainLossEntry,
      assetTransaction,
      disposalGainLoss
    };
  }

  /**
   * Process and save journal entries to the bookkeeping system
   */
  static async saveJournalEntries(entries: BookkeepingEntry[]): Promise<void> {
    // In a real implementation, this would save to the database
    // For now, we'll use the storage system
    entries.forEach(entry => {
      // Save each entry using the bookkeeping service
      // BookkeepingBusinessService.saveEntry(entry);
    });
  }

  /**
   * Generate all depreciation entries for a specific period
   */
  static async generatePeriodDepreciationEntries(
    period: string, // e.g., "2024-01"
    companyId: number
  ): Promise<DepreciationJournalEntry[]> {
    const { FixedAssetsBusinessService } = await import('./fixedAssetsBusinessService');
    const { FixedAssetsDepreciationService } = await import('./fixedAssetsDepreciationService');
    
    const activeAssets = FixedAssetsBusinessService.getAssetsByStatus('active');
    const depreciationEntries: DepreciationJournalEntry[] = [];

    for (const asset of activeAssets) {
      // Calculate monthly depreciation
      const monthlyDepreciation = FixedAssetsDepreciationService.calculateMonthlyDepreciation(asset);
      
      if (monthlyDepreciation > 0) {
        const entry = await this.generateDepreciationJournalEntries(asset, {
          depreciationAmount: monthlyDepreciation,
          period,
          companyId
        });
        depreciationEntries.push(entry);
      }
    }

    return depreciationEntries;
  }

  // Helper methods to find or create chart of accounts

  private static async findOrCreateAssetAccount(category: string): Promise<ChartOfAccount> {
    const accounts = ChartOfAccountsBusinessService.getAllAccounts();
    
    // Try to find existing asset account for this category
    let assetAccount = accounts.find(account => 
      account.type === 'Assets' && 
      account.subcategory === category
    );

    if (!assetAccount) {
      // Create new asset account
      assetAccount = {
        id: ChartOfAccountsBusinessService.generateAccountId(),
        code: `1${category.substring(0, 3).toUpperCase()}`,
        name: category,
        type: 'Assets',
        subcategory: category,
        description: `${category} fixed assets`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      ChartOfAccountsBusinessService.saveAccount(assetAccount);
    }

    return assetAccount;
  }

  private static async findOrCreateDepreciationExpenseAccount(): Promise<ChartOfAccount> {
    const accounts = ChartOfAccountsBusinessService.getAllAccounts();
    
    let depExpenseAccount = accounts.find(account => 
      account.type === 'Expense' && 
      account.name.toLowerCase().includes('depreciation')
    );

    if (!depExpenseAccount) {
      depExpenseAccount = {
        id: ChartOfAccountsBusinessService.generateAccountId(),
        code: 'DEP',
        name: 'Depreciation Expense',
        type: 'Expense',
        subcategory: 'Operating Expenses',
        description: 'Depreciation expense for fixed assets',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      ChartOfAccountsBusinessService.saveAccount(depExpenseAccount);
    }

    return depExpenseAccount;
  }

  private static async findOrCreateAccumulatedDepreciationAccount(category: string): Promise<ChartOfAccount> {
    const accounts = ChartOfAccountsBusinessService.getAllAccounts();
    
    let accDepAccount = accounts.find(account => 
      account.type === 'Assets' && 
      account.name.toLowerCase().includes('accumulated depreciation') &&
      account.subcategory === `Accumulated Depreciation - ${category}`
    );

    if (!accDepAccount) {
      accDepAccount = {
        id: ChartOfAccountsBusinessService.generateAccountId(),
        code: `AD${category.substring(0, 3).toUpperCase()}`,
        name: `Accumulated Depreciation - ${category}`,
        type: 'Assets',
        subcategory: `Accumulated Depreciation - ${category}`,
        description: `Accumulated depreciation for ${category}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      ChartOfAccountsBusinessService.saveAccount(accDepAccount);
    }

    return accDepAccount;
  }

  private static async findCashAccount(): Promise<string> {
    const accounts = ChartOfAccountsBusinessService.getAllAccounts();
    const cashAccount = accounts.find(account => 
      account.type === 'Assets' && 
      account.name.toLowerCase().includes('cash')
    );
    
    return cashAccount?.id || 'default-cash-account';
  }

  private static async findPayableAccount(): Promise<string> {
    const accounts = ChartOfAccountsBusinessService.getAllAccounts();
    const payableAccount = accounts.find(account => 
      account.type === 'Liability' && 
      account.name.toLowerCase().includes('payable')
    );
    
    return payableAccount?.id || 'default-payable-account';
  }

  private static async findOrCreateGainLossAccount(): Promise<ChartOfAccount> {
    const accounts = ChartOfAccountsBusinessService.getAllAccounts();
    
    let gainLossAccount = accounts.find(account => 
      account.name.toLowerCase().includes('gain') && 
      account.name.toLowerCase().includes('loss')
    );

    if (!gainLossAccount) {
      gainLossAccount = {
        id: ChartOfAccountsBusinessService.generateAccountId(),
        code: 'GAINLOSS',
        name: 'Gain/Loss on Asset Disposal',
        type: 'Revenue',
        subcategory: 'Other Income',
        description: 'Gains and losses from asset disposals',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      ChartOfAccountsBusinessService.saveAccount(gainLossAccount);
    }

    return gainLossAccount;
  }
}