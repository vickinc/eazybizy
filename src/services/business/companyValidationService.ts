import { Company } from '@/types';

export interface CompanyFormData {
  legalName: string;
  tradingName: string;
  registrationNo: string;
  registrationDate: string;
  countryOfRegistration: string;
  baseCurrency: string;
  businessLicenseNr: string;
  vatNumber: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  status: string;
  // Social Media URLs (optional)
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
  youtubeUrl: string;
  // Messenger contact numbers (optional)
  whatsappNumber: string;
  telegramNumber: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CompanyFormValidationResult extends ValidationResult {
  fieldErrors: {
    [key: string]: string[];
  };
}

/**
 * Service for validating company forms and business rules
 */
export class CompanyValidationService {
  /**
   * Validates a complete company form
   */
  static validateCompanyForm(
    formData: CompanyFormData,
    existingCompanies: Company[],
    editingId?: number
  ): CompanyFormValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fieldErrors: { [key: string]: string[] } = {};

    // Required field validation
    if (!formData.legalName.trim()) {
      errors.push('Legal Name is required');
      fieldErrors.legalName = ['Legal Name is required'];
    }

    if (!formData.tradingName.trim()) {
      errors.push('Trading Name is required');
      fieldErrors.tradingName = ['Trading Name is required'];
    }

    if (!formData.registrationNo.trim()) {
      errors.push('Registration Number is required');
      fieldErrors.registrationNo = ['Registration Number is required'];
    }

