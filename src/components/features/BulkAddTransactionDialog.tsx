import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDateForDisplay } from '@/utils';
import { BankAccount, DigitalWallet, BookkeepingEntry, Company } from '@/types';
import { BulkTransaction } from '@/services/business/transactionsBusinessService';
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Wallet from "lucide-react/dist/esm/icons/wallet";

const INCOME_CATEGORIES = [
  'Sales Revenue',
  'Service Revenue', 
  'Product Sales',
  'Consulting',
  'Licensing',
  'Interest Income',
  'Investment Returns',
  'Other Income'
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

interface BulkAddTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  bulkAddType: 'incoming' | 'outgoing';
  bulkTransactions: BulkTransaction[];
  bulkSelectedAccountId: string;
  bankAccounts: BankAccount[];
  digitalWallets: DigitalWallet[];
  linkableEntries: BookkeepingEntry[];
  companies: Company[];
  selectedCompany: number | 'all';
  formatCurrency: (amount: number, currency?: string) => string;
  setBulkSelectedAccountId: (accountId: string) => void;
  addBulkTransactionRow: () => void;
  removeBulkTransactionRow: (index: number) => void;
  updateBulkTransaction: (index: number, field: string, value: string) => void;
  handleBulkCreate: () => void;
}

export const BulkAddTransactionDialog: React.FC<BulkAddTransactionDialogProps> = ({
  open,
  onClose,
  bulkAddType,
  bulkTransactions,
  bulkSelectedAccountId,
  bankAccounts,
  digitalWallets,
  linkableEntries,
  companies,
  selectedCompany,
  formatCurrency,
  setBulkSelectedAccountId,
  addBulkTransactionRow,
  removeBulkTransactionRow,
  updateBulkTransaction,
  handleBulkCreate
}) => {
  const validTransactionCount = bulkTransactions.filter(t => 
    t.amount.trim() && (bulkAddType === 'incoming' ? t.paidBy.trim() : t.paidTo.trim())
  ).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] xl:max-w-[85vw] 2xl:max-w-[80vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Add {bulkAddType === 'incoming' ? 'Incoming' : 'Outgoing'} Transactions</DialogTitle>
          <DialogDescription>
            Quickly add multiple transactions to an account. Make sure to select the correct company and account first.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-hidden flex flex-col">
          {/* Header for account selection */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <Label htmlFor="bulk-account-select" className="text-base font-semibold text-gray-900 block mb-1">
                  Select Account for Transactions
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  All transactions will be recorded in the account you choose below.
                </p>
                <div className="max-w-2xl">
                  <Select
                    value={bulkSelectedAccountId}
                    onValueChange={setBulkSelectedAccountId}
                  >
                    <SelectTrigger id="bulk-account-select" className="h-9 bg-white border-blue-200 hover:border-blue-300 focus:border-blue-500">
                      <SelectValue placeholder="Choose an account..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-2 py-2">
                          <CreditCard className="h-4 w-4" />
                          Bank Accounts
                        </SelectLabel>
                        {bankAccounts
                          .filter(acc => selectedCompany === 'all' || acc.companyId === selectedCompany)
                          .map(acc => (
                            <SelectItem key={acc.id} value={acc.id} className="py-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{acc.bankName} - {acc.accountName}</span>
                                <span className="text-sm text-gray-500">
                                  {companies.find(c => c.id === acc.companyId)?.tradingName} • {acc.currency}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-2 py-2">
                          <Wallet className="h-4 w-4" />
                          Digital Wallets
                        </SelectLabel>
                        {digitalWallets
                          .filter(wallet => selectedCompany === 'all' || wallet.companyId === selectedCompany)
                          .map(wallet => (
                            <SelectItem key={wallet.id} value={wallet.id} className="py-3">
                              <div className="flex flex-col">
                                <span className="font-medium">{wallet.walletName}</span>
                                <span className="text-sm text-gray-500">
                                  {companies.find(c => c.id === wallet.companyId)?.tradingName} • {wallet.currency}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Table-style Form */}
          <div className="flex-1 overflow-y-auto">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 grid grid-cols-12 gap-3 text-sm font-medium text-gray-700">
              <div className="col-span-2">Link Entry</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-2">{bulkAddType === 'incoming' ? 'Paid By' : 'Paid To'}*</div>
              <div className="col-span-1">Amount*</div>
              <div className="col-span-1">Tax</div>
              <div className="col-span-1">Currency</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Description</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-200">
              {bulkTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Plus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No transactions added yet</p>
                  <Button onClick={addBulkTransactionRow} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Transaction
                  </Button>
                </div>
              ) : (
                bulkTransactions.map((transaction, index) => (
                  <div key={index} className="px-4 py-3 grid grid-cols-12 gap-3 border-b border-gray-200 hover:bg-gray-50 items-center">
                    {/* Link Entry */}
                    <div className="col-span-2">
                      <Select 
                        onValueChange={(value) => updateBulkTransaction(index, 'linkedEntryId', value === 'none' ? '' : value)}
                        value={transaction.linkedEntryId || 'none'}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select entry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No link</SelectItem>
                          {linkableEntries.length > 0 ? (
                            linkableEntries.map(entry => {
                              // Extract just the invoice number from descriptions like "Expense for Invoice INV-202506-0011 - Company Name"
                              const getCompactDescription = (desc: string) => {
                                // Look for invoice number pattern
                                const invoiceMatch = desc.match(/INV-[\d-]+/);
                                if (invoiceMatch) {
                                  return invoiceMatch[0];
                                }
                                // If no invoice pattern found, just take first 15 chars
                                return desc.length > 15 ? `${desc.substring(0, 15)}...` : desc;
                              };
                              
                              const compactDescription = getCompactDescription(entry.description);
                              return (
                                <SelectItem key={entry.id} value={entry.id} title={entry.description}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {compactDescription}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {formatCurrency(entry.amount, entry.currency)} • {formatDateForDisplay(entry.date)}
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="no-entries" disabled>
                              <span className="text-gray-400">No entries available</span>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date */}
                    <div className="col-span-1">
                      <Input
                        type="date"
                        value={transaction.date}
                        onChange={(e) => updateBulkTransaction(index, 'date', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Paid By/To */}
                    <div className="col-span-2">
                      <Input
                        placeholder={bulkAddType === 'incoming' ? 'Customer Name' : 'Vendor/Supplier'}
                        value={bulkAddType === 'incoming' ? transaction.paidBy : transaction.paidTo}
                        onChange={(e) => updateBulkTransaction(index, bulkAddType === 'incoming' ? 'paidBy' : 'paidTo', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Amount */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={transaction.amount}
                        onChange={(e) => updateBulkTransaction(index, 'amount', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Tax */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={transaction.tax}
                        onChange={(e) => updateBulkTransaction(index, 'tax', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Currency */}
                    <div className="col-span-1">
                      <Select 
                        value={transaction.currency || 'USD'} 
                        onValueChange={(value) => updateBulkTransaction(index, 'currency', value)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <Select
                        value={transaction.category}
                        onValueChange={(value) => updateBulkTransaction(index, 'category', value)}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {bulkAddType === 'incoming' ? (
                            <SelectGroup>
                              <SelectLabel>Income Categories</SelectLabel>
                              {INCOME_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectGroup>
                          ) : (
                            <SelectGroup>
                              <SelectLabel>Expense Categories</SelectLabel>
                              {EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div className="col-span-1">
                      <Input
                        placeholder="Brief description"
                        value={transaction.description}
                        onChange={(e) => updateBulkTransaction(index, 'description', e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addBulkTransactionRow}
                        className="text-green-600 border-green-200 hover:bg-green-50 p-1 h-8 w-8 rounded-md"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeBulkTransactionRow(index)}
                        className="text-red-600 border-red-200 hover:bg-red-50 p-1 h-8 w-8 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-auto pt-4 border-t bg-gray-50 -mx-6 px-6 -mb-6 pb-4 rounded-b-lg">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">{bulkTransactions.length}</span>
              <span className="ml-1">transaction{bulkTransactions.length === 1 ? '' : 's'} ready</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button 
                onClick={handleBulkCreate}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
              >
                Create {validTransactionCount} Transaction{validTransactionCount === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};