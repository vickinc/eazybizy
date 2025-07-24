import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Edit from "lucide-react/dist/esm/icons/edit";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import ArrowUpCircle from "lucide-react/dist/esm/icons/arrow-up-circle";
import ArrowDownCircle from "lucide-react/dist/esm/icons/arrow-down-circle";
import { formatDateForDisplay } from '@/utils';

interface EnrichedEntry {
  id: string;
  type: 'revenue' | 'expense';
  description: string;
  category: string;
  date: string;
  amount: number;
  currency: string;
  reference?: string;
  isFromInvoice?: boolean;
  cogs?: number;
  cogsPaid?: number;
  accountsPayable: number;
  company?: {
    id: number;
    tradingName: string;
    logo: string;
  };
}

interface RecentEntriesListItemProps {
  entry: EnrichedEntry;
  isExpanded: boolean;
  onToggleExpansion: (id: string) => void;
  onEdit: (entry: EnrichedEntry) => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

export const RecentEntriesListItem: React.FC<RecentEntriesListItemProps> = ({
  entry,
  isExpanded,
  onToggleExpansion,
  onEdit,
  formatCurrency
}) => {
  return (
    <div className="border rounded-lg hover:bg-gray-50 transition-all duration-200">
      {/* Compact Header - Always Visible */}
      <div 
        className="p-2.5 cursor-pointer"
        onClick={() => onToggleExpansion(entry.id)}
      >
        {/* Mobile-optimized layout */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          {/* Top row - badges and company info */}
          <div className="flex items-center space-x-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-5 w-5 pointer-events-none flex-shrink-0"
            >
              {isExpanded ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
            </Button>
            
            <div className={`p-1 rounded-full flex-shrink-0 ${entry.type === 'revenue' ? 'bg-green-100' : 'bg-red-100'}`}>
              {entry.type === 'revenue' ? 
                <ArrowUpCircle className="h-2.5 w-2.5 text-green-600" /> :
                <ArrowDownCircle className="h-2.5 w-2.5 text-red-600" />
              }
            </div>
            
            {entry.isFromInvoice && (
              <Badge variant="outline" className="text-xs h-4 px-1 flex-shrink-0">Auto</Badge>
            )}
            
            {entry.company && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs h-4 px-1 max-w-[120px] sm:max-w-none">
                <div className={`w-2.5 h-2.5 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                  entry.company.logo.startsWith('data:') || entry.company.logo.includes('http') 
                    ? '' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {entry.company.logo.startsWith('data:') || entry.company.logo.includes('http') ? (
                    <img 
                      src={entry.company.logo} 
                      alt={`${entry.company.tradingName} logo`} 
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    entry.company.logo
                  )}
                </div>
                <span className="truncate">{entry.company.tradingName}</span>
              </Badge>
            )}
          </div>
          
          {/* Bottom row - description and amount */}
          <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 sm:ml-4">
            <div className="flex-1 min-w-0 mr-3">
              <div className="font-medium text-xs truncate">{entry.description}</div>
              <div className="text-xs text-gray-500 truncate">
                {entry.category} • {formatDateForDisplay(entry.date)}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="text-right">
                <div className={`font-bold text-xs ${entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.type === 'revenue' ? '+' : '-'}{formatCurrency(entry.amount, entry.currency)}
                </div>
                {entry.type === 'revenue' && entry.cogs && entry.accountsPayable > 0 && (
                  <div className="text-xs text-orange-600 font-medium">
                    A/P: {formatCurrency(entry.accountsPayable, entry.currency)}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onEdit(entry);
                }}
                className="h-6 w-6 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded flex items-center justify-center transition-colors flex-shrink-0"
                title="Edit entry"
              >
                <Edit className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t bg-gray-50/50 p-3 space-y-3">
          {/* Full Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <Label className="text-xs font-semibold text-gray-600">Description</Label>
              <p className="text-xs mt-1">{entry.description}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600">Reference</Label>
              <p className="text-xs mt-1">{entry.reference || 'None'}</p>
            </div>
          </div>
          
          {/* COGS Information for Income Entries */}
          {entry.type === 'revenue' && entry.cogs && (
            <div className="bg-white p-2 rounded border">
              <Label className="text-xs font-semibold text-gray-600 mb-2 block">COGS Breakdown</Label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-purple-600 font-medium">COGS:</span>
                  <p className="font-semibold">{formatCurrency(entry.cogs, entry.currency)}</p>
                </div>
                <div>
                  <span className="text-red-600 font-medium">Paid:</span>
                  <p className="font-semibold">{formatCurrency(entry.cogsPaid || 0, entry.currency)}</p>
                </div>
                <div>
                  <span className="text-orange-600 font-medium">A/P:</span>
                  <p className="font-semibold">{formatCurrency(entry.accountsPayable, entry.currency)}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(entry)}
              className="h-6 px-2 text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};