import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateForDisplay } from '@/utils';
import { IncomeEntryCard } from './IncomeEntryCard';
import { ExpenseEntryCard } from './ExpenseEntryCard';
import CheckSquare from "lucide-react/dist/esm/icons/check-square";
import Square from "lucide-react/dist/esm/icons/square";
import Edit from "lucide-react/dist/esm/icons/edit";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import Folder from "lucide-react/dist/esm/icons/folder";
import Link from "lucide-react/dist/esm/icons/link";

interface EnhancedBookkeepingEntry {
  id: string;
  type: 'revenue' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  companyId: number;
  reference?: string;
  accountId?: string;
  accountType?: 'bank' | 'wallet';
  cogs?: number;
  cogsPaid?: number;
  linkedIncomeId?: string;
  vendorInvoice?: string;
  isFromInvoice?: boolean;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
  company?: unknown;
  totalLinkedExpenses: number;
  remainingAmount: number;
  linkedExpensesList: unknown[];
  linkedIncome?: unknown;
}

interface ProcessedGroup {
  key: string;
  name: string;
  entries: EnhancedBookkeepingEntry[];
  totalIncome: number;
  totalExpenses: number;
}

interface EntriesListViewProps {
  // Data
  filteredEntries: EnhancedBookkeepingEntry[];
  processedGroupedEntries: ProcessedGroup[];
  
  // View state
  groupedView: boolean;
  expandedGroups: Set<string>;
  expandedEntries: Set<string>;
  selectedEntries: Set<string>;
  highlightedEntryId?: string;
  
  // Event handlers
  toggleGroupExpansion: (groupKey: string) => void;
  toggleEntryExpansion: (entryId: string) => void;
  toggleEntrySelection: (entryId: string) => void;
  handleEditEntry: (entry: unknown) => void;
  handleDeleteEntry: (entry: unknown) => void;
  handleLinkToIncome: (entry: unknown) => void;
  handleViewRelatedIncomeEntry: (incomeId: string) => void;
  
  // Utility functions
  formatCurrency: (amount: number, currency?: string) => string;
  getCOGSCurrency: (entry: unknown) => string;
}

