import { BusinessCardFormData } from '@/types/businessCards.types';
import { Company } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class BusinessCardsValidationService {
  
  static validateBusinessCardForm(formData: BusinessCardFormData, companies: Company[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate company selection
    if (!formData.companyId || formData.companyId === 0) {
      errors.push('Please select a company');
    } else {
      const selectedCompany = companies.find(c => c.id === formData.companyId);
      if (!selectedCompany) {
        errors.push('Selected company not found');
      } else {
        // Check if company has required fields for QR code
        if (formData.qrType === 'website' && !selectedCompany.website) {
          errors.push('Selected company does not have a website configured');
        }
        if (formData.qrType === 'email' && !selectedCompany.email) {
          errors.push('Selected company does not have an email configured');
        }
        
        // Company status warnings
        if (selectedCompany.status !== 'Active') {
          warnings.push(`Company status is ${selectedCompany.status}`);
        }
      }
    }

    // Validate person name (optional but warn if empty for professional cards)
    if (!formData.personName?.trim()) {
      warnings.push('Consider adding a person name for a more professional business card');
    } else {
      // Basic name validation
      if (formData.personName.length < 2) {
        errors.push('Person name must be at least 2 characters long');
      }
      if (formData.personName.length > 100) {
        errors.push('Person name must be less than 100 characters');
      }
    }

    // Validate position (optional but recommended)
    if (!formData.position?.trim()) {
      warnings.push('Consider adding a position/title for a more professional business card');
    } else {
      if (formData.position.length > 100) {
        errors.push('Position must be less than 100 characters');
      }
    }

    // Validate QR type
    if (!['website', 'email'].includes(formData.qrType)) {
      errors.push('Invalid QR code type selected');
    }

    // Validate template
    if (!['modern', 'classic', 'minimal', 'eazy'].includes(formData.template)) {
      errors.push('Invalid template selected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static sanitizeFormData(formData: BusinessCardFormData): BusinessCardFormData {
    return {
      companyId: Number(formData.companyId) || 0,
      personName: (formData.personName || '').trim(),
      position: (formData.position || '').trim(),
      qrType: formData.qrType || 'website',
      template: formData.template || 'modern'
    };
  }

  static validateCompanyForBusinessCard(company: Company): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required company fields
    if (!company.tradingName?.trim()) {
      errors.push('Company must have a trading name');
    }

    if (!company.email?.trim()) {
      warnings.push('Company does not have an email address');
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(company.email)) {
        errors.push('Company email address is not valid');
      }
    }

    if (!company.website?.trim()) {
      warnings.push('Company does not have a website');
    } else {
      // Basic website validation
      const websiteRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!websiteRegex.test(company.website)) {
        warnings.push('Company website format may not be valid');
      }
    }

    if (!company.phone?.trim()) {
      warnings.push('Company does not have a phone number');
    }

    if (!company.address?.trim()) {
      warnings.push('Company does not have an address');
    }

    if (company.status !== 'Active') {
      warnings.push(`Company status is ${company.status}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static getFormValidationMessage(result: ValidationResult): string {
    if (result.isValid) {
      if (result.warnings.length > 0) {
        return `Ready to create card (${result.warnings.length} recommendations)`;
      }
      return 'Ready to create business card';
    } else {
      return `${result.errors.length} error${result.errors.length > 1 ? 's' : ''} must be fixed`;
    }
  }
}