import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, ChevronDown } from 'lucide-react';
import { BookkeepingEntry, Invoice, Product, Company } from '@/types';

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
  type: 'income' | 'expense';
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

interface UtilityProps {
  formatLargeCurrency: (amount: number, currency?: string) => string;
  getCOGSCurrency: (entry: BookkeepingEntry) => string;
}

interface AddEditEntryDialogProps {
  dialogProps: DialogProps;
  formProps: FormProps;
  dataProps: DataProps;
  invoiceSearchProps: InvoiceSearchProps;
  actionProps: ActionProps;
  utilityProps: UtilityProps;
}

export const AddEditEntryDialog: React.FC<AddEditEntryDialogProps> = ({
  dialogProps,
  formProps,
  dataProps,
  invoiceSearchProps,
  actionProps,
  utilityProps
}) => {
  const { open, onOpenChange } = dialogProps;
  const { entryFormData, editingEntry, updateEntryFormData } = formProps;
  const { companies, invoices, filteredInvoicesForDropdown, formSelectedLinkedIncome, formCogsSummary } = dataProps;
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{editingEntry ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
          <DialogDescription>
            {editingEntry ? 'Update the bookkeeping entry details.' : 'Create a new revenue or expense entry.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto flex-1">
          {/* Company Selection - Move to Top */}
          <div>
            <Label>Company *</Label>
            <Select value={entryFormData.companyId} onValueChange={(value) => updateEntryFormData('companyId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.filter(c => c.status === 'Active').map(company => (
                  <SelectItem key={company.id} value={String(company.id)}>
                    {company.tradingName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Linked Revenue Information */}
          {entryFormData.linkedIncomeId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Label className="text-xs font-semibold text-blue-700 mb-2 block">
                Linked to Revenue Entry
              </Label>
              {(() => {
                const linkedIncome = formSelectedLinkedIncome;
                return linkedIncome ? (
                  <div className="text-sm space-y-1">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={entryFormData.type} onValueChange={(value: 'income' | 'expense') => updateEntryFormData('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={entryFormData.category} onValueChange={(value) => updateEntryFormData('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(entryFormData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Reference field - required for revenue, optional for expenses */}
          {entryFormData.type === 'income' && (
            <div>
              <Label>Reference *</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
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
                      <div className="px-3 py-2 text-gray-500 italic">
                        No invoices available. Create invoices in Sales → Invoices.
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
            </div>
          )}

          {/* Vendor Invoice field - only for expenses */}
          {entryFormData.type === 'expense' && (
            <div>
              <Label>Vendor Invoice *</Label>
              <Input
                value={entryFormData.vendorInvoice}
                onChange={(e) => updateEntryFormData('vendorInvoice', e.target.value)}
                placeholder="Vendor invoice number"
              />
            </div>
          )}
          
          <div>
            <Label>Description (Optional)</Label>
            <Input
              value={entryFormData.description}
              onChange={(e) => updateEntryFormData('description', e.target.value)}
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
                onChange={(e) => updateEntryFormData('amount', e.target.value)}
                placeholder="0.00"
              />
            </div>

          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={entryFormData.date}
                onChange={(e) => updateEntryFormData('date', e.target.value)}
              />
            </div>
            <div>
              <Label>Currency {entryFormData.selectedInvoiceData && '(Auto-filled from invoice)'}</Label>
              <Select value={entryFormData.currency} onValueChange={(value) => updateEntryFormData('currency', value)}>
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
          {/* Reference field - optional for expenses */}
          {entryFormData.type === 'expense' && (
            <div>
              <Label>Reference (Optional)</Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
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
                      <div className="px-3 py-2 text-gray-500 italic">
                        No invoices available. Create invoices in Sales → Invoices.
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
            </div>
          )}

          {/* Selected Invoice Information */}
          {entryFormData.selectedInvoiceData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Selected Invoice Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-blue-700">Invoice Details</Label>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Number:</span> {entryFormData.selectedInvoiceData.invoiceNumber}</p>
                    <p><span className="font-medium">Client:</span> {entryFormData.selectedInvoiceData.clientName}</p>
                    <p><span className="font-medium">Amount:</span> {formatLargeCurrency(entryFormData.selectedInvoiceData.totalAmount, entryFormData.selectedInvoiceData.currency)}</p>
                    <p><span className="font-medium">Status:</span> <Badge variant="outline">{entryFormData.selectedInvoiceData.status}</Badge></p>
                  </div>
                </div>
                
                {entryFormData.vendorData && (
                  <div>
                    <Label className="text-xs font-semibold text-blue-700">Vendor Information</Label>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Company:</span> {entryFormData.vendorData.companyName}</p>
                      <p><span className="font-medium">Payment Terms:</span> {entryFormData.vendorData.paymentTerms} days</p>
                      <p><span className="font-medium">Currency:</span> {entryFormData.vendorData.currency}</p>
                      <p><span className="font-medium">Payment Method:</span> {entryFormData.vendorData.paymentMethod}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {entryFormData.productData && entryFormData.productData.length > 0 && (
                <div className="mt-4">
                  <Label className="text-xs font-semibold text-blue-700">Related Products ({entryFormData.productData.length})</Label>
                  <div className="mt-2 space-y-1">
                    {entryFormData.productData.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
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
                      <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
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

          {/* COGS fields for revenue entries */}
          {entryFormData.type === 'income' && (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <Label>COGS Amount (Optional)</Label>
                  {entryFormData.selectedInvoiceData && entryFormData.cogs && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {formCogsSummary ? `Auto-calculated (${formCogsSummary.currency})` : 'Auto-calculated (USD)'}
                    </Badge>
                  )}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Cost of goods sold for this income"
                  value={entryFormData.cogs}
                  onChange={(e) => updateEntryFormData('cogs', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formCogsSummary
                    ? `Auto-calculated from product costs: ${formCogsSummary.currency} ${formCogsSummary.amount.toFixed(2)}. Expenses should be tracked in ${formCogsSummary.currency}. You can edit this value if needed.`
                    : "Enter the total cost for delivering this income (product costs, materials, etc.)."}
                </p>
              </div>
              <div>
                <Label>COGS Paid (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount of COGS already paid"
                  value={entryFormData.cogsPaid}
                  onChange={(e) => updateEntryFormData('cogsPaid', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Legacy field - Track actual expense payments separately in the expense entries.
                </p>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleCancelEdit}>
            Cancel
          </Button>
          <Button onClick={editingEntry ? handleUpdateEntry : handleCreateEntry}>
            {editingEntry ? 'Update Entry' : 'Create Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};