import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BankAccount, DigitalWallet } from '@/types';
import { 
  NewBankAccount, 
  NewDigitalWallet,
  BanksWalletsBusinessService 
} from '@/services/business/banksWalletsBusinessService';
import Building2 from "lucide-react/dist/esm/icons/building-2";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Globe from "lucide-react/dist/esm/icons/globe";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Info from "lucide-react/dist/esm/icons/info";

interface BanksWalletsDialogsProps {
  // Company options for dropdowns
  companyOptions: { value: string; label: string }[];
  
  // Bank Account Dialog State
  showAddBankForm: boolean;
  editingBank: BankAccount | null;
  newBankAccount: NewBankAccount;
  
  // Digital Wallet Dialog State
  showAddWalletForm: boolean;
  editingWallet: DigitalWallet | null;
  newDigitalWallet: NewDigitalWallet;
  
  // Event Handlers
  setEditingBank: (bank: BankAccount | null) => void;
  updateNewBankAccount: (field: keyof NewBankAccount, value: string | number) => void;
  handleCreateBankAccount: () => void;
  handleUpdateBankAccount: (bank: BankAccount) => Promise<void>;
  onCloseAddBankDialog: () => void;
  onCloseEditBankDialog: () => void;
  
  setEditingWallet: (wallet: DigitalWallet | null) => void;
  updateNewDigitalWallet: (field: keyof NewDigitalWallet, value: string | number | string[]) => void;
  handleCreateDigitalWallet: () => void;
  handleUpdateDigitalWallet: (wallet: DigitalWallet) => Promise<void>;
  onCloseAddWalletDialog: () => void;
  onCloseEditWalletDialog: () => void;
}

