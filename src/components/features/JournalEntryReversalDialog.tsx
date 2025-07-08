import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JournalEntry } from '@/types';
import { formatDateForDisplay } from '@/utils';
import { AlertTriangle, RotateCcw, DollarSign } from 'lucide-react';

interface JournalEntryReversalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry | null;
  formatCurrency: (amount: number, currency?: string) => string;
  onConfirm: (entry: JournalEntry, reason: string) => void;
  onCancel: () => void;
}

export const JournalEntryReversalDialog: React.FC<JournalEntryReversalDialogProps> = ({
  open,
  onOpenChange,
  entry,
  formatCurrency,
  onConfirm,
  onCancel
}) => {
  const [reversalReason, setReversalReason] = useState('');

  const handleConfirm = () => {
    if (entry) {
      onConfirm(entry, reversalReason.trim());
      setReversalReason('');
    }
  };

  const handleCancel = () => {
    setReversalReason('');
    onCancel();
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            <span>Reverse Journal Entry</span>
          </DialogTitle>
          <DialogDescription>
            Create a reversal entry to correct this posted journal entry. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-amber-800">Important: Reversal Entry</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• A new journal entry will be created with reversed debit/credit amounts</li>
                  <li>• The original entry will be marked as "Reversed" and cannot be edited</li>
                  <li>• Both entries will remain visible in your records for audit purposes</li>
                  <li>• This action affects your financial statements immediately</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Entry to be Reversed */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Entry to be Reversed:</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Entry Number:</span>
                <span className="text-sm font-medium">{entry.entryNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium">{formatDateForDisplay(entry.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Description:</span>
                <span className="text-sm font-medium">{entry.description}</span>
              </div>
              {entry.reference && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Reference:</span>
                  <span className="text-sm font-medium">{entry.reference}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="text-sm font-medium flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formatCurrency(entry.totalDebits)}
                </span>
              </div>
            </div>
          </div>

          {/* Journal Lines Preview */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-3 bg-gray-100 border-b">
              <h4 className="font-medium text-gray-900">Journal Lines (will be reversed):</h4>
            </div>
            <div className="p-0">
              <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 text-xs font-medium text-gray-600 border-b">
                <div className="col-span-5">Account</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2 text-right">Original</div>
                <div className="col-span-2 text-right">Reversal</div>
              </div>
              {entry.lines.map((line, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 text-sm border-b last:border-b-0">
                  <div className="col-span-5">
                    <div className="font-medium">{line.accountName || line.accountId}</div>
                    {line.accountCode && (
                      <div className="text-xs text-gray-500">{line.accountCode}</div>
                    )}
                  </div>
                  <div className="col-span-3 text-gray-600">
                    {line.description || '-'}
                  </div>
                  <div className="col-span-2 text-right">
                    {line.debit > 0 ? (
                      <span className="text-red-600">Dr {formatCurrency(line.debit)}</span>
                    ) : (
                      <span className="text-green-600">Cr {formatCurrency(line.credit)}</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    {line.debit > 0 ? (
                      <span className="text-green-600">Cr {formatCurrency(line.debit)}</span>
                    ) : (
                      <span className="text-red-600">Dr {formatCurrency(line.credit)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason for Reversal */}
          <div>
            <Label htmlFor="reversalReason">Reason for Reversal (Optional)</Label>
            <Textarea
              id="reversalReason"
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="Enter the reason for reversing this entry (e.g., 'Incorrect amount', 'Posted to wrong account', etc.)"
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              This reason will be included in the reversal entry description.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Create Reversal Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};