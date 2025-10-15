import { 
  FinancialPeriod, 
  FinancialYear, 
  FinancialPeriodsSettings,
  PeriodClosingData,
  AccountBalance
} from '../../types/financialPeriods.types';

export class FinancialPeriodsStorageService {
  private static readonly FINANCIAL_PERIODS_KEY = 'portalpro_financial_periods';
  private static readonly FINANCIAL_YEARS_KEY = 'portalpro_financial_years';
  private static readonly PERIODS_SETTINGS_KEY = 'portalpro_periods_settings';
  private static readonly PERIOD_CLOSINGS_KEY = 'portalpro_period_closings';
  private static readonly ACCOUNT_BALANCES_KEY = 'portalpro_account_balances';

  // Financial Periods CRUD
  static getAllPeriods(): FinancialPeriod[] {
    try {
      const data = localStorage.getItem(this.FINANCIAL_PERIODS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading financial periods:', error);
      return [];
    }
  }

  static savePeriod(period: FinancialPeriod): void {
    try {
      const periods = this.getAllPeriods();
      const existingIndex = periods.findIndex(p => p.id === period.id);
      
      if (existingIndex >= 0) {
        periods[existingIndex] = { ...period, updatedAt: new Date().toISOString() };
      } else {
        periods.push(period);
      }
      
      localStorage.setItem(this.FINANCIAL_PERIODS_KEY, JSON.stringify(periods));
    } catch (error) {
      console.error('Error saving financial period:', error);
      throw error;
    }
  }

  static savePeriods(periods: FinancialPeriod[]): void {
    try {
      localStorage.setItem(this.FINANCIAL_PERIODS_KEY, JSON.stringify(periods));
    } catch (error) {
      console.error('Error saving financial periods:', error);
      throw error;
    }
  }

  static deletePeriod(periodId: string): void {
    try {
      const periods = this.getAllPeriods();
      const filteredPeriods = periods.filter(period => period.id !== periodId);
      localStorage.setItem(this.FINANCIAL_PERIODS_KEY, JSON.stringify(filteredPeriods));
    } catch (error) {
      console.error('Error deleting financial period:', error);
      throw error;
    }
  }

  static getPeriodById(periodId: string): FinancialPeriod | null {
    try {
      const periods = this.getAllPeriods();
      return periods.find(period => period.id === periodId) || null;
    } catch (error) {
      console.error('Error getting financial period by ID:', error);
      return null;
    }
  }

  // Financial Years CRUD
  static getAllYears(): FinancialYear[] {
    try {
      const data = localStorage.getItem(this.FINANCIAL_YEARS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading financial years:', error);
      return [];
    }
  }

  static saveYear(year: FinancialYear): void {
    try {
      const years = this.getAllYears();
      const existingIndex = years.findIndex(y => y.id === year.id);
      
      if (existingIndex >= 0) {
        years[existingIndex] = { ...year, updatedAt: new Date().toISOString() };
      } else {
        years.push(year);
      }
      
      localStorage.setItem(this.FINANCIAL_YEARS_KEY, JSON.stringify(years));
    } catch (error) {
      console.error('Error saving financial year:', error);
      throw error;
    }
  }

  static deleteYear(yearId: string): void {
    try {
      const years = this.getAllYears();
      const filteredYears = years.filter(year => year.id !== yearId);
      localStorage.setItem(this.FINANCIAL_YEARS_KEY, JSON.stringify(filteredYears));
    } catch (error) {
      console.error('Error deleting financial year:', error);
      throw error;
    }
  }

  // Settings CRUD
  static getSettings(): FinancialPeriodsSettings | null {
    try {
      const data = localStorage.getItem(this.PERIODS_SETTINGS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading periods settings:', error);
      return null;
    }
  }

  static saveSettings(settings: FinancialPeriodsSettings): void {
    try {
      const updatedSettings = { ...settings, updatedAt: new Date().toISOString() };
      localStorage.setItem(this.PERIODS_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving periods settings:', error);
      throw error;
    }
  }

  // Period Closing Data CRUD
  static getAllPeriodClosings(): PeriodClosingData[] {
    try {
      const data = localStorage.getItem(this.PERIOD_CLOSINGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading period closings:', error);
      return [];
    }
  }

  static savePeriodClosing(closingData: PeriodClosingData): void {
    try {
      const closings = this.getAllPeriodClosings();
      const existingIndex = closings.findIndex(c => c.periodId === closingData.periodId);
      
      if (existingIndex >= 0) {
        closings[existingIndex] = closingData;
      } else {
        closings.push(closingData);
      }
      
      localStorage.setItem(this.PERIOD_CLOSINGS_KEY, JSON.stringify(closings));
    } catch (error) {
      console.error('Error saving period closing:', error);
      throw error;
    }
  }

  static getPeriodClosing(periodId: string): PeriodClosingData | null {
    try {
      const closings = this.getAllPeriodClosings();
      return closings.find(closing => closing.periodId === periodId) || null;
    } catch (error) {
      console.error('Error getting period closing:', error);
      return null;
    }
  }

  // Account Balances CRUD
  static getAccountBalances(periodId: string): AccountBalance[] {
    try {
      const data = localStorage.getItem(`${this.ACCOUNT_BALANCES_KEY}_${periodId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading account balances:', error);
      return [];
    }
  }

  static saveAccountBalances(periodId: string, balances: AccountBalance[]): void {
    try {
      localStorage.setItem(`${this.ACCOUNT_BALANCES_KEY}_${periodId}`, JSON.stringify(balances));
    } catch (error) {
      console.error('Error saving account balances:', error);
      throw error;
    }
  }

  static deleteAccountBalances(periodId: string): void {
    try {
      localStorage.removeItem(`${this.ACCOUNT_BALANCES_KEY}_${periodId}`);
    } catch (error) {
      console.error('Error deleting account balances:', error);
      throw error;
    }
  }

  // Utility methods
  static isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static getStorageInfo() {
    if (!this.isLocalStorageAvailable()) {
      return { available: false };
    }

    const periods = this.getAllPeriods();
    const years = this.getAllYears();
    const settings = this.getSettings();
    const closings = this.getAllPeriodClosings();

    return {
      available: true,
      periodsCount: periods.length,
      yearsCount: years.length,
      hasSettings: !!settings,
      closingsCount: closings.length,
      lastUpdated: new Date().toISOString()
    };
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(this.FINANCIAL_PERIODS_KEY);
      localStorage.removeItem(this.FINANCIAL_YEARS_KEY);
      localStorage.removeItem(this.PERIODS_SETTINGS_KEY);
      localStorage.removeItem(this.PERIOD_CLOSINGS_KEY);
      
      // Clear all account balances (iterate through potential keys)
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.ACCOUNT_BALANCES_KEY)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing financial periods data:', error);
      throw error;
    }
  }

  // Backup and restore functionality
  static exportData() {
    try {
      return {
        periods: this.getAllPeriods(),
        years: this.getAllYears(),
        settings: this.getSettings(),
        closings: this.getAllPeriodClosings(),
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting financial periods data:', error);
      throw error;
    }
  }

  static importData(data: unknown): void {
    try {
      if (data.periods) {
        this.savePeriods(data.periods);
      }
      if (data.years) {
        localStorage.setItem(this.FINANCIAL_YEARS_KEY, JSON.stringify(data.years));
      }
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      if (data.closings) {
        localStorage.setItem(this.PERIOD_CLOSINGS_KEY, JSON.stringify(data.closings));
      }
    } catch (error) {
      console.error('Error importing financial periods data:', error);
      throw error;
    }
  }
}