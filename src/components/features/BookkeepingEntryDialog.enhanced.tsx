import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types/bookkeeping.types';
import { bookkeepingApiService } from '@/services/api/bookkeepingApiService';

interface Company {
  id: number;
  tradingName: string;
  legalName?: string;
}

interface BookkeepingEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  subcategory?: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  companyId: number;
  reference?: string;
  notes?: string;
  accountId?: string;
  accountType: 'BANK' | 'WALLET' | 'CASH' | 'CREDIT_CARD';
}

interface EntryFormData {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  companyId: number;
  reference: string;
  notes: string;
  accountId: string;
  accountType: 'BANK' | 'WALLET' | 'CASH' | 'CREDIT_CARD';
}

interface BookkeepingEntryDialogEnhancedProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingEntry?: BookkeepingEntry | null;
  companies: Company[];
  onEntryCreated?: (entry: BookkeepingEntry) => void;
  onEntryUpdated?: (entry: BookkeepingEntry) => void;
  initialCompanyId?: number;
}

export const BookkeepingEntryDialogEnhanced: React.FC<BookkeepingEntryDialogEnhancedProps> = ({
  isOpen,
  onOpenChange,
  editingEntry = null,
  companies,
  onEntryCreated,
  onEntryUpdated,
  initialCompanyId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EntryFormData>({
    type: 'EXPENSE',
    category: '',
    subcategory: '',
    description: '',
    amount: 0,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    companyId: initialCompanyId || (companies[0]?.id || 0),
    reference: '',
    notes: '',
    accountId: '',
    accountType: 'BANK'
  });

  // Reset form when dialog opens/closes or editing entry changes
  useEffect(() => {
    if (isOpen) {
      if (editingEntry) {
        setFormData({
          type: editingEntry.type,
          category: editingEntry.category,
          subcategory: editingEntry.subcategory || '',
          description: editingEntry.description,
          amount: editingEntry.amount,
          currency: editingEntry.currency,
          date: editingEntry.date,
          companyId: editingEntry.companyId,
          reference: editingEntry.reference || '',
          notes: editingEntry.notes || '',
          accountId: editingEntry.accountId || '',
          accountType: editingEntry.accountType
        });
      } else {
        setFormData({
          type: 'EXPENSE',
          category: '',
          subcategory: '',
          description: '',
          amount: 0,
          currency: 'USD',
          date: new Date().toISOString().split('T')[0],
          companyId: initialCompanyId || (companies[0]?.id || 0),
          reference: '',
          notes: '',
          accountId: '',
          accountType: 'BANK'
        });
      }
    }
  }, [isOpen, editingEntry, initialCompanyId, companies]);

  const availableCategories = formData.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleInputChange = (field: keyof EntryFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    
    if (formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!formData.companyId) {
      toast.error('Please select a company');
      return;
    }

    setIsLoading(true);
    
    try {
      if (editingEntry) {
        // Update existing entry
        const updatedEntry = await bookkeepingApiService.updateEntry(editingEntry.id, formData);
        toast.success('Entry updated successfully');
        onEntryUpdated?.(updatedEntry);
      } else {
        // Create new entry
        const newEntry = await bookkeepingApiService.createEntry(formData);
        toast.success('Entry created successfully');
        onEntryCreated?.(newEntry);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error(editingEntry ? 'Failed to update entry' : 'Failed to create entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEntry ? 'Edit' : 'Add'} Bookkeeping Entry
          </DialogTitle>
          <DialogDescription>
            {editingEntry ? 'Update the bookkeeping entry details' : 'Enter the details for the new bookkeeping entry'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entry Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'INCOME' | 'EXPENSE') => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="companyId">Company *</Label>
              <Select
                value={formData.companyId.toString()}
                onValueChange={(value) => handleInputChange('companyId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.tradingName || company.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value: 'BANK' | 'WALLET' | 'CASH' | 'CREDIT_CARD') => handleInputChange('accountType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK">Bank Account</SelectItem>
                  <SelectItem value="WALLET">Digital Wallet</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="Invoice number, receipt, etc."
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the transaction"
              required
            />
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Input
              id="subcategory"
              value={formData.subcategory}
              onChange={(e) => handleInputChange('subcategory', e.target.value)}
              placeholder="Optional subcategory for detailed tracking"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or details"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingEntry ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingEntry ? 'Update Entry' : 'Create Entry'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookkeepingEntryDialogEnhanced;