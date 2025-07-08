import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDateForDisplay } from '@/utils';
import { BookkeepingEntry } from '@/types';

interface LinkEntryDialogProps {
  open: boolean;
  onClose: () => void;
  linkableEntriesByType: { income: BookkeepingEntry[]; expense: BookkeepingEntry[] };
  formatCurrency: (amount: number, currency?: string) => string;
  onLinkEntry: (entryId: string) => void;
}

export const LinkEntryDialog: React.FC<LinkEntryDialogProps> = ({
  open,
  onClose,
  linkableEntriesByType,
  formatCurrency,
  onLinkEntry
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Link Transaction to Entry</DialogTitle>
          <DialogDescription>Select an entry to link this transaction to</DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Available Income Entries</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {linkableEntriesByType.income.map(entry => (
                <div key={entry.id} className="p-3 border rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => onLinkEntry(entry.id)}>
                  <p className="font-medium">{entry.description}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(entry.amount, entry.currency)} on {formatDateForDisplay(entry.date)}</p>
                </div>
              ))}
              {linkableEntriesByType.income.length === 0 && (
                <div className="p-3 text-gray-500 italic">No available income entries to link</div>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Available Expense Entries</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {linkableEntriesByType.expense.map(entry => (
                <div key={entry.id} className="p-3 border rounded-lg hover:bg-gray-100 cursor-pointer" onClick={() => onLinkEntry(entry.id)}>
                  <p className="font-medium">{entry.description}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(entry.amount, entry.currency)} on {formatDateForDisplay(entry.date)}</p>
                </div>
              ))}
              {linkableEntriesByType.expense.length === 0 && (
                <div className="p-3 text-gray-500 italic">No available expense entries to link</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};