import { 
  VATTreatmentFormData, 
  VATCategory, 
  VATApplicability,
  VAT_CATEGORIES,
  VAT_APPLICABILITIES
} from '@/types/vatTreatment.types';
import { VATTreatmentBusinessService } from './vatTreatmentBusinessService';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: keyof VATTreatmentFormData;
  message: string;
}

export class VATTreatmentValidationService {
  
  static validateFormData(formData: VATTreatmentFormData, excludeId?: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate code
    const codeError = VATTreatmentBusinessService.validateCode(formData.code, excludeId);
    if (codeError) {
      errors.push({ field: 'code', message: codeError });
    }

    // Validate name
    const nameError = VATTreatmentBusinessService.validateName(formData.name);
    if (nameError) {
      errors.push({ field: 'name', message: nameError });
    }

    // Validate description
    const descriptionError = VATTreatmentBusinessService.validateDescription(formData.description);
    if (descriptionError) {
      errors.push({ field: 'description', message: descriptionError });
    }

    // Validate rate
    const rateError = VATTreatmentBusinessService.validateRate(formData.rate);
    if (rateError) {
      errors.push({ field: 'rate', message: rateError });
    }

    // Validate category
    const categoryError = this.validateCategory(formData.category);
    if (categoryError) {
      errors.push({ field: 'category', message: categoryError });
    }

    // Validate applicability
    const applicabilityError = this.validateApplicability(formData.applicability);
    if (applicabilityError) {
      errors.push({ field: 'applicability', message: applicabilityError });
    }

    // Business rule validations
    const businessRuleErrors = this.validateBusinessRules(formData);
    errors.push(...businessRuleErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateCategory(category: VATCategory): string | null {
    if (!category) {
      return 'Category is required';
    }

    if (!VAT_CATEGORIES.includes(category)) {
      return 'Invalid category selected';
    }

    return null;
  }

  static validateApplicability(applicability: VATApplicability[]): string | null {
    if (!applicability || applicability.length === 0) {
      return 'At least one applicability option must be selected';
    }

    const invalidApplicabilities = applicability.filter(app => !VAT_APPLICABILITIES.includes(app));
    if (invalidApplicabilities.length > 0) {
      return `Invalid applicability options: ${invalidApplicabilities.join(', ')}`;
    }

    // Maximum 6 applicabilities allowed
    if (applicability.length > VAT_APPLICABILITIES.length) {
      return 'Too many applicability options selected';
    }

    return null;
  }

  static validateBusinessRules(formData: VATTreatmentFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    // Business Rule 1: Exempt categories should have 0% rate
    if ((formData.category === 'exempt') && parseFloat(formData.rate) > 0) {
      errors.push({
        field: 'rate',
        message: 'Exempt VAT treatments must have a 0% rate'
      });
    }

    // Business Rule 2: Standard category should have rate > 0
    if (formData.category === 'standard' && parseFloat(formData.rate) === 0) {
      errors.push({
        field: 'rate',
        message: 'Standard VAT treatments must have a rate greater than 0%'
      });
    }

    // Business Rule 3: Reduced category should have reasonable rate
    if (formData.category === 'reduced') {
      const rate = parseFloat(formData.rate);
      if (rate === 0 || rate >= 20) {
        errors.push({
          field: 'rate',
          message: 'Reduced VAT rates should typically be between 1% and 19%'
        });
      }
    }

    // Business Rule 4: Asset applicability validation
    if (formData.applicability.includes('assets') && !['acquisition', 'standard', 'reduced'].includes(formData.category)) {
      errors.push({
        field: 'applicability',
        message: 'Asset applicability is typically used with acquisition, standard, or reduced categories'
      });
    }

    // Business Rule 5: Export applicability should typically be exempt
    if (formData.applicability.includes('export') && formData.category !== 'exempt' && parseFloat(formData.rate) > 0) {
      errors.push({
        field: 'category',
        message: 'Export transactions are typically exempt from VAT'
      });
    }

    // Business Rule 6: Import applicability validation
    if (formData.applicability.includes('import') && formData.category === 'exempt') {
      errors.push({
        field: 'category',
        message: 'Import transactions typically require VAT payment'
      });
    }

    // Business Rule 7: Margin scheme validation
    if (formData.category === 'margin' && !formData.applicability.includes('sales')) {
      errors.push({
        field: 'applicability',
        message: 'Margin scheme treatments typically apply to sales'
      });
    }

    // Business Rule 8: Property category validation
    if (formData.category === 'property') {
      const hasValidApplicability = formData.applicability.some(app => ['sales', 'purchases', 'assets'].includes(app));
      if (!hasValidApplicability) {
        errors.push({
          field: 'applicability',
          message: 'Property VAT treatments should apply to sales, purchases, or assets'
        });
      }
    }

    return errors;
  }

  static validateForDeletion(treatmentId: string): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Check if treatment exists
    const treatment = VATTreatmentBusinessService.getTreatmentById(treatmentId);
    if (!treatment) {
      return {
        isValid: false,
        errors: [{ field: 'code' as keyof VATTreatmentFormData, message: 'VAT treatment not found' }]
      };
    }

    // Check if it's a default treatment
    if (treatment.isDefault) {
      errors.push({
        field: 'code' as keyof VATTreatmentFormData,
        message: 'Cannot delete default VAT treatments'
      });
    }

    // TODO: Add check for usage in Chart of Accounts when integration is complete
    // const isInUse = ChartOfAccountsBusinessService.isVATTreatmentInUse(treatmentId);
    // if (isInUse) {
    //   errors.push({
    //     field: 'code' as keyof VATTreatmentFormData,
    //     message: 'Cannot delete VAT treatment that is in use by Chart of Accounts'
    //   });
    // }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateBulkOperation(treatmentIds: string[], operation: 'delete' | 'activate' | 'deactivate'): ValidationResult {
    const errors: ValidationError[] = [];

    if (!treatmentIds || treatmentIds.length === 0) {
      return {
        isValid: false,
        errors: [{ field: 'code' as keyof VATTreatmentFormData, message: 'No treatments selected for operation' }]
      };
    }

    // Validate each treatment
    for (const id of treatmentIds) {
      const treatment = VATTreatmentBusinessService.getTreatmentById(id);
      if (!treatment) {
        errors.push({
          field: 'code' as keyof VATTreatmentFormData,
          message: `Treatment with ID ${id} not found`
        });
        continue;
      }

      // Operation-specific validations
      switch (operation) {
        case 'delete':
          if (treatment.isDefault) {
            errors.push({
              field: 'code' as keyof VATTreatmentFormData,
              message: `Cannot delete default treatment: ${treatment.name}`
            });
          }
          break;

        case 'deactivate':
          if (treatment.isDefault && treatment.isActive) {
            errors.push({
              field: 'code' as keyof VATTreatmentFormData,
              message: `Cannot deactivate default treatment: ${treatment.name}`
            });
          }
          break;
      }
    }

    // Check if trying to deactivate all active treatments
    if (operation === 'deactivate') {
      const allTreatments = VATTreatmentBusinessService.getAllTreatments();
      const activeTreatments = allTreatments.filter(t => t.isActive);
      const treatmentsToDeactivate = activeTreatments.filter(t => treatmentIds.includes(t.id));
      
      if (treatmentsToDeactivate.length === activeTreatments.length) {
        errors.push({
          field: 'code' as keyof VATTreatmentFormData,
          message: 'Cannot deactivate all VAT treatments. At least one must remain active.'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static getFieldValidationMessage(field: keyof VATTreatmentFormData, errors: ValidationError[]): string | undefined {
    const fieldError = errors.find(error => error.field === field);
    return fieldError?.message;
  }

  static hasFieldError(field: keyof VATTreatmentFormData, errors: ValidationError[]): boolean {
    return errors.some(error => error.field === field);
  }

  static getErrorSummary(errors: ValidationError[]): string {
    if (errors.length === 0) return '';
    if (errors.length === 1) return errors[0].message;
    return `${errors.length} validation errors found. Please check the form fields.`;
  }

  static validateImportData(importData: any[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (!Array.isArray(importData)) {
      return {
        isValid: false,
        errors: [{ field: 'code' as keyof VATTreatmentFormData, message: 'Import data must be an array' }]
      };
    }

    if (importData.length === 0) {
      return {
        isValid: false,
        errors: [{ field: 'code' as keyof VATTreatmentFormData, message: 'Import data cannot be empty' }]
      };
    }

    // Validate each item
    importData.forEach((item, index) => {
      if (!item.code) {
        errors.push({
          field: 'code' as keyof VATTreatmentFormData,
          message: `Row ${index + 1}: Code is required`
        });
      }

      if (!item.name) {
        errors.push({
          field: 'name' as keyof VATTreatmentFormData,
          message: `Row ${index + 1}: Name is required`
        });
      }

      if (item.rate === undefined || item.rate === null) {
        errors.push({
          field: 'rate' as keyof VATTreatmentFormData,
          message: `Row ${index + 1}: Rate is required`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}