import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import {
  FixedAsset,
  FixedAssetFormData,
  ASSET_CATEGORIES,
  DEPRECIATION_METHODS
} from '@/types/fixedAssets.types';

interface FixedAssetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FixedAssetFormData;
  editingAsset: FixedAsset | null;
  onFormInputChange: (field: keyof FixedAssetFormData, value: unknown) => void;
  onFormSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  getFieldError: (field: keyof FixedAssetFormData) => string | undefined;
  hasFieldError: (field: keyof FixedAssetFormData) => boolean;
  isSubmitting: boolean;
}

export const FixedAssetDialog: React.FC<FixedAssetDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  editingAsset,
  onFormInputChange,
  onFormSubmit,
  onCancel,
  getFieldError,
  hasFieldError,
  isSubmitting
}) => {
  const formatDepreciationMethod = (method: string): string => {
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const calculateDepreciationPreview = () => {
    const cost = parseFloat(formData.acquisitionCost) || 0;
    const residual = parseFloat(formData.residualValue) || 0;
    const years = parseFloat(formData.usefulLifeYears) || 0;
    
    if (cost <= 0 || years <= 0) return 0;
    
    const depreciableAmount = cost - residual;
    
    switch (formData.depreciationMethod) {
      case 'straight_line':
        return depreciableAmount / years;
      case 'declining_balance':
        return cost * (1 / years);
      case 'double_declining':
        return cost * (2 / years);
      default:
        return 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={onFormSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingAsset ? 'Edit Fixed Asset' : 'Add New Fixed Asset'}
            </DialogTitle>
            <DialogDescription>
              {editingAsset 
                ? 'Update the details of the fixed asset.'
                : 'Enter the details for the new fixed asset.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="accounting">Accounting</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Asset Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => onFormInputChange('code', e.target.value)}
                    placeholder="e.g., COMP-001"
                    className={hasFieldError('code') ? 'border-red-500' : ''}
                  />
                  {hasFieldError('code') && (
                    <p className="text-sm text-red-500">{getFieldError('code')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => onFormInputChange('category', value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => onFormInputChange('name', e.target.value)}
                  placeholder="e.g., Dell Laptop XPS 13"
                  className={hasFieldError('name') ? 'border-red-500' : ''}
                />
                {hasFieldError('name') && (
                  <p className="text-sm text-red-500">{getFieldError('name')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => onFormInputChange('description', e.target.value)}
                  placeholder="Detailed description of the asset"
                  rows={3}
                  className={hasFieldError('description') ? 'border-red-500' : ''}
                />
                {hasFieldError('description') && (
                  <p className="text-sm text-red-500">{getFieldError('description')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => onFormInputChange('tags', e.target.value)}
                  placeholder="Enter tags separated by commas"
                />
                <p className="text-sm text-gray-500">
                  e.g., electronics, office, 2024-purchase
                </p>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="acquisitionDate">Acquisition Date *</Label>
                  <Input
                    id="acquisitionDate"
                    type="date"
                    value={formData.acquisitionDate}
                    onChange={(e) => onFormInputChange('acquisitionDate', e.target.value)}
                    className={hasFieldError('acquisitionDate') ? 'border-red-500' : ''}
                  />
                  {hasFieldError('acquisitionDate') && (
                    <p className="text-sm text-red-500">{getFieldError('acquisitionDate')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acquisitionCost">Acquisition Cost *</Label>
                  <Input
                    id="acquisitionCost"
                    type="number"
                    step="0.01"
                    value={formData.acquisitionCost}
                    onChange={(e) => onFormInputChange('acquisitionCost', e.target.value)}
                    placeholder="0.00"
                    className={hasFieldError('acquisitionCost') ? 'border-red-500' : ''}
                  />
                  {hasFieldError('acquisitionCost') && (
                    <p className="text-sm text-red-500">{getFieldError('acquisitionCost')}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => onFormInputChange('supplier', e.target.value)}
                    placeholder="Supplier name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => onFormInputChange('invoiceNumber', e.target.value)}
                    placeholder="INV-12345"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Depreciation Settings</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depreciationMethod">Depreciation Method *</Label>
                    <Select
                      value={formData.depreciationMethod}
                      onValueChange={(value) => onFormInputChange('depreciationMethod', value)}
                    >
                      <SelectTrigger id="depreciationMethod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPRECIATION_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {formatDepreciationMethod(method)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="depreciationStartDate">Depreciation Start Date *</Label>
                    <Input
                      id="depreciationStartDate"
                      type="date"
                      value={formData.depreciationStartDate}
                      onChange={(e) => onFormInputChange('depreciationStartDate', e.target.value)}
                      className={hasFieldError('depreciationStartDate') ? 'border-red-500' : ''}
                    />
                    {hasFieldError('depreciationStartDate') && (
                      <p className="text-sm text-red-500">{getFieldError('depreciationStartDate')}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="usefulLifeYears">Useful Life (Years) *</Label>
                    <Input
                      id="usefulLifeYears"
                      type="number"
                      step="0.5"
                      value={formData.usefulLifeYears}
                      onChange={(e) => onFormInputChange('usefulLifeYears', e.target.value)}
                      placeholder="5"
                      className={hasFieldError('usefulLifeYears') ? 'border-red-500' : ''}
                    />
                    {hasFieldError('usefulLifeYears') && (
                      <p className="text-sm text-red-500">{getFieldError('usefulLifeYears')}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="residualValue">Residual Value *</Label>
                    <Input
                      id="residualValue"
                      type="number"
                      step="0.01"
                      value={formData.residualValue}
                      onChange={(e) => onFormInputChange('residualValue', e.target.value)}
                      placeholder="0.00"
                      className={hasFieldError('residualValue') ? 'border-red-500' : ''}
                    />
                    {hasFieldError('residualValue') && (
                      <p className="text-sm text-red-500">{getFieldError('residualValue')}</p>
                    )}
                  </div>
                </div>

                {formData.acquisitionCost && formData.usefulLifeYears && (
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Estimated annual depreciation: $
                      {calculateDepreciationPreview().toFixed(2)}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => onFormInputChange('location', e.target.value)}
                  placeholder="e.g., Main Office, Floor 2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => onFormInputChange('department', e.target.value)}
                  placeholder="e.g., IT Department"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => onFormInputChange('assignedTo', e.target.value)}
                  placeholder="Employee name or ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => onFormInputChange('notes', e.target.value)}
                  placeholder="Any additional information about the asset"
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="accounting" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Link this asset to your Chart of Accounts for automatic journal entry generation.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="assetAccountCode">Asset Account Code</Label>
                <Input
                  id="assetAccountCode"
                  value={formData.assetAccountCode}
                  onChange={(e) => onFormInputChange('assetAccountCode', e.target.value)}
                  placeholder="e.g., 1500 - Fixed Assets"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depreciationAccountCode">Depreciation Expense Account Code</Label>
                <Input
                  id="depreciationAccountCode"
                  value={formData.depreciationAccountCode}
                  onChange={(e) => onFormInputChange('depreciationAccountCode', e.target.value)}
                  placeholder="e.g., 5100 - Depreciation Expense"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accumulatedDepreciationAccountCode">Accumulated Depreciation Account Code</Label>
                <Input
                  id="accumulatedDepreciationAccountCode"
                  value={formData.accumulatedDepreciationAccountCode}
                  onChange={(e) => onFormInputChange('accumulatedDepreciationAccountCode', e.target.value)}
                  placeholder="e.g., 1510 - Accumulated Depreciation"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? 'Saving...' 
                : editingAsset ? 'Update Asset' : 'Add Asset'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};