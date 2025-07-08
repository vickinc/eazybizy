import { NewProduct, NewProductGroup } from '@/types/products.types';

export class ProductValidationService {
  static validateProduct(product: NewProduct): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!product.name.trim()) {
      errors.push('Product name is required');
    }

    if (!product.price || parseFloat(product.price) <= 0) {
      errors.push('Product price must be greater than 0');
    }

    if (product.addMode === 'company' && !product.companyId) {
      errors.push('Please select a company');
    }

    if (product.addMode === 'group' && !product.selectedGroupForAdding) {
      errors.push('Please select a group');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateProductGroup(group: NewProductGroup): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!group.name.trim()) {
      errors.push('Group name is required');
    }

    if (group.companyIds.length === 0) {
      errors.push('At least one company must be selected for the group');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}