"use client";

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { BankAccount, DigitalWallet } from '@/types/banksWallets.types';
import { Building2, Wallet } from 'lucide-react';

interface AccountOption {
  value: string;
  label: string;
  type: 'bank' | 'wallet';
  account: BankAccount | DigitalWallet;
}

interface AccountSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (accountId: string, accountType: 'bank' | 'wallet') => void;
  bankAccounts: BankAccount[];
  digitalWallets: DigitalWallet[];
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export const AccountSelectionDialog: React.FC<AccountSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  bankAccounts,
  digitalWallets,
  title = "Select Payment Account",
  description = "Choose which account received this payment",
  isLoading = false
}) => {
  const [selectedAccountValue, setSelectedAccountValue] = useState<string>('');

  // Combine bank accounts and digital wallets into options
  const accountOptions = useMemo(() => {
    const options: AccountOption[] = [];

    // Add bank accounts
    bankAccounts.forEach(account => {
      options.push({
        value: `bank-${account.id}`,
        label: `${account.accountName} (${account.bankName}) - ${account.currency}`,
        type: 'bank',
        account
      });
    });

    // Add digital wallets
    digitalWallets.forEach(wallet => {
      options.push({
        value: `wallet-${wallet.id}`,
        label: `${wallet.walletName} - ${wallet.currency}`,
        type: 'wallet',
        account: wallet
      });
    });

    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [bankAccounts, digitalWallets]);

  const comboboxOptions = accountOptions.map(option => ({
    value: option.value,
    label: option.label
  }));

  const handleConfirm = () => {
    if (!selectedAccountValue) return;

    const selectedOption = accountOptions.find(opt => opt.value === selectedAccountValue);
    if (selectedOption) {
      const accountId = selectedOption.type === 'bank' 
        ? (selectedOption.account as BankAccount).id 
        : (selectedOption.account as DigitalWallet).id;
      
      onSelectAccount(accountId, selectedOption.type);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedAccountValue('');
    onClose();
  };

  const selectedOption = accountOptions.find(opt => opt.value === selectedAccountValue);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Account Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Payment Account
            </label>
            <Combobox
              options={comboboxOptions}
              value={selectedAccountValue}
              onValueChange={setSelectedAccountValue}
              placeholder="Select account..."
              searchPlaceholder="Search accounts..."
              emptyMessage="No accounts found"
              disabled={isLoading}
            />
          </div>

          {/* Selected Account Preview */}
          {selectedOption && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {selectedOption.type === 'bank' ? (
                  <Building2 className="h-4 w-4 text-blue-600" />
                ) : (
                  <Wallet className="h-4 w-4 text-purple-600" />
                )}
                <span className="text-sm font-medium">
                  {selectedOption.type === 'bank' ? 'Bank Account' : 'Digital Wallet'}
                </span>
              </div>
              <p className="text-sm text-gray-600">{selectedOption.label}</p>
            </div>
          )}

          {/* Warning if no accounts available */}
          {accountOptions.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                No bank accounts or digital wallets found. Please add payment methods first.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedAccountValue || isLoading || accountOptions.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};