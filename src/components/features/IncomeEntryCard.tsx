import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateForDisplay } from '@/utils';
import { 
  CheckSquare,
  Square,
  Edit,
  Trash2,
  ChevronUp
} from 'lucide-react';

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
  const linkedExpensesList = entry.linkedExpensesList || [];
  
  // Helper function for currency formatting
  const formatLargeCurrency = (amount: number, currency: string = 'USD'): string => {
    return formatCurrency(amount, currency);
  };
  
  if (!isExpanded) {
    // Collapsed view - Ultra compact
    return (
      <div className={`shadow-sm border-l-4 ${
        entry.isFromInvoice 
          ? 'bg-blue-50 border-l-blue-500' 
          : 'bg-white border-l-green-500'
      } ${highlightedEntryId === entry.id ? 'bg-blue-100' : ''}`}>
        <div 
          className="py-1 px-2 cursor-pointer hover:bg-gray-50 transition-colors"
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
                    company.logo.startsWith('data:') || company.logo.includes('http') 
                      ? '' 
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    {company.logo.startsWith('data:') || company.logo.includes('http') ? (
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
            </div>
            
            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="text-right flex-1">
                <div className="text-lg sm:text-2xl font-bold text-green-600">
                  +{formatLargeCurrency(entry.amount, entry.currency)}
                </div>
                {/* Quick Status Summary */}
                <div className="text-xs text-gray-600 mt-1">
                  {remainingAmount > 0 && (
                    <span className="text-orange-600 font-medium">
                      A/P: {formatLargeCurrency(remainingAmount, getCOGSCurrency(entry))}
                    </span>
                  )}
                  {linkedExpenses > 0 && remainingAmount === 0 && (
                    <span className="text-green-600 font-medium">✅ Fully Paid</span>
                  )}
                  {linkedExpenses === 0 && entry.cogs && entry.cogs > 0 && (
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
          
          {/* Main Title */}
          <div className="mb-1">
            <h3 className="text-base font-semibold text-gray-900">
              {entry.reference ? entry.reference : entry.description}
              {entry.category && (
                <span className="text-gray-500"> ({entry.category})</span>
              )}
            </h3>
          </div>
          
          {/* Related Expenses Preview */}
          {linkedExpenses > 0 && (
            <div className="mt-2">
              <p className="text-sm text-blue-600 font-medium">
                Related Expenses ({linkedExpensesList.length})
              </p>
              <div className="text-xs text-gray-500 mt-1 space-y-1">
                {linkedExpensesList.slice(0, 2).map((expense) => (
                  <div key={expense.id} className="flex justify-between">
                    <span>{expense.vendorInvoice || expense.description}</span>
                    <span className="text-red-600 font-medium">-{formatLargeCurrency(expense.amount, expense.currency)}</span>
                  </div>
                ))}
                {linkedExpensesList.length > 2 && (
                  <p className="text-gray-400">...and {linkedExpensesList.length - 2} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Expanded view - detailed version matching expense layout
  return (
    <div className={`bg-white shadow-sm border-l-4 border-l-green-500 ${highlightedEntryId === entry.id ? 'bg-blue-100' : ''}`}>
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b"
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
              <Badge className={entry.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {entry.type === 'income' ? 'Revenue' : 'Expense'}
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
              {entry.isFromInvoice ? (
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
                {formatLargeCurrency(linkedExpenses, entry.currency)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className={`text-lg font-bold ${
                (entry.amount - (entry.cogs || 0) - linkedExpenses) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatLargeCurrency(entry.amount - (entry.cogs || 0) - linkedExpenses, entry.currency)}
              </p>
            </div>
          </div>
          {remainingAmount > 0 && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
              <p className="text-sm text-orange-800">
                <strong>Outstanding A/P:</strong> {formatLargeCurrency(remainingAmount, getCOGSCurrency(entry))} remaining to be paid
              </p>
            </div>
          )}
        </div>
        
        {/* Related Expenses List */}
        {linkedExpenses > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-700 mb-3">
              Related Expenses ({linkedExpensesList.length})
            </h4>
            <div className="space-y-2">
              {linkedExpensesList.map((expense) => (
                <div key={expense.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {expense.vendorInvoice || expense.description}
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
          </div>
        )}
      </div>
    </div>
  );
};