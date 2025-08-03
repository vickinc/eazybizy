import { ManualCashflowEntry } from '@/services/business/cashflowBusinessService';

export interface CashflowApiFilters {
  companyId?: number | 'all';
  accountId?: string;
  accountType?: 'bank' | 'wallet';
  type?: 'inflow' | 'outflow';
  period?: string;
  periodFrom?: string;
  periodTo?: string;
  searchTerm?: string;
}

export interface CashflowApiPagination {
  skip?: number;
  take?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CashflowApiResponse<T> {
  data: T;
  total?: number;
  error?: string;
}

export interface ManualCashflowEntryWithCompany extends ManualCashflowEntry {
  company: {
    id: number;
    tradingName: string;
    legalName: string;
    logo: string;
  };
}

export interface CreateManualCashflowEntryDto {
  companyId: number;
  accountId: string;
  accountType: 'bank' | 'wallet';
  type: 'inflow' | 'outflow';
  amount: string | number;
  currency: string;
  period: string;
  description: string;
  notes?: string;
}

export interface UpdateManualCashflowEntryDto {
  accountId?: string;
  accountType?: 'bank' | 'wallet';
  type?: 'inflow' | 'outflow';
  amount?: string | number;
  currency?: string;
  period?: string;
  description?: string;
  notes?: string;
}

export class CashflowApiService {
  private static readonly BASE_URL = '/api/cashflow/manual-entries';

  /**
   * Build query string from filters and pagination
   */
  private static buildQueryString(
    filters?: CashflowApiFilters,
    pagination?: CashflowApiPagination
  ): string {
    const params = new URLSearchParams();

    // Add filters
    if (filters) {
      if (filters.companyId !== undefined) {
        params.append('companyId', String(filters.companyId));
      }
      if (filters.accountId) {
        params.append('accountId', filters.accountId);
      }
      if (filters.accountType) {
        params.append('accountType', filters.accountType);
      }
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (filters.period) {
        params.append('period', filters.period);
      }
      if (filters.periodFrom) {
        params.append('periodFrom', filters.periodFrom);
      }
      if (filters.periodTo) {
        params.append('periodTo', filters.periodTo);
      }
      if (filters.searchTerm) {
        params.append('search', filters.searchTerm);
      }
    }

    // Add pagination
    if (pagination) {
      if (pagination.skip !== undefined) {
        params.append('skip', String(pagination.skip));
      }
      if (pagination.take !== undefined) {
        params.append('take', String(pagination.take));
      }
      if (pagination.sortField) {
        params.append('sortField', pagination.sortField);
      }
      if (pagination.sortDirection) {
        params.append('sortDirection', pagination.sortDirection);
      }
    }

    return params.toString();
  }

  /**
   * Get manual cashflow entries with filters and pagination
   */
  static async getManualCashflowEntries(
    filters?: CashflowApiFilters,
    pagination?: CashflowApiPagination
  ): Promise<CashflowApiResponse<ManualCashflowEntryWithCompany[]>> {
    try {
      const queryString = this.buildQueryString(filters, pagination);
      const url = queryString ? `${this.BASE_URL}?${queryString}` : this.BASE_URL;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch manual cashflow entries');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching manual cashflow entries:', error);
      throw error;
    }
  }

  /**
   * Get a single manual cashflow entry by ID
   */
  static async getManualCashflowEntryById(
    id: string
  ): Promise<ManualCashflowEntryWithCompany> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch manual cashflow entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching manual cashflow entry:', error);
      throw error;
    }
  }

  /**
   * Create a new manual cashflow entry
   */
  static async createManualCashflowEntry(
    data: CreateManualCashflowEntryDto
  ): Promise<ManualCashflowEntryWithCompany> {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create manual cashflow entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating manual cashflow entry:', error);
      throw error;
    }
  }

  /**
   * Update a manual cashflow entry
   */
  static async updateManualCashflowEntry(
    id: string,
    data: UpdateManualCashflowEntryDto
  ): Promise<ManualCashflowEntryWithCompany> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update manual cashflow entry');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating manual cashflow entry:', error);
      throw error;
    }
  }

  /**
   * Delete a manual cashflow entry
   */
  static async deleteManualCashflowEntry(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete manual cashflow entry');
      }
    } catch (error) {
      console.error('Error deleting manual cashflow entry:', error);
      throw error;
    }
  }

  /**
   * Migrate manual cashflow entries from localStorage to database
   */
  static async migrateFromLocalStorage(
    entries: ManualCashflowEntry[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const entry of entries) {
      try {
        // Convert the entry to the create DTO format
        const createDto: CreateManualCashflowEntryDto = {
          companyId: entry.companyId,
          accountId: entry.accountId,
          accountType: entry.accountType,
          type: entry.type,
          amount: entry.amount,
          currency: entry.currency,
          period: entry.period,
          description: entry.description,
          notes: entry.notes,
        };

        await this.createManualCashflowEntry(createDto);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed to migrate entry ${entry.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return results;
  }
}