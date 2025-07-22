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
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Info from "lucide-react/dist/esm/icons/info";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Settings from "lucide-react/dist/esm/icons/settings";
import Tag from "lucide-react/dist/esm/icons/tag";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import Target from "lucide-react/dist/esm/icons/target";
import {
  TaxTreatment,
  TaxTreatmentFormData,
  TAX_CATEGORIES,
  TAX_APPLICABILITIES,
  TAX_CATEGORY_DESCRIPTIONS,
  TAX_APPLICABILITY_DESCRIPTIONS,
  TaxApplicability
} from '@/types/taxTreatment.types';
import { ValidationError } from '@/services/business/taxTreatmentValidationService';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui/card';
import { useMemo } from 'react';

interface TaxTreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: TaxTreatmentFormData;
  treatment: TaxTreatment | null;
  onFormDataChange: (field: keyof TaxTreatmentFormData, value: unknown) => void;
  onSubmit: (e: React.FormEvent) => void;
  validationErrors: ValidationError[];
  isSubmitting: boolean;
}

export const TaxTreatmentDialog: React.FC<TaxTreatmentDialogProps> = ({
  open,
  onOpenChange,
  formData,
  treatment,
  onFormDataChange,
  onSubmit,
  validationErrors,
  isSubmitting
}) => {
  const isEditing = !!treatment;

  // Calculate form progress
  const requiredFields = ['code', 'name', 'description', 'rate', 'category', 'applicability'];
  const completedFields = useMemo(() => {
    return requiredFields.filter(field => {
      const value = formData[field as keyof TaxTreatmentFormData];
      if (field === 'applicability') {
        return Array.isArray(value) && value.length > 0;
      }
      return value?.toString().trim();
    });
  }, [formData]);
  const progress = Math.round((completedFields.length / requiredFields.length) * 100);

  const getFieldError = (field: keyof TaxTreatmentFormData): string | undefined => {
    const error = validationErrors.find(err => err.field === field);
    return error?.message;
  };

  const hasFieldError = (field: keyof TaxTreatmentFormData): boolean => {
    return validationErrors.some(err => err.field === field);
  };

  const handleApplicabilityChange = (applicability: TaxApplicability, checked: boolean) => {
    const currentApplicabilities = formData.applicability || [];
    let newApplicabilities: TaxApplicability[];
    
    if (checked) {
      newApplicabilities = [...currentApplicabilities, applicability];
    } else {
      newApplicabilities = currentApplicabilities.filter(app => app !== applicability);
    }
    
    onFormDataChange('applicability', newApplicabilities);
  };

  const formatCategoryDescription = (category: string) => {
    return TAX_CATEGORY_DESCRIPTIONS[category as keyof typeof TAX_CATEGORY_DESCRIPTIONS] || '';
  };

  const formatApplicabilityDescription = (applicability: string) => {
    return TAX_APPLICABILITY_DESCRIPTIONS[applicability as keyof typeof TAX_APPLICABILITY_DESCRIPTIONS] || '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="p-2 bg-lime-100 rounded-lg">
              {isEditing ? (
                <Settings className="h-6 w-6 text-lime-600" />
              ) : (
                <FileText className="h-6 w-6 text-lime-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? '✏️ Edit Tax Treatment' : '➕ Create New Tax Treatment'}
              {treatment?.isDefault && (
                <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
                  System Default
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {isEditing 
              ? 'Update the tax treatment details below to modify your tax configuration.' 
              : 'Create a new tax treatment for accounting transactions. Fields marked with * are required.'}
          </DialogDescription>
          {!isEditing && (
            <div className="mt-4 p-3 bg-lime-50 border border-lime-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-lime-900">Progress</span>
                <span className="text-sm font-medium text-lime-900">{progress}%</span>
              </div>
              <div className="w-full bg-lime-200 rounded-full h-2">
                <div 
                  className="bg-lime-600 h-2 rounded-full transition-all duration-300" 
                  style={{width: `${progress}%`}}
                />
              </div>
              <div className="text-xs text-lime-700 mt-1">
                {completedFields.length} of {requiredFields.length} required fields completed
              </div>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* Section 1: Basic Information */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium flex items-center space-x-1">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span>Tax Code</span>
                  <span className="text-red-500">*</span>
                  {formData.code && (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <Input
                  id="code"
                  value={formData.code || ''}
                  onChange={(e) => onFormDataChange('code', e.target.value.toUpperCase())}
                  placeholder="e.g., TAX22, EXEMPT"
                  className={cn("font-mono text-lg bg-lime-50 border-lime-200 focus:bg-white", hasFieldError('code') && "border-red-500")}
                  disabled={isSubmitting || treatment?.isDefault}
                  maxLength={10}
                />
                {hasFieldError('code') && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('code')}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Unique identifier for this tax treatment (max 10 characters)
                </p>
              </div>

              {/* Rate */}
              <div className="space-y-2">
                <Label htmlFor="rate" className="text-sm font-medium flex items-center space-x-1">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span>Tax Rate (%)</span>
                  <span className="text-red-500">*</span>
                  {formData.rate && (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.rate || ''}
                  onChange={(e) => onFormDataChange('rate', e.target.value)}
                  placeholder="0.00"
                  className={cn("text-lg bg-lime-50 border-lime-200 focus:bg-white", hasFieldError('rate') && "border-red-500")}
                  disabled={isSubmitting}
                />
                {hasFieldError('rate') && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('rate')}
                  </div>
                )}
                {formData.rate && (
                  <div className="bg-blue-50 p-2 rounded-md">
                    <p className="text-xs text-blue-700">
                      💰 Rate Preview: {formData.rate}% tax will be applied
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Tax percentage (0-100)
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2: Details */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Treatment Details</h3>
            </div>
            
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center space-x-1">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span>Display Name</span>
                  <span className="text-red-500">*</span>
                  {formData.name && (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => onFormDataChange('name', e.target.value)}
                  placeholder="e.g., VAT/Sales Tax/GST 22%"
                  className={cn("text-lg bg-lime-50 border-lime-200 focus:bg-white", hasFieldError('name') && "border-red-500")}
                  disabled={isSubmitting}
                  maxLength={100}
                />
                {hasFieldError('name') && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('name')}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  User-friendly name for this tax treatment (max 100 characters)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium flex items-center space-x-1">
                  <Info className="h-4 w-4 text-green-600" />
                  <span>Description</span>
                  <span className="text-red-500">*</span>
                  {formData.description && (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => onFormDataChange('description', e.target.value)}
                  placeholder="Describe when and how this tax treatment should be applied..."
                  rows={4}
                  className={cn("bg-lime-50 border-lime-200 focus:bg-white", hasFieldError('description') && "border-red-500")}
                  disabled={isSubmitting}
                  maxLength={500}
                />
                {hasFieldError('description') && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('description')}
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Detailed explanation of this tax treatment</span>
                  <span>{(formData.description || '').length}/500</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3: Classification */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Tax Classification</h3>
            </div>
            
            <div className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center space-x-1">
                  <Tag className="h-4 w-4 text-purple-600" />
                  <span>Tax Category</span>
                  <span className="text-red-500">*</span>
                  {formData.category && (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <Select
                  value={formData.category || ''}
                  onValueChange={(value) => onFormDataChange('category', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className={cn("h-12 bg-lime-50 border-lime-200 focus:bg-white", hasFieldError('category') && "border-red-500")}>
                    <SelectValue placeholder="Choose the tax category type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        <div className="flex flex-col items-start py-2">
                          <span className="capitalize font-medium">{category}</span>
                          <span className="text-xs text-gray-500">
                            {formatCategoryDescription(category)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasFieldError('category') && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('category')}
                  </div>
                )}
                {formData.category && (
                  <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Info className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 mb-1">
                        {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)} Tax Category
                      </p>
                      <p className="text-xs text-purple-700">
                        {formatCategoryDescription(formData.category)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Section 4: Applicability */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-orange-600">4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Where to Apply</h3>
              <Badge variant="secondary" className="ml-auto bg-lime-100 text-lime-800">
                {formData.applicability?.length || 0} selected
              </Badge>
            </div>
            
            {hasFieldError('applicability') && (
              <div className="flex items-center gap-1 text-xs text-red-600 mb-3">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('applicability')}
              </div>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-4 w-4 text-orange-600" />
                <p className="text-sm text-gray-700">
                  Select where this tax treatment can be applied <span className="text-red-500">*</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TAX_APPLICABILITIES.map((applicability) => (
                  <div key={applicability} className="flex items-start space-x-3 p-4 border border-lime-200 rounded-lg hover:bg-lime-50 transition-colors">
                    <Checkbox
                      id={`applicability-${applicability}`}
                      checked={formData.applicability?.includes(applicability) || false}
                      onCheckedChange={(checked) => 
                        handleApplicabilityChange(applicability, checked as boolean)
                      }
                      disabled={isSubmitting}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <Label 
                        htmlFor={`applicability-${applicability}`}
                        className="text-sm font-medium capitalize cursor-pointer flex items-center space-x-2"
                      >
                        <span>{applicability}</span>
                        {formData.applicability?.includes(applicability) && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatApplicabilityDescription(applicability)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {formData.applicability && formData.applicability.length > 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-700">
                    🎯 This tax treatment will be available for: <strong>{formData.applicability.join(', ')}</strong>
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Section 5: Settings */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-gray-600">5</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-lime-200 rounded-lg bg-lime-50">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <Label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                    Active Status
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Only active tax treatments can be used in transactions
                  </p>
                </div>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive ?? true}
                onCheckedChange={(checked) => onFormDataChange('isActive', checked)}
                disabled={isSubmitting || treatment?.isDefault}
              />
            </div>
          </Card>

          {/* Summary Section */}
          <Card className="p-6 bg-gray-50 border-dashed">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900">Summary</h4>
            </div>
            {progress < 100 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-2">Complete all required fields to proceed</p>
                <p className="text-xs text-gray-500">
                  Missing: {requiredFields.filter(field => {
                    const value = formData[field as keyof TaxTreatmentFormData];
                    if (field === 'applicability') {
                      return !Array.isArray(value) || value.length === 0;
                    }
                    return !value?.toString().trim();
                  }).join(', ')}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Code:</span>
                  <span className="font-mono font-medium">{formData.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate:</span>
                  <span>{formData.rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="capitalize">{formData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Applies to:</span>
                  <span className="text-right">{formData.applicability?.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={formData.isActive ? 'text-green-600' : 'text-gray-500'}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* System Default Warning */}
          {treatment?.isDefault && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-700">
                <p className="font-medium">System Default Treatment</p>
                <p>This is a system default tax treatment. Some fields cannot be modified to maintain system integrity.</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              ✕ Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || validationErrors.length > 0 || progress < 100}
              className="w-full sm:w-auto order-1 sm:order-2 min-w-[140px] bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : progress < 100 ? (
                <span className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Complete Required Fields</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{isEditing ? '✏️ Update Treatment' : '➕ Create Treatment'}</span>
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};