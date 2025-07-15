import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateForDisplay } from '@/utils';
import { JournalEntry } from '@/types';
import { AuditTrailCard } from './AuditTrailCard';
import CheckSquare from "lucide-react/dist/esm/icons/check-square";
import Square from "lucide-react/dist/esm/icons/square";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import Link from "lucide-react/dist/esm/icons/link";
import Copy from "lucide-react/dist/esm/icons/copy";

interface JournalEntryCardProps {
  entry: JournalEntry;
  isExpanded: boolean;
  isSelected: boolean;
  formatCurrency: (amount: number, currency?: string) => string;
  toggleEntryExpansion: (entryId: string) => void;
  toggleEntrySelection: (entryId: string) => void;
  handleEditEntry: (entry: JournalEntry) => void;
  handleDeleteEntry: (entry: JournalEntry) => void;
  handleReverseEntry?: (entry: JournalEntry) => void;
  handleViewReversalEntry?: (reversalEntryId: string) => void;
  handleDuplicateEntry?: (entry: JournalEntry) => void;
}

export const JournalEntryCard: React.FC<JournalEntryCardProps> = ({
  entry,
  isExpanded,
  isSelected,
  formatCurrency,
  toggleEntryExpansion,
  toggleEntrySelection,
  handleEditEntry,
  handleDeleteEntry,
  handleReverseEntry,
  handleViewReversalEntry,
  handleDuplicateEntry
}) => {
  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'manual': return 'bg-blue-100 text-blue-800';
      case 'auto-income': return 'bg-green-100 text-green-800';
      case 'auto-expense': return 'bg-red-100 text-red-800';
      case 'auto-invoice': return 'bg-purple-100 text-purple-800';
      case 'auto-fixed-asset': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'posted': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'reversed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`border rounded-lg ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'} hover:shadow-md transition-all`}>
      {/* Entry Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Left Side - Entry Info */}
          <div className="flex items-start space-x-3 flex-1">
            {/* Selection Checkbox */}
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 mt-1"
              onClick={() => toggleEntrySelection(entry.id)}
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>

            {/* Entry Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-gray-900">{entry.entryNumber}</h3>
                <Badge className={getSourceBadgeColor(entry.source)}>
                  {entry.source.replace('auto-', '').replace('-', ' ')}
                </Badge>
                <Badge className={getStatusBadgeColor(entry.status)}>
                  {entry.status}
                </Badge>
              </div>
              
              <p className="text-gray-700 mb-1">{entry.description}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{formatDateForDisplay(entry.date)}</span>
                {entry.reference && (
                  <span className="text-blue-600">Ref: {entry.reference}</span>
                )}
                <span className="font-medium">
                  {formatCurrency(entry.totalDebits)} total
                </span>
              </div>

              {/* Compact Audit Trail */}
              <div className="mt-2">
                <AuditTrailCard entry={entry} compact={true} />
              </div>

              {/* Reversal Information */}
              {entry.status === 'reversed' && entry.reversalEntryId && (
                <div className="mt-2 flex items-center space-x-2 text-sm">
                  <Badge className="bg-red-100 text-red-800">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reversed
                  </Badge>
                  {handleViewReversalEntry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewReversalEntry!(entry.reversalEntryId!)}
                      className="text-blue-600 hover:text-blue-800 text-xs p-1 h-auto"
                    >
                      <Link className="h-3 w-3 mr-1" />
                      View Reversal Entry
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditEntry(entry)}
              className="text-blue-600 hover:text-blue-800"
              disabled={entry.status === 'reversed'}
              title={entry.status === 'reversed' ? 'Cannot edit reversed entries' : 'Edit entry'}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            {/* Duplicate Button */}
            {handleDuplicateEntry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDuplicateEntry!(entry)}
                className="text-blue-600 hover:text-blue-800"
                title="Duplicate this journal entry"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}

            {/* Reverse Button - Only show for posted entries that haven't been reversed */}
            {entry.status === 'posted' && !entry.reversalEntryId && handleReverseEntry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReverseEntry!(entry)}
                className="text-orange-600 hover:text-orange-800"
                title="Reverse this journal entry"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteEntry(entry)}
              className="text-red-600 hover:text-red-800"
              disabled={entry.status === 'posted' || entry.status === 'reversed'}
              title={
                entry.status === 'posted' ? 'Cannot delete posted entries. Use reverse instead.' :
                entry.status === 'reversed' ? 'Cannot delete reversed entries' :
                'Delete entry'
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleEntryExpansion(entry.id)}
              className="text-gray-600 hover:text-gray-800"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Entry Details - Journal Lines */}
      {isExpanded && (
        <div className="border-t bg-gray-50">
          <div className="p-4">
            <div className="bg-white rounded border">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 p-3 bg-gray-100 font-semibold text-sm text-gray-700 border-b">
                <div className="col-span-1 text-center">Code</div>
                <div className="col-span-4">Account</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2 text-right">Debit</div>
                <div className="col-span-2 text-right">Credit</div>
              </div>

              {/* Journal Lines */}
              {entry.lines.map((line, index) => (
                <div key={line.id} className={`grid grid-cols-12 gap-2 p-3 text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} border-b last:border-b-0`}>
                  <div className="col-span-1 text-center text-xs text-gray-500">
                    {line.accountCode || '-'}
                  </div>
                  <div className="col-span-4 font-medium">
                    {line.accountName || `Account ${line.accountId}`}
                  </div>
                  <div className="col-span-3 text-gray-600">
                    {line.description || '-'}
                  </div>
                  <div className="col-span-2 text-right font-mono">
                    {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                  </div>
                  <div className="col-span-2 text-right font-mono">
                    {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                  </div>
                </div>
              ))}

              {/* Totals Row */}
              <div className="grid grid-cols-12 gap-2 p-3 bg-gray-100 font-semibold text-sm border-t-2">
                <div className="col-span-8 text-right">TOTALS:</div>
                <div className="col-span-2 text-right font-mono">
                  {formatCurrency(entry.totalDebits)}
                </div>
                <div className="col-span-2 text-right font-mono">
                  {formatCurrency(entry.totalCredits)}
                </div>
              </div>

              {/* Balance Check */}
              {entry.isBalanced ? (
                <div className="p-2 bg-green-50 text-green-800 text-center text-xs font-medium">
                  ✓ Entry is balanced
                </div>
              ) : (
                <div className="p-2 bg-red-50 text-red-800 text-center text-xs font-medium">
                  ⚠ Entry is not balanced (Difference: {formatCurrency(Math.abs(entry.totalDebits - entry.totalCredits))})
                </div>
              )}
            </div>

            {/* Audit Trail */}
            <div className="mt-4">
              <AuditTrailCard entry={entry} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};