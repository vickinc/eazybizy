import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartOfAccount } from '@/types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types/bookkeeping.types';
import { ChartOfAccountsStorageService } from '@/services/storage';

interface Company {
  id: number;
  tradingName: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  currency: string;
}

interface EntryFormData {
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  companyId: string;
  reference: string;
  cogs: string;
  cogsPaid: string;
  chartOfAccountsId: string;
}

interface BookkeepingEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingEntry: boolean;
  entryFormData: EntryFormData;
  activeCompanies: Company[];
  availableInvoices: Invoice[];
  showInvoiceSelect: boolean;
  onSetShowInvoiceSelect: (show: boolean) => void;
  onEntryInputChange: (field: string, value: string) => void;
  onInvoiceReferenceChange: (value: string) => void;
  onDialogCancel: () => void;
  onEntrySubmit: (e?: any) => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

export const BookkeepingEntryDialog: React.FC<BookkeepingEntryDialogProps> = ({
  isOpen,
  onOpenChange,
  editingEntry,
  entryFormData,
  activeCompanies,
  availableInvoices,
  showInvoiceSelect,
  onSetShowInvoiceSelect,
  onEntryInputChange,
  onInvoiceReferenceChange,
  onDialogCancel,
  onEntrySubmit,
  formatCurrency
}) => {
  // Get Chart of Accounts for category selection
  const chartOfAccounts = useMemo(() => {
    return ChartOfAccountsStorageService.getAccounts();
  }, []);

  // Filter accounts based on entry type
  const availableCategories = useMemo(() => {
    const targetType = entryFormData.type === 'income' ? 'Revenue' : 'Expense';
    const accounts = chartOfAccounts.filter(account => 
      account.type === targetType && 
      account.isActive &&
      account.accountType === 'Detail' // Only detail accounts for posting
    );
    
    // If no Chart of Accounts available, fall back to hardcoded categories
    if (accounts.length === 0) {
      return entryFormData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    }
    
    return accounts;
  }, [chartOfAccounts, entryFormData.type]);

  const isUsingChartOfAccounts = availableCategories.length > 0 && typeof availableCategories[0] === 'object';

  // Handle category selection - sets both category name and Chart of Accounts ID
  const handleCategoryChange = (value: string) => {
    if (isUsingChartOfAccounts) {
      const selectedAccount = (availableCategories as ChartOfAccount[]).find(account => account.name === value);
      if (selectedAccount) {
        onEntryInputChange('category', value);
        onEntryInputChange('chartOfAccountsId', selectedAccount.id);
      }
    } else {
      onEntryInputChange('category', value);
      onEntryInputChange('chartOfAccountsId', ''); // Clear Chart of Accounts ID for legacy categories
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingEntry ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
          <DialogDescription>
            {editingEntry ? 'Update the bookkeeping entry details.' : 'Create a new income or expense entry.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={entryFormData.type} onValueChange={(value) => onEntryInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={entryFormData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {isUsingChartOfAccounts ? (
                    // Using Chart of Accounts
                    (availableCategories as ChartOfAccount[]).map(account => (
                      <SelectItem key={account.id} value={account.name}>
                        <div className="flex flex-col">
                          <span className="font-medium">{account.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {account.code} • {account.vat}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    // Fallback to hardcoded categories
                    (availableCategories as string[]).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))
                  )}
                  {isUsingChartOfAccounts && availableCategories.length === 0 && (
                    <SelectItem value="no-accounts" disabled className="text-gray-500 italic">
                      No {entryFormData.type} accounts found. Add accounts in Chart of Accounts.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {isUsingChartOfAccounts && (
                <p className="text-xs text-muted-foreground mt-1">
                  Categories from your Chart of Accounts. 
                  <a href="/accounting/bookkeeping/categories" className="text-blue-600 hover:underline ml-1">
                    Manage accounts
                  </a>
                </p>
              )}
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={entryFormData.description}
              onChange={(e) => onEntryInputChange('description', e.target.value)}
              placeholder="Detailed description of the transaction"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={entryFormData.amount}
                onChange={(e) => onEntryInputChange('amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={entryFormData.currency} onValueChange={(value) => onEntryInputChange('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={entryFormData.date}
                onChange={(e) => onEntryInputChange('date', e.target.value)}
              />
            </div>
            <div>
              <Label>Company</Label>
              <Select value={entryFormData.companyId} onValueChange={(value) => onEntryInputChange('companyId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {activeCompanies.map(company => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.tradingName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Reference (Optional)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={showInvoiceSelect ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSetShowInvoiceSelect(!showInvoiceSelect)}
                  className="flex-shrink-0"
                >
                  {showInvoiceSelect ? "Custom" : "From Invoice"}
                </Button>
              </div>
              {showInvoiceSelect ? (
                <Select 
                  value={entryFormData.reference} 
                  onValueChange={onInvoiceReferenceChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Reference</SelectItem>
                    {availableInvoices.length === 0 ? (
                      <SelectItem value="no-invoices" disabled className="text-gray-500 italic">
                        {!entryFormData.companyId 
                          ? 'Select a company first'
                          : 'No paid or sent invoices found for selected company'
                        }
                      </SelectItem>
                    ) : (
                      availableInvoices.map(invoice => (
                        <SelectItem key={invoice.id} value={`Invoice ${invoice.invoiceNumber}`}>
                          Invoice {invoice.invoiceNumber} - {invoice.clientName} ({formatCurrency(invoice.totalAmount, invoice.currency)})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={entryFormData.reference}
                  onChange={(e) => onEntryInputChange('reference', e.target.value)}
                  placeholder="Invoice number, receipt, etc."
                />
              )}
            </div>
          </div>

          {/* COGS fields for income entries */}
          {entryFormData.type === 'income' && (
            <>
              <div>
                <Label>COGS Amount (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Cost of goods sold for this income"
                  value={entryFormData.cogs}
                  onChange={(e) => onEntryInputChange('cogs', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the projected cost for delivering this income.
                </p>
              </div>
              <div>
                <Label>COGS Paid (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount of COGS already paid"
                  value={entryFormData.cogsPaid}
                  onChange={(e) => onEntryInputChange('cogsPaid', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter how much of the COGS has already been paid.
                </p>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onDialogCancel}>
            Cancel
          </Button>
          <Button onClick={onEntrySubmit}>
            {editingEntry ? 'Update Entry' : 'Create Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};