"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Download from 'lucide-react/dist/esm/icons/download';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import { BlockchainIcon } from '@/components/ui/blockchain-icon';

interface TronWallet {
  id: string;
  walletName: string;
  walletAddress: string;
  blockchain: string;
  currency: string;
  currencies: string;
  company: {
    id: number;
    tradingName: string;
    logo: string;
  };
}

interface TronBlockchainImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number | 'all';
  onImportComplete: () => void;
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

export function TronBlockchainImportDialog({
  isOpen,
  onClose,
  companyId,
  onImportComplete
}: TronBlockchainImportDialogProps) {
  const [tronWallets, setTronWallets] = useState<TronWallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [limit, setLimit] = useState(1000);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    isImporting: false,
    progress: 0,
    currentStep: ''
  });

  // Get selected wallet details
  const selectedWallet = useMemo(() => {
    return tronWallets.find(wallet => wallet.id === selectedWalletId);
  }, [tronWallets, selectedWalletId]);

  // Parse available currencies for selected wallet
  const availableCurrencies = useMemo(() => {
    if (!selectedWallet) return [];
    
    const currencies: string[] = [];
    
    if (selectedWallet.currencies) {
      if (typeof selectedWallet.currencies === 'string') {
        currencies.push(...selectedWallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0));
      }
    }
    
    // Fallback to primary currency if no multi-currency support
    if (currencies.length === 0 && selectedWallet.currency) {
      currencies.push(selectedWallet.currency);
    }
    
    return currencies;
  }, [selectedWallet]);

  // Load Tron wallets when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadTronWallets();
    }
  }, [isOpen, companyId]);

  // Auto-select all currencies when wallet changes
  useEffect(() => {
    if (availableCurrencies.length > 0) {
      setSelectedCurrencies([...availableCurrencies]);
    }
  }, [availableCurrencies]);

  const loadTronWallets = async () => {
    setIsLoadingWallets(true);
    try {
      const params = new URLSearchParams();
      if (companyId !== 'all') {
        params.set('companyId', companyId.toString());
      }
      params.set('walletType', 'crypto');
      params.set('blockchain', 'tron');
      params.set('isActive', 'true');

      console.log('🔍 Loading Tron wallets with params:', {
        companyId,
        url: `/api/digital-wallets?${params}`,
        params: Object.fromEntries(params)
      });

      const response = await fetch(`/api/digital-wallets?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API response error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to load Tron wallets: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Tron wallets API response:', {
        totalWallets: data.digitalWallets?.length || 0,
        wallets: data.digitalWallets?.map(w => ({
          id: w.id,
          name: w.walletName,
          address: w.walletAddress,
          blockchain: w.blockchain,
          walletType: w.walletType,
          currencies: w.currencies
        })) || []
      });

      setTronWallets(data.data || []);
      
      if (data.data?.length > 0) {
        setSelectedWalletId(data.data[0].id);
      } else {
        // If no Tron wallets found, let's check what wallets exist at all
        console.log('🔍 No Tron wallets found, checking all wallets for debugging...');
        try {
          const debugParams = new URLSearchParams();
          if (companyId !== 'all') {
            debugParams.set('companyId', companyId.toString());
          }
          const debugResponse = await fetch(`/api/digital-wallets?${debugParams}`);
          if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            console.log('🐛 All wallets for debugging:', {
              totalWallets: debugData.data?.length || 0,
              wallets: debugData.data?.map(w => ({
                id: w.id,
                name: w.walletName,
                walletType: w.walletType,
                blockchain: w.blockchain,
                isActive: w.isActive,
                currencies: w.currencies
              })) || []
            });
            
            // Also try specific searches to understand what's happening
            console.log('🔍 Testing specific wallet queries:');
            
            // Test crypto wallet type only
            const cryptoParams = new URLSearchParams();
            if (companyId !== 'all') {
              cryptoParams.set('companyId', companyId.toString());
            }
            cryptoParams.set('walletType', 'crypto');
            const cryptoResponse = await fetch(`/api/digital-wallets?${cryptoParams}`);
            if (cryptoResponse.ok) {
              const cryptoData = await cryptoResponse.json();
              console.log('🔍 Crypto wallets only:', {
                count: cryptoData.digitalWallets?.length || 0,
                wallets: cryptoData.digitalWallets?.map(w => ({
                  name: w.walletName,
                  blockchain: w.blockchain,
                  walletType: w.walletType
                })) || []
              });
            }
            
            // Test tron blockchain only
            const tronParams = new URLSearchParams();
            if (companyId !== 'all') {
              tronParams.set('companyId', companyId.toString());
            }
            tronParams.set('blockchain', 'tron');
            const tronResponse = await fetch(`/api/digital-wallets?${tronParams}`);
            if (tronResponse.ok) {
              const tronData = await tronResponse.json();
              console.log('🔍 Tron blockchain wallets only:', {
                count: tronData.digitalWallets?.length || 0,
                wallets: tronData.digitalWallets?.map(w => ({
                  name: w.walletName,
                  blockchain: w.blockchain,
                  walletType: w.walletType
                })) || []
              });
            }
          }
        } catch (debugError) {
          console.error('Debug query failed:', debugError);
        }
      }
    } catch (error) {
      console.error('❌ Error loading Tron wallets:', error);
      toast.error(`Failed to load Tron wallets: ${error.message}`);
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const handleCurrencyToggle = (currency: string) => {
    setSelectedCurrencies(prev => 
      prev.includes(currency)
        ? prev.filter(c => c !== currency)
        : [...prev, currency]
    );
  };

  const handleImport = async () => {
    if (!selectedWallet || selectedCurrencies.length === 0) {
      toast.error('Please select a wallet and at least one currency');
      return;
    }

    setImportStatus({
      isImporting: true,
      progress: 0,
      currentStep: 'Starting blockchain transaction import...'
    });

    try {
      const importData = {
        walletId: selectedWallet.id,
        currencies: selectedCurrencies,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit,
        overwriteDuplicates,
        createInitialBalances: false
      };

      console.log('🚀 Starting Tron transaction import:', importData);

      const response = await fetch('/api/blockchain/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();
      console.log('✅ Import completed:', result);

      setImportStatus({
        isImporting: false,
        progress: 100,
        currentStep: 'Import completed successfully!',
        result: result.result
      });

      toast.success(`Successfully imported ${result.result.importedTransactions} transactions`);
      
      // Auto-close after 2 seconds and refresh parent
      setTimeout(() => {
        onImportComplete();
      }, 2000);

    } catch (error) {
      console.error('❌ Import failed:', error);
      setImportStatus({
        isImporting: false,
        progress: 0,
        currentStep: 'Import failed',
        result: {
          success: false,
          totalTransactions: 0,
          importedTransactions: 0,
          duplicateTransactions: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      });
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClose = () => {
    if (!importStatus.isImporting) {
      setImportStatus({
        isImporting: false,
        progress: 0,
        currentStep: ''
      });
      setSelectedWalletId('');
      setSelectedCurrencies([]);
      setStartDate('');
      setEndDate('');
      setOverwriteDuplicates(false);
      setLimit(1000);
      onClose();
    }
  };

  const canImport = selectedWallet && selectedCurrencies.length > 0 && !importStatus.isImporting;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BlockchainIcon blockchain="tron" className="h-5 w-5" />
            <span>Import Tron Blockchain Transactions</span>
          </DialogTitle>
          <DialogDescription>
            Import transaction history from your Tron wallets using TronGrid API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Wallet Selection */}
          <div className="space-y-2">
            <Label htmlFor="wallet">Select Tron Wallet</Label>
            {isLoadingWallets ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-gray-600">Loading Tron wallets...</span>
              </div>
            ) : tronWallets.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No Tron crypto wallets found. Please add Tron wallets in Banks & Wallets page first.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a Tron wallet" />
                </SelectTrigger>
                <SelectContent>
                  {tronWallets.map(wallet => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4" />
                        <span>{wallet.walletName}</span>
                        <Badge variant="outline" className="text-xs">
                          {wallet.company.tradingName}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Wallet Details */}
          {selectedWallet && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Wallet Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Address:</span>
                    <p className="font-mono text-xs break-all">{selectedWallet.walletAddress}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Company:</span>
                    <p>{selectedWallet.company.tradingName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Currency Selection */}
          {availableCurrencies.length > 0 && (
            <div className="space-y-2">
              <Label>Select Currencies to Import</Label>
              <div className="flex flex-wrap gap-2">
                {availableCurrencies.map(currency => (
                  <div key={currency} className="flex items-center space-x-2">
                    <Checkbox
                      id={`currency-${currency}`}
                      checked={selectedCurrencies.includes(currency)}
                      onCheckedChange={() => handleCurrencyToggle(currency)}
                    />
                    <Label htmlFor={`currency-${currency}`} className="cursor-pointer">
                      <Badge variant="outline" className="text-sm">
                        {currency === 'TRX' ? '🪙 TRX (Native)' : `🪙 ${currency} (TRC-20)`}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date (Optional)</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={importStatus.isImporting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={importStatus.isImporting}
              />
            </div>
          </div>

          {/* Import Options */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="limit">Transaction Limit</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                min={1}
                max={10000}
                disabled={importStatus.isImporting}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwriteDuplicates"
                checked={overwriteDuplicates}
                onCheckedChange={setOverwriteDuplicates}
                disabled={importStatus.isImporting}
              />
              <Label htmlFor="overwriteDuplicates" className="cursor-pointer text-sm">
                Overwrite existing transactions with same hash
              </Label>
            </div>
          </div>

          {/* Import Progress */}
          {importStatus.isImporting && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Importing Transactions...</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={importStatus.progress} className="w-full" />
                  <p className="text-sm text-gray-600">{importStatus.currentStep}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importStatus.result && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                  {importStatus.result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Import {importStatus.result.success ? 'Complete' : 'Failed'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Total Found:</span>
                    <p>{importStatus.result.totalTransactions}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Imported:</span>
                    <p className="text-green-600 font-semibold">{importStatus.result.importedTransactions}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Duplicates:</span>
                    <p className="text-yellow-600">{importStatus.result.duplicateTransactions}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Errors:</span>
                    <p className="text-red-600">{importStatus.result.errors.length}</p>
                  </div>
                </div>
                
                {importStatus.result.errors.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-red-600">Errors:</Label>
                    <div className="mt-1 max-h-32 overflow-y-auto">
                      {importStatus.result.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-500 bg-red-50 p-2 rounded mt-1">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose} disabled={importStatus.isImporting}>
            {importStatus.result ? 'Close' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!canImport}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            {importStatus.isImporting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Importing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Import Transactions</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}