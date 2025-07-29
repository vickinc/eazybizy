import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Search from "lucide-react/dist/esm/icons/search";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import FileText from "lucide-react/dist/esm/icons/file-text";
import ExternalLink from "lucide-react/dist/esm/icons/external-link";
import { BookkeepingEntry, Invoice, Product, Company } from '@/types';
import { ChartOfAccount } from '@/types/chartOfAccounts.types';
import { CategoryMode } from '@/contexts/CategoryModeContext';
import { ChartOfAccountsBusinessService } from '@/services/business/chartOfAccountsBusinessService';

interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
  website: string;
  paymentTerms: number;
  currency: string;
  paymentMethod: string;
  billingAddress: string;
  itemsServicesSold: string;
  notes: string;
  companyRegistrationNr: string;
  vatNr: string;
  vendorCountry: string;
  companyId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ExtendedEntryFormData {
  type: 'revenue' | 'expense';
  category: string;
  subcategory: string;
  amount: string;
  currency: string;
  description: string;
  date: string;
  companyId: string;
  reference: string;
  accountId: string;
  accountType: 'bank' | 'wallet';
  cogs: string;
  cogsPaid: string;
  selectedInvoiceData: Invoice | null;
  vendorData: Vendor | null;
  productData: Product[] | null;
  linkedIncomeId: string;
  vendorInvoice: string;
}

const INCOME_CATEGORIES = [
  'Sales Revenue',
  'Service Revenue', 
  'Product Sales',
  'Consulting',
  'Licensing',
  'Interest Revenue',
  'Investment Returns',
  'Other Revenue'
];

const EXPENSE_CATEGORIES = [
  'COGS',
  'Cost of Service',
  'Payroll and benefits',
  'Rent and utilities',
  'Supplies and equipment',
  'Marketing and advertising',
  'Insurance',
  'Taxes',
  'Travel and entertainment',
  'Professional services',
  'Inventory costs',
  'Debt payments',
  'Subscriptions and software',
  'Maintenance and repairs',
  'Other'
];

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormProps {
  entryFormData: ExtendedEntryFormData;
  editingEntry: BookkeepingEntry | null;
  updateEntryFormData: (field: string, value: string) => void;
}

interface DataProps {
  companies: Company[];
  invoices: Invoice[];
  filteredInvoicesForDropdown: Invoice[];
  formSelectedLinkedIncome?: BookkeepingEntry;
  formCogsSummary?: { amount: number; currency: string };
}

interface InvoiceSearchProps {
  invoiceSearchTerm: string | null;
  handleInvoiceSearchChange: (value: string) => void;
  handleInvoiceSearchFocus: () => void;
  handleCustomReferenceSelection: (reference: string) => void;
  handleInvoiceSelectionWithHide: (reference: string) => void;
  handleClearSelectedInvoice: () => void;
}

interface ActionProps {
  handleCancelEdit: () => void;
  handleCreateEntry: () => void;
  handleUpdateEntry: () => void;
}

interface CategoryProps {
  categoryMode: CategoryMode;
  chartOfAccounts: ChartOfAccount[];
}

interface UtilityProps {
  formatLargeCurrency: (amount: number, currency?: string) => string;
  getCOGSCurrency: (entry: BookkeepingEntry) => string;
}

interface AddEditEntryDialogProps {
  dialogProps: DialogProps;
  formProps: FormProps;
  dataProps: DataProps;
  categoryProps: CategoryProps;
  invoiceSearchProps: InvoiceSearchProps;
  actionProps: ActionProps;
  utilityProps: UtilityProps;
  selectedCompanyName?: string;
}

