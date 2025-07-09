import { FixedAssetFormData, FixedAsset } from '@/types/fixedAssets.types';
import { FixedAssetsStorageService } from '@/services/storage/fixedAssetsStorageService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationError {
  field: keyof FixedAssetFormData;
  message: string;
}

export class FixedAssetsValidationService {
  static validateAssetForm(
    formData: FixedAssetFormData,
    editingAssetId?: string
  ): ValidationResult {
    const errors: string[] = [];

    // Code validation
    if (!formData.code || formData.code.trim().length === 0) {
      errors.push('Asset code is required');
    } else if (formData.code.trim().length < 3) {
      errors.push('Asset code must be at least 3 characters');
    } else if (formData.code.trim().length > 20) {
      errors.push('Asset code cannot exceed 20 characters');
    } else if (!/^[A-Z0-9-]+$/i.test(formData.code.trim())) {
      errors.push('Asset code can only contain letters, numbers, and hyphens');
    } else if (!FixedAssetsStorageService.isCodeUnique(formData.code.trim(), editingAssetId)) {
      errors.push('Asset code already exists');
    }

    // Name validation
    if (!formData.name || formData.name.trim().length === 0) {
      errors.push('Asset name is required');
    } else if (formData.name.trim().length < 3) {
      errors.push('Asset name must be at least 3 characters');
    } else if (formData.name.trim().length > 100) {
      errors.push('Asset name cannot exceed 100 characters');
    }

    // Description validation
    if (!formData.description || formData.description.trim().length === 0) {
      errors.push('Description is required');
    } else if (formData.description.trim().length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }

    // Acquisition date validation
    if (!formData.acquisitionDate) {
      errors.push('Acquisition date is required');
    } else {
      const acquisitionDate = new Date(formData.acquisitionDate);
      if (isNaN(acquisitionDate.getTime())) {
        errors.push('Invalid acquisition date');
      } else if (acquisitionDate > new Date()) {
        errors.push('Acquisition date cannot be in the future');
      }
    }

    // Acquisition cost validation
    const cost = parseFloat(formData.acquisitionCost);
    if (!formData.acquisitionCost || isNaN(cost)) {
      errors.push('Acquisition cost is required and must be a number');
    } else if (cost < 0) {
      errors.push('Acquisition cost cannot be negative');
    } else if (cost > 999999999) {
      errors.push('Acquisition cost is too large');
    }

    // Useful life validation
    const usefulLife = parseFloat(formData.usefulLifeYears);
    if (!formData.usefulLifeYears || isNaN(usefulLife)) {
      errors.push('Useful life is required and must be a number');
    } else if (usefulLife < 0) {
      errors.push('Useful life cannot be negative');
    } else if (usefulLife > 100) {
      errors.push('Useful life cannot exceed 100 years');
    } else if (usefulLife === 0 && formData.depreciationMethod !== 'straight_line') {
      errors.push('Useful life must be greater than 0 for depreciation');
    }

    // Residual value validation
    const residualValue = parseFloat(formData.residualValue);
    if (formData.residualValue === '' || isNaN(residualValue)) {
      errors.push('Residual value is required and must be a number');
    } else if (residualValue < 0) {
      errors.push('Residual value cannot be negative');
    } else if (residualValue > cost) {
      errors.push('Residual value cannot exceed acquisition cost');
    }

    // Depreciation start date validation
    if (!formData.depreciationStartDate) {
      errors.push('Depreciation start date is required');
    } else {
      const depStartDate = new Date(formData.depreciationStartDate);
      const acqDate = new Date(formData.acquisitionDate);
      if (isNaN(depStartDate.getTime())) {
        errors.push('Invalid depreciation start date');
      } else if (depStartDate < acqDate) {
        errors.push('Depreciation start date cannot be before acquisition date');
      } else if (depStartDate > new Date()) {
        errors.push('Depreciation start date cannot be in the future');
      }
    }

    // Optional field validations
    if (formData.supplier && formData.supplier.trim().length > 100) {
      errors.push('Supplier name cannot exceed 100 characters');
    }

    if (formData.invoiceNumber && formData.invoiceNumber.trim().length > 50) {
      errors.push('Invoice number cannot exceed 50 characters');
    }

    if (formData.location && formData.location.trim().length > 100) {
      errors.push('Location cannot exceed 100 characters');
    }

    if (formData.assignedTo && formData.assignedTo.trim().length > 100) {
      errors.push('Assigned to cannot exceed 100 characters');
    }

    if (formData.department && formData.department.trim().length > 100) {
      errors.push('Department cannot exceed 100 characters');
    }

    if (formData.notes && formData.notes.trim().length > 1000) {
      errors.push('Notes cannot exceed 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAssetDeletion(id: string): ValidationResult {
    const errors: string[] = [];
    const asset = FixedAssetsStorageService.getAssetById(id);

    if (!asset) {
      errors.push('Asset not found');
      return { isValid: false, errors };
    }

    // Check if asset is already disposed
    if (asset.status === 'disposed' || asset.status === 'written_off') {
      errors.push('Cannot delete disposed or written-off assets. Please reactivate first.');
    }

    // Check if asset has significant book value
    if (asset.currentBookValue > 1000) {
      errors.push('Cannot delete assets with significant book value. Consider disposal instead.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateAssetDisposal(
    asset: FixedAsset,
    disposalData: {
      disposalDate: string;
      disposalMethod: string;
      disposalPrice: number;
      disposalReason: string;
    }
  ): ValidationResult {
    const errors: string[] = [];

    // Check if asset is already disposed
    if (asset.status === 'disposed' || asset.status === 'written_off') {
      errors.push('Asset is already disposed or written off');
    }

    // Validate disposal date
    if (!disposalData.disposalDate) {
      errors.push('Disposal date is required');
    } else {
      const disposalDate = new Date(disposalData.disposalDate);
      const acquisitionDate = new Date(asset.acquisitionDate);
      
      if (isNaN(disposalDate.getTime())) {
        errors.push('Invalid disposal date');
      } else if (disposalDate < acquisitionDate) {
        errors.push('Disposal date cannot be before acquisition date');
      } else if (disposalDate > new Date()) {
        errors.push('Disposal date cannot be in the future');
      }
    }

    // Validate disposal price
    if (disposalData.disposalPrice < 0) {
      errors.push('Disposal price cannot be negative');
    }

    // Validate disposal reason
    if (!disposalData.disposalReason || disposalData.disposalReason.trim().length === 0) {
      errors.push('Disposal reason is required');
    } else if (disposalData.disposalReason.trim().length > 500) {
      errors.push('Disposal reason cannot exceed 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateFormField(
    field: keyof FixedAssetFormData,
    value: unknown,
    formData: FixedAssetFormData
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (field) {
      case 'code':
        if (!value || value.trim().length === 0) {
          errors.push({ field: 'code', message: 'Asset code is required' });
        } else if (value.trim().length < 3) {
          errors.push({ field: 'code', message: 'Asset code must be at least 3 characters' });
        } else if (!/^[A-Z0-9-]+$/i.test(value.trim())) {
          errors.push({ field: 'code', message: 'Asset code can only contain letters, numbers, and hyphens' });
        }
        break;

      case 'name':
        if (!value || value.trim().length === 0) {
          errors.push({ field: 'name', message: 'Asset name is required' });
        } else if (value.trim().length < 3) {
          errors.push({ field: 'name', message: 'Asset name must be at least 3 characters' });
        }
        break;

      case 'acquisitionCost':
        const cost = parseFloat(value);
        if (!value || isNaN(cost)) {
          errors.push({ field: 'acquisitionCost', message: 'Acquisition cost must be a number' });
        } else if (cost < 0) {
          errors.push({ field: 'acquisitionCost', message: 'Acquisition cost cannot be negative' });
        }
        break;

      case 'residualValue':
        const residual = parseFloat(value);
        const acquisitionCost = parseFloat(formData.acquisitionCost);
        if (value === '' || isNaN(residual)) {
          errors.push({ field: 'residualValue', message: 'Residual value must be a number' });
        } else if (residual < 0) {
          errors.push({ field: 'residualValue', message: 'Residual value cannot be negative' });
        } else if (!isNaN(acquisitionCost) && residual > acquisitionCost) {
          errors.push({ field: 'residualValue', message: 'Residual value cannot exceed acquisition cost' });
        }
        break;

      case 'usefulLifeYears':
        const years = parseFloat(value);
        if (!value || isNaN(years)) {
          errors.push({ field: 'usefulLifeYears', message: 'Useful life must be a number' });
        } else if (years < 0) {
          errors.push({ field: 'usefulLifeYears', message: 'Useful life cannot be negative' });
        } else if (years > 100) {
          errors.push({ field: 'usefulLifeYears', message: 'Useful life cannot exceed 100 years' });
        }
        break;
    }

    return errors;
  }

  static canDepreciate(asset: FixedAsset): boolean {
    return (
      asset.status === 'active' &&
      asset.depreciationMethod !== 'straight_line' &&
      asset.currentBookValue > asset.residualValue &&
      asset.usefulLifeYears > 0
    );
  }
}