import { NewClient, Client } from '@/types/client.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ClientValidationService {
  static validateClient(clientData: NewClient): ValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!clientData.companyId) {
      errors.push('Please select a company');
    }

    if (!clientData.name.trim()) {
      errors.push('Client name is required');
    }

    if (!clientData.email.trim()) {
      errors.push('Email is required');
    }

    // Email format validation
    if (clientData.email.trim() && !this.isValidEmail(clientData.email.trim())) {
      errors.push('Please enter a valid email address');
    }

    // Client type specific validation
    if (clientData.clientType === 'Legal Entity') {
      if (!clientData.registrationNumber.trim()) {
        errors.push('Registration Number is required for Legal Entity clients');
      }
      if (!clientData.contactPersonName.trim()) {
        errors.push('Contact Person Name is required for Legal Entity clients');
      }
    }

    // Phone validation (if provided)
    if (clientData.phone.trim() && !this.isValidPhone(clientData.phone.trim())) {
      errors.push('Please enter a valid phone number');
    }

    // Website validation (if provided)
    if (clientData.website.trim() && !this.isValidUrl(clientData.website.trim())) {
      errors.push('Please enter a valid website URL');
    }

    // Tax ID/VAT number validation (if provided)
    if (clientData.vatNumber.trim() && clientData.vatNumber.trim().length < 2) {
      errors.push('Tax ID/VAT number must be at least 2 characters');
    }

    // Date of birth validation for individuals (if provided)
    if (clientData.clientType === 'Individual' && clientData.dateOfBirth) {
      if (!this.isValidDate(clientData.dateOfBirth)) {
        errors.push('Please enter a valid date of birth');
      } else {
        const birthDate = new Date(clientData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 16 || age > 120) {
          errors.push('Date of birth must represent an age between 16 and 120 years');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateForUpdate(clientData: NewClient, existingClients: Client[], currentClientId: string): ValidationResult {
    const baseValidation = this.validateClient(clientData);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Check for duplicate email (excluding current client)
    const emailExists = existingClients.some(client => 
      client.id !== currentClientId && 
      client.email.toLowerCase() === clientData.email.toLowerCase()
    );

    if (emailExists) {
      return {
        isValid: false,
        errors: ['A client with this email already exists']
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateForCreation(clientData: NewClient, existingClients: Client[]): ValidationResult {
    const baseValidation = this.validateClient(clientData);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Check for duplicate email
    const emailExists = existingClients.some(client => 
      client.email.toLowerCase() === clientData.email.toLowerCase()
    );

    if (emailExists) {
      return {
        isValid: false,
        errors: ['A client with this email already exists']
      };
    }

    return { isValid: true, errors: [] };
  }

  static validateRequiredFields(clientData: Partial<NewClient>): string[] {
    const errors: string[] = [];

    if (!clientData.companyId) {
      errors.push('Company selection is required');
    }

    if (!clientData.name?.trim()) {
      errors.push('Client name is required');
    }

    if (!clientData.email?.trim()) {
      errors.push('Email is required');
    }

    if (clientData.clientType === 'Legal Entity') {
      if (!clientData.registrationNumber?.trim()) {
        errors.push('Registration Number is required for Legal Entity clients');
      }
      if (!clientData.contactPersonName?.trim()) {
        errors.push('Contact Person Name is required for Legal Entity clients');
      }
    }

    return errors;
  }

  static validateEmail(email: string): string | null {
    if (!email.trim()) return null;
    
    if (!this.isValidEmail(email.trim())) {
      return 'Please enter a valid email address';
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

  static validateWebsite(website: string): string | null {
    if (!website.trim()) return null;
    
    if (!this.isValidUrl(website.trim())) {
      return 'Please enter a valid website URL';
    }

    return null;
  }

  static validateRegistrationNumber(regNumber: string, clientType: string): string | null {
    if (clientType === 'Legal Entity' && !regNumber.trim()) {
      return 'Registration Number is required for Legal Entity clients';
    }

    if (regNumber.trim() && regNumber.trim().length < 2) {
      return 'Registration Number must be at least 2 characters';
    }

    return null;
  }

  static validateVatNumber(vatNumber: string): string | null {
    if (!vatNumber.trim()) return null;
    
    if (vatNumber.trim().length < 2) {
      return 'Tax ID/VAT number must be at least 2 characters';
    }

    return null;
  }

  static validateDateOfBirth(dateOfBirth: string): string | null {
    if (!dateOfBirth) return null;
    
    if (!this.isValidDate(dateOfBirth)) {
      return 'Please enter a valid date of birth';
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 16) {
      return 'Client must be at least 16 years old';
    }
    
    if (age > 120) {
      return 'Please enter a valid date of birth';
    }

    return null;
  }

  // Private validation helper methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    // Basic phone validation - allows various international formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 7;
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

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
  }

  // Business rule validations
  static validateBusinessRules(clientData: NewClient): ValidationResult {
    const errors: string[] = [];

    // Business rule: Individual clients should not have company-specific fields
    if (clientData.clientType === 'Individual') {
      if (clientData.registrationNumber.trim()) {
        errors.push('Individual clients should not have a registration number');
      }
      if (clientData.vatNumber.trim()) {
        errors.push('Individual clients should not have a Tax ID/VAT number');
      }
    }

    // Business rule: Legal entities should have professional contact information
    if (clientData.clientType === 'Legal Entity') {
      if (!clientData.contactPersonPosition.trim()) {
        console.warn('Legal Entity client should have contact person position for better records');
      }
    }

    // Business rule: Active/Inactive clients should have complete information
    if (clientData.status === 'active') {
      if (!clientData.phone.trim()) {
        console.warn('Active clients should have phone numbers for better communication');
      }
      if (!clientData.address.trim()) {
        console.warn('Active clients should have addresses for invoicing purposes');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Field-level validation for real-time feedback
  static validateField(fieldName: string, value: unknown, clientType?: string): string | null {
    switch (fieldName) {
      case 'name':
        return !value?.trim() ? 'Client name is required' : null;
      
      case 'email':
        return this.validateEmail(value || '');
      
      case 'phone':
        return this.validatePhone(value || '');
      
      case 'website':
        return this.validateWebsite(value || '');
      
      case 'registrationNumber':
        return this.validateRegistrationNumber(value || '', clientType || '');
      
      case 'vatNumber':
        return this.validateVatNumber(value || '');
      
      case 'dateOfBirth':
        return this.validateDateOfBirth(value || '');
      
      case 'contactPersonName':
        if (clientType === 'Legal Entity' && !value?.trim()) {
          return 'Contact Person Name is required for Legal Entity clients';
        }
        return null;
      
      default:
        return null;
    }
  }
}