import { TaxTreatmentFormData } from '@/types/taxTreatment.types';
import { TaxTreatmentBusinessService } from './taxTreatmentBusinessService';

export interface ValidationError {
  field: keyof TaxTreatmentFormData;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class TaxTreatmentValidationService {
  
  static validateFormData(formData: TaxTreatmentFormData, excludeId?: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate code
    const codeErrors = this.validateCode(formData.code, excludeId);
    errors.push(...codeErrors);

    // Validate name
    const nameErrors = this.validateName(formData.name);
    errors.push(...nameErrors);

    // Validate description
    const descriptionErrors = this.validateDescription(formData.description);
    errors.push(...descriptionErrors);

    // Validate rate
    const rateErrors = this.validateRate(formData.rate);
    errors.push(...rateErrors);

    // Validate category
    const categoryErrors = this.validateCategory(formData.category);
    errors.push(...categoryErrors);

    // Validate applicability
    const applicabilityErrors = this.validateApplicability(formData.applicability);
    errors.push(...applicabilityErrors);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateCode(code: string, excludeId?: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!code || code.trim().length === 0) {
      errors.push({
        field: 'code',
        message: 'Tax treatment code is required',
        code: 'CODE_REQUIRED'
      });
      return errors;
    }

    const trimmedCode = code.trim();

    if (trimmedCode.length < 2) {
      errors.push({
        field: 'code',
        message: 'Tax treatment code must be at least 2 characters long',
        code: 'CODE_TOO_SHORT'
      });
    }

    if (trimmedCode.length > 20) {
      errors.push({
        field: 'code',
        message: 'Tax treatment code must be no more than 20 characters long',
        code: 'CODE_TOO_LONG'
      });
    }

    // Check for valid characters (alphanumeric and underscore only)
    if (!/^[A-Za-z0-9_]+$/.test(trimmedCode)) {
      errors.push({
        field: 'code',
        message: 'Tax treatment code can only contain letters, numbers, and underscores',
        code: 'CODE_INVALID_CHARACTERS'
      });
    }

    // Check uniqueness
    if (!TaxTreatmentBusinessService.isCodeUnique(trimmedCode, excludeId)) {
      errors.push({
        field: 'code',
        message: 'Tax treatment code already exists',
        code: 'CODE_DUPLICATE'
      });
    }

    return errors;
  }

  static validateName(name: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!name || name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Tax treatment name is required',
        code: 'NAME_REQUIRED'
      });
      return errors;
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
      errors.push({
        field: 'name',
        message: 'Tax treatment name must be at least 3 characters long',
        code: 'NAME_TOO_SHORT'
      });
    }

    if (trimmedName.length > 100) {
      errors.push({
        field: 'name',
        message: 'Tax treatment name must be no more than 100 characters long',
        code: 'NAME_TOO_LONG'
      });
    }

    return errors;
  }

  static validateDescription(description: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!description || description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Tax treatment description is required',
        code: 'DESCRIPTION_REQUIRED'
      });
      return errors;
    }

    const trimmedDescription = description.trim();

    if (trimmedDescription.length < 10) {
      errors.push({
        field: 'description',
        message: 'Tax treatment description must be at least 10 characters long',
        code: 'DESCRIPTION_TOO_SHORT'
      });
    }

    if (trimmedDescription.length > 500) {
      errors.push({
        field: 'description',
        message: 'Tax treatment description must be no more than 500 characters long',
        code: 'DESCRIPTION_TOO_LONG'
      });
    }

    return errors;
  }

  static validateRate(rate: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!rate || rate.trim().length === 0) {
      errors.push({
        field: 'rate',
        message: 'Tax rate is required',
        code: 'RATE_REQUIRED'
      });
      return errors;
    }

    const validation = TaxTreatmentBusinessService.validateRate(rate);
    
    if (!validation.isValid) {
      errors.push({
        field: 'rate',
        message: 'Tax rate must be a valid number between 0 and 100',
        code: 'RATE_INVALID'
      });
    }

    return errors;
  }

  static validateCategory(category: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!category || category.trim().length === 0) {
      errors.push({
        field: 'category',
        message: 'Tax category is required',
        code: 'CATEGORY_REQUIRED'
      });
      return errors;
    }

    const validCategories = ['standard', 'reduced', 'exempt', 'special', 'acquisition', 'margin', 'property'];
    
    if (!validCategories.includes(category)) {
      errors.push({
        field: 'category',
        message: 'Invalid tax category selected',
        code: 'CATEGORY_INVALID'
      });
    }

    return errors;
  }

  static validateApplicability(applicability: string[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!applicability || applicability.length === 0) {
      errors.push({
        field: 'applicability',
        message: 'At least one applicability option must be selected',
        code: 'APPLICABILITY_REQUIRED'
      });
      return errors;
    }

    const validApplicabilities = ['sales', 'purchases', 'assets', 'services', 'import', 'export'];
    
    const invalidApplicabilities = applicability.filter(app => !validApplicabilities.includes(app));
    
    if (invalidApplicabilities.length > 0) {
      errors.push({
        field: 'applicability',
        message: `Invalid applicability options: ${invalidApplicabilities.join(', ')}`,
        code: 'APPLICABILITY_INVALID'
      });
    }

    return errors;
  }

  static validateForDeletion(treatmentId: string): ValidationResult {
    const errors: ValidationError[] = [];
    
    const treatment = TaxTreatmentBusinessService.getTreatmentById(treatmentId);
    
    if (!treatment) {
      errors.push({
        field: 'code' as keyof TaxTreatmentFormData,
        message: 'Tax treatment not found',
        code: 'TREATMENT_NOT_FOUND'
      });
      return { isValid: false, errors };
    }

    // Check if this is a default treatment
    if (treatment.isDefault) {
      errors.push({
        field: 'code' as keyof TaxTreatmentFormData,
        message: 'Cannot delete default tax treatments',
        code: 'CANNOT_DELETE_DEFAULT'
      });
    }

    // TODO: Add checks for relationships (transactions, accounts, etc.)
    // This would require additional business logic to check if the treatment is in use

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Utility method to get validation message for a specific field
  static getFieldValidationMessage(field: keyof TaxTreatmentFormData, errors: ValidationError[]): string | undefined {
    const fieldError = errors.find(error => error.field === field);
    return fieldError?.message;
  }

  // Utility method to check if a field has errors
  static hasFieldError(field: keyof TaxTreatmentFormData, errors: ValidationError[]): boolean {
    return errors.some(error => error.field === field);
  }

  // Validate individual field (useful for real-time validation)
  static validateField(field: keyof TaxTreatmentFormData, value: any, formData?: Partial<TaxTreatmentFormData>, excludeId?: string): ValidationError[] {
    switch (field) {
      case 'code':
        return this.validateCode(value as string, excludeId);
      case 'name':
        return this.validateName(value as string);
      case 'description':
        return this.validateDescription(value as string);
      case 'rate':
        return this.validateRate(value as string);
      case 'category':
        return this.validateCategory(value as string);
      case 'applicability':
        return this.validateApplicability(value as string[]);
      default:
        return [];
    }
  }

  // Quick validation method used by the management hook
  static validateForm(formData: TaxTreatmentFormData, excludeId?: string): ValidationError[] {
    const result = this.validateFormData(formData, excludeId);
    return result.errors;
  }

  // Get all possible validation error codes for documentation/testing
  static getValidationErrorCodes(): string[] {
    return [
      'CODE_REQUIRED',
      'CODE_TOO_SHORT',
      'CODE_TOO_LONG',
      'CODE_INVALID_CHARACTERS',
      'CODE_DUPLICATE',
      'NAME_REQUIRED',
      'NAME_TOO_SHORT',
      'NAME_TOO_LONG',
      'DESCRIPTION_REQUIRED',
      'DESCRIPTION_TOO_SHORT',
      'DESCRIPTION_TOO_LONG',
      'RATE_REQUIRED',
      'RATE_INVALID',
      'CATEGORY_REQUIRED',
      'CATEGORY_INVALID',
      'APPLICABILITY_REQUIRED',
      'APPLICABILITY_INVALID',
      'TREATMENT_NOT_FOUND',
      'CANNOT_DELETE_DEFAULT'
    ];
  }
}