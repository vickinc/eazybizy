import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  Wallet
} from "lucide-react";
import { Company } from '@/types';
import { NewManualEntry, EnhancedBankAccount, EnhancedDigitalWallet } from '@/services/business/cashflowBusinessService';

const currencies = [
  'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'MXN',
  'NZD', 'SGD', 'HKD', 'NOK', 'KRW', 'TRY', 'INR', 'RUB', 'BRL', 'ZAR',
  'DKK', 'PLN', 'TWD', 'THB', 'MYR',
  // Common cryptocurrencies and digital tokens
  'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE',
  'AVAX', 'SHIB', 'LTC', 'MATIC', 'UNI', 'LINK', 'BCH', 'XLM', 'ALGO', 'VET'
];

interface ManualEntryDialogProps {
  open: boolean;
  onClose: () => void;
  newManualEntry: NewManualEntry;
  enhancedBankAccounts: EnhancedBankAccount[];
  enhancedDigitalWallets: EnhancedDigitalWallet[];
  selectedCompany: number | 'all';
  updateNewManualEntry: (field: keyof NewManualEntry, value: string | number) => void;
  handleCreateManualEntry: () => void;
}

export const ManualEntryDialog: React.FC<ManualEntryDialogProps> = ({
  open,
  onClose,
  newManualEntry,
  enhancedBankAccounts,
  enhancedDigitalWallets,
  selectedCompany,
  updateNewManualEntry,
  handleCreateManualEntry
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Cashflow Entry</DialogTitle>
          <DialogDescription>
            Add a manual cashflow entry for a specific account and period
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Account</Label>
            <Select 
              value={newManualEntry.accountId} 
              onValueChange={(value) => {
                const [accountId, accountType] = value.split(':');
                updateNewManualEntry('accountId', accountId);
                updateNewManualEntry('accountType', accountType as 'bank' | 'wallet');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2 py-2">
                    <CreditCard className="h-4 w-4" />
                    Bank Accounts
                  </SelectLabel>
                  {enhancedBankAccounts.map(acc => (
                    <SelectItem key={acc.id} value={`${acc.id}:bank`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{acc.bankName} - {acc.accountName}</span>
                        <span className="text-sm text-gray-500">
                          {acc.company.tradingName} • {acc.currency}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2 py-2">
                    <Wallet className="h-4 w-4" />
                    Digital Wallets
                  </SelectLabel>
                  {enhancedDigitalWallets.map(wallet => (
                    <SelectItem key={wallet.id} value={`${wallet.id}:wallet`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{wallet.walletName}</span>
                        <span className="text-sm text-gray-500">
                          {wallet.company.tradingName} • {wallet.currency}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select 
                value={newManualEntry.type} 
                onValueChange={(value: 'inflow' | 'outflow') => updateNewManualEntry('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inflow">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4 text-green-600" />
                      Inflow
                    </div>
                  </SelectItem>
                  <SelectItem value="outflow">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4 text-red-600" />
                      Outflow
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Period (Month)</Label>
              <Input
                type="month"
                value={newManualEntry.period}
                onChange={(e) => updateNewManualEntry('period', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newManualEntry.amount}
                onChange={(e) => updateNewManualEntry('amount', e.target.value)}
              />
            </div>

            <div>
              <Label>Currency</Label>
              <Select 
                value={newManualEntry.currency} 
                onValueChange={(value) => updateNewManualEntry('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(curr => (
                    <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              placeholder="Brief description of the cashflow"
              value={newManualEntry.description}
              onChange={(e) => updateNewManualEntry('description', e.target.value)}
            />
          </div>

          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Additional notes or details"
              value={newManualEntry.notes}
              onChange={(e) => updateNewManualEntry('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreateManualEntry}>
            Create Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};