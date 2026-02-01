import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateForDisplay } from '@/utils';
import CheckSquare from "lucide-react/dist/esm/icons/check-square";
import Square from "lucide-react/dist/esm/icons/square";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";

interface IncomeEntryCardProps {
  // Core data
  entry: unknown;
  company: unknown;
  isExpanded: boolean;
  linkedExpenses: number;
  remainingAmount: number;
  
  // State
  highlightedEntryId?: string;
  selectedEntries: Set<string>;
  
  // Functions
  formatCurrency: (amount: number, currency?: string) => string;
  getCOGSCurrency: (entry: unknown) => string;
  toggleEntryExpansion: (entryId: string) => void;
  toggleEntrySelection: (entryId: string) => void;
  handleEditEntry: (entry: unknown) => void;
  handleDeleteEntry: (entry: unknown) => void;
}

export const IncomeEntryCard: React.FC<IncomeEntryCardProps> = ({
  entry,
  company,
  isExpanded,
  linkedExpenses,
  remainingAmount,
  highlightedEntryId,
  selectedEntries,
  formatCurrency,
  getCOGSCurrency,
  toggleEntryExpansion,
  toggleEntrySelection,
  handleEditEntry,
  handleDeleteEntry
}) => {
  // Calculate actual linked expenses from the entry data
  const actualLinkedExpenses = entry.linkedExpenses ? entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;
  const actualRemainingAmount = entry.cogs ? Math.max(0, entry.cogs - actualLinkedExpenses) : 0;
  
  // Helper function for currency formatting
  const formatLargeCurrency = (amount: number, currency: string = 'USD'): string => {
    return formatCurrency(amount, currency);
  };
  
  if (!isExpanded) {
    // Collapsed view - Ultra compact
    return (
      <div className={`border-l-4 border-l-green-500 border-r border-t border-b border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 ${
        entry.isFromInvoice 
          ? 'bg-blue-50' 
          : 'bg-white'
      } ${highlightedEntryId === entry.id ? 'bg-blue-100' : ''}`}>
        <div 
          className="p-3 cursor-pointer"
          onClick={() => toggleEntryExpansion(entry.id)}
        >
          {/* Date in top left corner */}
          <div className="text-xs text-gray-500 mb-2">
            {formatDateForDisplay(entry.date)}
          </div>
          
          {/* Header Section */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Selection Checkbox */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleEntrySelection(entry.id);
                }}
                className="p-1 h-6 w-6"
              >
                {selectedEntries.has(entry.id) ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
              </Button>
              
              {/* Company Badge with Logo */}
              {company && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                    company.logo && (company.logo.startsWith('data:') || company.logo.includes('http'))
                      ? '' 
                      : 'bg-blue-600'
                  }`}>
                    {company.logo && (company.logo.startsWith('data:') || company.logo.includes('http')) ? (
                      <img 
                        src={company.logo} 
                        alt={`${company.tradingName} logo`} 
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      company.logo
                    )}
                  </div>
                  {company.tradingName}
                </Badge>
              )}
              {entry.isFromInvoice && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Auto
                </Badge>
              )}
              <div className="flex-1">
                <div className="font-medium text-sm truncate">
                  {entry.reference ? entry.reference : entry.description}
                  {entry.category && (
                    <span className="text-gray-500"> ({entry.category})</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="text-right flex-1">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  +{formatLargeCurrency(entry.amount, entry.currency)}
                </div>
                {/* Quick Status Summary */}
                <div className="text-xs text-gray-600 mt-1">
                  {actualRemainingAmount > 0 && (
                    <span className="text-orange-600 font-medium">
                      A/P: {formatLargeCurrency(actualRemainingAmount, getCOGSCurrency(entry))}
                    </span>
                  )}
                  {actualLinkedExpenses > 0 && actualRemainingAmount === 0 && (
                    <span className="text-green-600 font-medium">✅ Fully Paid</span>
                  )}
                  {actualLinkedExpenses === 0 && entry.cogs && entry.cogs > 0 && (
                    <span className="text-purple-600 font-medium">🏷️ COGS: {formatLargeCurrency(entry.cogs, getCOGSCurrency(entry))}</span>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditEntry(entry)}
                  className="h-8 w-8 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
                  title="Edit entry"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEntry(entry)}
                  className="h-8 w-8 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
                  title="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Linked Expenses Preview */}
          {entry.linkedExpenses && entry.linkedExpenses.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-red-600 font-medium">
                Linked Expenses ({entry.linkedExpenses.length})
              </p>
              <div className="text-xs text-gray-500 mt-1 space-y-1">
                {entry.linkedExpenses.slice(0, 2).map((expense) => (
                  <div key={expense.id} className="flex justify-between">
                    <span>{expense.vendorInvoice || expense.description || expense.reference || 'No description'}</span>
                    <span className="text-red-600 font-medium">-{formatLargeCurrency(expense.amount, expense.currency)}</span>
                  </div>
                ))}
                {entry.linkedExpenses.length > 2 && (
                  <p className="text-gray-400">...and {entry.linkedExpenses.length - 2} more</p>
                )}
                <div className="pt-1 border-t border-gray-200 mt-2">
                  <div className="flex justify-between font-medium text-xs">
                    <span>Net Amount:</span>
                    <span className={
                      entry.amount - entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0) > 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }>
                      {entry.amount - entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0) > 0 ? '+' : ''}
                      {formatLargeCurrency(
                        entry.amount - entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0),
                        entry.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Expanded view - detailed version matching expense layout
  return (
    <div className={`border-l-4 border-l-green-500 border-r border-t border-b border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 ${highlightedEntryId === entry.id ? 'bg-blue-100' : 'bg-white'}`}>
      <div 
        className="p-3 cursor-pointer"
        onClick={() => toggleEntryExpansion(entry.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronUp className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {entry.reference ? entry.reference : entry.description}
              </h3>
              <p className="text-gray-600 text-sm">
                {entry.category} • {formatDateForDisplay(entry.date)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-green-600">
              +{formatLargeCurrency(entry.amount, entry.currency)}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditEntry(entry);
              }}
              className="h-8 w-8 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              title="Edit entry"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      <div className="p-4 space-y-4">
        {/* Comprehensive Entry Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Entry ID</label>
            <p className="text-xs text-gray-600 mt-1 font-mono">{entry.id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <p className="text-sm text-gray-900 mt-1">{entry.description || 'No description'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Reference</label>
            <p className="text-sm text-gray-900 mt-1">
              {entry.reference ? (
                <span className="text-blue-600 underline cursor-pointer">
                  {entry.reference}
                </span>
              ) : (
                'None'
              )}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Entry Type</label>
            <p className="text-sm mt-1">
              <Badge className={entry.type === 'revenue' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {entry.type === 'revenue' ? 'Revenue' : 'Expense'}
              </Badge>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Category</label>
            <p className="text-sm text-gray-900 mt-1">{entry.category}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Subcategory</label>
            <p className="text-sm text-gray-900 mt-1">{entry.subcategory || 'None'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date</label>
            <p className="text-sm text-gray-900 mt-1">{formatDateForDisplay(entry.date)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Amount</label>
            <p className="text-sm font-bold text-green-600 mt-1">
              +{formatLargeCurrency(entry.amount, entry.currency)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Currency</label>
            <p className="text-sm text-gray-900 mt-1">{entry.currency}</p>
          </div>
          {entry.cogs && entry.cogs > 0 && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700">COGS Amount</label>
                <p className="text-sm font-bold text-purple-600 mt-1">
                  {formatLargeCurrency(entry.cogs, getCOGSCurrency(entry))}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">COGS Currency</label>
                <p className="text-sm text-gray-900 mt-1">{getCOGSCurrency(entry)}</p>
              </div>
            </>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">Company</label>
            <p className="text-sm text-gray-900 mt-1">{company?.tradingName || 'Unknown'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Account Type</label>
            <p className="text-sm text-gray-900 mt-1 capitalize">{entry.accountType || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Account ID</label>
            <p className="text-xs text-gray-600 mt-1 font-mono">{entry.accountId || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Created At</label>
            <p className="text-xs text-gray-600 mt-1">{new Date(entry.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Updated At</label>
            <p className="text-xs text-gray-600 mt-1">{new Date(entry.updatedAt).toLocaleString()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Source</label>
            <p className="text-sm mt-1">
              {entry.isFromInvoice && entry.invoice ? (
                <Badge className="bg-blue-100 text-blue-800">
                  📄 From Invoice {entry.invoice.invoiceNumber}
                </Badge>
              ) : entry.isFromInvoice ? (
                <Badge className="bg-blue-100 text-blue-800">
                  📄 From Invoice {entry.invoiceId ? `(${entry.invoiceId})` : ''}
                </Badge>
              ) : (
                <Badge variant="outline">Manual Entry</Badge>
              )}
            </p>
          </div>
        </div>
        
        {/* Financial Summary Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Financial Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Gross Revenue</p>
              <p className="text-lg font-bold text-green-600">{formatLargeCurrency(entry.amount, entry.currency)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">COGS</p>
              <p className="text-lg font-bold text-purple-600">
                {entry.cogs ? formatLargeCurrency(entry.cogs, getCOGSCurrency(entry)) : '$0.00'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Expenses Paid</p>
              <p className="text-lg font-bold text-red-600">
                {formatLargeCurrency(
                  entry.linkedExpenses ? entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0) : 0, 
                  entry.currency
                )}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className={`text-lg font-bold ${
                (entry.amount - (entry.cogs || 0) - (entry.linkedExpenses ? entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0) : 0)) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatLargeCurrency(
                  entry.amount - (entry.cogs || 0) - (entry.linkedExpenses ? entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0) : 0), 
                  entry.currency
                )}
              </p>
            </div>
          </div>
          {actualRemainingAmount > 0 && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm text-orange-800">
                <strong>Outstanding A/P:</strong> {formatLargeCurrency(actualRemainingAmount, getCOGSCurrency(entry))} remaining to be paid
              </p>
            </div>
          )}
        </div>
        
        {/* Linked Expenses List */}
        {entry.linkedExpenses && entry.linkedExpenses.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-red-700 mb-3">
              Linked Expenses ({entry.linkedExpenses.length})
            </h4>
            <div className="space-y-2">
              {entry.linkedExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {expense.vendorInvoice || expense.description || expense.reference || 'No description'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {expense.category} • {formatDateForDisplay(expense.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">
                      -{formatLargeCurrency(expense.amount, expense.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">Total Linked Expenses:</span>
                <span className="font-bold text-red-600">
                  -{formatLargeCurrency(
                    entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0),
                    entry.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="font-medium text-gray-700">Net Amount:</span>
                <span className={`font-bold ${
                  entry.amount - entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0) > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {entry.amount - entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0) > 0 ? '+' : ''}
                  {formatLargeCurrency(
                    entry.amount - entry.linkedExpenses.reduce((sum, exp) => sum + exp.amount, 0),
                    entry.currency
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};