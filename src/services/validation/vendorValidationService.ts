import { NewVendor } from '@/types/vendor.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class VendorValidationService {
  static validateVendor(vendor: NewVendor, customPaymentTerms?: string): ValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!vendor.companyName.trim()) {
      errors.push('Company Name is required');
    }

    if (!vendor.contactPerson.trim()) {
      errors.push('Contact Person is required');
    }

    if (!vendor.contactEmail.trim()) {
      errors.push('Contact Email is required');
    }

    if (!vendor.companyId) {
      errors.push('Please select a company');
    }

    // Email format validation
    if (vendor.contactEmail.trim() && !this.isValidEmail(vendor.contactEmail.trim())) {
      errors.push('Please enter a valid email address');
    }

    // Payment terms validation
    const paymentTermsDays = vendor.paymentTerms === 'custom' 
      ? parseInt(customPaymentTerms || '') 
      : parseInt(vendor.paymentTerms);

    if (isNaN(paymentTermsDays) || paymentTermsDays <= 0) {
      errors.push('Please enter valid payment terms');
    }

    // Website URL validation (if provided)
    if (vendor.website.trim() && !this.isValidUrl(vendor.website.trim())) {
      errors.push('Please enter a valid website URL');
    }

    // Phone number validation (if provided)
    if (vendor.phone.trim() && !this.isValidPhone(vendor.phone.trim())) {
      errors.push('Please enter a valid phone number');
    }

    // VAT number validation (if provided)
    if (vendor.vatNr.trim() && vendor.vatNr.trim().length < 2) {
      errors.push('VAT number must be at least 2 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidUrl(url: string): boolean {
    try {
      // Add protocol if missing
      const urlToTest = url.startsWith('http') ? url : `https://${url}`;
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  }

  private static isValidPhone(phone: string): boolean {
    // Basic phone validation - allows various international formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7;
  }

  static validateRequiredFields(vendor: NewVendor): string[] {
    const errors: string[] = [];

    if (!vendor.companyName.trim()) {
      errors.push('Company Name is required');
    }

    if (!vendor.contactPerson.trim()) {
      errors.push('Contact Person is required');
    }

    if (!vendor.contactEmail.trim()) {
      errors.push('Contact Email is required');
    }

    if (!vendor.companyId) {
      errors.push('Please select a company');
    }

    return errors;
  }

  static validatePaymentTerms(paymentTerms: string, customPaymentTerms?: string): string | null {
    const days = paymentTerms === 'custom' 
      ? parseInt(customPaymentTerms || '') 
      : parseInt(paymentTerms);

    if (isNaN(days) || days <= 0) {
      return 'Please enter valid payment terms';
    }

    if (days > 365) {
      return 'Payment terms cannot exceed 365 days';
    }

    return null;
  }

  static validateEmail(email: string): string | null {
    if (!email.trim()) return null;
    
    if (!this.isValidEmail(email.trim())) {
      return 'Please enter a valid email address';
    }

    return null;
  }

  static validateWebsite(website: string): string | null {
    if (!website.trim()) return null;
    
    if (!this.isValidUrl(website.trim())) {
      return 'Please enter a valid website URL';
    }

    return null;
  }

  static validatePhone(phone: string): string | null {
    if (!phone.trim()) return null;
    
    if (!this.isValidPhone(phone.trim())) {
      return 'Please enter a valid phone number';
    }

    return null;
  }
}