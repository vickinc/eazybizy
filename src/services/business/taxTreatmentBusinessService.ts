import { 
  TaxTreatment, 
  TaxTreatmentFormData, 
  TaxTreatmentStats,
  TaxTreatmentFilter,
  TaxTreatmentTableSortConfig,
  DEFAULT_TAX_TREATMENTS,
  TaxCategory,
  TaxApplicability
} from '@/types/taxTreatment.types';
import { TaxTreatmentStorageService } from '@/services/storage/taxTreatmentStorageService';

export class TaxTreatmentBusinessService {
  
  static generateId(): string {
    return `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static initializeDefaultTreatments(): TaxTreatment[] {
    // Check if treatments already exist
    const existing = TaxTreatmentStorageService.getAllTreatments();
    if (existing.length > 0) {
      return existing; // Return existing treatments instead of overwriting
    }

    // Create default treatments with generated IDs and timestamps
    const defaultTreatments: TaxTreatment[] = DEFAULT_TAX_TREATMENTS.map(treatment => ({
      ...treatment,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Save to storage
    TaxTreatmentStorageService.saveTreatments(defaultTreatments);
    
    return defaultTreatments;
  }

  static resetToDefaults(): TaxTreatment[] {
    // Clear existing treatments
    TaxTreatmentStorageService.clearTreatments();
    
    // Initialize defaults
    return this.initializeDefaultTreatments();
  }

  static getAllTreatments(): TaxTreatment[] {
    return TaxTreatmentStorageService.getAllTreatments();
  }

  static getTreatmentById(id: string): TaxTreatment | null {
    return TaxTreatmentStorageService.getTreatmentById(id);
  }

  static createTreatment(formData: TaxTreatmentFormData): TaxTreatment {
    const now = new Date().toISOString();
    const newTreatment: TaxTreatment = {
      id: this.generateId(),
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      rate: parseFloat(formData.rate),
      category: formData.category,
      applicability: formData.applicability,
      isActive: formData.isActive,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    const treatments = this.getAllTreatments();
    treatments.push(newTreatment);
    TaxTreatmentStorageService.saveTreatments(treatments);
    
    return newTreatment;
  }

  static updateTreatment(id: string, formData: TaxTreatmentFormData): TaxTreatment {
    const treatments = this.getAllTreatments();
    const index = treatments.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Tax treatment not found');
    }

    const existingTreatment = treatments[index];
    const updatedTreatment: TaxTreatment = {
      ...existingTreatment,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      rate: parseFloat(formData.rate),
      category: formData.category,
      applicability: formData.applicability,
      isActive: formData.isActive,
      updatedAt: new Date().toISOString(),
    };

    treatments[index] = updatedTreatment;
    TaxTreatmentStorageService.saveTreatments(treatments);
    
    return updatedTreatment;
  }

  static deleteTreatment(id: string): boolean {
    const treatments = this.getAllTreatments();
    const filteredTreatments = treatments.filter(t => t.id !== id);
    
    if (filteredTreatments.length === treatments.length) {
      return false; // Treatment not found
    }

    TaxTreatmentStorageService.saveTreatments(filteredTreatments);
    return true;
  }

  static toggleActive(id: string): TaxTreatment {
    const treatments = this.getAllTreatments();
    const index = treatments.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Tax treatment not found');
    }

    treatments[index] = {
      ...treatments[index],
      isActive: !treatments[index].isActive,
      updatedAt: new Date().toISOString(),
    };

    TaxTreatmentStorageService.saveTreatments(treatments);
    return treatments[index];
  }

  static getStats(): TaxTreatmentStats {
    const treatments = this.getAllTreatments();
    const total = treatments.length;
    const active = treatments.filter(t => t.isActive).length;
    const inactive = total - active;

    // Calculate by category
    const byCategory: { [key in TaxCategory]: number } = {
      standard: 0,
      reduced: 0,
      exempt: 0,
      special: 0,
      acquisition: 0,
      margin: 0,
      property: 0
    };

    treatments.forEach(treatment => {
      byCategory[treatment.category] = (byCategory[treatment.category] || 0) + 1;
    });

    return {
      total,
      active,
      inactive,
      byCategory
    };
  }

  static filterTreatments(treatments: TaxTreatment[], filter: TaxTreatmentFilter): TaxTreatment[] {
    return treatments.filter(treatment => {
      // Search filter
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const matchesSearch = 
          treatment.name.toLowerCase().includes(searchTerm) ||
          treatment.code.toLowerCase().includes(searchTerm) ||
          treatment.description.toLowerCase().includes(searchTerm) ||
          treatment.category.toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filter.category !== 'all' && treatment.category !== filter.category) {
        return false;
      }

      // Active filter
      if (filter.isActive !== 'all' && treatment.isActive !== filter.isActive) {
        return false;
      }

      // Applicability filter
      if (filter.applicability !== 'all') {
        const hasApplicability = treatment.applicability.includes(filter.applicability as TaxApplicability);
        if (!hasApplicability) return false;
      }

      // Rate range filter
      if (treatment.rate < filter.rateRange.min || treatment.rate > filter.rateRange.max) {
        return false;
      }

      return true;
    });
  }

  static sortTreatments(treatments: TaxTreatment[], sortConfig: TaxTreatmentTableSortConfig): TaxTreatment[] {
    return [...treatments].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  static exportToCSV(treatments?: TaxTreatment[]): string {
    const data = treatments || this.getAllTreatments();
    
    // CSV headers
    const headers = [
      'Code',
      'Name', 
      'Description',
      'Rate',
      'Category',
      'Applicability',
      'Active',
      'Default',
      'Created',
      'Updated'
    ];

    // CSV rows
    const rows = data.map(treatment => [
      treatment.code,
      treatment.name,
      treatment.description,
      treatment.rate.toString(),
      treatment.category,
      treatment.applicability.join(';'),
      treatment.isActive ? 'Yes' : 'No',
      treatment.isDefault ? 'Yes' : 'No',
      new Date(treatment.createdAt).toLocaleDateString(),
      new Date(treatment.updatedAt).toLocaleDateString()
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  static getDefaultTreatments(): Omit<TaxTreatment, 'id' | 'createdAt' | 'updatedAt'>[] {
    return DEFAULT_TAX_TREATMENTS;
  }

  // Utility methods for validation
  static isCodeUnique(code: string, excludeId?: string): boolean {
    const treatments = this.getAllTreatments();
    const normalizedCode = code.trim().toUpperCase();
    
    return !treatments.some(treatment => 
      treatment.code === normalizedCode && treatment.id !== excludeId
    );
  }

  static validateRate(rate: string): { isValid: boolean; numericRate?: number } {
    const numericRate = parseFloat(rate);
    
    if (isNaN(numericRate)) {
      return { isValid: false };
    }

    if (numericRate < 0 || numericRate > 100) {
      return { isValid: false };
    }

    return { isValid: true, numericRate };
  }

  // Search utilities
  static searchTreatments(searchTerm: string): TaxTreatment[] {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const treatments = this.getAllTreatments();
    return treatments.filter(treatment => {
      const term = searchTerm.toLowerCase();
      return (
        treatment.name.toLowerCase().includes(term) ||
        treatment.code.toLowerCase().includes(term) ||
        treatment.description.toLowerCase().includes(term) ||
        treatment.category.toLowerCase().includes(term)
      );
    });
  }

  static getTreatmentsByCategory(category: TaxCategory): TaxTreatment[] {
    return this.getAllTreatments().filter(treatment => treatment.category === category);
  }

  static getTreatmentsByApplicability(applicability: TaxApplicability): TaxTreatment[] {
    return this.getAllTreatments().filter(treatment => 
      treatment.applicability.includes(applicability)
    );
  }

  static getActiveTreatments(): TaxTreatment[] {
    return this.getAllTreatments().filter(treatment => treatment.isActive);
  }

  static getDefaultOnlyTreatments(): TaxTreatment[] {
    return this.getAllTreatments().filter(treatment => treatment.isDefault);
  }

  static getTreatmentsByRateRange(minRate: number, maxRate: number): TaxTreatment[] {
    return this.getAllTreatments().filter(treatment => 
      treatment.rate >= minRate && treatment.rate <= maxRate
    );
  }
}