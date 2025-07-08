import { InitialBalance } from '@/types/balance.types';

class BalanceStorageService {
  private readonly INITIAL_BALANCES_KEY = 'app-initial-balances';

  // Get all initial balances
  getAllInitialBalances(): InitialBalance[] {
    try {
      const data = localStorage.getItem(this.INITIAL_BALANCES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading initial balances:', error);
      return [];
    }
  }

  // Get initial balance for specific account
  getInitialBalance(accountId: string, accountType: 'bank' | 'wallet'): InitialBalance | null {
    const balances = this.getAllInitialBalances();
    return balances.find(b => b.accountId === accountId && b.accountType === accountType) || null;
  }

  // Get initial balances for company
  getInitialBalancesByCompany(companyId: number): InitialBalance[] {
    const balances = this.getAllInitialBalances();
    return balances.filter(b => b.companyId === companyId);
  }

  // Save initial balance
  saveInitialBalance(balance: Omit<InitialBalance, 'id' | 'createdAt' | 'updatedAt'>): InitialBalance {
    const balances = this.getAllInitialBalances();
    
    // Check if balance already exists for this account
    const existingIndex = balances.findIndex(
      b => b.accountId === balance.accountId && b.accountType === balance.accountType
    );

    const now = new Date().toISOString();
    
    if (existingIndex >= 0) {
      // Update existing balance
      const updatedBalance: InitialBalance = {
        ...balances[existingIndex],
        ...balance,
        updatedAt: now
      };
      balances[existingIndex] = updatedBalance;
      this.saveAllInitialBalances(balances);
      return updatedBalance;
    } else {
      // Create new balance
      const newBalance: InitialBalance = {
        ...balance,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now
      };
      balances.push(newBalance);
      this.saveAllInitialBalances(balances);
      return newBalance;
    }
  }

  // Update initial balance
  updateInitialBalance(id: string, updates: Partial<Omit<InitialBalance, 'id' | 'createdAt'>>): InitialBalance | null {
    const balances = this.getAllInitialBalances();
    const index = balances.findIndex(b => b.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedBalance: InitialBalance = {
      ...balances[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    balances[index] = updatedBalance;
    this.saveAllInitialBalances(balances);
    return updatedBalance;
  }

  // Delete initial balance
  deleteInitialBalance(id: string): boolean {
    const balances = this.getAllInitialBalances();
    const index = balances.findIndex(b => b.id === id);
    
    if (index === -1) {
      return false;
    }

    balances.splice(index, 1);
    this.saveAllInitialBalances(balances);
    return true;
  }

  // Delete initial balance by account
  deleteInitialBalanceByAccount(accountId: string, accountType: 'bank' | 'wallet'): boolean {
    const balances = this.getAllInitialBalances();
    const index = balances.findIndex(b => b.accountId === accountId && b.accountType === accountType);
    
    if (index === -1) {
      return false;
    }

    balances.splice(index, 1);
    this.saveAllInitialBalances(balances);
    return true;
  }

  // Cleanup orphaned initial balances (balances for accounts that no longer exist)
  cleanupOrphanedBalances(validAccountIds: { accountId: string; accountType: 'bank' | 'wallet' }[]): number {
    const balances = this.getAllInitialBalances();
    const initialCount = balances.length;
    
    const validBalances = balances.filter(balance => 
      validAccountIds.some(valid => 
        valid.accountId === balance.accountId && valid.accountType === balance.accountType
      )
    );

    this.saveAllInitialBalances(validBalances);
    return initialCount - validBalances.length;
  }

  // Clear all initial balances
  clearAllInitialBalances(): void {
    localStorage.removeItem(this.INITIAL_BALANCES_KEY);
  }

  // Private methods
  private saveAllInitialBalances(balances: InitialBalance[]): void {
    try {
      localStorage.setItem(this.INITIAL_BALANCES_KEY, JSON.stringify(balances));
    } catch (error) {
      console.error('Error saving initial balances:', error);
      throw new Error('Failed to save initial balances');
    }
  }

  private generateId(): string {
    return `balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const balanceStorageService = new BalanceStorageService();