import { BookkeepingEntry } from '@/types';

export interface ProfitLossStorageData {
  entries: BookkeepingEntry[];
  lastModified: string;
  version: string;
}

export class ProfitLossStorageService {
  private static readonly STORAGE_KEY = 'app-bookkeeping-entries';
  private static readonly STORAGE_VERSION = '1.0';

  static async loadBookkeepingEntries(): Promise<BookkeepingEntry[]> {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      
      if (!savedData) {
        return [];
      }

      const parsedData = JSON.parse(savedData);
      
      // Handle both array format (standard) and object format (legacy)
      if (Array.isArray(parsedData)) {
        // Standard array format - this is the preferred format
        return this.validateEntries(parsedData);
      } else if (parsedData && typeof parsedData === 'object' && Array.isArray(parsedData.entries)) {
        // Legacy object format - convert to standard array format
        console.warn('🔄 Converting from legacy object format to standard array format');
        const entries = this.validateEntries(parsedData.entries);
        await this.saveBookkeepingEntries(entries); // Save in standard array format
        return entries;
      } else {
        console.error('Invalid bookkeeping data format:', typeof parsedData);
        return [];
      }
    } catch (error) {
      console.error('Error loading bookkeeping entries:', error);
      throw new Error('Failed to load financial data from storage');
    }
  }

  static async saveBookkeepingEntries(entries: BookkeepingEntry[]): Promise<void> {
    try {
      const validatedEntries = this.validateEntries(entries);
      
      // IMPORTANT: Save as array to maintain consistency with BookkeepingStorageService
      // The object format was causing data format inconsistencies
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validatedEntries));
      
      // Dispatch storage event for consistency
      window.dispatchEvent(new StorageEvent('storage', {
        key: this.STORAGE_KEY,
        newValue: JSON.stringify(validatedEntries),
        storageArea: localStorage,
      }));
      
    } catch (error) {
      console.error('Error saving bookkeeping entries:', error);
      throw new Error('Failed to save financial data to storage');
    }
  }

  static async addBookkeepingEntry(entry: BookkeepingEntry): Promise<BookkeepingEntry[]> {
    try {
      const existingEntries = await this.loadBookkeepingEntries();
      const updatedEntries = [...existingEntries, entry];
      await this.saveBookkeepingEntries(updatedEntries);
      return updatedEntries;
    } catch (error) {
      console.error('Error adding bookkeeping entry:', error);
      throw new Error('Failed to add financial entry');
    }
  }

  static async updateBookkeepingEntry(updatedEntry: BookkeepingEntry): Promise<BookkeepingEntry[]> {
    try {
      const existingEntries = await this.loadBookkeepingEntries();
      const updatedEntries = existingEntries.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      );
      await this.saveBookkeepingEntries(updatedEntries);
      return updatedEntries;
    } catch (error) {
      console.error('Error updating bookkeeping entry:', error);
      throw new Error('Failed to update financial entry');
    }
  }

  static async deleteBookkeepingEntry(entryId: string): Promise<BookkeepingEntry[]> {
    try {
      const existingEntries = await this.loadBookkeepingEntries();
      const updatedEntries = existingEntries.filter(entry => entry.id !== entryId);
      await this.saveBookkeepingEntries(updatedEntries);
      return updatedEntries;
    } catch (error) {
      console.error('Error deleting bookkeeping entry:', error);
      throw new Error('Failed to delete financial entry');
    }
  }

  static async getStorageInfo(): Promise<{
    entryCount: number;
    lastModified: string;
    version: string;
    storageSize: string;
  }> {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      
      if (!savedData) {
        return {
          entryCount: 0,
          lastModified: 'Never',
          version: this.STORAGE_VERSION,
          storageSize: '0 KB'
        };
      }

      const parsedData = JSON.parse(savedData);
      const entries = Array.isArray(parsedData) ? parsedData : parsedData.entries || [];
      const lastModified = parsedData.lastModified || 'Unknown';
      const version = parsedData.version || '1.0';
      
      // Calculate storage size
      const sizeInBytes = new Blob([savedData]).size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);

      return {
        entryCount: entries.length,
        lastModified,
        version,
        storageSize: `${sizeInKB} KB`
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        entryCount: 0,
        lastModified: 'Error',
        version: this.STORAGE_VERSION,
        storageSize: 'Unknown'
      };
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing bookkeeping data:', error);
      throw new Error('Failed to clear financial data');
    }
  }

  static async exportData(): Promise<ProfitLossStorageData> {
    try {
      const entries = await this.loadBookkeepingEntries();
      return {
        entries,
        lastModified: new Date().toISOString(),
        version: this.STORAGE_VERSION
      };
    } catch (error) {
      console.error('Error exporting bookkeeping data:', error);
      throw new Error('Failed to export financial data');
    }
  }

  static async importData(data: ProfitLossStorageData): Promise<BookkeepingEntry[]> {
    try {
      if (!data || !Array.isArray(data.entries)) {
        throw new Error('Invalid import data format');
      }

      const validatedEntries = this.validateEntries(data.entries);
      await this.saveBookkeepingEntries(validatedEntries);
      return validatedEntries;
    } catch (error) {
      console.error('Error importing bookkeeping data:', error);
      throw new Error('Failed to import financial data');
    }
  }

  private static validateEntries(entries: unknown[]): BookkeepingEntry[] {
    if (!Array.isArray(entries)) {
      throw new Error('Entries must be an array');
    }

    return entries.filter((entry): entry is BookkeepingEntry => {
      if (!entry || typeof entry !== 'object') {
        console.warn('Invalid entry format, skipping:', entry);
        return false;
      }

      const entryObj = entry as Record<string, unknown>;

      const requiredFields = ['id', 'type', 'category', 'amount', 'currency', 'description', 'date', 'companyId'];
      const hasRequiredFields = requiredFields.every(field => entryObj.hasOwnProperty(field));

      if (!hasRequiredFields) {
        console.warn('Entry missing required fields, skipping:', entry);
        return false;
      }

      // Validate entry type (allow income, expense, and cogs)
      if (!['revenue', 'expense', 'cogs'].includes(entryObj.type as string)) {
        console.warn('Invalid entry type, skipping:', entry);
        return false;
      }

      // Validate amount is a number
      if (typeof entryObj.amount !== 'number' || isNaN(entryObj.amount)) {
        console.warn('Invalid amount, skipping:', entry);
        return false;
      }

      // Validate date format
      if (!entryObj.date || isNaN(new Date(entryObj.date as string).getTime())) {
        console.warn('Invalid date, skipping:', entry);
        return false;
      }

      return true;
    });
  }

  static async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<BookkeepingEntry[]> {
    try {
      const allEntries = await this.loadBookkeepingEntries();
      return allEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
    } catch (error) {
      console.error('Error filtering entries by date range:', error);
      throw new Error('Failed to filter entries by date range');
    }
  }

  static async getEntriesByCompany(companyId: number): Promise<BookkeepingEntry[]> {
    try {
      const allEntries = await this.loadBookkeepingEntries();
      return allEntries.filter(entry => entry.companyId === companyId);
    } catch (error) {
      console.error('Error filtering entries by company:', error);
      throw new Error('Failed to filter entries by company');
    }
  }

  static async getEntriesByCategory(category: string): Promise<BookkeepingEntry[]> {
    try {
      const allEntries = await this.loadBookkeepingEntries();
      return allEntries.filter(entry => entry.category === category);
    } catch (error) {
      console.error('Error filtering entries by category:', error);
      throw new Error('Failed to filter entries by category');
    }
  }

  static async migrateData(): Promise<void> {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      
      if (!savedData) {
        return;
      }

      const parsedData = JSON.parse(savedData);
      
      // If already in new format, no migration needed
      if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData) && parsedData.version) {
        return;
      }

      // If it's an array (old format), migrate to new format
      if (Array.isArray(parsedData)) {
        const validatedEntries = this.validateEntries(parsedData);
        await this.saveBookkeepingEntries(validatedEntries);
      }
    } catch (error) {
      console.error('Error during data migration:', error);
      // Don't throw error - allow app to continue with empty data
    }
  }
}