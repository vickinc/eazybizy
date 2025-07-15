import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Building from "lucide-react/dist/esm/icons/building";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Save from "lucide-react/dist/esm/icons/save";
import X from "lucide-react/dist/esm/icons/x";
import { AccountBalance, InitialBalance } from '@/types/balance.types';
import { balanceStorageService } from '@/services/storage/balanceStorageService';
import { BalanceBusinessService } from '@/services/business/balanceBusinessService';

interface ManualBalanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accountBalance?: AccountBalance;
  onSave: (
    accountId: string,
    accountType: 'bank' | 'wallet',
    amount: number,
    currency: string,
    companyId: number,
    notes?: string
  ) => Promise<void>;
  loading?: boolean;
}

export const ManualBalanceDialog: React.FC<ManualBalanceDialogProps> = ({
  isOpen,
  onClose,
  accountBalance,
  onSave,
  loading = false
}) => {
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const account = accountBalance?.account;
  const company = accountBalance?.company;
  const isBank = account && BalanceBusinessService.isAccountBank(account);
  
  // Memoize existing initial balance to prevent infinite loops
  const existingInitialBalance = useMemo(() => {
    if (!accountBalance || !account) return null;
    return balanceStorageService.getInitialBalance(
      account.id, 
      isBank ? 'bank' : 'wallet'
    );
  }, [accountBalance, account, isBank]);

  // Initialize form with existing data
  useEffect(() => {
    if (isOpen && accountBalance) {
      if (existingInitialBalance) {
        setAmount(existingInitialBalance.amount.toString());
        setNotes(existingInitialBalance.notes || '');
      } else {
        setAmount('');
        setNotes('');
      }
      setErrors({});
    }
  }, [isOpen, accountBalance, existingInitialBalance]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate amount
    const numAmount = parseFloat(amount);
    if (amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(numAmount) || !isFinite(numAmount)) {
      newErrors.amount = 'Please enter a valid number';
    }

    // Validate notes length
    if (notes.length > 500) {
      newErrors.notes = 'Notes must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountBalance || !account || !company || !validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      const numAmount = parseFloat(amount);
      await onSave(
        account.id,
        isBank ? 'bank' : 'wallet',
        numAmount,
        account.currency,
        company.id,
        notes.trim() || undefined
      );
      onClose();
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save initial balance'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow negative numbers, decimals, and empty string
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setAmount(value);
      if (errors.amount) {
        setErrors(prev => ({ ...prev, amount: '' }));
      }
    }
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return BalanceBusinessService.formatCurrency(amount, currency);
  };

  if (!accountBalance || !account || !company) {
    return null;
  }

  const isEditing = !!existingInitialBalance;
  const previewAmount = amount ? parseFloat(amount) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>
              {isEditing ? 'Edit' : 'Set'} Initial Balance
            </span>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the' : 'Set the'} starting balance for this account. 
            This will be used as the base for calculating the final balance.
          </DialogDescription>
        </DialogHeader>

        {/* Account Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                {isBank ? (
                  <CreditCard className="h-5 w-5 text-blue-600" />
                ) : (
                  <Wallet className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{account.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                  <Building className="h-4 w-4" />
                  <span>{company.tradingName}</span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={isBank ? "default" : "secondary"}>
                    {isBank ? 'Bank Account' : 'Digital Wallet'}
                  </Badge>
                  <Badge variant="outline">{account.currency}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Initial Balance ({account.currency})
            </Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className={errors.amount ? 'border-red-500' : ''}
              disabled={saving}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
            {amount && !errors.amount && (
              <p className="text-sm text-gray-500">
                Preview: {formatCurrency(previewAmount, account.currency)}
              </p>
            )}
          </div>

          {/* Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this initial balance..."
              className={errors.notes ? 'border-red-500' : ''}
              disabled={saving}
              maxLength={500}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes}</p>
            )}
            <p className="text-xs text-gray-500">
              {notes.length}/500 characters
            </p>
          </div>

          {/* Current Balance Info */}
          {isEditing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Current initial balance: {formatCurrency(existingInitialBalance!.amount, account.currency)}
                {existingInitialBalance!.notes && (
                  <div className="mt-1 text-sm text-gray-600">
                    Notes: {existingInitialBalance!.notes}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || loading}
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update' : 'Save'} Balance
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};