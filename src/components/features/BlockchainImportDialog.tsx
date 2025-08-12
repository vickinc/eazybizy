"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Download from 'lucide-react/dist/esm/icons/download';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { AccountBalance } from '@/types/balance.types';

interface BlockchainImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  accountBalance: AccountBalance;
}

interface ImportStatus {
  isImporting: boolean;
  progress: number;
  currentStep: string;
  result?: {
    success: boolean;
    totalTransactions: number;
    importedTransactions: number;
    duplicateTransactions: number;
    errors: string[];
  };
}

export function BlockchainImportDialog({
  isOpen,
  onClose,
  accountBalance
}: BlockchainImportDialogProps) {
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    isImporting: false,
    progress: 0,
    currentStep: ''
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [limit, setLimit] = useState(1000);

  const wallet = accountBalance.account as any; // DigitalWallet type
  const isValidCryptoWallet = wallet.walletType?.toLowerCase() === 'crypto' && 
                             wallet.walletAddress && 
                             wallet.blockchain;

  // Parse available currencies
  const availableCurrencies = React.useMemo(() => {
    const currencies: string[] = [];
    
    if (wallet.currencies) {
      if (Array.isArray(wallet.currencies)) {
        currencies.push(...wallet.currencies);
      } else if (typeof wallet.currencies === 'string') {
        currencies.push(...wallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0));
      }
    }
    
    // Fallback to primary currency
    if (currencies.length === 0 && wallet.currency) {
      currencies.push(wallet.currency);
    }
    
    return currencies;
  }, [wallet]);

  React.useEffect(() => {
    // Initialize with all currencies selected
    if (selectedCurrencies.length === 0 && availableCurrencies.length > 0) {
      setSelectedCurrencies([...availableCurrencies]);
    }
  }, [availableCurrencies, selectedCurrencies.length]);

  const handleImport = async () => {
    if (!isValidCryptoWallet) {
      toast.error('Invalid wallet configuration');
      return;
    }

    setImportStatus({
      isImporting: true,
      progress: 0,
      currentStep: 'Starting blockchain transaction import...'
    });

    try {
      const importBody = {
        walletId: wallet.id,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currencies: selectedCurrencies.length > 0 ? selectedCurrencies : undefined,
        limit,
        overwriteDuplicates
      };

      console.log('🚀 Starting blockchain import:', importBody);

      setImportStatus(prev => ({
        ...prev,
        progress: 10,
        currentStep: 'Connecting to blockchain APIs...'
      }));

      const response = await fetch('/api/blockchain/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importBody)
      });

      setImportStatus(prev => ({
        ...prev,
        progress: 50,
        currentStep: 'Processing transaction data...'
      }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      setImportStatus(prev => ({
        ...prev,
        progress: 100,
        currentStep: 'Import completed!',
        result: result.result
      }));

      if (result.success && result.result.success) {
        toast.success(
          `Successfully imported ${result.result.importedTransactions} transactions!`,
          { duration: 5000 }
        );
        
        // Refresh the page to show updated balances
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error('Import completed with errors. Check the details below.');
      }

    } catch (error) {
      console.error('Import error:', error);
      setImportStatus(prev => ({
        ...prev,
        progress: 0,
        currentStep: 'Import failed',
        result: {
          success: false,
          totalTransactions: 0,
          importedTransactions: 0,
          duplicateTransactions: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      }));
      
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClose = () => {
    if (!importStatus.isImporting) {
      onClose();
      // Reset state when closing
      setImportStatus({
        isImporting: false,
        progress: 0,
        currentStep: ''
      });
    }
  };

  const handleCurrencyToggle = (currency: string, checked: boolean) => {
    setSelectedCurrencies(prev => 
      checked 
        ? [...prev, currency]
        : prev.filter(c => c !== currency)
    );
  };

  if (!isValidCryptoWallet) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Blockchain Import Not Available</DialogTitle>
            <DialogDescription>
              This feature is only available for cryptocurrency wallets with valid blockchain configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Blockchain Transactions
          </DialogTitle>
          <DialogDescription>
            Import transaction history from the blockchain for {wallet.walletName || 'this wallet'} 
            ({wallet.blockchain?.toUpperCase()}: {wallet.walletAddress?.substring(0, 20)}...)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 mb-2">Wallet Information</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <p><strong>Name:</strong> {wallet.walletName}</p>
              <p><strong>Address:</strong> {wallet.walletAddress}</p>
              <p><strong>Blockchain:</strong> {wallet.blockchain?.toUpperCase()}</p>
              <p><strong>Currencies:</strong> {availableCurrencies.join(', ')}</p>
            </div>
          </div>

          {/* Import Options */}
          {!importStatus.isImporting && !importStatus.result && (
            <div className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date (Optional)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Currency Selection */}
              <div>
                <Label className="text-sm font-medium">Currencies to Import</Label>
                <div className="mt-2 space-y-2">
                  {availableCurrencies.map(currency => (
                    <div key={currency} className="flex items-center space-x-2">
                      <Checkbox
                        id={`currency-${currency}`}
                        checked={selectedCurrencies.includes(currency)}
                        onCheckedChange={(checked) => handleCurrencyToggle(currency, !!checked)}
                      />
                      <Label htmlFor={`currency-${currency}`} className="text-sm">
                        {currency}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="overwriteDuplicates"
                    checked={overwriteDuplicates}
                    onCheckedChange={(checked) => setOverwriteDuplicates(!!checked)}
                  />
                  <Label htmlFor="overwriteDuplicates" className="text-sm">
                    Overwrite existing transactions
                  </Label>
                </div>

                <div>
                  <Label htmlFor="limit" className="text-sm">Maximum transactions per currency</Label>
                  <Select 
                    value={limit.toString()} 
                    onValueChange={(value) => setLimit(parseInt(value))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                      <SelectItem value="1000">1,000</SelectItem>
                      <SelectItem value="2000">2,000</SelectItem>
                      <SelectItem value="5000">5,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importStatus.isImporting && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Importing transactions...</span>
              </div>
              
              <Progress value={importStatus.progress} className="w-full" />
              
              <p className="text-xs text-gray-600">{importStatus.currentStep}</p>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This process may take a few minutes. Please do not close this window.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Import Results */}
          {importStatus.result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {importStatus.result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {importStatus.result.success ? 'Import Completed' : 'Import Failed'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Found:</span>
                  <span className="ml-2 font-medium">{importStatus.result.totalTransactions}</span>
                </div>
                <div>
                  <span className="text-gray-600">Imported:</span>
                  <span className="ml-2 font-medium text-green-600">{importStatus.result.importedTransactions}</span>
                </div>
                <div>
                  <span className="text-gray-600">Duplicates:</span>
                  <span className="ml-2 font-medium text-yellow-600">{importStatus.result.duplicateTransactions}</span>
                </div>
                <div>
                  <span className="text-gray-600">Errors:</span>
                  <span className="ml-2 font-medium text-red-600">{importStatus.result.errors.length}</span>
                </div>
              </div>

              {importStatus.result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Import Errors:</p>
                      <ul className="text-xs space-y-1">
                        {importStatus.result.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {importStatus.result.errors.length > 5 && (
                          <li>• ... and {importStatus.result.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose} disabled={importStatus.isImporting}>
              {importStatus.result?.success ? 'Done' : 'Cancel'}
            </Button>
            {!importStatus.isImporting && !importStatus.result && (
              <Button 
                onClick={handleImport}
                disabled={selectedCurrencies.length === 0}
              >
                Start Import
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}