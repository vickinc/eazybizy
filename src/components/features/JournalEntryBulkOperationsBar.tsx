import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Copy from "lucide-react/dist/esm/icons/copy";
import FileEdit from "lucide-react/dist/esm/icons/file-edit";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Archive from "lucide-react/dist/esm/icons/archive";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import XCircle from "lucide-react/dist/esm/icons/circle";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import { JournalEntry } from '@/types';

interface JournalEntryBulkOperationsBarProps {
  selectedEntries: Set<string>;
  entries: JournalEntry[];
  onBulkDelete: () => void;
  onBulkStatusChange: (status: 'draft' | 'posted') => void;
  onBulkDuplicate: () => void;
  onBulkReverse: () => void;
  onClearSelection: () => void;
}

export const JournalEntryBulkOperationsBar: React.FC<JournalEntryBulkOperationsBarProps> = ({
  selectedEntries,
  entries,
  onBulkDelete,
  onBulkStatusChange,
  onBulkDuplicate,
  onBulkReverse,
  onClearSelection
}) => {
  const [bulkAction, setBulkAction] = useState<string>('');
  
  if (selectedEntries.size === 0) {
    return null;
  }

  const selectedEntriesData = entries.filter(entry => selectedEntries.has(entry.id));
  const canPost = selectedEntriesData.every(entry => entry.status === 'draft');
  const canReverse = selectedEntriesData.every(entry => entry.status === 'posted' && !entry.reversalEntryId);
  const totalAmount = selectedEntriesData.reduce((sum, entry) => sum + entry.totalDebits, 0);

  const handleBulkAction = () => {
    switch (bulkAction) {
      case 'delete':
        onBulkDelete();
        break;
      case 'post':
        onBulkStatusChange('posted');
        break;
      case 'draft':
        onBulkStatusChange('draft');
        break;
      case 'duplicate':
        onBulkDuplicate();
        break;
      case 'reverse':
        onBulkReverse();
        break;
    }
    setBulkAction('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'posted': return 'bg-green-100 text-green-800';
      case 'reversed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {/* Selection Summary */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">
              {selectedEntries.size} {selectedEntries.size === 1 ? 'entry' : 'entries'} selected
            </span>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="text-sm text-blue-700">
            Total: <span className="font-medium">${totalAmount.toLocaleString()}</span>
          </div>
          
          {/* Status Breakdown */}
          <div className="flex items-center space-x-1">
            {['draft', 'posted', 'reversed'].map(status => {
              const count = selectedEntriesData.filter(entry => entry.status === status).length;
              if (count === 0) return null;
              return (
                <Badge key={status} variant="secondary" className={getStatusColor(status)}>
                  {count} {status}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center space-x-2">
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Choose action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="duplicate">
                <div className="flex items-center space-x-2">
                  <Copy className="h-4 w-4" />
                  <span>Duplicate Entries</span>
                </div>
              </SelectItem>
              
              {canPost && (
                <SelectItem value="post">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Post to Ledger</span>
                  </div>
                </SelectItem>
              )}
              
              <SelectItem value="draft">
                <div className="flex items-center space-x-2">
                  <FileEdit className="h-4 w-4" />
                  <span>Mark as Draft</span>
                </div>
              </SelectItem>
              
              {canReverse && (
                <SelectItem value="reverse">
                  <div className="flex items-center space-x-2">
                    <Archive className="h-4 w-4" />
                    <span>Reverse Entries</span>
                  </div>
                </SelectItem>
              )}
              
              <SelectItem value="delete" className="text-red-600">
                <div className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Entries</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleBulkAction}
            disabled={!bulkAction}
            variant={bulkAction === 'delete' ? 'destructive' : 'default'}
            size="sm"
          >
            {bulkAction === 'delete' && <AlertTriangle className="h-4 w-4 mr-1" />}
            Apply
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearSelection}
            className="text-gray-600"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};