export const AddEditEntryDialog: React.FC<AddEditEntryDialogProps> = ({
  dialogProps,
  formProps,
  dataProps,
  categoryProps,
  invoiceSearchProps,
  actionProps,
  utilityProps,
  selectedCompanyName
}) => {
  const { open, onOpenChange } = dialogProps;
  const { entryFormData, editingEntry, updateEntryFormData } = formProps;
  const { companies, invoices, filteredInvoicesForDropdown, formSelectedLinkedIncome, formCogsSummary } = dataProps;
  const { categoryMode: globalCategoryMode, chartOfAccounts } = categoryProps;
  
  // Local state for in-dialog mode switching
  const [localCategoryMode, setLocalCategoryMode] = useState<CategoryMode>(globalCategoryMode);
  
  // Use local mode if it exists, otherwise global mode
  const effectiveCategoryMode = localCategoryMode;
  
  // Reset local mode when dialog opens/closes
  useEffect(() => {
    if (open) {
      setLocalCategoryMode(globalCategoryMode);
    }
  }, [open, globalCategoryMode]);

  // Clear category selection when mode changes to avoid invalid selections
  useEffect(() => {
    if (entryFormData.category) {
      const currentCategories = getCategories(entryFormData.type);
      const isCurrentCategoryValid = currentCategories.some(cat => cat.value === entryFormData.category);
      if (!isCurrentCategoryValid) {
        updateEntryFormData('category', '');
      }
    }
  }, [effectiveCategoryMode, entryFormData.type]);
  
  const { 
    invoiceSearchTerm, 
    handleInvoiceSearchChange, 
    handleInvoiceSearchFocus, 
    handleCustomReferenceSelection, 
    handleInvoiceSelectionWithHide, 
    handleClearSelectedInvoice 
  } = invoiceSearchProps;
  const { handleCancelEdit, handleCreateEntry, handleUpdateEntry } = actionProps;
  const { formatLargeCurrency, getCOGSCurrency } = utilityProps;

  // Get categories based on mode
  const getCategories = (type: 'revenue' | 'expense') => {
    if (effectiveCategoryMode === 'advanced' && Array.isArray(chartOfAccounts) && chartOfAccounts.length > 0) {
      // Use the business service to get the correct accounts by type
      const filteredAccounts = ChartOfAccountsBusinessService.getAccountsForBookkeeping(chartOfAccounts, type);

      // If we have filtered accounts, use them, otherwise fallback to simplified
      if (filteredAccounts.length > 0) {
        return filteredAccounts.map(account => {
          const accountCode = account.code || account.accountCode;
          const accountName = account.name || account.accountName;
          return {
            value: accountName,
            label: `${accountCode} - ${accountName}`
          };
        });
      }
    }
    
    // Use simplified categories (either in simplified mode or as fallback)
    const categories = type === 'revenue' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return categories.map(category => ({
      value: category,
      label: category
    }));
  };

  const availableCategories = getCategories(entryFormData.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingEntry ? 'Update the bookkeeping entry details' : 'Create a new revenue or expense entry'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Company Assignment Section */}
          {selectedCompanyName && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-yellow-800">Creating entry for:</Label>
                  <p className="text-lg font-semibold text-yellow-900">{selectedCompanyName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Linked Revenue Information */}
          {entryFormData.linkedIncomeId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                Linked Revenue Information
              </h3>
              {(() => {
                const linkedIncome = formSelectedLinkedIncome;
                return linkedIncome ? (
                  <div className="text-sm space-y-2">
                    <p><span className="font-medium">Revenue:</span> {linkedIncome.description}</p>
                    <p><span className="font-medium">Revenue Amount:</span> {formatLargeCurrency(linkedIncome.amount, linkedIncome.currency)}</p>
                    {linkedIncome.cogs && (
                      <p><span className="font-medium">COGS:</span> {formatLargeCurrency(linkedIncome.cogs, getCOGSCurrency(linkedIncome))}</p>
                    )}
                    <p><span className="font-medium">Current Expenses Paid:</span> {formatLargeCurrency((linkedIncome as any).totalLinkedExpenses, getCOGSCurrency(linkedIncome))}</p>
                    {linkedIncome.cogs ? (
                      <p><span className="font-medium text-black">Remaining A/P:</span> <span className="text-black">{formatLargeCurrency((linkedIncome as any).remainingAmount, getCOGSCurrency(linkedIncome))}</span></p>
                    ) : (
                      <p><span className="font-medium">Net Remaining:</span> {formatLargeCurrency(linkedIncome.amount - (linkedIncome as any).totalLinkedExpenses, linkedIncome.currency)}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Linked revenue entry not found</p>
                );
              })()}
            </div>
          )}

          {/* Basic Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type" className="text-sm font-medium">Type *</Label>
                <Select value={entryFormData.type} onValueChange={(value: 'revenue' | 'expense') => updateEntryFormData('type', value)}>
                  <SelectTrigger className="mt-1 bg-lime-50 border-lime-200 hover:bg-lime-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={entryFormData.date}
                  onChange={(e) => updateEntryFormData('date', e.target.value)}
                  className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${effectiveCategoryMode === 'simplified' ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      Simplified
                    </span>
                    <Switch
                      checked={effectiveCategoryMode === 'advanced'}
                      onCheckedChange={(checked) => setLocalCategoryMode(checked ? 'advanced' : 'simplified')}
                      className="data-[state=checked]:bg-green-600"
                    />
                    <span className={`text-xs ${effectiveCategoryMode === 'advanced' ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      Advanced
                    </span>
                  </div>
                </div>
                <Combobox
                  options={availableCategories}
                  value={entryFormData.category}
                  onValueChange={(value) => updateEntryFormData('category', value)}
                  placeholder="Select category"
                  searchPlaceholder="Search categories..."
                  emptyMessage="No category found."
                  className="mt-1 bg-lime-50 border-lime-200 hover:bg-lime-100"
                />
                {effectiveCategoryMode === 'simplified' && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Navigate to categories page
                        window.open('/accounting/bookkeeping/categories', '_blank');
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Switch to advanced categories
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      Use professional Chart of Accounts for more detailed categorization
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Description 
                <Badge variant="secondary" className="text-xs ml-2">Optional</Badge>
              </Label>
              <Input
                id="description"
                value={entryFormData.description}
                onChange={(e) => updateEntryFormData('description', e.target.value)}
                placeholder="Detailed description of the transaction"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide additional details about this entry for better record keeping.
              </p>
            </div>
          </div>

          {/* Financial Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
              Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium">Amount *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={entryFormData.amount}
                    onChange={(e) => updateEntryFormData('amount', e.target.value)}
                    placeholder="0.00"
                    className="pl-10 bg-lime-50 border-lime-200 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="currency" className="text-sm font-medium">
                  Currency *
                  {entryFormData.selectedInvoiceData && (
                    <Badge variant="secondary" className="text-xs ml-2">Auto-filled</Badge>
                  )}
                </Label>
                <Select value={entryFormData.currency} onValueChange={(value) => updateEntryFormData('currency', value)}>
                  <SelectTrigger className="mt-1 bg-lime-50 border-lime-200 hover:bg-lime-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {/* Revenue Reference Section - Revenue Only */}
          {entryFormData.type === 'revenue' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
                Revenue Reference
              </h3>
              
              <div>
                <Label htmlFor="reference" className="text-sm font-medium">Reference *</Label>
                <div className="relative mt-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="reference"
                      placeholder={entryFormData.selectedInvoiceData ? entryFormData.reference : "Search invoices or type custom reference..."}
                      value={entryFormData.selectedInvoiceData ? entryFormData.reference : invoiceSearchTerm === 'hidden' ? entryFormData.reference : invoiceSearchTerm}
                      onChange={(e) => handleInvoiceSearchChange(e.target.value)}
                      onFocus={handleInvoiceSearchFocus}
                      className="pl-10 pr-10 bg-lime-50 border-lime-200 focus:bg-white"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    {entryFormData.selectedInvoiceData && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={handleClearSelectedInvoice}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  
                  {/* Dropdown results */}
                  {!entryFormData.selectedInvoiceData && invoiceSearchTerm !== null && invoiceSearchTerm !== 'hidden' && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {/* Custom Reference Option */}
                      {invoiceSearchTerm && (
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b bg-blue-50"
                          onClick={() => handleCustomReferenceSelection(invoiceSearchTerm)}
                        >
                          <div className="font-medium text-blue-600">Use "{invoiceSearchTerm}" as custom reference</div>
                          <div className="text-xs text-gray-500">Click to use this text as your reference</div>
                        </div>
                      )}
                      
                      {/* Invoice Options */}
                      {invoices.length === 0 ? (
                        <div className="py-2 px-3 bg-blue-50 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-900">No invoices available</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open('/sales/invoices', '_blank')}
                              className="text-xs text-blue-600 hover:bg-blue-100 h-7 px-2"
                            >
                              Create invoice →
                            </Button>
                          </div>
                        </div>
                      ) : !entryFormData.companyId ? (
                        <div className="px-3 py-2 text-gray-500 italic">
                          Please select a company first to see related invoices.
                        </div>
                      ) : (
                        (() => {
                          const filteredInvoices = filteredInvoicesForDropdown;
                          
                          return filteredInvoices.length === 0 ? (
                            <div className="px-3 py-2 text-gray-500 italic">
                              {invoiceSearchTerm ? 'No invoices match your search' : 'No paid or sent invoices found for selected company'}
                            </div>
                          ) : (
                            <>
                              {filteredInvoices.length > 0 && (
                                <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b bg-gray-50">
                                  Available Invoices ({filteredInvoices.length})
                                </div>
                              )}
                              {filteredInvoices.map(invoice => (
                                <div
                                  key={invoice.id}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handleInvoiceSelectionWithHide(`Invoice ${invoice.invoiceNumber}`)}
                                >
                                  <div className="font-medium">Invoice {invoice.invoiceNumber} - {invoice.clientName}</div>
                                  <div className="text-sm text-gray-600">{formatLargeCurrency(invoice.totalAmount, invoice.currency)} • {invoice.status}</div>
                                  {invoice.items.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Products: {invoice.items.map(item => item.productName).join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Link this entry to an existing invoice or provide a custom reference for tracking.
                </p>
              </div>
            </div>
          )}

          {/* Vendor Information Section - Expense Only */}
          {entryFormData.type === 'expense' && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
                Vendor Information
                <Badge variant="secondary" className="text-xs ml-2">Optional</Badge>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vendorInvoice" className="text-sm font-medium">Vendor Invoice *</Label>
                  <Input
                    id="vendorInvoice"
                    value={entryFormData.vendorInvoice}
                    onChange={(e) => updateEntryFormData('vendorInvoice', e.target.value)}
                    placeholder="Vendor invoice number"
                    className="mt-1 bg-lime-50 border-lime-200 focus:bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the invoice number from your vendor for this expense.
                  </p>
                </div>
                <div>
                  <Label htmlFor="reference-expense" className="text-sm font-medium">
                    Reference
                    <Badge variant="secondary" className="text-xs ml-2">Optional</Badge>
                  </Label>
                  <div className="relative mt-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="reference-expense"
                        placeholder={entryFormData.selectedInvoiceData ? entryFormData.reference : "Search invoices or type custom reference..."}
                        value={entryFormData.selectedInvoiceData ? entryFormData.reference : invoiceSearchTerm === 'hidden' ? entryFormData.reference : invoiceSearchTerm}
                        onChange={(e) => handleInvoiceSearchChange(e.target.value)}
                        onFocus={handleInvoiceSearchFocus}
                        className="pl-10 pr-10"
                      />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      {entryFormData.selectedInvoiceData && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={handleClearSelectedInvoice}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                    
                    {/* Dropdown results for expense reference */}
                    {!entryFormData.selectedInvoiceData && invoiceSearchTerm !== null && invoiceSearchTerm !== 'hidden' && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {/* Custom Reference Option */}
                        {invoiceSearchTerm && (
                          <div
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b bg-blue-50"
                            onClick={() => handleCustomReferenceSelection(invoiceSearchTerm)}
                          >
                            <div className="font-medium text-blue-600">Use "{invoiceSearchTerm}" as custom reference</div>
                            <div className="text-xs text-gray-500">Click to use this text as your reference</div>
                          </div>
                        )}
                        
                        {/* Invoice Options */}
                        {invoices.length === 0 ? (
                          <div className="py-2 px-3 bg-blue-50 border-b">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-blue-900">No invoices available</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open('/sales/invoices', '_blank')}
                                className="text-xs text-blue-600 hover:bg-blue-100 h-7 px-2"
                              >
                                Create invoice →
                              </Button>
                            </div>
                          </div>
                        ) : !entryFormData.companyId ? (
                          <div className="px-3 py-2 text-gray-500 italic">
                            Please select a company first to see related invoices.
                          </div>
                        ) : (
                          (() => {
                            const filteredInvoices = filteredInvoicesForDropdown;
                            
                            return filteredInvoices.length === 0 ? (
                              <div className="px-3 py-2 text-gray-500 italic">
                                {invoiceSearchTerm ? 'No invoices match your search' : 'No paid or sent invoices found for selected company'}
                              </div>
                            ) : (
                              <>
                                {filteredInvoices.length > 0 && (
                                  <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b bg-gray-50">
                                    Available Invoices ({filteredInvoices.length})
                                  </div>
                                )}
                                {filteredInvoices.map(invoice => (
                                  <div
                                    key={invoice.id}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleInvoiceSelectionWithHide(`Invoice ${invoice.invoiceNumber}`)}
                                  >
                                    <div className="font-medium">Invoice {invoice.invoiceNumber} - {invoice.clientName}</div>
                                    <div className="text-sm text-gray-600">{formatLargeCurrency(invoice.totalAmount, invoice.currency)} • {invoice.status}</div>
                                    {invoice.items.length > 0 && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Products: {invoice.items.map(item => item.productName).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </>
                            );
                          })()
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional reference for tracking this expense entry.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected Invoice Information */}
          {entryFormData.selectedInvoiceData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                Selected Invoice Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-blue-700">Invoice Details</Label>
                  <div className="space-y-2 text-sm mt-2">
                    <p><span className="font-medium">Number:</span> {entryFormData.selectedInvoiceData.invoiceNumber}</p>
                    <p><span className="font-medium">Client:</span> {entryFormData.selectedInvoiceData.clientName}</p>
                    <p><span className="font-medium">Amount:</span> {formatLargeCurrency(entryFormData.selectedInvoiceData.totalAmount, entryFormData.selectedInvoiceData.currency)}</p>
                    <p><span className="font-medium">Status:</span> <Badge variant="outline">{entryFormData.selectedInvoiceData.status}</Badge></p>
                  </div>
                </div>
                
                {entryFormData.vendorData && (
                  <div>
                    <Label className="text-xs font-semibold text-blue-700">Vendor Information</Label>
                    <div className="space-y-2 text-sm mt-2">
                      <p><span className="font-medium">Company:</span> {entryFormData.vendorData.companyName}</p>
                      <p><span className="font-medium">Payment Terms:</span> {entryFormData.vendorData.paymentTerms} days</p>
                      <p><span className="font-medium">Currency:</span> {entryFormData.vendorData.currency}</p>
                      <p><span className="font-medium">Payment Method:</span> {entryFormData.vendorData.paymentMethod}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {entryFormData.productData && entryFormData.productData.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold text-blue-700">Related Products ({entryFormData.productData.length})</Label>
                  <div className="mt-2 space-y-2">
                    {entryFormData.productData.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between text-sm bg-white p-3 rounded border">
                        <div>
                          <span className="font-medium">{product.name}</span>
                          {product.description && <span className="text-gray-500 ml-2">- {product.description}</span>}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Price: {product.currency} {product.price.toFixed(2)}</div>
                          <div className="text-xs text-purple-600 font-medium">
                            Cost: {product.costCurrency} {product.cost.toFixed(2)}
                            {product.costCurrency !== product.currency && (
                              <span className="ml-1 text-orange-600">• Different currency</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {formCogsSummary && formCogsSummary.amount > 0 && (
                      <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded text-sm">
                        <span className="font-medium text-purple-700">
                          Total COGS: {formCogsSummary.currency} {formCogsSummary.amount.toFixed(2)}
                        </span>
                        <div className="text-xs text-purple-600 mt-1">
                          Calculated from product costs × quantities. Expenses should be tracked in {formCogsSummary.currency}.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COGS Information Section - Only for Revenue */}
          {entryFormData.type === 'revenue' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-lime-300 rounded-full"></div>
                Cost of Goods Sold (COGS)
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cogs" className="text-sm font-medium">
                    COGS Amount
                    {entryFormData.selectedInvoiceData && entryFormData.cogs && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 ml-2">
                        {formCogsSummary ? `Auto-calculated (${formCogsSummary.currency})` : 'Auto-calculated (USD)'}
                      </Badge>
                    )}
                  </Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="cogs"
                      type="number"
                      step="0.01"
                      placeholder="Cost of goods sold for this income"
                      value={entryFormData.cogs}
                      onChange={(e) => updateEntryFormData('cogs', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formCogsSummary
                      ? `Auto-calculated from product costs: ${formCogsSummary.currency} ${formCogsSummary.amount.toFixed(2)}. Expenses should be tracked in ${formCogsSummary.currency}. You can edit this value if needed.`
                      : "Enter the total cost for delivering this income (product costs, materials, etc.)."}
                  </p>
                </div>
                <div>
                  <Label htmlFor="cogsPaid" className="text-sm font-medium">
                    COGS Paid
                    <Badge variant="secondary" className="text-xs ml-2">Legacy</Badge>
                  </Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="cogsPaid"
                      type="number"
                      step="0.01"
                      placeholder="Amount of COGS already paid"
                      value={entryFormData.cogsPaid}
                      onChange={(e) => updateEntryFormData('cogsPaid', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Legacy field - Track actual expense payments separately in the expense entries.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            * Required fields
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancelEdit} className="min-w-[100px]">
              Cancel
            </Button>
            <Button 
              onClick={editingEntry ? handleUpdateEntry : handleCreateEntry}
              className="min-w-[120px] bg-green-600 hover:bg-green-700"
            >
              <Receipt className="h-4 w-4 mr-2" />
              {editingEntry ? 'Update Entry' : 'Create Entry'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};