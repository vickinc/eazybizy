import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BankAccount, DigitalWallet } from '@/types';
import { 
  NewBankAccount, 
  NewDigitalWallet,
  BanksWalletsBusinessService 
} from '@/services/business/banksWalletsBusinessService';

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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Bank Account</DialogTitle>
            <DialogDescription>Add a new bank account for your company</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank-name">Bank Name *</Label>
                <Input 
                  id="bank-name" 
                  placeholder="Enter bank name"
                  value={newBankAccount.bankName}
                  onChange={(e) => updateNewBankAccount('bankName', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="account-name">Account Name *</Label>
                <Input 
                  id="account-name" 
                  placeholder="Enter account holder name"
                  value={newBankAccount.accountName}
                  onChange={(e) => updateNewBankAccount('accountName', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="account-number">Account Number</Label>
                <Input 
                  id="account-number" 
                  placeholder="Enter account number (or use IBAN instead)"
                  value={newBankAccount.accountNumber}
                  onChange={(e) => updateNewBankAccount('accountNumber', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="iban">IBAN</Label>
                <Input 
                  id="iban" 
                  placeholder="Enter IBAN (or use Account Number instead)"
                  value={newBankAccount.iban}
                  onChange={(e) => updateNewBankAccount('iban', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="swift">SWIFT Code *</Label>
                <Input 
                  id="swift" 
                  placeholder="Enter SWIFT/BIC code"
                  value={newBankAccount.swiftCode}
                  onChange={(e) => updateNewBankAccount('swiftCode', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={newBankAccount.currency} onValueChange={(value) => updateNewBankAccount('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BanksWalletsBusinessService.CURRENCIES.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="bank-address">Bank Address</Label>
              <Textarea 
                id="bank-address" 
                placeholder="Enter bank address"
                value={newBankAccount.bankAddress}
                onChange={(e) => updateNewBankAccount('bankAddress', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="bank-notes">Notes</Label>
              <Textarea 
                id="bank-notes" 
                placeholder="Additional notes"
                value={newBankAccount.notes}
                onChange={(e) => updateNewBankAccount('notes', e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onCloseAddBankDialog}>
                Cancel
              </Button>
              <Button onClick={handleCreateBankAccount}>Add Bank Account</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Digital Wallet Dialog */}
      <Dialog open={showAddWalletForm} onOpenChange={(open) => !open && onCloseAddWalletDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Digital Wallet</DialogTitle>
            <DialogDescription>Add a new digital wallet or payment method</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wallet-type">Wallet Type *</Label>
                <Select value={newDigitalWallet.walletType} onValueChange={(value: unknown) => {
                  updateNewDigitalWallet('walletType', value);
                  updateNewDigitalWallet('currency', value === 'crypto' ? 'USDT' : 'USD');
                  updateNewDigitalWallet('currencies', []);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BanksWalletsBusinessService.WALLET_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="wallet-name">Wallet Name *</Label>
                <Input 
                  id="wallet-name" 
                  placeholder="Enter wallet name"
                  value={newDigitalWallet.walletName}
                  onChange={(e) => updateNewDigitalWallet('walletName', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="wallet-address">Wallet Address/Email *</Label>
                <Input 
                  id="wallet-address" 
                  placeholder="Enter wallet address or email"
                  value={newDigitalWallet.walletAddress}
                  onChange={(e) => updateNewDigitalWallet('walletAddress', e.target.value)}
                />
              </div>
              
              <div>
                {newDigitalWallet.walletType === 'crypto' ? (
                  <>
                    <Label htmlFor="wallet-currencies">Supported Currencies *</Label>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                        {BanksWalletsBusinessService.CRYPTO_CURRENCIES.map(currency => (
                          <label key={currency} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{currency}</span>
                          </label>
                        ))}
                      </div>
                      {newDigitalWallet.currencies.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Selected: {newDigitalWallet.currencies.join(', ')}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Label htmlFor="wallet-currency">Currency</Label>
                    <Select value={newDigitalWallet.currency} onValueChange={(value) => updateNewDigitalWallet('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BanksWalletsBusinessService.CURRENCIES.map(currency => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
              
              {/* Conditional Blockchain field for cryptocurrency wallets */}
              {newDigitalWallet.walletType === 'crypto' && (
                <div>
                  <Label htmlFor="wallet-blockchain">Blockchain *</Label>
                  <Input 
                    id="wallet-blockchain" 
                    placeholder="Enter blockchain network (e.g., Ethereum, Bitcoin, Polygon)"
                    value={newDigitalWallet.blockchain}
                    onChange={(e) => updateNewDigitalWallet('blockchain', e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="wallet-description">Description</Label>
              <Input 
                id="wallet-description" 
                placeholder="Brief description of the wallet"
                value={newDigitalWallet.description}
                onChange={(e) => updateNewDigitalWallet('description', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="wallet-notes">Notes</Label>
              <Textarea 
                id="wallet-notes" 
                placeholder="Additional notes"
                value={newDigitalWallet.notes}
                onChange={(e) => updateNewDigitalWallet('notes', e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onCloseAddWalletDialog}>
                Cancel
              </Button>
              <Button onClick={handleCreateDigitalWallet}>Add Digital Wallet</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Bank Account Dialog */}
      <Dialog open={!!editingBank} onOpenChange={(open) => !open && onCloseEditBankDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
            <DialogDescription>Update bank account information</DialogDescription>
          </DialogHeader>
          {editingBank && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderCompanySelect(
                  editingBank.companyId,
                  (value) => setEditingBank({ ...editingBank, companyId: parseInt(value) }),
                  true
                )}
                
                <div>
                  <Label htmlFor="edit-bank-name">Bank Name *</Label>
                  <Input 
                    id="edit-bank-name" 
                    value={editingBank.bankName}
                    onChange={(e) => setEditingBank({ ...editingBank, bankName: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-account-name">Account Name *</Label>
                  <Input 
                    id="edit-account-name" 
                    value={editingBank.accountName}
                    onChange={(e) => setEditingBank({ ...editingBank, accountName: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-account-number">Account Number</Label>
                  <Input 
                    id="edit-account-number" 
                    value={editingBank.accountNumber || ''}
                    onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-iban">IBAN</Label>
                  <Input 
                    id="edit-iban" 
                    placeholder="Enter IBAN (or use Account Number instead)"
                    value={editingBank.iban}
                    onChange={(e) => setEditingBank({ ...editingBank, iban: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-swift">SWIFT Code *</Label>
                  <Input 
                    id="edit-swift" 
                    value={editingBank.swiftCode}
                    onChange={(e) => setEditingBank({ ...editingBank, swiftCode: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-bank-currency">Currency</Label>
                  <Select value={editingBank.currency} onValueChange={(value) => setEditingBank({ ...editingBank, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BanksWalletsBusinessService.CURRENCIES.map(currency => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-bank-address">Bank Address</Label>
                <Textarea 
                  id="edit-bank-address" 
                  value={editingBank.bankAddress}
                  onChange={(e) => setEditingBank({ ...editingBank, bankAddress: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-bank-notes">Notes</Label>
                <Textarea 
                  id="edit-bank-notes" 
                  value={editingBank.notes || ''}
                  onChange={(e) => setEditingBank({ ...editingBank, notes: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onCloseEditBankDialog}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateBankAccount(editingBank)}>
                  Update Bank Account
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Digital Wallet Dialog */}
      <Dialog open={!!editingWallet} onOpenChange={(open) => !open && onCloseEditWalletDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Digital Wallet</DialogTitle>
            <DialogDescription>Update digital wallet information</DialogDescription>
          </DialogHeader>
          {editingWallet && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderCompanySelect(
                  editingWallet.companyId,
                  (value) => setEditingWallet({ ...editingWallet, companyId: parseInt(value) }),
                  true
                )}
                
                <div>
                  <Label htmlFor="edit-wallet-type">Wallet Type *</Label>
                  <Select value={editingWallet.walletType} onValueChange={(value: unknown) => setEditingWallet({
                    ...editingWallet,
                    walletType: value,
                    currency: value === 'crypto' ? 'USDT' : 'USD',
                    currencies: value === 'crypto' ? (editingWallet.currencies || '') : ''
                  })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BanksWalletsBusinessService.WALLET_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-wallet-name">Wallet Name *</Label>
                  <Input 
                    id="edit-wallet-name" 
                    value={editingWallet.walletName}
                    onChange={(e) => setEditingWallet({ ...editingWallet, walletName: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-wallet-address">Wallet Address/Email *</Label>
                  <Input 
                    id="edit-wallet-address" 
                    value={editingWallet.walletAddress}
                    onChange={(e) => setEditingWallet({ ...editingWallet, walletAddress: e.target.value })}
                  />
                </div>
                
                <div>
                  {editingWallet.walletType === 'crypto' ? (
                    <>
                      <Label htmlFor="edit-wallet-currencies">Supported Currencies *</Label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                          {BanksWalletsBusinessService.CRYPTO_CURRENCIES.map(currency => (
                            <label key={currency} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{currency}</span>
                            </label>
                          ))}
                        </div>
                        {editingWallet.currencies && editingWallet.currencies.trim() && (
                          <div className="text-sm text-gray-600">
                            Selected: {editingWallet.currencies}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Label htmlFor="edit-wallet-currency">Currency</Label>
                      <Select value={editingWallet.currency} onValueChange={(value) => setEditingWallet({ ...editingWallet, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BanksWalletsBusinessService.CURRENCIES.map(currency => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
                
                {/* Conditional Blockchain field for cryptocurrency wallets */}
                {editingWallet.walletType === 'crypto' && (
                  <div>
                    <Label htmlFor="edit-wallet-blockchain">Blockchain *</Label>
                    <Input 
                      id="edit-wallet-blockchain" 
                      value={editingWallet.blockchain || ''}
                      onChange={(e) => setEditingWallet({ ...editingWallet, blockchain: e.target.value })}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="edit-wallet-description">Description</Label>
                <Input 
                  id="edit-wallet-description" 
                  value={editingWallet.description}
                  onChange={(e) => setEditingWallet({ ...editingWallet, description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-wallet-notes">Notes</Label>
                <Textarea 
                  id="edit-wallet-notes" 
                  value={editingWallet.notes || ''}
                  onChange={(e) => setEditingWallet({ ...editingWallet, notes: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onCloseEditWalletDialog}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateDigitalWallet(editingWallet)}>
                  Update Digital Wallet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};