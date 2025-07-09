import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info } from 'lucide-react';
import {
  VATTreatment,
  VATTreatmentFormData,
  VAT_CATEGORIES,
  VAT_APPLICABILITIES,
  VAT_CATEGORY_DESCRIPTIONS,
  VAT_APPLICABILITY_DESCRIPTIONS,
  VATApplicability
} from '@/types/vatTreatment.types';
import { ValidationError } from '@/services/business/vatTreatmentValidationService';
import { cn } from '@/utils/cn';

interface VATTreatmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: VATTreatmentFormData;
  editingTreatment: VATTreatment | null;
  onFormInputChange: (field: keyof VATTreatmentFormData, value: unknown) => void;
  onFormSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  getFieldError: (field: keyof VATTreatmentFormData) => string | undefined;
  hasFieldError: (field: keyof VATTreatmentFormData) => boolean;
  isSubmitting: boolean;
}

export const VATTreatmentDialog: React.FC<VATTreatmentDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  editingTreatment,
  onFormInputChange,
  onFormSubmit,
  onCancel,
  getFieldError,
  hasFieldError,
  isSubmitting
}) => {
  const isEditing = !!editingTreatment;
  const isDefaultTreatment = editingTreatment?.isDefault || false;

  const handleApplicabilityChange = (applicability: VATApplicability, checked: boolean) => {
    const currentApplicabilities = formData.applicability;
    if (checked) {
      if (!currentApplicabilities.includes(applicability)) {
        onFormInputChange('applicability', [...currentApplicabilities, applicability]);
      }
    } else {
      onFormInputChange('applicability', currentApplicabilities.filter(a => a !== applicability));
    }
  };

  const getRateInputType = () => {
    // Show info based on category
    switch (formData.category) {
      case 'exempt':
        return 'Rate should be 0% for exempt categories';
      case 'standard':
        return 'Standard rates are typically 15-25%';
      case 'reduced':
        return 'Reduced rates are typically 1-15%';
      default:
        return 'Enter rate as percentage (0-100)';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? 'Edit VAT Treatment' : 'Create VAT Treatment'}
            {isDefaultTreatment && (
              <Badge variant="secondary" className="text-xs">
                Default
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the VAT treatment details below.'
              : 'Create a new VAT treatment to manage tax rates and applicability.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onFormSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <Label htmlFor="code" className="text-sm font-medium">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => onFormInputChange('code', e.target.value)}
                placeholder="e.g., VAT_22, EXEMPT"
                disabled={isDefaultTreatment}
                className={cn(
                  hasFieldError('code') && "border-red-500 focus:border-red-500"
                )}
              />
              {hasFieldError('code') && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('code')}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier (letters, numbers, underscores only)
              </p>
            </div>

            {/* Rate */}
            <div>
              <Label htmlFor="rate" className="text-sm font-medium">
                Rate (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.rate}
                onChange={(e) => onFormInputChange('rate', e.target.value)}
                placeholder="22.00"
                className={cn(
                  hasFieldError('rate') && "border-red-500 focus:border-red-500"
                )}
              />
              {hasFieldError('rate') && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('rate')}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                {getRateInputType()}
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormInputChange('name', e.target.value)}
              placeholder="e.g., Value Added Tax 22%"
              className={cn(
                hasFieldError('name') && "border-red-500 focus:border-red-500"
              )}
            />
            {hasFieldError('name') && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('name')}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormInputChange('description', e.target.value)}
              placeholder="Detailed description of when this VAT treatment applies..."
              rows={3}
              className={cn(
                hasFieldError('description') && "border-red-500 focus:border-red-500"
              )}
            />
            {hasFieldError('description') && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('description')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <Label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => onFormInputChange('category', value)}
              >
                <SelectTrigger className={cn(
                  hasFieldError('category') && "border-red-500 focus:border-red-500"
                )}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {VAT_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      <div className="flex flex-col">
                        <span className="font-medium capitalize">{category}</span>
                        <span className="text-xs text-gray-500">
                          {VAT_CATEGORY_DESCRIPTIONS[category]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFieldError('category') && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('category')}
                </p>
              )}
            </div>

            {/* Active Status */}
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex items-center space-x-3 mt-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => onFormInputChange('isActive', checked)}
                  disabled={isDefaultTreatment}
                />
                <Label htmlFor="isActive" className="text-sm">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </Label>
              </div>
              {isDefaultTreatment && (
                <p className="text-xs text-gray-500 mt-1">
                  Default treatments cannot be deactivated
                </p>
              )}
            </div>
          </div>

          {/* Applicability */}
          <div>
            <Label className="text-sm font-medium">
              Applicability <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {VAT_APPLICABILITIES.map(applicability => (
                <div key={applicability} className="flex items-center space-x-3">
                  <Checkbox
                    id={applicability}
                    checked={formData.applicability.includes(applicability)}
                    onCheckedChange={(checked) => 
                      handleApplicabilityChange(applicability, checked as boolean)
                    }
                  />
                  <div className="flex flex-col">
                    <Label htmlFor={applicability} className="text-sm font-medium capitalize">
                      {applicability}
                    </Label>
                    <span className="text-xs text-gray-500">
                      {VAT_APPLICABILITY_DESCRIPTIONS[applicability]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {hasFieldError('applicability') && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('applicability')}
              </p>
            )}
          </div>

          {/* Current Applicability Display */}
          {formData.applicability.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Selected Applicability</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.applicability.map(app => (
                  <Badge key={app} variant="outline" className="text-xs">
                    {app.charAt(0).toUpperCase() + app.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Warning for default treatments */}
          {isDefaultTreatment && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800 font-medium">
                  Default Treatment
                </span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                This is a system default VAT treatment. Code and status cannot be modified.
                You can still update the name, description, rate, category, and applicability.
              </p>
            </div>
          )}
        </form>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDefaultTreatment && (
              <Badge variant="outline" className="text-xs">
                System Default
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={onFormSubmit}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  Saving...
                </div>
              ) : (
                isEditing ? 'Update' : 'Create'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};