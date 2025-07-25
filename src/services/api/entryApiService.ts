import { BookkeepingEntry } from '@/types/bookkeeping.types';

export interface EntryFilters {
  companyId?: string;
  type?: 'revenue' | 'expense';
  category?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  accountId?: string;
  chartOfAccountsId?: string;
  isFromInvoice?: boolean;
}

export interface EntryPaginationOptions {
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EntryListResponse {
  entries: any[];
  pagination: {
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
  };
  stats: {
    totalAmount: number;
    totalCogs: number;
    totalCogsPaid: number;
    averageAmount: number;
    count: number;
    income: {
      total: number;
      count: number;
    };
    expense: {
      total: number;
      totalCogs: number;
      totalCogsPaid: number;
      count: number;
    };
    netProfit: number;
  };
}

export interface CreateEntryData {
  companyId: number;
  type: 'revenue' | 'expense';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  reference?: string;
  notes?: string;
  accountId?: string;
  accountType?: 'bank' | 'wallet';
  cogs?: number;
  cogsPaid?: number;
  vendorInvoice?: string;
  isFromInvoice?: boolean;
  invoiceId?: string;
  chartOfAccountsId?: string;
  linkedIncomeId?: string;
}

export interface UpdateEntryData extends Partial<CreateEntryData> {}

export class EntryApiService {
  private static baseUrl = '/api/entries';

  // Build query string from filters and options
  private static buildQueryString(
    filters: EntryFilters = {},
    options: EntryPaginationOptions = {}
  ): string {
    const params = new URLSearchParams();

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    // Add pagination options
    if (options.skip !== undefined) params.append('skip', String(options.skip));
    if (options.take !== undefined) params.append('take', String(options.take));
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    return params.toString();
  }

  // Get list of entries
  static async getEntries(
    filters: EntryFilters = {},
    options: EntryPaginationOptions = {}
  ): Promise<EntryListResponse> {
    const queryString = this.buildQueryString(filters, options);
    const url = `${this.baseUrl}${queryString ? `?${queryString}` : ''}`;

    console.log('🔍 [EntryApiService] Fetching entries with:', { filters, options });
    console.log('🔍 [EntryApiService] Final URL:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch entries: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔍 [EntryApiService] Response data:', data);

    return data;
  }

  // Get single entry by ID
  static async getEntry(id: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Entry not found');
      }
      throw new Error(`Failed to fetch entry: ${response.statusText}`);
    }

    return response.json();
  }

  // Create new entry
  static async createEntry(data: CreateEntryData): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create entry');
    }

    return response.json();
  }

  // Update existing entry
  static async updateEntry(id: string, data: UpdateEntryData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update entry');
    }

    return response.json();
  }

  // Delete entry
  static async deleteEntry(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete entry');
    }
  }

  // Bulk create entries
  static async createBulkEntries(entries: CreateEntryData[]): Promise<any> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create entries');
    }

    return response.json();
  }

  // Bulk delete entries
  static async deleteBulkEntries(ids: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete entries');
    }
  }

  // Get entries with minimal data (fast endpoint)
  static async getEntriesFast(
    filters: EntryFilters = {},
    options: EntryPaginationOptions = {}
  ): Promise<any> {
    const queryString = this.buildQueryString(filters, options);
    const url = `${this.baseUrl}/fast${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch entries: ${response.statusText}`);
    }

    return response.json();
  }

  // Export entries as CSV
  static async exportEntries(filters: EntryFilters = {}): Promise<Blob> {
    const queryString = this.buildQueryString(filters);
    const url = `${this.baseUrl}/export${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to export entries: ${response.statusText}`);
    }

    return response.blob();
  }

  // Get entry statistics
  static async getEntryStatistics(filters: EntryFilters = {}): Promise<any> {
    const queryString = this.buildQueryString(filters);
    const url = `${this.baseUrl}/stats${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance for convenience
export const entryApiService = EntryApiService;