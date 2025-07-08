import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChartOfAccount, 
  ChartOfAccountFormData, 
  ACCOUNT_TYPES, 
  ACCOUNT_TYPE_DESCRIPTIONS,
  ACCOUNT_CATEGORIES_BY_TYPE,
  ACCOUNT_SUBCATEGORIES_BY_TYPE,
  IFRS_REFERENCES 
} from "@/types/chartOfAccounts.types";
import { VATTypesIntegrationService } from "@/services/business/vatTypesIntegrationService";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";

interface CategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ChartOfAccountFormData;
  editingAccount: ChartOfAccount | null;
  onFormInputChange: (field: string, value: string) => void;
  onFormSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const CategoryDialog: React.FC<CategoryDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  editingAccount,
  onFormInputChange,
  onFormSubmit,
  onCancel
}) => {
  // Get dynamic VAT types (static + custom treatments)
  const vatTypes = useMemo(() => VATTypesIntegrationService.getAllVATTypes(), []);
  const isEditing = !!editingAccount;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Account' : 'Add New Account'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the account details below.' 
              : 'Create a new account in your chart of accounts.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Code */}
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                Account Code *
              </Label>
              <Input
                id="code"
                placeholder="e.g., 4000"
                value={formData.code}
                onChange={(e) => onFormInputChange('code', e.target.value)}
                className="font-mono"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground">
                4-digit numeric code (e.g., 1000-1999 for Assets)
              </p>
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Account Type *
              </Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => onFormInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center space-x-2">
                        <span>{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.type && (
                <div className="flex items-start space-x-2 p-2 bg-muted rounded-md">
                  <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {ACCOUNT_TYPE_DESCRIPTIONS[formData.type]}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Account Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Account Category *
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => onFormInputChange('category', value)}
              disabled={!formData.type}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account category" />
              </SelectTrigger>
              <SelectContent>
                {formData.type && ACCOUNT_CATEGORIES_BY_TYPE[formData.type]?.map(category => (
                  <SelectItem key={category} value={category}>
                    <div className="flex items-center space-x-2">
                      <span>{category}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.type && (
              <p className="text-xs text-muted-foreground">
                Please select an account type first
              </p>
            )}
          </div>

          {/* IFRS Subcategory */}
          <div className="space-y-2">
            <Label htmlFor="subcategory" className="text-sm font-medium">
              IFRS Subcategory
            </Label>
            <Select 
              value={formData.subcategory || 'none'} 
              onValueChange={(value) => onFormInputChange('subcategory', value === 'none' ? undefined : value)}
              disabled={!formData.type}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select IFRS subcategory (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">None</span>
                </SelectItem>
                {formData.type && ACCOUNT_SUBCATEGORIES_BY_TYPE[formData.type]?.map(subcategory => (
                  <SelectItem key={subcategory} value={subcategory}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{subcategory}</span>
                      <span className="text-xs text-muted-foreground">
                        IFRS-compliant classification for financial statements
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-start space-x-2 p-2 bg-blue-50 rounded-md">
              <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                IFRS subcategories help ensure proper classification in Balance Sheet and P&L statements. 
                This affects current vs non-current asset/liability classification and expense categorization.
              </p>
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Account Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g., Office Supplies"
              value={formData.name}
              onChange={(e) => onFormInputChange('name', e.target.value)}
              maxLength={200}
            />
          </div>

          {/* IFRS Reference */}
          <div className="space-y-2">
            <Label htmlFor="ifrsReference" className="text-sm font-medium">
              IFRS Standard Reference
            </Label>
            <Select 
              value={formData.ifrsReference || 'none'} 
              onValueChange={(value) => onFormInputChange('ifrsReference', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select applicable IFRS standard (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">None</span>
                </SelectItem>
                {Object.entries(IFRS_REFERENCES).map(([code, description]) => (
                  <SelectItem key={code} value={code}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{code}</span>
                      <span className="text-xs text-muted-foreground">
                        {description.length > 50 ? `${description.substring(0, 50)}...` : description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.ifrsReference && (
              <div className="flex items-start space-x-2 p-2 bg-green-50 rounded-md">
                <InfoIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <p className="text-xs text-green-700 font-medium">
                    {formData.ifrsReference}: {IFRS_REFERENCES[formData.ifrsReference as keyof typeof IFRS_REFERENCES]}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    This account will follow the disclosure and measurement requirements of this IFRS standard.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* VAT Treatment */}
          <div className="space-y-2">
            <Label htmlFor="vat" className="text-sm font-medium">
              VAT Treatment *
            </Label>
            <Select 
              value={formData.vat} 
              onValueChange={(value) => onFormInputChange('vat', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select VAT treatment" />
              </SelectTrigger>
              <SelectContent>
                {vatTypes.map(vat => {
                  const isCustom = VATTypesIntegrationService.isCustomVATTreatment(vat);
                  const description = VATTypesIntegrationService.getVATTypeDescription(vat);
                  const rate = VATTypesIntegrationService.getVATRateFromType(vat);
                  
                  return (
                    <SelectItem key={vat} value={vat}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{vat}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {description.length > 40 ? `${description.substring(0, 40)}...` : description}
                          </span>
                          {isCustom && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Custom
                            </Badge>
                          )}
                          {rate !== null && rate > 0 && (
                            <span className="text-xs font-medium text-green-600">
                              {rate}%
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Related Vendor */}
            <div className="space-y-2">
              <Label htmlFor="relatedVendor" className="text-sm font-medium">
                Related Vendor
              </Label>
              <Input
                id="relatedVendor"
                placeholder="e.g., Tax Authority"
                value={formData.relatedVendor}
                onChange={(e) => onFormInputChange('relatedVendor', e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Vendor or counterparty associated with this account
              </p>
            </div>

            {/* Account Classification */}
            <div className="space-y-2">
              <Label htmlFor="accountType" className="text-sm font-medium">
                Classification *
              </Label>
              <Select 
                value={formData.accountType} 
                onValueChange={(value) => onFormInputChange('accountType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Detail">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Detail</span>
                      <span className="text-xs text-muted-foreground">
                        Posting account for transactions
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Header">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Header</span>
                      <span className="text-xs text-muted-foreground">
                        Summary account for grouping
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="w-full sm:w-auto"
            >
              {isEditing ? 'Update Account' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};