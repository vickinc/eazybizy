"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CryptocurrencyIcon } from '@/components/ui/cryptocurrency-icon';
import { BLOCKCHAIN_CURRENCIES, type BlockchainKey } from '../TransactionFilterWizard';
import Check from "lucide-react/dist/esm/icons/check";
import Coins from "lucide-react/dist/esm/icons/coins";

export interface CurrencySelectionStepProps {
  blockchain: BlockchainKey;
  selectedCurrencies: string[];
  onUpdateCurrencies: (currencies: string[]) => void;
}

export const CurrencySelectionStep: React.FC<CurrencySelectionStepProps> = ({
  blockchain,
  selectedCurrencies,
  onUpdateCurrencies
}) => {
  const blockchainConfig = BLOCKCHAIN_CURRENCIES[blockchain];
  const availableCurrencies = blockchainConfig.currencies;

  const toggleCurrency = (currency: string) => {
    if (selectedCurrencies.includes(currency)) {
      onUpdateCurrencies(selectedCurrencies.filter(c => c !== currency));
    } else {
      onUpdateCurrencies([...selectedCurrencies, currency]);
    }
  };

  const selectAllCurrencies = () => {
    onUpdateCurrencies([...availableCurrencies]);
  };

  const clearAllCurrencies = () => {
    onUpdateCurrencies([]);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-xl font-semibold text-gray-900 mb-2">Select Currencies</h4>
        <p className="text-gray-600">
          Choose which {blockchainConfig.name} currencies you want to see transactions for
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-center space-x-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={selectAllCurrencies}
          className="flex items-center space-x-2"
        >
          <Coins className="h-4 w-4" />
          <span>Select All</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearAllCurrencies}
          disabled={selectedCurrencies.length === 0}
        >
          Clear All
        </Button>
      </div>

      {/* Currency Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {availableCurrencies.map((currency) => {
          const isSelected = selectedCurrencies.includes(currency);
          
          return (
            <Card
              key={currency}
              className={`relative p-4 cursor-pointer transition-all border-2 hover:shadow-md ${
                isSelected 
                  ? 'border-green-500 bg-green-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleCurrency(currency)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
              
              <div className="flex flex-col items-center space-y-3">
                {/* Currency Icon */}
                <div className="w-12 h-12 flex items-center justify-center">
                  <CryptocurrencyIcon 
                    currency={currency} 
                    size={48}
                    className="rounded-full"
                  />
                </div>
                
                {/* Currency Name */}
                <div className="text-center">
                  <h5 className={`font-semibold ${
                    isSelected ? 'text-green-900' : 'text-gray-900'
                  }`}>
                    {currency}
                  </h5>
                  <p className={`text-sm ${
                    isSelected ? 'text-green-700' : 'text-gray-500'
                  }`}>
                    {getCurrencyName(currency)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-gray-600" />
            <span className="text-gray-700 font-medium">
              Selected currencies: {selectedCurrencies.length} of {availableCurrencies.length}
            </span>
          </div>
          
          {selectedCurrencies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedCurrencies.map((currency) => (
                <Badge key={currency} variant="secondary" className="text-xs">
                  {currency}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {selectedCurrencies.length === 0 && (
          <p className="text-gray-500 text-sm mt-2">
            Please select at least one currency to continue
          </p>
        )}
      </div>
    </div>
  );
};

// Helper function to get currency full names
function getCurrencyName(currency: string): string {
  const currencyNames: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'TRX': 'Tron',
    'BNB': 'BNB',
    'SOL': 'Solana',
    'USDT': 'Tether',
    'USDC': 'USD Coin',
    'DAI': 'Dai Stablecoin',
    'WETH': 'Wrapped Ethereum',
    'BUSD': 'Binance USD'
  };
  return currencyNames[currency] || currency;
}