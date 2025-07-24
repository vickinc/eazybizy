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
import { 
  TaxTreatmentFormData,
  TAX_CATEGORIES,
  TAX_APPLICABILITIES,
  TaxApplicability
} from "@/types/taxTreatment.types";
import { useTaxTreatmentsOperations, useTaxTreatments } from "@/hooks/useTaxTreatmentsAPI";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import InfoIcon from "lucide-react/dist/esm/icons/info";
import CheckCircleIcon from "lucide-react/dist/esm/icons/check-circle";
import AlertCircleIcon from "lucide-react/dist/esm/icons/alert-circle";
import PlusIcon from "lucide-react/dist/esm/icons/plus";
import ChevronDownIcon from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUpIcon from "lucide-react/dist/esm/icons/chevron-up";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Tag from "lucide-react/dist/esm/icons/tag";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import Settings from "lucide-react/dist/esm/icons/settings";

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
  const isEditing = !!editingAccount;

  // Tax Treatment API operations
  const { createTreatment } = useTaxTreatmentsOperations();
  
  // Fetch real tax treatments from database
  const { data: taxTreatmentsResponse, isLoading: isLoadingTreatments, error: treatmentsError } = useTaxTreatments({
    take: 1000
    // Remove isActive filter temporarily to see if we get any data
  });

  // Log any errors
  React.useEffect(() => {
    if (treatmentsError) {
      console.error('Error fetching tax treatments:', treatmentsError);
    }
  }, [treatmentsError]);
  
  // Get active tax treatments and format them for the dropdown
  const taxTreatments = useMemo(() => {
    console.log('Tax Treatments Response:', taxTreatmentsResponse);
    if (!taxTreatmentsResponse?.data) {
      console.log('No tax treatments data found');
      return [];
    }
    console.log('Raw tax treatments data:', taxTreatmentsResponse.data);
    
    // Filter for active treatments since we removed the API filter
    const activeData = taxTreatmentsResponse.data.filter(treatment => treatment.isActive);
    console.log('Active tax treatments:', activeData);
    
    const formatted = activeData.map(treatment => ({
      value: treatment.name,
      label: treatment.name,
      description: treatment.description,
      rate: treatment.rate,
      code: treatment.code,
      isCustom: !treatment.isDefault
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
    
    console.log('Formatted tax treatments for dropdown:', formatted);
    return formatted;
  }, [taxTreatmentsResponse?.data]);

  // Clear invalid tax treatment selection when treatments are loaded
  React.useEffect(() => {
    if (formData.vat && taxTreatments.length > 0) {
      const selectedTreatment = taxTreatments.find(t => t.value === formData.vat);
      if (!selectedTreatment) {
        // Clear invalid selection
        onFormInputChange('vat', '');
      }
    }
  }, [formData.vat, taxTreatments, onFormInputChange]);

  // Tax Treatment Form State
  const [showCreateTaxTreatment, setShowCreateTaxTreatment] = React.useState(false);
  const [taxTreatmentFormData, setTaxTreatmentFormData] = React.useState<TaxTreatmentFormData>({
    code: '',
    name: '',
    description: '',
    rate: '',
    category: '',
    applicability: [],
    isActive: true
  });

  // Calculate form progress
  const requiredFields = ['code', 'name', 'type', 'category', 'vat', 'accountType'];
  const completedFields = requiredFields.filter(field => formData[field as keyof ChartOfAccountFormData]?.toString().trim());
  const progress = Math.round((completedFields.length / requiredFields.length) * 100);

  // Handle tax treatment form changes
  const handleTaxTreatmentChange = (field: keyof TaxTreatmentFormData, value: any) => {
    setTaxTreatmentFormData(prev => ({...prev, [field]: value}));
  };

  // Handle tax treatment applicability changes
  const handleTaxApplicabilityChange = (applicability: TaxApplicability, checked: boolean) => {
    const current = taxTreatmentFormData.applicability || [];
    if (checked) {
      handleTaxTreatmentChange('applicability', [...current, applicability]);
    } else {
      handleTaxTreatmentChange('applicability', current.filter(app => app !== applicability));
    }
  };

  // Handle creating new tax treatment
  const handleCreateTaxTreatment = async () => {
    // Validate required fields
    if (!taxTreatmentFormData.code || !taxTreatmentFormData.name || !taxTreatmentFormData.description || !taxTreatmentFormData.rate || !taxTreatmentFormData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!taxTreatmentFormData.applicability || taxTreatmentFormData.applicability.length === 0) {
      toast.error('Please select at least one applicability option');
      return;
    }

    try {
      // Create the tax treatment in the database
      const newTreatment = await createTreatment.mutateAsync(taxTreatmentFormData);
      
      // Create the display name for the new tax treatment
      const newTaxTreatmentName = `${taxTreatmentFormData.name} ${taxTreatmentFormData.rate}%`;
      
      // Add it to the form
      onFormInputChange('vat', newTaxTreatmentName);
      
      // Show success message
      toast.success(`Tax treatment "${taxTreatmentFormData.name}" created successfully`);
      
      // Reset and close the form
      setTaxTreatmentFormData({
        code: '',
        name: '',
        description: '',
        rate: '',
        category: '',
        applicability: [],
        isActive: true
      });
      setShowCreateTaxTreatment(false);
    } catch (error) {
      console.error('Error creating tax treatment:', error);
      toast.error('Failed to create tax treatment');
    }
  };

  // Reset tax treatment form when main dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setShowCreateTaxTreatment(false);
      setTaxTreatmentFormData({
        code: '',
        name: '',
        description: '',
        rate: '',
        category: '',
        applicability: [],
        isActive: true
      });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
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
              {isEditing ? '✏️ Edit Account' : '➕ Add New Account'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {isEditing 
              ? 'Update the account details below to modify your chart of accounts.' 
              : 'Create a new account by filling out the required information. Fields marked with * are required.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onFormSubmit} className="space-y-4">
          {/* Section 1: Basic Information */}
          <Card className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Code */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium flex items-center space-x-1">
                  <span>Account Code</span>
                  <span className="text-red-500">*</span>
                  {formData.code && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <Input
                  id="code"
                  placeholder="e.g., 4000"
                  value={formData.code}
                  onChange={(e) => onFormInputChange('code', e.target.value)}
                  className="font-mono text-lg bg-lime-50 border-lime-200 focus:bg-white"
                  maxLength={4}
                />
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs font-medium text-gray-700 mb-1">Code Range Guidelines:</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>• Assets: 1000-1999</div>
                    <div>• Liabilities & Equity: 2000-2999</div>
                    <div>• Revenue: 3000-3999</div>
                    <div>• Expenses: 4000-4999</div>
                  </div>
                </div>
              </div>

              {/* Account Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center space-x-1">
                  <span>Account Name</span>
                  <span className="text-red-500">*</span>
                  {formData.name && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Office Supplies"
                  value={formData.name}
                  onChange={(e) => onFormInputChange('name', e.target.value)}
                  maxLength={200}
                  className="text-lg bg-lime-50 border-lime-200 focus:bg-white"
                />
                <p className="text-xs text-muted-foreground">
                  Descriptive name for the account (max 200 characters)
                </p>
              </div>
            </div>
          </Card>

          {/* Section 2: Classification */}
          <Card className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Account Classification</h3>

            <div className="space-y-6">
              {/* Account Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium flex items-center space-x-1">
                  <span>Account Type</span>
                  <span className="text-red-500">*</span>
                  {formData.type && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => onFormInputChange('type', value)}
                >
                  <SelectTrigger className="h-12 bg-lime-50 border-lime-200 focus:bg-white">
                    <SelectValue placeholder="Choose the main account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center space-x-2 py-2">
                          <span className="font-medium">{type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.type && (
                  <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <InfoIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-900 mb-1">
                        {formData.type} Account
                      </p>
                      <p className="text-xs text-green-700">
                        {ACCOUNT_TYPE_DESCRIPTIONS[formData.type]}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium flex items-center space-x-1">
                  <span>Account Category</span>
                  <span className="text-red-500">*</span>
                  {formData.category && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => onFormInputChange('category', value)}
                  disabled={!formData.type}
                >
                  <SelectTrigger className="h-12 bg-lime-50 border-lime-200 focus:bg-white disabled:bg-gray-100 disabled:border-gray-200">
                    <SelectValue placeholder={!formData.type ? "Please select account type first" : "Choose a specific category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type && ACCOUNT_CATEGORIES_BY_TYPE[formData.type]?.map(category => (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center space-x-2 py-1">
                          <span>{category}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.type ? (
                  <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircleIcon className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      Please select an account type above to see available categories
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Select the specific category within {formData.type} accounts
                  </p>
                )}
              </div>

              {/* Account Classification */}
              <div className="space-y-2">
                <Label htmlFor="accountType" className="text-sm font-medium flex items-center space-x-1">
                  <span>Classification</span>
                  <span className="text-red-500">*</span>
                  {formData.accountType && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <Select 
                  value={formData.accountType} 
                  onValueChange={(value) => onFormInputChange('accountType', value)}
                >
                  <SelectTrigger className="h-12 bg-lime-50 border-lime-200 focus:bg-white">
                    <SelectValue placeholder="How will this account be used?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Detail">
                      <div className="flex flex-col items-start py-2">
                        <span className="font-medium">📝 Detail Account</span>
                        <span className="text-xs text-muted-foreground">
                          For posting transactions (most common)
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Header">
                      <div className="flex flex-col items-start py-2">
                        <span className="font-medium">📁 Header Account</span>
                        <span className="text-xs text-muted-foreground">
                          For grouping and organization only
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formData.accountType && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs text-gray-700">
                      {formData.accountType === 'Detail' 
                        ? '✅ This account can be used for journal entries and transactions'
                        : '🗂️ This account will only be used for organizing other accounts'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Section 3: Tax Treatment */}
          <Card className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Tax Treatment</h3>

            <div className="space-y-6">
              {/* Tax Treatment Selection */}
              <div className="space-y-2">
                <Label htmlFor="vat" className="text-sm font-medium flex items-center space-x-1">
                  <span>Tax Treatment</span>
                  <span className="text-red-500">*</span>
                  {formData.vat && (
                    <CheckCircleIcon className="h-4 w-4 text-green-500 ml-2" />
                  )}
                </Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.vat} 
                    onValueChange={(value) => onFormInputChange('vat', value)}
                    disabled={isLoadingTreatments}
                  >
                    <SelectTrigger className="h-12 flex-1 bg-lime-50 border-lime-200 focus:bg-white disabled:bg-gray-100 disabled:border-gray-200">
                      <SelectValue placeholder={isLoadingTreatments ? "Loading tax treatments..." : "How is this account taxed?"} />
                    </SelectTrigger>
                    <SelectContent>
                      {taxTreatments.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          {isLoadingTreatments ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              <span>Loading tax treatments...</span>
                            </div>
                          ) : (
                            <>
                              <p className="mb-2">No tax treatments found</p>
                              <p className="text-xs">Create your first tax treatment using the button below</p>
                            </>
                          )}
                        </div>
                      ) : (
                        taxTreatments.map(treatment => (
                          <SelectItem key={treatment.code} value={treatment.value}>
                            <div className="flex flex-col items-start py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{treatment.label}</span>
                                {treatment.rate > 0 && (
                                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                    {treatment.rate}%
                                  </Badge>
                                )}
                                {treatment.isCustom && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    Custom
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {treatment.description.length > 60 ? `${treatment.description.substring(0, 60)}...` : treatment.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateTaxTreatment(!showCreateTaxTreatment)}
                    className="h-12 px-3 bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-sm font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create New
                  </Button>
                </div>
                {(() => {
                  // Only show preview if the selected value exists in our tax treatments
                  const selectedTreatment = taxTreatments.find(t => t.value === formData.vat);
                  
                  if (formData.vat && selectedTreatment) {
                    return (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-xs text-purple-700">
                          💰 Selected: <strong>{selectedTreatment.label}</strong>
                          {selectedTreatment.rate > 0 ? ` (${selectedTreatment.rate}%)` : ''}
                        </p>
                      </div>
                    );
                  }
                  
                  // Show warning if there's a value but no matching treatment
                  if (formData.vat && !selectedTreatment) {
                    return (
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <p className="text-xs text-amber-700">
                          ⚠️ Previously selected tax treatment "{formData.vat}" is no longer available. Please select a new one.
                        </p>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
              </div>

              {/* Inline Create Tax Treatment Form */}
              <Collapsible open={showCreateTaxTreatment} onOpenChange={setShowCreateTaxTreatment}>
                <CollapsibleContent>
                  <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <PlusIcon className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-medium text-blue-900">Create New Tax Treatment</h4>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCreateTaxTreatment(false)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {showCreateTaxTreatment ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tax-code" className="text-sm font-medium text-blue-900">
                            Tax Code *
                          </Label>
                          <Input
                            id="tax-code"
                            placeholder="e.g., TAX22"
                            value={taxTreatmentFormData.code}
                            onChange={(e) => handleTaxTreatmentChange('code', e.target.value.toUpperCase())}
                            className="bg-lime-50 border-lime-200 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tax-rate" className="text-sm font-medium text-blue-900">
                            Tax Rate (%) *
                          </Label>
                          <Input
                            id="tax-rate"
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            max="100"
                            value={taxTreatmentFormData.rate}
                            onChange={(e) => handleTaxTreatmentChange('rate', e.target.value)}
                            className="bg-lime-50 border-lime-200 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax-name" className="text-sm font-medium text-blue-900">
                          Display Name *
                        </Label>
                        <Input
                          id="tax-name"
                          placeholder="e.g., Value Added Tax"
                          value={taxTreatmentFormData.name}
                          onChange={(e) => handleTaxTreatmentChange('name', e.target.value)}
                          className="bg-lime-50 border-lime-200 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax-description" className="text-sm font-medium text-blue-900">
                          Description *
                        </Label>
                        <Textarea
                          id="tax-description"
                          placeholder="Describe when this tax treatment applies..."
                          rows={2}
                          value={taxTreatmentFormData.description}
                          onChange={(e) => handleTaxTreatmentChange('description', e.target.value)}
                          className="bg-lime-50 border-lime-200 focus:bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-blue-900">
                          Tax Category *
                        </Label>
                        <Select
                          value={taxTreatmentFormData.category}
                          onValueChange={(value) => handleTaxTreatmentChange('category', value)}
                        >
                          <SelectTrigger className="bg-lime-50 border-lime-200 focus:bg-white">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                <span className="capitalize">{category}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-blue-900">
                          Applicable To ({(taxTreatmentFormData.applicability || []).length} selected)
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          {TAX_APPLICABILITIES.map(applicability => (
                            <div key={applicability} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tax-${applicability}`}
                                checked={(taxTreatmentFormData.applicability || []).includes(applicability)}
                                onCheckedChange={(checked) => handleTaxApplicabilityChange(applicability, checked as boolean)}
                              />
                              <Label htmlFor={`tax-${applicability}`} className="text-xs text-blue-800 capitalize">
                                {applicability}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end space-x-2 pt-2 border-t border-blue-200">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateTaxTreatment(false)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-100"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateTaxTreatment}
                          disabled={!taxTreatmentFormData.code || !taxTreatmentFormData.name || !taxTreatmentFormData.description || !taxTreatmentFormData.rate || !taxTreatmentFormData.category || createTreatment.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {createTreatment.isPending ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Creating...</span>
                            </div>
                          ) : (
                            <>
                              <PlusIcon className="h-3 w-3 mr-1" />
                              Add & Select
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </Card>

          {/* Section 4: Advanced Settings (Collapsible) */}
          <Card className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Advanced Settings</h3>

            <div className="space-y-6">
              {/* Related Vendor */}
              <div className="space-y-2">
                <Label htmlFor="relatedVendor" className="text-sm font-medium">
                  Related Vendor
                </Label>
                <Input
                  id="relatedVendor"
                  placeholder="e.g., Tax Authority, Supplier Name"
                  value={formData.relatedVendor}
                  onChange={(e) => onFormInputChange('relatedVendor', e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Link this account to a specific vendor or counterparty
                </p>
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
                    <SelectValue placeholder={!formData.type ? "Please select account type first" : "Choose IFRS classification (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">🚫 None</span>
                    </SelectItem>
                    {formData.type && ACCOUNT_SUBCATEGORIES_BY_TYPE[formData.type]?.map(subcategory => (
                      <SelectItem key={subcategory} value={subcategory}>
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">📊 {subcategory}</span>
                          <span className="text-xs text-muted-foreground">
                            IFRS-compliant classification
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    IFRS subcategories ensure proper classification in financial statements and affect current vs non-current asset/liability classification.
                  </p>
                </div>
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
                      <span className="text-muted-foreground">🚫 None</span>
                    </SelectItem>
                    {Object.entries(IFRS_REFERENCES).map(([code, description]) => (
                      <SelectItem key={code} value={code}>
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">📋 {code}</span>
                          <span className="text-xs text-muted-foreground">
                            {description.length > 60 ? `${description.substring(0, 60)}...` : description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.ifrsReference && (
                  <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <InfoIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <p className="text-xs text-green-700 font-medium">
                        📋 {formData.ifrsReference}: {IFRS_REFERENCES[formData.ifrsReference as keyof typeof IFRS_REFERENCES]}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        This account will follow the disclosure and measurement requirements of this IFRS standard.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Summary Section */}
          <Card className="p-3 bg-gray-50 border-dashed">
            <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
            
            {/* Progress Card */}
            {!isEditing && (
              <div className="mb-4 p-3 bg-lime-50 border border-lime-200 rounded-lg">
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
            
            {progress < 100 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-2">Complete all required fields to proceed</p>
                <p className="text-xs text-gray-500">
                  Missing: {requiredFields.filter(field => !formData[field as keyof ChartOfAccountFormData]?.toString().trim()).join(', ')}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Code:</span>
                  <span className="font-mono font-medium">{formData.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Name:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span>{formData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="text-right">{formData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax Treatment:</span>
                  <span className="text-right">{formData.vat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Classification:</span>
                  <span>{formData.accountType}</span>
                </div>
              </div>
            )}
          </Card>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              ✕ Cancel
            </Button>
            <Button 
              type="submit"
              disabled={progress < 100}
              className="w-full sm:w-auto order-1 sm:order-2 min-w-[140px] bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700"
            >
              {progress < 100 ? (
                <span className="flex items-center space-x-2">
                  <AlertCircleIcon className="h-4 w-4" />
                  <span>Complete Required Fields</span>
                </span>
              ) : isEditing ? (
                <span className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Update Account</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Create Account</span>
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};