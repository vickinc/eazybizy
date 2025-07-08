import { ChartOfAccountFormData, ACCOUNT_TYPES } from '@/types/chartOfAccounts.types';
import { ChartOfAccountsStorageService } from '@/services/storage/chartOfAccountsStorageService';
import { VATTypesIntegrationService } from './vatTypesIntegrationService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ChartOfAccountsValidationService {
  static validateAccountForm(formData: ChartOfAccountFormData, excludeId?: string): ValidationResult {
    const errors: string[] = [];

    // Validate code
    if (!formData.code.trim()) {
      errors.push('Account code is required');
    } else if (!/^\d{4}$/.test(formData.code.trim())) {
      errors.push('Account code must be a 4-digit number');
    } else if (!ChartOfAccountsStorageService.isCodeUnique(formData.code.trim(), excludeId)) {
      errors.push('Account code already exists');
    }

    // Validate name
    if (!formData.name.trim()) {
      errors.push('Account name is required');
    } else if (formData.name.trim().length > 200) {
      errors.push('Account name must be 200 characters or less');
    }

    // Validate type
    if (!formData.type) {
      errors.push('Account type is required');
    } else if (!ACCOUNT_TYPES.includes(formData.type)) {
      errors.push('Invalid account type');
    }

    // Validate VAT
    if (!formData.vat) {
      errors.push('VAT treatment is required');
    } else if (!VATTypesIntegrationService.getAllVATTypes().includes(formData.vat)) {
      errors.push('Invalid VAT treatment');
    }

    // Validate account type
    if (!formData.accountType) {
      errors.push('Account classification is required');
    } else if (!['Detail', 'Header'].includes(formData.accountType)) {
      errors.push('Invalid account classification');
    }

    // Validate related vendor (optional, but if provided should be reasonable)
    if (formData.relatedVendor && formData.relatedVendor.trim().length > 100) {
      errors.push('Related vendor name must be 100 characters or less');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateBulkImport(accounts: any[]): ValidationResult {
    const errors: string[] = [];
    const codes = new Set<string>();

    accounts.forEach((account, index) => {
      const accountErrors: string[] = [];

      // Check required fields
      if (!account.code) {
        accountErrors.push('Missing account code');
      } else if (!/^\d{4}$/.test(account.code)) {
        accountErrors.push('Invalid account code format');
      } else if (codes.has(account.code)) {
        accountErrors.push('Duplicate account code');
      } else {
        codes.add(account.code);
      }

      if (!account.name) {
        accountErrors.push('Missing account name');
      }

      if (!account.type || !ACCOUNT_TYPES.includes(account.type)) {
        accountErrors.push('Invalid account type');
      }

      if (!account.vat || !VATTypesIntegrationService.getAllVATTypes().includes(account.vat)) {
        accountErrors.push('Invalid VAT treatment');
      }

      if (accountErrors.length > 0) {
        errors.push(`Row ${index + 1}: ${accountErrors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAccountDeletion(accountId: string): ValidationResult {
    const errors: string[] = [];

    // Check if account is being used in bookkeeping entries
    // This would require checking the bookkeeping entries
    // For now, we'll allow deletion but could add checks later
    
    // Could add checks like:
    // - Is this account referenced in any bookkeeping entries?
    // - Is this account referenced in any transactions?
    // - Is this a system-required account?

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAccountCode(code: string): boolean {
    return /^\d{4}$/.test(code.trim());
  }

  static validateAccountName(name: string): boolean {
    return name.trim().length > 0 && name.trim().length <= 200;
  }

  static sanitizeAccountData(formData: ChartOfAccountFormData): ChartOfAccountFormData {
    return {
      code: formData.code.trim(),
      name: formData.name.trim(),
      type: formData.type,
      vat: formData.vat,
      relatedVendor: formData.relatedVendor.trim(),
      accountType: formData.accountType
    };
  }
}