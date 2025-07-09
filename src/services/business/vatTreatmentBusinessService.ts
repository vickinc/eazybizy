import { 
  VATTreatment, 
  VATTreatmentFormData, 
  VATTreatmentStats,
  VATTreatmentFilter,
  TableSortConfig,
  DEFAULT_VAT_TREATMENTS,
  VATCategory,
  VATApplicability
} from '@/types/vatTreatment.types';
import { VATTreatmentStorageService } from '@/services/storage/vatTreatmentStorageService';

export class VATTreatmentBusinessService {
  
  static generateId(): string {
    return `vat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static initializeDefaultTreatments(): VATTreatment[] {
    // Check if treatments already exist
    const existingCount = VATTreatmentStorageService.count();
    if (existingCount > 0) {
      return VATTreatmentStorageService.getAll();
    }

    // Create default treatments
    const now = new Date().toISOString();
    const treatments: VATTreatment[] = DEFAULT_VAT_TREATMENTS.map(template => ({
      ...template,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    }));

    // Save to storage
    VATTreatmentStorageService.saveAll(treatments);
    return treatments;
  }

  static createTreatment(formData: VATTreatmentFormData): VATTreatment {
    const now = new Date().toISOString();
    const treatment: VATTreatment = {
      id: this.generateId(),
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      rate: parseFloat(formData.rate) || 0,
      isActive: formData.isActive,
      category: formData.category,
      applicability: formData.applicability,
      isDefault: false, // User-created treatments are never default
      createdAt: now,
      updatedAt: now
    };

    return VATTreatmentStorageService.save(treatment);
  }

  static updateTreatment(id: string, formData: VATTreatmentFormData): VATTreatment {
    const existing = VATTreatmentStorageService.getById(id);
    if (!existing) {
      throw new Error('VAT treatment not found');
    }

    const updatedTreatment: VATTreatment = {
      ...existing,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      rate: parseFloat(formData.rate) || 0,
      isActive: formData.isActive,
      category: formData.category,
      applicability: formData.applicability,
      updatedAt: new Date().toISOString()
    };

    return VATTreatmentStorageService.save(updatedTreatment);
  }

  static deleteTreatment(id: string): boolean {
    const treatment = VATTreatmentStorageService.getById(id);
    if (!treatment) {
      throw new Error('VAT treatment not found');
    }

    // Prevent deletion of default treatments
    if (treatment.isDefault) {
      throw new Error('Cannot delete default VAT treatments');
    }

    // TODO: Check if treatment is in use by Chart of Accounts
    // This will be implemented when we integrate with Chart of Accounts

    return VATTreatmentStorageService.delete(id);
  }

  static toggleActive(id: string): VATTreatment {
    const treatment = VATTreatmentStorageService.getById(id);
    if (!treatment) {
      throw new Error('VAT treatment not found');
    }

    const updatedTreatment: VATTreatment = {
      ...treatment,
      isActive: !treatment.isActive,
      updatedAt: new Date().toISOString()
    };

    return VATTreatmentStorageService.save(updatedTreatment);
  }

  static getStats(): VATTreatmentStats {
    const treatments = VATTreatmentStorageService.getAll();
    
    const stats: VATTreatmentStats = {
      total: treatments.length,
      active: treatments.filter(t => t.isActive).length,
      inactive: treatments.filter(t => !t.isActive).length,
      byCategory: {
        standard: 0,
        reduced: 0,
        exempt: 0,
        special: 0,
        acquisition: 0,
        margin: 0,
        property: 0
      }
    };

    treatments.forEach(treatment => {
      stats.byCategory[treatment.category]++;
    });

    return stats;
  }

  static filterTreatments(treatments: VATTreatment[], filter: VATTreatmentFilter): VATTreatment[] {
    return treatments.filter(treatment => {
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch = 
          treatment.name.toLowerCase().includes(searchLower) ||
          treatment.code.toLowerCase().includes(searchLower) ||
          treatment.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filter.category !== 'all' && treatment.category !== filter.category) {
        return false;
      }

      // Active status filter
      if (filter.isActive !== 'all' && treatment.isActive !== filter.isActive) {
        return false;
      }

      // Applicability filter
      if (filter.applicability !== 'all' && !treatment.applicability.includes(filter.applicability)) {
        return false;
      }

      // Rate range filter
      if (treatment.rate < filter.rateRange.min || treatment.rate > filter.rateRange.max) {
        return false;
      }

      return true;
    });
  }

  static sortTreatments(treatments: VATTreatment[], sortConfig: TableSortConfig): VATTreatment[] {
    return [...treatments].sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      switch (sortConfig.field) {
        case 'code':
          aValue = a.code;
          bValue = b.code;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'rate':
          aValue = a.rate;
          bValue = b.rate;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  static formatRate(rate: number): string {
    return `${rate}%`;
  }

  static formatApplicability(applicability: VATApplicability[]): string {
    return applicability.map(app => 
      app.charAt(0).toUpperCase() + app.slice(1)
    ).join(', ');
  }

  static formatCategory(category: VATCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  static validateCode(code: string, excludeId?: string): string | null {
    if (!code || !code.trim()) {
      return 'Code is required';
    }

    const trimmedCode = code.trim().toUpperCase();
    
    if (trimmedCode.length < 2) {
      return 'Code must be at least 2 characters long';
    }

    if (trimmedCode.length > 20) {
      return 'Code must be no more than 20 characters long';
    }

    if (!/^[A-Z0-9_]+$/.test(trimmedCode)) {
      return 'Code can only contain letters, numbers, and underscores';
    }

    if (VATTreatmentStorageService.codeExists(trimmedCode, excludeId)) {
      return 'Code already exists';
    }

    return null;
  }

  static validateName(name: string): string | null {
    if (!name || !name.trim()) {
      return 'Name is required';
    }

    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters long';
    }

    if (name.trim().length > 100) {
      return 'Name must be no more than 100 characters long';
    }

    return null;
  }

  static validateRate(rate: string): string | null {
    if (!rate || !rate.trim()) {
      return 'Rate is required';
    }

    const numericRate = parseFloat(rate);
    
    if (isNaN(numericRate)) {
      return 'Rate must be a valid number';
    }

    if (numericRate < 0) {
      return 'Rate cannot be negative';
    }

    if (numericRate > 100) {
      return 'Rate cannot exceed 100%';
    }

    // Allow up to 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(rate)) {
      return 'Rate can have at most 2 decimal places';
    }

    return null;
  }

  static validateDescription(description: string): string | null {
    if (!description || !description.trim()) {
      return 'Description is required';
    }

    if (description.trim().length < 5) {
      return 'Description must be at least 5 characters long';
    }

    if (description.trim().length > 500) {
      return 'Description must be no more than 500 characters long';
    }

    return null;
  }

  static exportToCSV(): string {
    const treatments = VATTreatmentStorageService.getAll();
    const headers = ['Code', 'Name', 'Description', 'Rate (%)', 'Category', 'Applicability', 'Status', 'Is Default', 'Created At'];
    
    const rows = treatments.map(treatment => [
      treatment.code,
      treatment.name,
      treatment.description,
      treatment.rate.toString(),
      this.formatCategory(treatment.category),
      this.formatApplicability(treatment.applicability),
      treatment.isActive ? 'Active' : 'Inactive',
      treatment.isDefault ? 'Yes' : 'No',
      new Date(treatment.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  static searchTreatments(searchTerm: string): VATTreatment[] {
    return VATTreatmentStorageService.search(searchTerm);
  }

  static getTreatmentsByCategory(category: VATCategory): VATTreatment[] {
    return VATTreatmentStorageService.getByCategory(category);
  }

  static getTreatmentsByApplicability(applicability: VATApplicability): VATTreatment[] {
    return VATTreatmentStorageService.getByApplicability(applicability);
  }

  static getActiveTreatments(): VATTreatment[] {
    return VATTreatmentStorageService.getActive();
  }

  static getAllTreatments(): VATTreatment[] {
    return VATTreatmentStorageService.getAll();
  }

  static getTreatmentById(id: string): VATTreatment | undefined {
    return VATTreatmentStorageService.getById(id);
  }

  static getTreatmentByCode(code: string): VATTreatment | undefined {
    return VATTreatmentStorageService.getByCode(code);
  }

  static resetToDefaults(): VATTreatment[] {
    // Clear existing treatments
    VATTreatmentStorageService.clear();
    
    // Reinitialize with defaults
    return this.initializeDefaultTreatments();
  }
}