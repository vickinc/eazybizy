import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Plus from "lucide-react/dist/esm/icons/plus";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Copy from "lucide-react/dist/esm/icons/copy";

interface BulkEntryFormData {
  description: string;
  amount: string;
  currency: string;
  category: string;
  vendorInvoice: string;
  date: string;
  reference: string;
  cogs: string;
  cogsCurrency: string;
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

interface BulkAddDialogProps {
  // Dialog state
  open: boolean;
  onClose: () => void;
  
  // Bulk add state
  bulkAddType: 'revenue' | 'expense';
  bulkEntries: BulkEntryFormData[];
  validBulkEntriesCount: number;
  
  // Event handlers
  updateBulkEntry: (index: number, field: string, value: string) => void;
  addBulkEntryRow: () => void;
  removeBulkEntryRow: (index: number) => void;
  handleCancelBulkAdd: () => void;
  handleBulkCreate: () => void;
}

export const BulkAddDialog: React.FC<BulkAddDialogProps> = ({
  open,
  onClose,
  bulkAddType,
  bulkEntries,
  validBulkEntriesCount,
  updateBulkEntry,
  addBulkEntryRow,
  removeBulkEntryRow,
  handleCancelBulkAdd,
  handleBulkCreate
}) => {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancelBulkAdd();
        }
      }}
    >
      <div className="bg-white w-full h-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[1200px] max-h-[95vh] sm:max-h-[90vh] md:max-h-[700px] rounded-lg shadow-2xl drop-shadow-2xl flex flex-col overflow-hidden" style={{boxShadow: '0 -25px 50px -12px rgba(0, 0, 0, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'}}>
        {/* Header */}
        <div className="flex-shrink-0 px-3 sm:px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  Bulk Add {bulkAddType === 'revenue' ? 'Revenue' : 'Expense'} Entries
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Add multiple {bulkAddType === 'revenue' ? 'revenue' : bulkAddType} entries at once. Fill in the required fields and use the + button to add more rows.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelBulkAdd}
              className="h-8 w-8 rounded-full hover:bg-gray-200"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Scrollable Entry Rows */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            <div className="space-y-2">
              {bulkEntries.map((entry, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded p-2 shadow-sm hover:shadow-md transition-all duration-200">
                  {/* Mobile-first responsive layout */}
                  <div className="space-y-3 md:space-y-0 md:grid md:gap-2 md:items-end" style={{gridTemplateColumns: bulkAddType === 'revenue' ? '2fr 3fr 1.5fr 1fr 1.5fr 1fr 2fr 1.5fr 100px' : '2fr 3fr 1.5fr 1fr 2fr 1.5fr 100px'}}>
                    
                    {/* Mobile: Group primary fields together */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:contents">
                      {/* First field - Vendor Invoice for expenses, Reference for income */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {bulkAddType === 'expense' ? 'Vendor Invoice*' : 'Reference*'} {index === 0 && <span className="text-gray-500">(Required)</span>}
                        </label>
                        <Input
                          placeholder={bulkAddType === 'expense' ? 'Invoice number' : 'Reference info'}
                          value={bulkAddType === 'expense' ? entry.vendorInvoice : entry.reference}
                          onChange={(e) => updateBulkEntry(index, bulkAddType === 'expense' ? 'vendorInvoice' : 'reference', e.target.value)}
                          className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Second field - Description (now optional) */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description {index === 0 && <span className="text-gray-500">(Optional)</span>}
                        </label>
                        <Input
                          placeholder="Enter description"
                          value={entry.description}
                          onChange={(e) => updateBulkEntry(index, 'description', e.target.value)}
                          className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    {/* Mobile: Group amount and currency fields */}
                    <div className="grid grid-cols-2 gap-3 md:contents">
                      {/* Amount field */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Amount* {index === 0 && <span className="text-gray-500">(Required)</span>}
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={entry.amount}
                          onChange={(e) => updateBulkEntry(index, 'amount', e.target.value)}
                          className="h-9 text-sm text-right border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Currency field */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Currency {index === 0 && <span className="text-gray-500">(Required)</span>}
                        </label>
                        <Select value={(entry as any).currency || 'USD'} onValueChange={(value) => updateBulkEntry(index, 'currency', value)}>
                          <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* COGS fields - only for revenue entries */}
                    {bulkAddType === 'revenue' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:contents">
                        {/* COGS field */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">COGS {index === 0 && <span className="text-gray-500">(Optional)</span>}</label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={(entry as any).cogs || ''}
                            onChange={(e) => updateBulkEntry(index, 'cogs', e.target.value)}
                            className="h-9 text-sm text-right border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        
                        {/* COGS Currency field - only show when COGS > 0.01 */}
                        {parseFloat((entry as any).cogs || '0') > 0.01 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">COGS Currency</label>
                            <Select value={(entry as any).cogsCurrency || 'USD'} onValueChange={(value) => updateBulkEntry(index, 'cogsCurrency', value)}>
                              <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                <SelectValue placeholder="Currency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {/* Placeholder div for grid alignment when COGS currency is not shown */}
                        {parseFloat((entry as any).cogs || '0') <= 0.01 && <div className="hidden md:block"></div>}
                      </div>
                    )}
                    {/* Mobile: Group category and date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:contents">
                      {/* Category field */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Category* {index === 0 && <span className="text-gray-500">(Required)</span>}
                        </label>
                        <Select value={entry.category} onValueChange={(value) => updateBulkEntry(index, 'category', value)}>
                          <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {(bulkAddType === 'revenue' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Date field */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <Input
                          type="date"
                          value={entry.date}
                          onChange={(e) => updateBulkEntry(index, 'date', e.target.value)}
                          className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* Actions - separate section on mobile, last column on desktop */}
                    <div className="md:contents">
                      <div className="flex justify-center space-x-2 pt-2 md:pt-0 md:justify-start md:ml-2">
                        <Button
                          variant="outline"
                          onClick={addBulkEntryRow}
                          className="h-9 px-3 flex items-center justify-center border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                          title="Add row"
                        >
                          <Plus className="h-3 w-3 md:mr-0" />
                          <span className="ml-1 md:hidden text-xs">Add</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => removeBulkEntryRow(index)}
                          disabled={bulkEntries.length === 1}
                          className="h-9 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Remove row"
                        >
                          <Trash2 className="h-3 w-3 md:mr-0" />
                          <span className="ml-1 md:hidden text-xs">Remove</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Bar - Updated validation count */}
          <div className="flex-shrink-0 px-4 py-2 bg-blue-50 border-t border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>* Required fields.</strong> {validBulkEntriesCount} of {bulkEntries.length} entries are complete and ready to create.
            </div>
          </div>
        </div>

        {/* Footer - Updated create button count */}
        <div className="flex-shrink-0 px-3 sm:px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <Button 
            variant="outline" 
            onClick={handleCancelBulkAdd}
            className="px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg h-10 sm:h-12 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBulkCreate} 
            className={`px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg h-10 sm:h-12 w-full sm:w-auto ${bulkAddType === 'revenue' ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
          >
            <Copy className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
            Create {validBulkEntriesCount} Entries
          </Button>
        </div>
      </div>
    </div>
  );
};