export const EntriesListView: React.FC<EntriesListViewProps> = ({
  filteredEntries,
  processedGroupedEntries,
  groupedView,
  expandedGroups,
  expandedEntries,
  selectedEntries,
  highlightedEntryId,
  toggleGroupExpansion,
  toggleEntryExpansion,
  toggleEntrySelection,
  handleEditEntry,
  handleDeleteEntry,
  handleLinkToIncome,
  handleViewRelatedIncomeEntry,
  formatCurrency,
  getCOGSCurrency
}) => {
  const formatLargeCurrency = (amount: number, currency: string = 'USD'): string => {
    return formatCurrency(amount, currency);
  };

  if (filteredEntries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No entries found for the selected period and filters.
      </div>
    );
  }

  if (groupedView) {
    // Grouped View
    return (
      <div className="space-y-2">
        {processedGroupedEntries.map((group) => (
          <div key={group.key} className={`border rounded-lg ${
            group.type === 'revenue' 
              ? 'border-l-4 border-l-green-500 bg-green-50/50' 
              : 'border-l-4 border-l-red-500 bg-red-50/50'
          }`}>
            {/* Group Header */}
            <div 
              className={`p-4 cursor-pointer transition-colors ${
                group.type === 'revenue'
                  ? 'bg-green-50 hover:bg-green-100'
                  : 'bg-red-50 hover:bg-red-100'
              }`}
              onClick={() => toggleGroupExpansion(group.key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 pointer-events-none"
                  >
                    {expandedGroups.has(group.key) ? 
                      <FolderOpen className={`h-4 w-4 ${
                        group.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                      }`} /> : 
                      <Folder className={`h-4 w-4 ${
                        group.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    }
                  </Button>
                  <h3 className={`font-semibold text-lg ${
                    group.type === 'revenue' ? 'text-green-800' : 'text-red-800'
                  }`}>{group.name}</h3>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      group.type === 'revenue' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}
                  >
                    {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-medium ${
                      group.type === 'revenue' 
                        ? 'bg-green-200 text-green-800 border-green-300' 
                        : 'bg-red-200 text-red-800 border-red-300'
                    }`}
                  >
                    {group.type === 'revenue' ? '📈 Revenue' : '📉 Expense'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4">
                  {group.type === 'revenue' ? (
                    <div className="text-sm font-medium text-green-700">
                      Revenue: {formatLargeCurrency(group.totalIncome)}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-red-700">
                      Expenses: {formatLargeCurrency(group.totalExpenses)}
                    </div>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform ${
                    expandedGroups.has(group.key) ? 'rotate-180' : ''
                  } ${group.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
            
            {/* Group Content */}
            {expandedGroups.has(group.key) && (
              <div className="border-t space-y-2 p-2">
                {group.entries.filter(entry => entry && entry.id).map((entry) => {
                  const isExpanded = expandedEntries.has(entry.id);
                  
                  // Use pre-calculated values from enhanced entry
                  const linkedExpenses = entry.totalLinkedExpenses;
                  const remainingAmount = entry.remainingAmount;
                  
                  // Use enhanced rendering for income entries in grouped view
                  if (entry.type === 'revenue') {
                    return (
                      <div key={entry.id} id={`entry-${entry.id}`}>
                        <IncomeEntryCard
                          entry={entry}
                          company={entry.company}
                          isExpanded={isExpanded}
                          linkedExpenses={linkedExpenses}
                          remainingAmount={remainingAmount}
                          highlightedEntryId={highlightedEntryId}
                          selectedEntries={selectedEntries}
                          formatCurrency={formatCurrency}
                          getCOGSCurrency={getCOGSCurrency}
                          toggleEntryExpansion={toggleEntryExpansion}
                          toggleEntrySelection={toggleEntrySelection}
                          handleEditEntry={handleEditEntry}
                          handleDeleteEntry={handleDeleteEntry}
                        />
                      </div>
                    );
                  }
                  
                  // Standard rendering for expense entries in grouped view
                  return (
                    <div key={entry.id} id={`entry-${entry.id}`}>
                      <ExpenseEntryCard
                        entry={entry}
                        company={entry.company}
                        isExpanded={isExpanded}
                        highlightedEntryId={highlightedEntryId}
                        selectedEntries={selectedEntries}
                        formatCurrency={formatCurrency}
                        getCOGSCurrency={getCOGSCurrency}
                        toggleEntryExpansion={toggleEntryExpansion}
                        toggleEntrySelection={toggleEntrySelection}
                        handleEditEntry={handleEditEntry}
                        handleDeleteEntry={handleDeleteEntry}
                        handleLinkToIncome={handleLinkToIncome}
                        handleViewRelatedIncomeEntry={handleViewRelatedIncomeEntry}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Regular List View
  return (
    <div className="space-y-2">
      {filteredEntries.filter(entry => entry && entry.id).map((entry) => {
        const isExpanded = expandedEntries.has(entry.id);
        
        // Use pre-calculated values from enhanced entry
        const linkedExpenses = entry.totalLinkedExpenses;
        const remainingAmount = entry.remainingAmount;
        
        // Use enhanced rendering for income entries
        if (entry.type === 'revenue') {
          return (
            <div key={entry.id} id={`entry-${entry.id}`} className={highlightedEntryId === entry.id ? 'bg-blue-100 transition-all duration-500' : ''}>
              <IncomeEntryCard
                entry={entry}
                company={entry.company}
                isExpanded={isExpanded}
                linkedExpenses={linkedExpenses}
                remainingAmount={remainingAmount}
                highlightedEntryId={highlightedEntryId}
                selectedEntries={selectedEntries}
                formatCurrency={formatCurrency}
                getCOGSCurrency={getCOGSCurrency}
                toggleEntryExpansion={toggleEntryExpansion}
                toggleEntrySelection={toggleEntrySelection}
                handleEditEntry={handleEditEntry}
                handleDeleteEntry={handleDeleteEntry}
              />
            </div>
          );
        }
        
        // Standard rendering for expense entries
        return (
          <div key={entry.id} id={`entry-${entry.id}`}>
            <ExpenseEntryCard
              entry={entry}
              company={entry.company}
              isExpanded={isExpanded}
              highlightedEntryId={highlightedEntryId}
              selectedEntries={selectedEntries}
              formatCurrency={formatCurrency}
              getCOGSCurrency={getCOGSCurrency}
              toggleEntryExpansion={toggleEntryExpansion}
              toggleEntrySelection={toggleEntrySelection}
              handleEditEntry={handleEditEntry}
              handleDeleteEntry={handleDeleteEntry}
              handleLinkToIncome={handleLinkToIncome}
              handleViewRelatedIncomeEntry={handleViewRelatedIncomeEntry}
            />
          </div>
        );
      })}
    </div>
  );
};