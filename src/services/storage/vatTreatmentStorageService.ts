import { VATTreatment } from '@/types/vatTreatment.types';

export class VATTreatmentStorageService {
  private static readonly STORAGE_KEY = 'vatTreatments';

  static getAll(): VATTreatment[] {
    try {
      // SSR guard: Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return [];
      }
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading VAT treatments from localStorage:', error);
      return [];
    }
  }

  static getById(id: string): VATTreatment | undefined {
    const treatments = this.getAll();
    return treatments.find(treatment => treatment.id === id);
  }

  static getByCode(code: string): VATTreatment | undefined {
    const treatments = this.getAll();
    return treatments.find(treatment => treatment.code === code);
  }

  static getActive(): VATTreatment[] {
    return this.getAll().filter(treatment => treatment.isActive);
  }

  static save(treatment: VATTreatment): VATTreatment {
    try {
      // SSR guard: Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return treatment; // Return the treatment as-is during SSR
      }
      
      const treatments = this.getAll();
      const existingIndex = treatments.findIndex(t => t.id === treatment.id);
      
      if (existingIndex >= 0) {
        // Update existing treatment
        treatments[existingIndex] = { ...treatment, updatedAt: new Date().toISOString() };
      } else {
        // Add new treatment
        treatments.push(treatment);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(treatments));
      return treatment;
    } catch (error) {
      console.error('Error saving VAT treatment to localStorage:', error);
      throw new Error('Failed to save VAT treatment');
    }
  }

  static saveAll(treatments: VATTreatment[]): void {
    try {
      // SSR guard: Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return; // Do nothing during SSR
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(treatments));
    } catch (error) {
      console.error('Error saving VAT treatments to localStorage:', error);
      throw new Error('Failed to save VAT treatments');
    }
  }

  static delete(id: string): boolean {
    try {
      // SSR guard: Check if we're in browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return false; // Return false during SSR
      }
      
      const treatments = this.getAll();
      const filteredTreatments = treatments.filter(treatment => treatment.id !== id);
      
      if (filteredTreatments.length === treatments.length) {
        return false; // Treatment not found
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTreatments));
      return true;
    } catch (error) {
      console.error('Error deleting VAT treatment from localStorage:', error);
      throw new Error('Failed to delete VAT treatment');
    }
  }

  static exists(id: string): boolean {
    return this.getById(id) !== undefined;
  }

  static codeExists(code: string, excludeId?: string): boolean {
    const treatments = this.getAll();
    return treatments.some(treatment => 
      treatment.code === code && treatment.id !== excludeId
    );
  }

  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing VAT treatments from localStorage:', error);
      throw new Error('Failed to clear VAT treatments');
    }
  }

  static count(): number {
    return this.getAll().length;
  }

  static getByCategory(category: string): VATTreatment[] {
    return this.getAll().filter(treatment => treatment.category === category);
  }

  static getByApplicability(applicability: string): VATTreatment[] {
    return this.getAll().filter(treatment => 
      treatment.applicability.includes(applicability as any)
    );
  }

  static getDefaults(): VATTreatment[] {
    return this.getAll().filter(treatment => treatment.isDefault);
  }

  static getNonDefaults(): VATTreatment[] {
    return this.getAll().filter(treatment => !treatment.isDefault);
  }

  static backup(): string {
    return JSON.stringify(this.getAll());
  }

  static restore(backupData: string): void {
    try {
      const treatments = JSON.parse(backupData);
      if (Array.isArray(treatments)) {
        this.saveAll(treatments);
      } else {
        throw new Error('Invalid backup data format');
      }
    } catch (error) {
      console.error('Error restoring VAT treatments from backup:', error);
      throw new Error('Failed to restore VAT treatments from backup');
    }
  }

  static search(searchTerm: string): VATTreatment[] {
    if (!searchTerm.trim()) {
      return this.getAll();
    }
    
    const term = searchTerm.toLowerCase();
    return this.getAll().filter(treatment =>
      treatment.name.toLowerCase().includes(term) ||
      treatment.code.toLowerCase().includes(term) ||
      treatment.description.toLowerCase().includes(term) ||
      treatment.category.toLowerCase().includes(term)
    );
  }

  static getStats() {
    const treatments = this.getAll();
    const stats = {
      total: treatments.length,
      active: treatments.filter(t => t.isActive).length,
      inactive: treatments.filter(t => !t.isActive).length,
      byCategory: {} as Record<string, number>,
      byRate: {} as Record<string, number>
    };

    treatments.forEach(treatment => {
      // Count by category
      stats.byCategory[treatment.category] = (stats.byCategory[treatment.category] || 0) + 1;
      
      // Count by rate ranges
      const rateRange = treatment.rate === 0 ? '0%' : 
                       treatment.rate < 10 ? '1-9%' :
                       treatment.rate < 20 ? '10-19%' : '20%+';
      stats.byRate[rateRange] = (stats.byRate[rateRange] || 0) + 1;
    });

    return stats;
  }
}