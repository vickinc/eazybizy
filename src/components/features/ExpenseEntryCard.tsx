import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatDateForDisplay } from '@/utils';
import CheckSquare from "lucide-react/dist/esm/icons/check-square";
import Square from "lucide-react/dist/esm/icons/square";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Link from "lucide-react/dist/esm/icons/link";
import ArrowUpCircle from "lucide-react/dist/esm/icons/arrow-up-circle";

interface ExpenseEntryCardProps {
  // Core data
  entry: unknown;
  company: unknown;
  isExpanded: boolean;
  
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
  handleLinkToIncome: (entry: unknown) => void;
  handleViewRelatedIncomeEntry: (incomeId: string) => void;
}

export const ExpenseEntryCard: React.FC<ExpenseEntryCardProps> = ({
  entry,
  company,
  isExpanded,
  highlightedEntryId,
  selectedEntries,
  formatCurrency,
  getCOGSCurrency,
  toggleEntryExpansion,
  toggleEntrySelection,
  handleEditEntry,
  handleDeleteEntry,
  handleLinkToIncome,
  handleViewRelatedIncomeEntry
}) => {
  const formatLargeCurrency = (amount: number, currency: string = 'USD'): string => {
    return formatCurrency(amount, currency);
  };
  
  if (!isExpanded) {
    // Collapsed view - Compact
    return (
      <div className={`border-l-4 border-l-red-500 border-r border-t border-b border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 ${highlightedEntryId === entry.id ? 'bg-blue-100' : ''}`} id={`entry-${entry.id}`}>
        <div 
          className="p-3 cursor-pointer"
          onClick={() => toggleEntryExpansion(entry.id)}
        >
          {/* Date in top left corner */}
          <div className="text-xs text-gray-500 mb-2">
            {formatDateForDisplay(entry.date)}
          </div>
          
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-2 flex-wrap">
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
              {entry.linkedIncomeId && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Linked
                </Badge>
              )}
              {company && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                    company.logo && (company.logo.startsWith('data:') || company.logo.includes('http'))
                      ? '' 
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
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
              <div className="flex-1">
                <div className="font-medium text-sm truncate">
                  {entry.vendorInvoice ? entry.vendorInvoice : entry.description}
                  {entry.category && (
                    <span className="text-gray-500"> ({entry.category})</span>
                  )}
                </div>
                {entry.vendorInvoice && (
                  <div className="text-xs text-gray-500 truncate">
                    {entry.description}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="text-right flex-1">
                <div className="font-bold text-sm text-red-600">
                  -{formatLargeCurrency(entry.amount, entry.currency)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {/* Link to Income button - only show for unlinked expenses */}
                {entry.type === 'expense' && !entry.linkedIncomeId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLinkToIncome(entry);
                    }}
                    className="h-7 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 flex-shrink-0"
                    title="Link to revenue entry"
                  >
                    <Link className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Link to Revenue</span>
                    <span className="sm:hidden">Link</span>
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditEntry(entry)}
                  className="h-7 w-7 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
                  title="Edit entry"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteEntry(entry)}
                  className="h-7 w-7 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
                  title="Delete entry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Expanded view - detailed version
  return (
    <div className={`border-l-4 border-l-red-500 border-r border-t border-b border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 ${highlightedEntryId === entry.id ? 'bg-blue-100' : ''}`} id={`entry-${entry.id}`}>
      {/* Compact Header - Always Visible */}
      <div 
        className="p-3 cursor-pointer"
        onClick={() => toggleEntryExpansion(entry.id)}
      >
        {/* Date in top left corner */}
        <div className="text-xs text-gray-500 mb-2">
          {formatDateForDisplay(entry.date)}
        </div>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center space-x-2 flex-wrap">
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
            {entry.linkedIncomeId && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Linked
              </Badge>
            )}
            {company && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                  company.logo && (company.logo.startsWith('data:') || company.logo.includes('http'))
                    ? '' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
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
            <div className="flex-1">
              <div className="font-medium text-sm truncate">
                {entry.vendorInvoice ? entry.vendorInvoice : entry.description}
                {entry.category && (
                  <span className="text-gray-500"> ({entry.category})</span>
                )}
              </div>
              {entry.vendorInvoice && (
                <div className="text-xs text-gray-500 truncate">
                  {entry.description}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="text-right flex-1">
              <div className="font-bold text-sm text-red-600">
                -{formatLargeCurrency(entry.amount, entry.currency)}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {/* Link to Income button - only show for unlinked expenses */}
              {entry.type === 'expense' && !entry.linkedIncomeId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLinkToIncome(entry);
                  }}
                  className="h-7 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 flex-shrink-0"
                  title="Link to revenue entry"
                >
                  <Link className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Link to Revenue</span>
                  <span className="sm:hidden">Link</span>
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditEntry(entry)}
                className="h-7 w-7 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
                title="Edit entry"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteEntry(entry)}
                className="h-7 w-7 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
                title="Delete entry"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      <div className="border-t bg-gray-50/50 p-4 space-y-4">
        {/* Full Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entry.type === 'expense' && entry.vendorInvoice && (
            <div>
              <Label className="text-xs font-semibold text-gray-600">Vendor Invoice</Label>
              <p className="text-sm mt-1 font-medium">{entry.vendorInvoice}</p>
            </div>
          )}
          <div>
            <Label className="text-xs font-semibold text-gray-600">Description</Label>
            <p className="text-sm mt-1">{entry.description}</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600">Reference</Label>
            <p className="text-sm mt-1">{entry.reference || 'None'}</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600">Date</Label>
            <p className="text-sm mt-1">{formatDateForDisplay(entry.date)}</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600">Amount</Label>
            <p className={`text-sm mt-1 font-semibold ${entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
              {entry.type === 'revenue' ? '+' : '-'}{formatLargeCurrency(entry.amount, entry.currency)}
            </p>
          </div>
        </div>

        {/* Linked Revenue Information for Expense Entries */}
        {entry.type === 'expense' && entry.linkedIncomeId && entry.linkedIncome && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <Label className="text-xs font-semibold text-green-700 mb-2 block">Linked to Revenue Entry</Label>
            {(() => {
              const linkedIncome = entry.linkedIncome;
              return linkedIncome ? (
                <div className="text-sm space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><span className="font-medium">Revenue Description:</span> {linkedIncome.description || linkedIncome.reference || 'No description'}</p>
                      <p><span className="font-medium">Revenue Amount:</span> <span className="text-green-600 font-bold">+{formatLargeCurrency(linkedIncome.amount, linkedIncome.currency)}</span></p>
                      <p><span className="font-medium">Revenue Category:</span> {linkedIncome.category}</p>
                      <p><span className="font-medium">Revenue Date:</span> {formatDateForDisplay(linkedIncome.date)}</p>
                    </div>
                    <div>
                      {linkedIncome.cogs && linkedIncome.cogs > 0 && (
                        <p><span className="font-medium">COGS Amount:</span> <span className="text-purple-600 font-bold">{formatLargeCurrency(linkedIncome.cogs, getCOGSCurrency(linkedIncome))}</span></p>
                      )}
                      <p><span className="font-medium">Revenue Reference:</span> {linkedIncome.reference || 'None'}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-green-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRelatedIncomeEntry(linkedIncome.id)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <ArrowUpCircle className="h-4 w-4 mr-2" />
                      View Related Revenue Entry
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Linked revenue entry not found</p>
              );
            })()}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditEntry(entry)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Entry
          </Button>
        </div>
      </div>
    </div>
  );
};