    if (!formData.registrationDate.trim()) {
      errors.push('Registration Date is required');
      fieldErrors.registrationDate = ['Registration Date is required'];
    } else {
      // Validate that registration date is not in the future
      const registrationDate = new Date(formData.registrationDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      if (registrationDate > today) {
        errors.push('Registration Date cannot be in the future');
        fieldErrors.registrationDate = [...(fieldErrors.registrationDate || []), 'Registration Date cannot be in the future'];
      }
    }

    if (!formData.countryOfRegistration.trim()) {
      errors.push('Country Of Registration is required');
      fieldErrors.countryOfRegistration = ['Country Of Registration is required'];
    }

    if (!formData.baseCurrency.trim()) {
      errors.push('Base Currency is required');
      fieldErrors.baseCurrency = ['Base Currency is required'];
    }

    if (!formData.email.trim()) {
      errors.push('Email is required');
      fieldErrors.email = ['Email is required'];
    }

    // Email format validation
    if (formData.email && !this.isValidEmail(formData.email)) {
      errors.push('Invalid email format');
      fieldErrors.email = [...(fieldErrors.email || []), 'Invalid email format'];
    }

    // Website format validation
    if (formData.website && !this.isValidWebsite(formData.website)) {
      warnings.push('Website URL format may be invalid');
    }

    // Phone validation
    if (formData.phone && !this.isValidPhone(formData.phone)) {
      warnings.push('Phone number format may be invalid');
    }

    // VAT number validation
    if (formData.vatNumber && !this.isValidVATNumber(formData.vatNumber)) {
      warnings.push('VAT number format may be invalid');
    }

    // Duplicate checks
    const duplicateChecks = this.checkDuplicates(formData, existingCompanies, editingId);
    errors.push(...duplicateChecks.errors);
    warnings.push(...duplicateChecks.warnings);

    // Merge duplicate field errors
    Object.keys(duplicateChecks.fieldErrors).forEach(field => {
      fieldErrors[field] = [...(fieldErrors[field] || []), ...duplicateChecks.fieldErrors[field]];
    });

    // Status validation
    if (!['Active', 'Passive'].includes(formData.status)) {
      errors.push('Invalid status. Must be Active or Passive');
      fieldErrors.status = ['Invalid status'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fieldErrors
    };
  }

  /**
   * Check for duplicate companies
   */
  private static checkDuplicates(
    formData: CompanyFormData,
    existingCompanies: Company[],
    editingId?: number
  ): CompanyFormValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fieldErrors: { [key: string]: string[] } = {};

    // Filter out the company being edited
    const otherCompanies = existingCompanies.filter(c => c.id !== editingId);

    // Check for duplicate legal name
    const duplicateLegalName = otherCompanies.find(c => 
      c.legalName.toLowerCase() === formData.legalName.toLowerCase()
    );
    if (duplicateLegalName) {
      errors.push('A company with this legal name already exists');
      fieldErrors.legalName = [...(fieldErrors.legalName || []), 'Legal name already exists'];
    }

    // Check for duplicate trading name
    const duplicateTradingName = otherCompanies.find(c => 
      c.tradingName.toLowerCase() === formData.tradingName.toLowerCase()
    );
    if (duplicateTradingName) {
      errors.push('A company with this trading name already exists');
      fieldErrors.tradingName = [...(fieldErrors.tradingName || []), 'Trading name already exists'];
    }

    // Check for duplicate email
    const duplicateEmail = otherCompanies.find(c => 
      c.email.toLowerCase() === formData.email.toLowerCase()
    );
    if (duplicateEmail) {
      errors.push('A company with this email already exists');
      fieldErrors.email = [...(fieldErrors.email || []), 'Email already exists'];
    }

    // Check for duplicate registration number
    if (formData.registrationNo) {
      const duplicateRegNo = otherCompanies.find(c => 
        c.registrationNo === formData.registrationNo
      );
      if (duplicateRegNo) {
        errors.push('A company with this registration number already exists');
        fieldErrors.registrationNo = ['Registration number already exists'];
      }
    }

    // Check for duplicate VAT number
    if (formData.vatNumber) {
      const duplicateVAT = otherCompanies.find(c => 
        c.vatNumber === formData.vatNumber
      );
      if (duplicateVAT) {
        warnings.push('Another company has the same VAT number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fieldErrors
    };
  }

  /**
   * Validates email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates website URL format
   */
  private static isValidWebsite(website: string): boolean {
    try {
      // Try with https:// prefix if not present
      const url = website.startsWith('http') ? website : `https://${website}`;
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates phone number format (basic check)
   */
  private static isValidPhone(phone: string): boolean {
    // Basic phone validation - contains numbers and common phone characters
    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)\.]{7,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validates VAT number format (basic check)
   */
  private static isValidVATNumber(vatNumber: string): boolean {
    // Basic VAT validation - alphanumeric with common separators
    const vatRegex = /^[A-Z]{0,4}[0-9A-Z\-\s]{4,20}$/i;
    return vatRegex.test(vatNumber);
  }

  /**
   * Quick validation for real-time form updates
   */
  static validateField(fieldName: string, value: string, existingCompanies?: Company[], editingId?: number): string[] {
    const errors: string[] = [];

    switch (fieldName) {
      case 'legalName':
        if (!value.trim()) {
          errors.push('Legal Name is required');
        } else if (existingCompanies) {
          const duplicate = existingCompanies.find(c => 
            c.id !== editingId && c.legalName.toLowerCase() === value.toLowerCase()
          );
          if (duplicate) {
            errors.push('Legal name already exists');
          }
        }
        break;

      case 'tradingName':
        if (!value.trim()) {
          errors.push('Trading Name is required');
        } else if (existingCompanies) {
          const duplicate = existingCompanies.find(c => 
            c.id !== editingId && c.tradingName.toLowerCase() === value.toLowerCase()
          );
          if (duplicate) {
            errors.push('Trading name already exists');
          }
        }
        break;

      case 'email':
        if (!value.trim()) {
          errors.push('Email is required');
        } else if (!this.isValidEmail(value)) {
          errors.push('Invalid email format');
        } else if (existingCompanies) {
          const duplicate = existingCompanies.find(c => 
            c.id !== editingId && c.email.toLowerCase() === value.toLowerCase()
          );
          if (duplicate) {
            errors.push('Email already exists');
          }
        }
        break;

      case 'website':
        if (value && !this.isValidWebsite(value)) {
          errors.push('Invalid website URL format');
        }
        break;

      case 'phone':
        if (value && !this.isValidPhone(value)) {
          errors.push('Invalid phone number format');
        }
        break;

      case 'registrationDate':
        if (!value.trim()) {
          errors.push('Registration Date is required');
        } else {
          const registrationDate = new Date(value);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          
          if (registrationDate > today) {
            errors.push('Registration Date cannot be in the future');
          }
        }
        break;

      case 'vatNumber':
        if (value && !this.isValidVATNumber(value)) {
          errors.push('Invalid VAT number format');
        }
        break;

      case 'baseCurrency':
        if (!value.trim()) {
          errors.push('Base Currency is required');
        }
        break;
    }

    return errors;
  }
}