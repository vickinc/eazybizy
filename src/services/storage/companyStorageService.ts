import { Company } from '@/types'; // Assuming Company type is available via barrel export

const COMPANIES_STORAGE_KEY = 'app-companies';

export class CompanyStorageService {
  static getCompanies(): Company[] {
    try {
      const savedCompanies = localStorage.getItem(COMPANIES_STORAGE_KEY);
      if (savedCompanies) {
        // TODO: Consider if migration is needed for companies in the future
        return JSON.parse(savedCompanies) as Company[];
      }
    } catch (error) {
      console.error('Error loading companies from localStorage:', error);
    }
    return [];
  }

  static saveCompanies(companies: Company[]): boolean {
    try {
      localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies));
      // Dispatch a storage event so other tabs/contexts can pick up the change
      // This is good practice if companies can be edited from multiple places or contexts
      window.dispatchEvent(new StorageEvent('storage', {
        key: COMPANIES_STORAGE_KEY,
        newValue: JSON.stringify(companies),
        storageArea: localStorage,
      }));
      return true;
    } catch (error) {
      console.error('Error saving companies to localStorage:', error);
      return false;
    }
  }
}
