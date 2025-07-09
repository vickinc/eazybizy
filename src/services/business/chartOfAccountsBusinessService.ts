import { 
  ChartOfAccount, 
  ChartOfAccountFormData, 
  ChartOfAccountsStats, 
  ChartOfAccountsFilter,
  AccountType,
  AccountCategory,
  AccountGroup,
  TableSortConfig,
  ACCOUNT_CATEGORIES_BY_TYPE
} from '@/types/chartOfAccounts.types';
import { ChartOfAccountsStorageService } from '@/services/storage/chartOfAccountsStorageService';
import { ChartOfAccountsParserService } from './chartOfAccountsParserService';

export class ChartOfAccountsBusinessService {
  static generateAccountId(): string {
    return `account_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  static createAccountFromFormData(formData: ChartOfAccountFormData): ChartOfAccount {
    return {
      id: this.generateAccountId(),
      code: formData.code.trim(),
      name: formData.name.trim(),
      type: formData.type,
      category: formData.category,
      vat: formData.vat,
      relatedVendor: formData.relatedVendor.trim() || undefined,
      accountType: formData.accountType,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static updateAccountFromFormData(existingAccount: ChartOfAccount, formData: ChartOfAccountFormData): ChartOfAccount {
    return {
      ...existingAccount,
      code: formData.code.trim(),
      name: formData.name.trim(),
      type: formData.type,
      category: formData.category,
      vat: formData.vat,
      relatedVendor: formData.relatedVendor.trim() || undefined,
      accountType: formData.accountType,
      updatedAt: new Date().toISOString()
    };
  }

  static filterAccounts(accounts: ChartOfAccount[], filter: ChartOfAccountsFilter): ChartOfAccount[] {
    return accounts.filter(account => {
      // Search filter
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const matchesSearch = 
          account.code.toLowerCase().includes(searchTerm) ||
          account.name.toLowerCase().includes(searchTerm) ||
          (account.relatedVendor && account.relatedVendor.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filter.type !== 'all' && account.type !== filter.type) {
        return false;
      }

      // Category filter
      if (filter.category !== 'all' && account.category !== filter.category) {
        return false;
      }

      // VAT filter
      if (filter.vat !== 'all' && account.vat !== filter.vat) {
        return false;
      }

      // Account type filter
      if (filter.accountType !== 'all' && account.accountType !== filter.accountType) {
        return false;
      }

      // Active status filter
      if (filter.isActive !== 'all' && account.isActive !== filter.isActive) {
        return false;
      }

      return true;
    });
  }


  static calculateStats(accounts: ChartOfAccount[]): ChartOfAccountsStats {
    const stats: ChartOfAccountsStats = {
      total: accounts.length,
      byType: {
        Assets: 0,
        Liability: 0,
        Equity: 0,
        Revenue: 0,
        Expense: 0
      },
      byVAT: {}
    };

    accounts.forEach(account => {
      // Count by type
      stats.byType[account.type]++;

      // Count by VAT
      if (!stats.byVAT[account.vat]) {
        stats.byVAT[account.vat] = 0;
      }
      stats.byVAT[account.vat]++;
    });

    return stats;
  }

  static getAccountsByType(accounts: ChartOfAccount[], type: AccountType): ChartOfAccount[] {
    return accounts.filter(account => account.type === type && account.isActive);
  }

  static getAccountsForBookkeeping(accounts: ChartOfAccount[], entryType: 'income' | 'expense'): ChartOfAccount[] {
    // For income entries, suggest Revenue accounts
    // For expense entries, suggest Expense accounts
    const targetType: AccountType = entryType === 'income' ? 'Revenue' : 'Expense';
    return this.getAccountsByType(accounts, targetType);
  }

  static getAccountsForBalance(accounts: ChartOfAccount[]): { assets: ChartOfAccount[], liabilities: ChartOfAccount[] } {
    return {
      assets: this.getAccountsByType(accounts, 'Assets'),
      liabilities: this.getAccountsByType(accounts, 'Liability')
    };
  }

  static getAccountsForProfitLoss(accounts: ChartOfAccount[]): { revenue: ChartOfAccount[], expenses: ChartOfAccount[] } {
    return {
      revenue: this.getAccountsByType(accounts, 'Revenue'),
      expenses: this.getAccountsByType(accounts, 'Expense')
    };
  }

  static initializeDefaultAccounts(): ChartOfAccount[] {
    const existingAccounts = ChartOfAccountsStorageService.getAccounts();
    
    // FORCE COMPLETE DATASET: Always load all 218 accounts if we don't have them
    // This ensures users get the complete dataset even if they have partial data
    const needsCompleteDataset = existingAccounts.length < 218;
    
    // console.log('Chart of Accounts initialization:', {
    //   existingCount: existingAccounts.length,
    //   needsCompleteDataset,
    //   reason: existingAccounts.length === 0 ? 'no_accounts' : 
    //           existingAccounts.length < 218 ? 'incomplete_dataset' : 'complete'
    // });
    
    if (needsCompleteDataset) {
      
      // Clear any incomplete data first
      if (existingAccounts.length > 0) {
        ChartOfAccountsStorageService.clearAllAccounts();
      }
      
      try {
        const defaultAccounts = ChartOfAccountsParserService.getDefaultChartOfAccounts();
        // console.log('Loading complete default accounts:', {
        //   count: defaultAccounts.length, 
        //   expectedCount: 218,
        //   isComplete: defaultAccounts.length >= 218
        // });
        
        if (defaultAccounts.length >= 218) {
          ChartOfAccountsStorageService.saveAccounts(defaultAccounts);
          return defaultAccounts;
        } else {
          console.error(`❌ Expected 218 accounts but got ${defaultAccounts.length}`);
          // Still save whatever we got, but log the issue
          ChartOfAccountsStorageService.saveAccounts(defaultAccounts);
          return defaultAccounts;
        }
      } catch (error) {
        console.error('Error parsing default accounts:', error);
        // Fallback: create a few basic accounts
        const fallbackAccounts = this.createFallbackAccounts();
        ChartOfAccountsStorageService.saveAccounts(fallbackAccounts);
        return fallbackAccounts;
      }
    }
    
    return existingAccounts;
  }

  static createFallbackAccounts(): ChartOfAccount[] {
    return [
      {
        id: this.generateAccountId(),
        code: '1000',
        name: 'Cash',
        type: 'Assets',
        category: 'Cash and cash equivalents',
        vat: 'Not included in Turnover',
        accountType: 'Detail',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: this.generateAccountId(),
        code: '1200',
        name: 'Trade receivables',
        type: 'Assets',
        category: 'Trade receivables',
        vat: 'Not included in Turnover',
        accountType: 'Detail',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: this.generateAccountId(),
        code: '2110',
        name: 'Trade payables',
        type: 'Liability',
        category: 'Trade payables',
        vat: 'Not included in Turnover',
        accountType: 'Detail',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: this.generateAccountId(),
        code: '3000',
        name: 'Sales Revenue',
        type: 'Revenue',
        category: 'Revenue',
        vat: 'Value Added Tax 22%',
        accountType: 'Detail',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: this.generateAccountId(),
        code: '4000',
        name: 'Cost of Goods Sold',
        type: 'Expense',
        category: 'Raw materials and consumables used',
        vat: 'Value Added Tax 22%',
        accountType: 'Detail',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  static getAccountByCode(code: string): ChartOfAccount | null {
    return ChartOfAccountsStorageService.getAccountByCode(code);
  }

  static getAccountById(id: string): ChartOfAccount | null {
    return ChartOfAccountsStorageService.getAccountById(id);
  }

  static forceRefreshCompleteDataset(): ChartOfAccount[] {
    
    // Clear all existing data
    ChartOfAccountsStorageService.clearAllAccounts();
    
    // Load complete dataset
    const defaultAccounts = ChartOfAccountsParserService.getDefaultChartOfAccounts();
    
    // Save and return
    ChartOfAccountsStorageService.saveAccounts(defaultAccounts);
    
    return defaultAccounts;
  }

  static deactivateAccount(id: string): void {
    const account = ChartOfAccountsStorageService.getAccountById(id);
    if (account) {
      const updatedAccount = {
        ...account,
        isActive: false,
        updatedAt: new Date().toISOString()
      };
      ChartOfAccountsStorageService.updateAccount(updatedAccount);
    }
  }

  static reactivateAccount(id: string): void {
    const account = ChartOfAccountsStorageService.getAccountById(id);
    if (account) {
      const updatedAccount = {
        ...account,
        isActive: true,
        updatedAt: new Date().toISOString()
      };
      ChartOfAccountsStorageService.updateAccount(updatedAccount);
    }
  }

  static searchAccounts(accounts: ChartOfAccount[], searchTerm: string): ChartOfAccount[] {
    if (!searchTerm.trim()) {
      return accounts;
    }

    const term = searchTerm.toLowerCase().trim();
    return accounts.filter(account => 
      account.code.toLowerCase().includes(term) ||
      account.name.toLowerCase().includes(term) ||
      account.type.toLowerCase().includes(term) ||
      (account.relatedVendor && account.relatedVendor.toLowerCase().includes(term))
    );
  }

  static exportToCSV(accounts: ChartOfAccount[]): string {
    const headers = ['Code', 'Name', 'Type', 'Category', 'VAT', 'Related Vendor', 'Account Type'];
    const rows = accounts.map(account => [
      account.code,
      account.name,
      account.type,
      account.category,
      account.vat,
      account.relatedVendor || '',
      account.accountType
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  static getNextAvailableCode(type: AccountType): string {
    const accounts = ChartOfAccountsStorageService.getAccounts();
    const typePrefix = this.getTypePrefix(type);
    
    // Find the highest existing code for this type
    const existingCodes = accounts
      .filter(account => account.code.startsWith(typePrefix))
      .map(account => parseInt(account.code))
      .filter(code => !isNaN(code));

    if (existingCodes.length === 0) {
      return `${typePrefix}000`;
    }

    const maxCode = Math.max(...existingCodes);
    return (maxCode + 1).toString();
  }

  private static getTypePrefix(type: AccountType): string {
    switch (type) {
      case 'Assets': return '1';
      case 'Liability': return '2';
      case 'Equity': return '2'; // Equity accounts typically use 2900-2999 range
      case 'Revenue': return '3';
      case 'Expense': return '4';
      default: return '9';
    }
  }

  static groupAccountsByType(accounts: ChartOfAccount[]): AccountGroup[] {
    const accountTypes: AccountType[] = ['Assets', 'Liability', 'Equity', 'Revenue', 'Expense'];
    
    return accountTypes.map(type => {
      const typeAccounts = accounts
        .filter(account => account.type === type)
        .sort((a, b) => a.code.localeCompare(b.code));
      
      const totalBalance = typeAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
      
      return {
        type,
        accounts: typeAccounts,
        totalBalance,
        count: typeAccounts.length
      };
    }).filter(group => group.count > 0);
  }

  static sortAccounts(accounts: ChartOfAccount[], sortConfig: TableSortConfig): ChartOfAccount[] {
    return [...accounts].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.field) {
        case 'code':
          aValue = a.code;
          bValue = b.code;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'balance':
          aValue = a.balance || 0;
          bValue = b.balance || 0;
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'classification':
          aValue = a.classification || '';
          bValue = b.classification || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  static getAccountClassification(account: ChartOfAccount): string {
    const code = parseInt(account.code);
    const type = account.type;
    
    // Auto-classify based on account code ranges
    switch (type) {
      case 'Assets':
        if (code >= 1000 && code < 1400) return 'Current Assets';
        if (code >= 1400 && code < 1800) return 'Investments';
        if (code >= 1800 && code < 1900) return 'Fixed Assets';
        if (code >= 1900) return 'Intangible Assets';
        break;
      case 'Liability':
        if (code >= 2000 && code < 2800) return 'Current Liabilities';
        if (code >= 2800 && code < 2900) return 'Long-term Liabilities';
        break;
      case 'Equity':
        if (code >= 2900) return 'Equity';
        break;
      case 'Revenue':
        if (code >= 3000 && code < 3500) return 'Operating Revenue';
        if (code >= 3500 && code < 3900) return 'Non-operating Revenue';
        if (code >= 3900) return 'Other Income';
        break;
      case 'Expense':
        if (code >= 4000 && code < 4200) return 'Cost of Goods Sold';
        if (code >= 4200 && code < 4600) return 'Operating Expenses';
        if (code >= 4600 && code < 4800) return 'Administrative Expenses';
        if (code >= 4800) return 'Financial Expenses';
        break;
    }
    
    return account.classification || 'Other';
  }

  static formatVATRate(vat: string): string {
    if (vat.includes('22%')) return '22%';
    if (vat.includes('9%')) return '9%';
    if (vat.includes('0%')) return '0%';
    if (vat.includes('exempt')) return 'Exempt';
    return 'N/A';
  }

  static formatCurrency(amount: number, currency: string = 'EUR'): string {
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;
    return `${symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  static getAccountCategory(account: ChartOfAccount): AccountCategory {
    if (account.category) return account.category;
    
    // Auto-assign category based on account code and type from Chart of Accounts.md
    const code = parseInt(account.code);
    const type = account.type;
    
    switch (type) {
      case 'Assets':
        // Cash and cash equivalents (1000-1080)
        if (code >= 1000 && code <= 1080) return 'Cash and cash equivalents';
        // Financial investments (1100, 1630)
        if (code === 1100 || code === 1630) return 'Financial investments';
        // Trade receivables (1200-1208)
        if (code >= 1200 && code <= 1208) return 'Trade receivables';
        // Tax prepayments and receivables (1210)
        if (code === 1210) return 'Tax prepayments and receivables';
        // Other receivables (1220-1246)
        if (code >= 1220 && code <= 1246) return 'Other receivables';
        // Loan Receivables (1240)
        if (code === 1240) return 'Loan Receivables';
        // Prepayments for services (1250-1254)
        if (code >= 1250 && code <= 1254) return 'Prepayments for services';
        // Receivables from connected parties (1280)
        if (code === 1280) return 'Receivables from connected parties';
        // Raw materials (1310)
        if (code === 1310) return 'Raw materials';
        // Work in progress (1320)
        if (code === 1320) return 'Work in progress';
        // Finished goods (1330)
        if (code === 1330) return 'Finished goods';
        // Purchases (1340)
        if (code === 1340) return 'Purchases';
        // Prepayments for inventories (1350)
        if (code === 1350) return 'Prepayments for inventories';
        // Biological assets (1400, 1890)
        if (code === 1400 || code === 1890) return 'Biological assets';
        // Shares of subsidiaries (1600-1610)
        if (code >= 1600 && code <= 1610) return 'Shares of subsidiaries';
        // Receivables and prepayments (1640)
        if (code === 1640) return 'Receivables and prepayments';
        // Investment property (1700-1710)
        if (code >= 1700 && code <= 1710) return 'Investment property';
        // Land (1800)
        if (code === 1800) return 'Land';
        // Buildings (1820-1821)
        if (code >= 1820 && code <= 1821) return 'Buildings';
        // Machinery and equipment (1830-1835)
        if (code >= 1830 && code <= 1835) return 'Machinery and equipment';
        // Other tangible assets (1840-1841)
        if (code >= 1840 && code <= 1841) return 'Other tangible assets';
        // Unfinished construction projects and prepayments (1870-1880)
        if (code >= 1870 && code <= 1880) return 'Unfinished construction projects and prepayments';
        // Goodwill (1900-1901)
        if (code >= 1900 && code <= 1901) return 'Goodwill';
        // Development expenditures (1910-1911)
        if (code >= 1910 && code <= 1911) return 'Development expenditures';
        // Computer software (1920-1921)
        if (code >= 1920 && code <= 1921) return 'Computer software';
        // Concessions, patents, licences, trademarks (1940-1941)
        if (code >= 1940 && code <= 1941) return 'Concessions, patents, licences, trademarks';
        // Other intangible assets (1960-1961)
        if (code >= 1960 && code <= 1961) return 'Other intangible assets';
        // Unfinished projects for intangible assets (1980)
        if (code === 1980) return 'Unfinished projects for intangible assets';
        return 'Other receivables';
      case 'Liability':
        // Current loans and notes payable (2010-2030)
        if (code >= 2010 && code <= 2030) return 'Current loans and notes payable';
        // Current portion of long-term debts (2070-2080)
        if (code >= 2070 && code <= 2080) return 'Current portion of long-term debts';
        // Trade payables (2110)
        if (code === 2110) return 'Trade payables';
        // Payables to employees (2210-2280)
        if (code >= 2210 && code <= 2280) return 'Payables to employees';
        // Tax payables (2305-2390)
        if (code >= 2305 && code <= 2390) return 'Tax payables';
        // Other payables (2400-2477)
        if (code >= 2400 && code <= 2477) return 'Other payables';
        // Other received prepayments (2500-2510)
        if (code >= 2500 && code <= 2510) return 'Other received prepayments';
        // Targeted financing (2600)
        if (code === 2600) return 'Targeted financing';
        // Other provisions (2700, 2870)
        if (code === 2700 || code === 2870) return 'Other provisions';
        // Loan liabilities (2810-2830)
        if (code >= 2810 && code <= 2830) return 'Loan liabilities';
        // Payables and prepayments (2860)
        if (code === 2860) return 'Payables and prepayments';
        // Government grants (2880)
        if (code === 2880) return 'Government grants';
        // Issued capital (2910)
        if (code === 2910) return 'Issued capital';
        // Share capital (2912)
        if (code === 2912) return 'Share capital';
        // Unregistered equity (2920-2922)
        if (code >= 2920 && code <= 2922) return 'Unregistered equity';
        // Share premium (2930)
        if (code === 2930) return 'Share premium';
        // Reacquired shares (2940-2942)
        if (code >= 2940 && code <= 2942) return 'Reacquired shares';
        // Statutory reserve capital (2950)
        if (code === 2950) return 'Statutory reserve capital';
        // Other reserves (2960-2962)
        if (code >= 2960 && code <= 2962) return 'Other reserves';
        // Retained earnings (deficit) (2970)
        if (code === 2970) return 'Retained earnings (deficit)';
        // Profit (loss) for the year (2980)
        if (code === 2980) return 'Profit (loss) for the year';
        return 'Other payables';
      case 'Revenue':
        // Revenue (3000-3099)
        if (code >= 3000 && code <= 3099) return 'Revenue';
        // Other income (3510-3590)
        if (code >= 3510 && code <= 3590) return 'Other income';
        // Gain (loss) on biological assets (3900)
        if (code === 3900) return 'Gain (loss) on biological assets';
        // Increase/decrease in inventories (3910)
        if (code === 3910) return 'Increase/decrease in inventories of finished goods and work in progress';
        // Capital expenditure (3920)
        if (code === 3920) return 'Capital expenditure on items of property, plant and equipment for the entity\'s own use';
        // Profit (loss) from subsidiaries (6000)
        if (code === 6000) return 'Profit (loss) from subsidiaries';
        // Profit (loss) from financial investments (6010)
        if (code === 6010) return 'Profit (loss) from financial investments';
        // Other financial income and expense (6040-6050)
        if (code >= 6040 && code <= 6050) return 'Other financial income and expense';
        return 'Revenue';
      case 'Expense':
        // Raw materials and consumables used (4000-4050)
        if (code >= 4000 && code <= 4050) return 'Raw materials and consumables used';
        // Other operating expenses (4200-4680)
        if (code >= 4200 && code <= 4680) return 'Other operating expenses';
        // Wage and salary expense (4710-4790)
        if (code >= 4710 && code <= 4790) return 'Wage and salary expense';
        // Social security taxes (4720-4791)
        if ((code >= 4720 && code <= 4729) || code === 4791) return 'Social security taxes';
        // Depreciation and impairment loss (4810-4830)
        if (code >= 4810 && code <= 4830) return 'Depreciation and impairment loss (reversal)';
        // Other expense (4900-4990)
        if (code >= 4900 && code <= 4990) return 'Other expense';
        // Interest expenses (6060-6065)
        if (code >= 6060 && code <= 6065) return 'Interest expenses';
        // Income tax expense (7000)
        if (code === 7000) return 'Income tax expense';
        return 'Other operating expenses';
      default:
        // Default to first category for the type
        return ACCOUNT_CATEGORIES_BY_TYPE[type][0];
    }
  }

  static enrichAccountsWithCalculatedFields(accounts: ChartOfAccount[]): ChartOfAccount[] {
    return accounts.map(account => ({
      ...account,
      category: account.category || this.getAccountCategory(account),
      classification: account.classification || this.getAccountClassification(account),
      balance: account.balance || 0,
      hasTransactions: (account.transactionCount || 0) > 0,
      lastActivity: account.lastActivity || account.updatedAt
    }));
  }

  /**
   * Get all accounts from storage, initializing defaults if needed
   * This method is used by journal entry management for account selection
   */
  static getAllAccounts(): ChartOfAccount[] {
    // Initialize accounts if they don't exist
    const accounts = this.initializeDefaultAccounts();
    
    // Return enriched accounts with calculated fields
    return this.enrichAccountsWithCalculatedFields(accounts);
  }

  /**
   * Get active accounts only (filtered for UI dropdowns)
   */
  static getActiveAccounts(): ChartOfAccount[] {
    return this.getAllAccounts().filter(account => account.isActive);
  }

  /**
   * Get accounts suitable for journal entries (active accounts sorted by code)
   */
  static getAccountsForJournalEntry(): ChartOfAccount[] {
    return this.getActiveAccounts().sort((a, b) => a.code.localeCompare(b.code));
  }
}