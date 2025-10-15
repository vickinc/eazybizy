"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CryptocurrencyIcon } from '@/components/ui/cryptocurrency-icon';
import { BLOCKCHAIN_CURRENCIES, type BlockchainKey } from '../TransactionFilterWizard';
import { Check, Coins } from "lucide-react";

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
    <div className="space-y-3">
      <div>
        <h4 className="text-lg font-semibold text-gray-900">Select Currencies</h4>
        <p className="text-sm text-gray-600 mt-1">
          Choose which {blockchainConfig.name} currencies you want to see transactions for
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={selectAllCurrencies}
          className="flex items-center space-x-1.5 text-xs"
        >
          <Coins className="h-3.5 w-3.5" />
          <span>Select All</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearAllCurrencies}
          disabled={selectedCurrencies.length === 0}
          className="text-xs"
        >
          Clear All
        </Button>
      </div>

      {/* Currency Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {availableCurrencies.map((currency) => {
          const isSelected = selectedCurrencies.includes(currency);
          
          return (
            <button
              key={currency}
              className={`relative group p-3 rounded-lg border transition-all text-left ${
                isSelected 
                  ? 'border-lime-500 bg-lime-100 ring-2 ring-lime-500 ring-opacity-50' 
                  : 'bg-lime-50 border-lime-200 hover:border-lime-300 hover:bg-lime-100'
              }`}
              onClick={() => toggleCurrency(currency)}
            >
              {/* Selection checkbox */}
              <div className="absolute top-2 right-2">
                {isSelected ? (
                  <div className="w-4 h-4 bg-lime-600 rounded flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded group-hover:border-gray-400" />
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                {/* Currency Icon and Name */}
                <div className="flex items-start space-x-2">
                  <CryptocurrencyIcon 
                    currency={currency} 
                    className="w-8 h-8 rounded-md flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-medium text-sm ${
                      isSelected ? 'text-lime-900' : 'text-gray-900'
                    }`}>
                      {currency}
                    </h5>
                    <p className={`text-xs truncate ${
                      isSelected ? 'text-lime-700' : 'text-gray-500'
                    }`}>
                      {getCurrencyName(currency)}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="p-3 bg-lime-50 border border-lime-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-lime-600" />
            <span className="text-sm font-medium text-lime-900">
              Selected: {selectedCurrencies.length} of {availableCurrencies.length}
            </span>
          </div>
          
          {selectedCurrencies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedCurrencies.slice(0, 3).map((currency) => (
                <Badge key={currency} className="text-xs bg-white text-lime-700 border-lime-200">
                  {currency}
                </Badge>
              ))}
              {selectedCurrencies.length > 3 && (
                <Badge className="text-xs bg-white text-lime-700 border-lime-200">
                  +{selectedCurrencies.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        {selectedCurrencies.length === 0 && (
          <p className="text-lime-700 text-xs mt-2">
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