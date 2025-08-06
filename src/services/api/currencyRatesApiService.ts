import { CurrencyRate } from '@/types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CurrencyRatesStats {
  totalRates: number;
  fiatRates: number;
  cryptoRates: number;
  lastUpdated: string | null;
}

export class CurrencyRatesApiService {
  private static baseUrl = '/api/currency-rates';

  /**
   * Fetch all currency rates or by type
   */
  static async findAll(): Promise<CurrencyRate[]> {
    const response = await fetch(`${this.baseUrl}`);
    const result: ApiResponse<CurrencyRate[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch currency rates');
    }
    
    return result.data || [];
  }

  /**
   * Fetch currency rates by type (fiat or crypto)
   */
  static async findByType(type: 'fiat' | 'crypto'): Promise<CurrencyRate[]> {
    const response = await fetch(`${this.baseUrl}?type=${type}`);
    const result: ApiResponse<CurrencyRate[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || `Failed to fetch ${type} currency rates`);
    }
    
    return result.data || [];
  }

  /**
   * Save multiple currency rates (bulk upsert)
   */
  static async saveRates(rates: CurrencyRate[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rates }),
    });
    
    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save currency rates');
    }
  }

  /**
   * Update a single currency rate
   */
  static async updateRate(code: string, rate: number, source = 'manual'): Promise<CurrencyRate> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, rate, source }),
    });
    
    const result: ApiResponse<CurrencyRate> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update currency rate');
    }
    
    return result.data!;
  }

  /**
   * Get currency rates statistics
   */
  static async getStats(): Promise<CurrencyRatesStats> {
    const response = await fetch(`${this.baseUrl}/stats`);
    const result: ApiResponse<CurrencyRatesStats> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch currency rates statistics');
    }
    
    return result.data!;
  }

  /**
   * Migrate data from localStorage to database
   */
  static async migrateFromLocalStorage(fiatRates: CurrencyRate[], cryptoRates: CurrencyRate[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fiatRates, cryptoRates }),
    });
    
    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to migrate currency rates');
    }
  }

  /**
   * Initialize default currency rates
   */
  static async initializeDefaults(defaultRates: CurrencyRate[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ defaultRates }),
    });
    
    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to initialize default currency rates');
    }
  }
}