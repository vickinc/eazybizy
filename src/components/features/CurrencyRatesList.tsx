import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Globe from "lucide-react/dist/esm/icons/globe";
import Bitcoin from "lucide-react/dist/esm/icons/bitcoin";
import Coins from "lucide-react/dist/esm/icons/coins";
import { EnhancedCurrencyRate } from '@/services/business/currencyRatesBusinessService';

interface CurrencyRatesListProps {
  currencies: EnhancedCurrencyRate[];
  type: 'fiat' | 'crypto';
  onRateChange: (code: string, newRate: string, type: 'fiat' | 'crypto') => void;
  onResetToDefaults: (type: 'fiat' | 'crypto') => void;
}

export const CurrencyRatesList: React.FC<CurrencyRatesListProps> = ({
  currencies,
  type,
  onRateChange,
  onResetToDefaults
}) => {
  const handleRateInputChange = (code: string, value: string) => {
    // Remove commas and pass to handler - validation is handled in the hook
    const numericValue = value.replace(/,/g, '');
    onRateChange(code, numericValue, type);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {type === 'fiat' ? (
            <Globe className="h-5 w-5 text-blue-600" />
          ) : (
            <Bitcoin className="h-5 w-5 text-orange-600" />
          )}
          <span>{type === 'fiat' ? 'FIAT' : 'Cryptocurrency'} Rates</span>
        </CardTitle>
        <CardDescription>
          {type === 'fiat' 
            ? 'Traditional government-issued currencies. Rates represent how much foreign currency 1 USD equals.'
            : 'Digital currencies and tokens. Rates represent how much USD 1 unit of the cryptocurrency equals.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {currencies.map((currency) => (
              <Card key={currency.code} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {type === 'crypto' ? (
                        currency.code === 'BTC' ? (
                          <Bitcoin className="h-5 w-5 text-orange-500" />
                        ) : (
                          <Coins className="h-5 w-5 text-orange-500" />
                        )
                      ) : (
                        <Globe className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-lg">{currency.code}</span>
                          <Badge 
                            variant="outline" 
                            className={type === 'crypto' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}
                          >
                            {type === 'crypto' ? 'Crypto' : 'FIAT'}
                          </Badge>
                          {currency.isBase && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700">
                              Base
                            </Badge>
                          )}
                          {currency.hasError && (
                            <Badge variant="destructive" className="bg-red-50 text-red-700">
                              Error
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{currency.name}</p>
                        <p className="text-xs text-gray-500">
                          Last updated: {currency.lastUpdatedFormatted}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Label htmlFor={`rate-${currency.code}`} className="text-sm text-gray-600">
                        {currency.rateDescription}
                      </Label>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <Input
                            id={`rate-${currency.code}`}
                            type="text"
                            value={currency.formattedRate}
                            onChange={(e) => handleRateInputChange(currency.code, e.target.value)}
                            className={`w-32 text-right ${currency.hasError ? 'border-red-500 focus:border-red-500' : ''}`}
                            disabled={currency.isDisabled}
                          />
                          {currency.isBase && (
                            <span className="text-sm text-gray-500">(Base currency)</span>
                          )}
                        </div>
                        {currency.hasError && currency.errorMessage && (
                          <p className="text-xs text-red-600">{currency.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onResetToDefaults(type)}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset to Defaults</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};