export const BanksWalletsDialogs: React.FC<BanksWalletsDialogsProps> = ({
  companyOptions,
  showAddBankForm,
  editingBank,
  newBankAccount,
  showAddWalletForm,
  editingWallet,
  newDigitalWallet,
  setEditingBank,
  updateNewBankAccount,
  handleCreateBankAccount,
  handleUpdateBankAccount,
  onCloseAddBankDialog,
  onCloseEditBankDialog,
  setEditingWallet,
  updateNewDigitalWallet,
  handleCreateDigitalWallet,
  handleUpdateDigitalWallet,
  onCloseAddWalletDialog,
  onCloseEditWalletDialog
}) => {
  const renderCompanySelect = (
    value: number,
    onValueChange: (value: string) => void,
    isEdit: boolean = false
  ) => (
    <div>
      <Label>Company * {companyOptions.length === 0 && <span className="text-red-500">(No companies found)</span>}</Label>
      <Select value={value ? value.toString() : ''} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={companyOptions.length === 0 ? "No companies available" : "Select company"} />
        </SelectTrigger>
        <SelectContent>
          {companyOptions.length === 0 ? (
            <SelectItem value="0" disabled>No companies available</SelectItem>
          ) : (
            companyOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      {/* Add Bank Account Dialog */}
      <Dialog open={showAddBankForm} onOpenChange={(open) => !open && onCloseAddBankDialog()}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Add Bank Account</DialogTitle>
                <DialogDescription className="text-sm">
                  Add a new bank account for secure payment processing
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Basic Information Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank-name" className="text-sm font-medium">Bank Name *</Label>
                  <Input 
                    id="bank-name" 
                    placeholder="e.g., Chase Bank, Wells Fargo"
                    value={newBankAccount.bankName}
                    onChange={(e) => updateNewBankAccount('bankName', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="account-name" className="text-sm font-medium">Account Holder Name *</Label>
                  <Input 
                    id="account-name" 
                    placeholder="Enter the account holder's full name"
                    value={newBankAccount.accountName}
                    onChange={(e) => updateNewBankAccount('accountName', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                  <Select value={newBankAccount.currency} onValueChange={(value) => updateNewBankAccount('currency', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {BanksWalletsBusinessService.CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{currency}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Account Details Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                Account Details
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Account Number or IBAN Required</p>
                    <p className="text-blue-700 mt-1">You can provide either an account number OR an IBAN. IBAN is preferred for international transactions.</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="account-number" className="text-sm font-medium">Account Number</Label>
                  <Input 
                    id="account-number" 
                    placeholder="e.g., 1234567890"
                    value={newBankAccount.accountNumber}
                    onChange={(e) => updateNewBankAccount('accountNumber', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For domestic accounts
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="iban" className="text-sm font-medium">IBAN</Label>
                  <Input 
                    id="iban" 
                    placeholder="e.g., GB29 NWBK 6016 1331 9268 19"
                    value={newBankAccount.iban}
                    onChange={(e) => updateNewBankAccount('iban', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    International Bank Account Number
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="swift" className="text-sm font-medium">SWIFT/BIC Code *</Label>
                  <Input 
                    id="swift" 
                    placeholder="e.g., CHASUS33"
                    value={newBankAccount.swiftCode}
                    onChange={(e) => updateNewBankAccount('swiftCode', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    8 or 11 character code for bank identification
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                Additional Information
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </h3>
              
              <div>
                <Label htmlFor="bank-address" className="text-sm font-medium">Bank Address</Label>
                <Textarea 
                  id="bank-address" 
                  placeholder="Enter the bank's physical address (optional)"
                  value={newBankAccount.bankAddress}
                  onChange={(e) => updateNewBankAccount('bankAddress', e.target.value)}
                  rows={2}
                  className="mt-1 resize-none"
                />
              </div>
              
              <div>
                <Label htmlFor="bank-notes" className="text-sm font-medium">Notes</Label>
                <Textarea 
                  id="bank-notes" 
                  placeholder="Add any additional notes or special instructions..."
                  value={newBankAccount.notes}
                  onChange={(e) => updateNewBankAccount('notes', e.target.value)}
                  rows={2}
                  className="mt-1 resize-none"
                />
              </div>
            </div>
          </div>
          
          {/* Footer with Actions */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              * Required fields
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCloseAddBankDialog} className="min-w-[100px]">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateBankAccount}
                className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Bank Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Digital Wallet Dialog */}
      <Dialog open={showAddWalletForm} onOpenChange={(open) => !open && onCloseAddWalletDialog()}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Add Digital Wallet</DialogTitle>
                <DialogDescription className="text-sm">
                  Add a new digital wallet or payment method for online transactions
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Basic Information Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wallet-type" className="text-sm font-medium">Wallet Type *</Label>
                  <Select value={newDigitalWallet.walletType} onValueChange={(value: unknown) => {
                    updateNewDigitalWallet('walletType', value);
                    updateNewDigitalWallet('currency', value === 'crypto' ? 'USDT' : 'USD');
                    updateNewDigitalWallet('currencies', []);
                  }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select wallet type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BanksWalletsBusinessService.WALLET_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.value === 'paypal' && <Globe className="h-4 w-4 text-blue-600" />}
                            {type.value === 'crypto' && <Wallet className="h-4 w-4 text-orange-600" />}
                            {type.value === 'stripe' && <CreditCard className="h-4 w-4 text-indigo-600" />}
                            {type.value === 'wise' && <Globe className="h-4 w-4 text-green-600" />}
                            {type.value === 'other' && <Wallet className="h-4 w-4 text-gray-600" />}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="wallet-name" className="text-sm font-medium">Wallet Name *</Label>
                  <Input 
                    id="wallet-name" 
                    placeholder="e.g., My PayPal Business Account"
                    value={newDigitalWallet.walletName}
                    onChange={(e) => updateNewDigitalWallet('walletName', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="wallet-address" className="text-sm font-medium">
                    {newDigitalWallet.walletType === 'crypto' ? 'Wallet Address *' : 'Account Email/ID *'}
                  </Label>
                  <Input 
                    id="wallet-address" 
                    placeholder={
                      newDigitalWallet.walletType === 'crypto' 
                        ? "e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                        : "e.g., business@company.com"
                    }
                    value={newDigitalWallet.walletAddress}
                    onChange={(e) => updateNewDigitalWallet('walletAddress', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newDigitalWallet.walletType === 'crypto' 
                      ? "The public address of your cryptocurrency wallet"
                      : "The email or account identifier for this payment method"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Currency & Network Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                {newDigitalWallet.walletType === 'crypto' ? 'Currency & Network Details' : 'Currency Settings'}
              </h3>
              
              {newDigitalWallet.walletType === 'crypto' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="wallet-blockchain" className="text-sm font-medium">Blockchain Network *</Label>
                    <Input 
                      id="wallet-blockchain" 
                      placeholder="e.g., Ethereum, Bitcoin, Polygon, BSC"
                      value={newDigitalWallet.blockchain}
                      onChange={(e) => updateNewDigitalWallet('blockchain', e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The blockchain network this wallet operates on
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="wallet-currencies" className="text-sm font-medium">Supported Cryptocurrencies *</Label>
                    <div className="space-y-2 mt-1">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                        {BanksWalletsBusinessService.CRYPTO_CURRENCIES.map(currency => (
                          <label key={currency} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={newDigitalWallet.currencies.includes(currency)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateNewDigitalWallet('currencies', [...newDigitalWallet.currencies, currency]);
                                  if (newDigitalWallet.currencies.length === 0) {
                                    updateNewDigitalWallet('currency', currency);
                                  }
                                } else {
                                  const newCurrencies = newDigitalWallet.currencies.filter(c => c !== currency);
                                  updateNewDigitalWallet('currencies', newCurrencies);
                                  if (newCurrencies.length > 0) {
                                    updateNewDigitalWallet('currency', newCurrencies[0]);
                                  } else {
                                    updateNewDigitalWallet('currency', 'USDT');
                                  }
                                }
                              }}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm font-medium">{currency}</span>
                          </label>
                        ))}
                      </div>
                      {newDigitalWallet.currencies.length > 0 && (
                        <div className="bg-purple-50 border border-purple-200 rounded-md p-2">
                          <p className="text-sm font-medium text-purple-800">Selected currencies:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {newDigitalWallet.currencies.map(currency => (
                              <Badge key={currency} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                {currency}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="wallet-currency" className="text-sm font-medium">Primary Currency</Label>
                  <Select value={newDigitalWallet.currency} onValueChange={(value) => updateNewDigitalWallet('currency', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {BanksWalletsBusinessService.CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{currency}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Additional Information Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                Additional Information
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </h3>
              
              <div>
                <Label htmlFor="wallet-description" className="text-sm font-medium">Description</Label>
                <Input 
                  id="wallet-description" 
                  placeholder="Brief description of this wallet's purpose..."
                  value={newDigitalWallet.description}
                  onChange={(e) => updateNewDigitalWallet('description', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="wallet-notes" className="text-sm font-medium">Notes</Label>
                <Textarea 
                  id="wallet-notes" 
                  placeholder="Add any additional notes or special instructions..."
                  value={newDigitalWallet.notes}
                  onChange={(e) => updateNewDigitalWallet('notes', e.target.value)}
                  rows={2}
                  className="mt-1 resize-none"
                />
              </div>
            </div>
          </div>
          
          {/* Footer with Actions */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              * Required fields
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCloseAddWalletDialog} className="min-w-[100px]">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateDigitalWallet}
                className="min-w-[120px] bg-purple-600 hover:bg-purple-700"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Add Digital Wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Bank Account Dialog */}
      <Dialog open={!!editingBank} onOpenChange={(open) => !open && onCloseEditBankDialog()}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Edit Bank Account</DialogTitle>
                <DialogDescription className="text-sm">
                  Update your bank account information for secure payment processing
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {editingBank && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Company Selection Section */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-yellow-500 rounded-full"></div>
                  Company Assignment
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {renderCompanySelect(
                    editingBank.companyId,
                    (value) => setEditingBank({ ...editingBank, companyId: parseInt(value) }),
                    true
                  )}
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-bank-name" className="text-sm font-medium">Bank Name *</Label>
                    <Input 
                      id="edit-bank-name" 
                      placeholder="e.g., Chase Bank, Wells Fargo"
                      value={editingBank.bankName}
                      onChange={(e) => setEditingBank({ ...editingBank, bankName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-account-name" className="text-sm font-medium">Account Holder Name *</Label>
                    <Input 
                      id="edit-account-name" 
                      placeholder="Enter the account holder's full name"
                      value={editingBank.accountName}
                      onChange={(e) => setEditingBank({ ...editingBank, accountName: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-bank-currency" className="text-sm font-medium">Currency</Label>
                    <Select value={editingBank.currency} onValueChange={(value) => setEditingBank({ ...editingBank, currency: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {BanksWalletsBusinessService.CURRENCIES.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{currency}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Account Details Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                  Account Details
                </h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Account Number or IBAN Required</p>
                      <p className="text-blue-700 mt-1">You can provide either an account number OR an IBAN. IBAN is preferred for international transactions.</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-account-number" className="text-sm font-medium">Account Number</Label>
                    <Input 
                      id="edit-account-number" 
                      placeholder="e.g., 1234567890"
                      value={editingBank.accountNumber || ''}
                      onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For domestic accounts
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-iban" className="text-sm font-medium">IBAN</Label>
                    <Input 
                      id="edit-iban" 
                      placeholder="e.g., GB29 NWBK 6016 1331 9268 19"
                      value={editingBank.iban}
                      onChange={(e) => setEditingBank({ ...editingBank, iban: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      International Bank Account Number
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-swift" className="text-sm font-medium">SWIFT/BIC Code *</Label>
                    <Input 
                      id="edit-swift" 
                      placeholder="e.g., CHASUS33"
                      value={editingBank.swiftCode}
                      onChange={(e) => setEditingBank({ ...editingBank, swiftCode: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      8 or 11 character code for bank identification
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                  Additional Information
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </h3>
                
                <div>
                  <Label htmlFor="edit-bank-address" className="text-sm font-medium">Bank Address</Label>
                  <Textarea 
                    id="edit-bank-address" 
                    placeholder="Enter the bank's physical address (optional)"
                    value={editingBank.bankAddress}
                    onChange={(e) => setEditingBank({ ...editingBank, bankAddress: e.target.value })}
                    rows={2}
                    className="mt-1 resize-none"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-bank-notes" className="text-sm font-medium">Notes</Label>
                  <Textarea 
                    id="edit-bank-notes" 
                    placeholder="Add any additional notes or special instructions..."
                    value={editingBank.notes || ''}
                    onChange={(e) => setEditingBank({ ...editingBank, notes: e.target.value })}
                    rows={2}
                    className="mt-1 resize-none"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Footer with Actions */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              * Required fields
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCloseEditBankDialog} className="min-w-[100px]">
                Cancel
              </Button>
              {editingBank && (
                <Button 
                  onClick={() => handleUpdateBankAccount(editingBank)}
                  className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Bank Account
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Digital Wallet Dialog */}
      <Dialog open={!!editingWallet} onOpenChange={(open) => !open && onCloseEditWalletDialog()}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">Edit Digital Wallet</DialogTitle>
                <DialogDescription className="text-sm">
                  Update your digital wallet information for online transactions
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {editingWallet && (
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Company Selection Section */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-yellow-500 rounded-full"></div>
                  Company Assignment
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {renderCompanySelect(
                    editingWallet.companyId,
                    (value) => setEditingWallet({ ...editingWallet, companyId: parseInt(value) }),
                    true
                  )}
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-wallet-type" className="text-sm font-medium">Wallet Type *</Label>
                    <Select value={editingWallet.walletType} onValueChange={(value: unknown) => setEditingWallet({
                      ...editingWallet,
                      walletType: value,
                      currency: value === 'crypto' ? 'USDT' : 'USD',
                      currencies: value === 'crypto' ? (editingWallet.currencies || '') : ''
                    })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select wallet type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BanksWalletsBusinessService.WALLET_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              {type.value === 'paypal' && <Globe className="h-4 w-4 text-blue-600" />}
                              {type.value === 'crypto' && <Wallet className="h-4 w-4 text-orange-600" />}
                              {type.value === 'stripe' && <CreditCard className="h-4 w-4 text-indigo-600" />}
                              {type.value === 'wise' && <Globe className="h-4 w-4 text-green-600" />}
                              {type.value === 'other' && <Wallet className="h-4 w-4 text-gray-600" />}
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-wallet-name" className="text-sm font-medium">Wallet Name *</Label>
                    <Input 
                      id="edit-wallet-name" 
                      placeholder="e.g., My PayPal Business Account"
                      value={editingWallet.walletName}
                      onChange={(e) => setEditingWallet({ ...editingWallet, walletName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-wallet-address" className="text-sm font-medium">
                      {editingWallet.walletType === 'crypto' ? 'Wallet Address *' : 'Account Email/ID *'}
                    </Label>
                    <Input 
                      id="edit-wallet-address" 
                      placeholder={
                        editingWallet.walletType === 'crypto' 
                          ? "e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                          : "e.g., business@company.com"
                      }
                      value={editingWallet.walletAddress}
                      onChange={(e) => setEditingWallet({ ...editingWallet, walletAddress: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {editingWallet.walletType === 'crypto' 
                        ? "The public address of your cryptocurrency wallet"
                        : "The email or account identifier for this payment method"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Currency & Network Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                  {editingWallet.walletType === 'crypto' ? 'Currency & Network Details' : 'Currency Settings'}
                </h3>
                
                {editingWallet.walletType === 'crypto' ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-wallet-blockchain" className="text-sm font-medium">Blockchain Network *</Label>
                      <Input 
                        id="edit-wallet-blockchain" 
                        placeholder="e.g., Ethereum, Bitcoin, Polygon, BSC"
                        value={editingWallet.blockchain || ''}
                        onChange={(e) => setEditingWallet({ ...editingWallet, blockchain: e.target.value })}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        The blockchain network this wallet operates on
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-wallet-currencies" className="text-sm font-medium">Supported Cryptocurrencies *</Label>
                      <div className="space-y-2 mt-1">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                          {BanksWalletsBusinessService.CRYPTO_CURRENCIES.map(currency => (
                            <label key={currency} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                              <input
                                type="checkbox"
                                checked={(() => {
                                  const currenciesArray = typeof editingWallet.currencies === 'string' 
                                    ? editingWallet.currencies.split(', ').filter(c => c.trim())
                                    : [];
                                  return currenciesArray.includes(currency);
                                })()}
                                onChange={(e) => {
                                  const currentCurrencies = typeof editingWallet.currencies === 'string' 
                                    ? editingWallet.currencies.split(', ').filter(c => c.trim())
                                    : [];
                                  
                                  if (e.target.checked) {
                                    const newCurrencies = [...currentCurrencies, currency];
                                    setEditingWallet({
                                      ...editingWallet,
                                      currencies: newCurrencies.join(', '),
                                      currency: currentCurrencies.length === 0 ? currency : editingWallet.currency
                                    });
                                  } else {
                                    const newCurrencies = currentCurrencies.filter(c => c !== currency);
                                    setEditingWallet({
                                      ...editingWallet,
                                      currencies: newCurrencies.join(', '),
                                      currency: newCurrencies.length > 0 ? newCurrencies[0] : 'USDT'
                                    });
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm font-medium">{currency}</span>
                            </label>
                          ))}
                        </div>
                        {editingWallet.currencies && editingWallet.currencies.trim() && (
                          <div className="bg-purple-50 border border-purple-200 rounded-md p-2">
                            <p className="text-sm font-medium text-purple-800">Selected currencies:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {editingWallet.currencies.split(', ').filter(c => c.trim()).map(currency => (
                                <Badge key={currency} variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                  {currency}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="edit-wallet-currency" className="text-sm font-medium">Primary Currency</Label>
                    <Select value={editingWallet.currency} onValueChange={(value) => setEditingWallet({ ...editingWallet, currency: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {BanksWalletsBusinessService.CURRENCIES.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{currency}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Additional Information Section */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                  Additional Information
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </h3>
                
                <div>
                  <Label htmlFor="edit-wallet-description" className="text-sm font-medium">Description</Label>
                  <Input 
                    id="edit-wallet-description" 
                    placeholder="Brief description of this wallet's purpose..."
                    value={editingWallet.description}
                    onChange={(e) => setEditingWallet({ ...editingWallet, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-wallet-notes" className="text-sm font-medium">Notes</Label>
                  <Textarea 
                    id="edit-wallet-notes" 
                    placeholder="Add any additional notes or special instructions..."
                    value={editingWallet.notes || ''}
                    onChange={(e) => setEditingWallet({ ...editingWallet, notes: e.target.value })}
                    rows={2}
                    className="mt-1 resize-none"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Footer with Actions */}
          <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              * Required fields
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCloseEditWalletDialog} className="min-w-[100px]">
                Cancel
              </Button>
              {editingWallet && (
                <Button 
                  onClick={() => handleUpdateDigitalWallet(editingWallet)}
                  className="min-w-[120px] bg-purple-600 hover:bg-purple-700"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Update Digital Wallet
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};