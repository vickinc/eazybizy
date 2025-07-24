import { BookkeepingFormData, AccountFormData } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class BookkeepingValidationService {
  static validateEntryForm(formData: BookkeepingFormData): ValidationResult {
    const errors: string[] = [];

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!formData.category) {
      errors.push('Category is required');
    }

    // Description is optional for all entry types

    if (!formData.companyId) {
      errors.push('Company is required');
    }

    if (!formData.date) {
      errors.push('Date is required');
    }

    // Validate COGS fields if income type
    if (formData.type === 'revenue') {
      if (formData.cogs && parseFloat(formData.cogs) < 0) {
        errors.push('COGS amount cannot be negative');
      }

      if (formData.cogsPaid && parseFloat(formData.cogsPaid) < 0) {
        errors.push('COGS paid amount cannot be negative');
      }

      if (formData.cogs && formData.cogsPaid) {
        const cogs = parseFloat(formData.cogs);
        const cogsPaid = parseFloat(formData.cogsPaid);
        if (cogsPaid > cogs) {
          errors.push('COGS paid cannot exceed total COGS');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAccountForm(formData: AccountFormData): ValidationResult {
    const errors: string[] = [];

    if (!formData.name || formData.name.trim().length === 0) {
      errors.push('Account name is required');
    }

    if (!formData.companyId) {
      errors.push('Company is required');
    }

    if (!formData.startingBalance) {
      errors.push('Starting balance is required');
    }

    if (parseFloat(formData.startingBalance) < 0) {
      errors.push('Starting balance cannot be negative');
    }

    if (!formData.currency) {
      errors.push('Currency is required');
    }

    if (formData.type !== 'bank' && formData.type !== 'wallet') {
      errors.push('Invalid account type');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAmount(amount: string): boolean {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0;
  }

  static validateDate(date: string): boolean {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  }

  static validateCurrency(currency: string): boolean {
    const validCurrencies = ['USD', 'EUR', 'GBP'];
    return validCurrencies.includes(currency);
  }
}