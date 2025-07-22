import { TaxTreatment } from '@/types/taxTreatment.types';

const STORAGE_KEY = 'eazybizy_tax_treatments';

export class TaxTreatmentStorageService {
  
  static saveTreatments(treatments: TaxTreatment[]): void {
    try {
      const data = JSON.stringify(treatments);
      localStorage.setItem(STORAGE_KEY, data);
    } catch (error) {
      console.error('Failed to save tax treatments to localStorage:', error);
      throw new Error('Failed to save tax treatments');
    }
  }

  static getAllTreatments(): TaxTreatment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }
      
      const treatments = JSON.parse(data);
      
      // Validate that the data is an array
      if (!Array.isArray(treatments)) {
        console.warn('Invalid tax treatments data in localStorage, returning empty array');
        return [];
      }
      
      return treatments;
    } catch (error) {
      console.error('Failed to load tax treatments from localStorage:', error);
      return [];
    }
  }

  static getTreatmentById(id: string): TaxTreatment | null {
    const treatments = this.getAllTreatments();
    return treatments.find(treatment => treatment.id === id) || null;
  }

  static clearTreatments(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear tax treatments from localStorage:', error);
    }
  }

  static updateTreatment(updatedTreatment: TaxTreatment): boolean {
    try {
      const treatments = this.getAllTreatments();
      const index = treatments.findIndex(t => t.id === updatedTreatment.id);
      
      if (index === -1) {
        return false;
      }
      
      treatments[index] = updatedTreatment;
      this.saveTreatments(treatments);
      return true;
    } catch (error) {
      console.error('Failed to update tax treatment:', error);
      return false;
    }
  }

  static deleteTreatment(id: string): boolean {
    try {
      const treatments = this.getAllTreatments();
      const filteredTreatments = treatments.filter(t => t.id !== id);
      
      if (filteredTreatments.length === treatments.length) {
        return false; // Treatment not found
      }
      
      this.saveTreatments(filteredTreatments);
      return true;
    } catch (error) {
      console.error('Failed to delete tax treatment:', error);
      return false;
    }
  }

  static addTreatment(treatment: TaxTreatment): boolean {
    try {
      const treatments = this.getAllTreatments();
      
      // Check if treatment with same ID already exists
      if (treatments.some(t => t.id === treatment.id)) {
        return false;
      }
      
      treatments.push(treatment);
      this.saveTreatments(treatments);
      return true;
    } catch (error) {
      console.error('Failed to add tax treatment:', error);
      return false;
    }
  }

  // Utility method to check if localStorage is available
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

  // Get storage info (for debugging)
  static getStorageInfo(): { 
    isAvailable: boolean; 
    treatmentCount: number; 
    storageSize: number; 
    storageKey: string; 
  } {
    const isAvailable = this.isLocalStorageAvailable();
    const treatments = isAvailable ? this.getAllTreatments() : [];
    const data = isAvailable ? localStorage.getItem(STORAGE_KEY) || '' : '';
    
    return {
      isAvailable,
      treatmentCount: treatments.length,
      storageSize: data.length,
      storageKey: STORAGE_KEY,
    };
  }

  // Export treatments as JSON string (for backup/migration)
  static exportTreatments(): string {
    const treatments = this.getAllTreatments();
    return JSON.stringify(treatments, null, 2);
  }

  // Import treatments from JSON string (for backup/migration)
  static importTreatments(jsonData: string, overwrite: boolean = false): boolean {
    try {
      const treatments = JSON.parse(jsonData);
      
      if (!Array.isArray(treatments)) {
        throw new Error('Invalid data format: expected array');
      }
      
      // Basic validation of treatment structure
      const isValidStructure = treatments.every(treatment => 
        typeof treatment === 'object' && 
        treatment.id && 
        treatment.code && 
        treatment.name &&
        typeof treatment.rate === 'number'
      );
      
      if (!isValidStructure) {
        throw new Error('Invalid treatment structure');
      }
      
      if (overwrite) {
        this.saveTreatments(treatments);
      } else {
        const existingTreatments = this.getAllTreatments();
        const existingIds = new Set(existingTreatments.map(t => t.id));
        
        // Only import treatments that don't already exist
        const newTreatments = treatments.filter((t: TaxTreatment) => !existingIds.has(t.id));
        const allTreatments = [...existingTreatments, ...newTreatments];
        
        this.saveTreatments(allTreatments);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import tax treatments:', error);
      return false;
    }
  }
}