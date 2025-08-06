"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Download from "lucide-react/dist/esm/icons/download";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Zap from "lucide-react/dist/esm/icons/zap";
import Clock from "lucide-react/dist/esm/icons/clock";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import X from "lucide-react/dist/esm/icons/x";
import Plus from "lucide-react/dist/esm/icons/plus";
import { toast } from 'sonner';

interface CurrencyRatesAPIControlsProps {
  onRatesUpdated: (rates: any[], updateType: 'latest' | 'historical') => void;
  isAPIConfigured: boolean;
}

interface APIStatus {
  loading: boolean;
  error?: string;
  success?: string;
  lastUsed?: string;
}

// Rate limiting: 4 hours between requests
const RATE_LIMIT_HOURS = 4;
const RATE_LIMIT_MS = RATE_LIMIT_HOURS * 60 * 60 * 1000;

// Available currencies for selection
const AVAILABLE_FIAT_CURRENCIES = [
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Zloty' },
];

const AVAILABLE_CRYPTO_CURRENCIES = [
  { code: 'BTC', name: 'Bitcoin' },
  { code: 'ETH', name: 'Ethereum' },
  { code: 'SOL', name: 'Solana' },
  { code: 'BNB', name: 'Binance Coin' },
  { code: 'TRX', name: 'TRON' },
  { code: 'USDT', name: 'Tether' },
  { code: 'USDC', name: 'USD Coin' },
  { code: 'BUSD', name: 'Binance USD' },
];

export const CurrencyRatesAPIControls: React.FC<CurrencyRatesAPIControlsProps> = ({
  onRatesUpdated,
  isAPIConfigured
}) => {
  const [latestStatus, setLatestStatus] = useState<APIStatus>({ loading: false });
  const [historicalStatus, setHistoricalStatus] = useState<APIStatus>({ loading: false });
  const [selectedDate, setSelectedDate] = useState('2025-07-21');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Currency selection state
  const [selectedFiatCurrencies, setSelectedFiatCurrencies] = useState<string[]>([]);
  const [selectedCryptoCurrencies, setSelectedCryptoCurrencies] = useState<string[]>([]);
  
  // Set yesterday's date on client-side only
  useEffect(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    setSelectedDate(yesterday.toISOString().split('T')[0]);
    
    // Load last usage times from localStorage
    const lastLatestUsed = localStorage.getItem('currency-api-latest-used');
    const lastHistoricalUsed = localStorage.getItem('currency-api-historical-used');
    
    if (lastLatestUsed) {
      setLatestStatus(prev => ({ ...prev, lastUsed: lastLatestUsed }));
    }
    if (lastHistoricalUsed) {
      setHistoricalStatus(prev => ({ ...prev, lastUsed: lastHistoricalUsed }));
    }

    // Load selected currencies from localStorage
    const savedFiatCurrencies = localStorage.getItem('currency-api-selected-fiat');
    const savedCryptoCurrencies = localStorage.getItem('currency-api-selected-crypto');

    if (savedFiatCurrencies) {
      try {
        const parsed = JSON.parse(savedFiatCurrencies);
        if (Array.isArray(parsed) && parsed.length <= 3) {
          setSelectedFiatCurrencies(parsed);
        }
      } catch (error) {
        console.warn('Failed to load saved FIAT currencies:', error);
      }
    }

    if (savedCryptoCurrencies) {
      try {
        const parsed = JSON.parse(savedCryptoCurrencies);
        if (Array.isArray(parsed) && parsed.length <= 3) {
          setSelectedCryptoCurrencies(parsed);
        }
      } catch (error) {
        console.warn('Failed to load saved crypto currencies:', error);
      }
    }
  }, []);

  // Save selected currencies to localStorage when they change
  useEffect(() => {
    localStorage.setItem('currency-api-selected-fiat', JSON.stringify(selectedFiatCurrencies));
  }, [selectedFiatCurrencies]);

  useEffect(() => {
    localStorage.setItem('currency-api-selected-crypto', JSON.stringify(selectedCryptoCurrencies));
  }, [selectedCryptoCurrencies]);

  // Development helper to reset time limits
  const resetTimeLimits = () => {
    localStorage.removeItem('currency-api-latest-used');
    localStorage.removeItem('currency-api-historical-used');
    setLatestStatus(prev => ({ ...prev, lastUsed: undefined }));
    setHistoricalStatus(prev => ({ ...prev, lastUsed: undefined }));
    console.log('API time limits reset!');
  };

  // Add keyboard shortcut for development (Ctrl/Cmd + Shift + R)
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        resetTimeLimits();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const canUseAPI = (lastUsed?: string): boolean => {
    if (!lastUsed) return true;
    const timeSinceLastUse = Date.now() - new Date(lastUsed).getTime();
    return timeSinceLastUse >= RATE_LIMIT_MS;
  };

  const getTimeUntilNextUse = (lastUsed?: string): string => {
    if (!lastUsed) return '';
    const timeSinceLastUse = Date.now() - new Date(lastUsed).getTime();
    const timeRemaining = RATE_LIMIT_MS - timeSinceLastUse;
    
    if (timeRemaining <= 0) return '';
    
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Currency selection handlers
  const toggleFiatCurrency = (code: string) => {
    setSelectedFiatCurrencies(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else if (prev.length < 3) {
        return [...prev, code];
      } else {
        toast.warning('Maximum 3 FIAT currencies allowed');
        return prev;
      }
    });
  };

  const toggleCryptoCurrency = (code: string) => {
    setSelectedCryptoCurrencies(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else if (prev.length < 3) {
        return [...prev, code];
      } else {
        toast.warning('Maximum 3 crypto currencies allowed');
        return prev;
      }
    });
  };

  const removeFiatCurrency = (code: string) => {
    setSelectedFiatCurrencies(prev => prev.filter(c => c !== code));
  };

  const removeCryptoCurrency = (code: string) => {
    setSelectedCryptoCurrencies(prev => prev.filter(c => c !== code));
  };

  const getCombinedCurrencies = () => {
    return [...selectedFiatCurrencies, ...selectedCryptoCurrencies];
  };

  const handleFetchLatestRates = async () => {
    if (!isAPIConfigured) {
      toast.error('Automatic rate updates are not available.');
      return;
    }

    if (!canUseAPI(latestStatus.lastUsed)) {
      const timeLeft = getTimeUntilNextUse(latestStatus.lastUsed);
      toast.error(`Please wait ${timeLeft} before updating rates again.`);
      return;
    }

    const totalSelected = selectedFiatCurrencies.length + selectedCryptoCurrencies.length;
    if (totalSelected === 0) {
      toast.error('Please select at least one currency to update.');
      return;
    }

    setLatestStatus({ loading: true });

    try {
      const selectedCurrencies = getCombinedCurrencies();
      const currenciesParam = selectedCurrencies.length > 0 ? `?currencies=${selectedCurrencies.join(',')}` : '';
      
      const response = await fetch(`/api/currency-rates/latest${currenciesParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch latest rates');
      }

      const currentTime = new Date().toISOString();
      localStorage.setItem('currency-api-latest-used', currentTime);

      // Check if there's a limitation warning
      const cryptoCount = result.data?.filter((r: any) => r.type === 'crypto').length || 0;
      const fiatCount = result.data?.filter((r: any) => r.type === 'fiat').length || 0;
      
      let successMessage = `Updated ${result.data.length} currencies (${selectedFiatCurrencies.length} FIAT, ${selectedCryptoCurrencies.length} crypto)`;
      let toastMessage = `Updated ${result.data.length} selected currencies successfully!`;
      
      if (result.error && result.error.includes('premium subscription')) {
        successMessage = `Updated ${cryptoCount} crypto prices (FIAT rates require premium)`;
        toastMessage = `Updated ${cryptoCount} crypto prices. FIAT rates require API premium subscription.`;
      }

      setLatestStatus({
        loading: false,
        success: successMessage,
        lastUsed: currentTime
      });

      onRatesUpdated(result.data, 'latest');
      
      if (result.error && result.error.includes('premium subscription')) {
        toast.warning(toastMessage);
      } else {
        toast.success(toastMessage);
      }

    } catch (error) {
      console.error('Error fetching latest rates:', error);
      setLatestStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rates'
      });
      toast.error('Failed to update exchange rates. Please try again later.');
    }
  };

  const handleFetchHistoricalRates = async () => {
    if (!isAPIConfigured) {
      toast.error('Historical rate data is not available.');
      return;
    }

    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (!canUseAPI(historicalStatus.lastUsed)) {
      const timeLeft = getTimeUntilNextUse(historicalStatus.lastUsed);
      toast.error(`Please wait ${timeLeft} before fetching historical data again.`);
      return;
    }

    const totalSelected = selectedFiatCurrencies.length + selectedCryptoCurrencies.length;
    if (totalSelected === 0) {
      toast.error('Please select at least one currency to fetch historical data for.');
      return;
    }

    setHistoricalStatus({ loading: true });

    try {
      const selectedCurrencies = getCombinedCurrencies();
      const currenciesParam = selectedCurrencies.length > 0 ? `&currencies=${selectedCurrencies.join(',')}` : '';
      
      const response = await fetch(`/api/currency-rates/historical?date=${selectedDate}${currenciesParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch historical rates');
      }

      const currentTime = new Date().toISOString();
      localStorage.setItem('currency-api-historical-used', currentTime);

      setHistoricalStatus({
        loading: false,
        success: `Fetched ${result.data.length} currencies (${selectedFiatCurrencies.length} FIAT, ${selectedCryptoCurrencies.length} crypto) for ${selectedDate}`,
        lastUsed: currentTime
      });

      onRatesUpdated(result.data, 'historical');
      toast.success(`Historical rates loaded for ${new Date(selectedDate).toLocaleDateString()} - ${result.data.length} selected currencies`);

    } catch (error) {
      console.error('Error fetching historical rates:', error);
      setHistoricalStatus({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch historical rates'
      });
      toast.error('Failed to load historical rates. Please try again later.');
    }
  };

  // Don't show the controls if API is not configured
  if (!isAPIConfigured) {
    return null;
  }

  return (
    <Card className="mb-6 border-lime-300 bg-lime-100">
      <CardHeader 
        className="pb-2 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Zap className="h-5 w-5 text-lime-700" />
            <span>Automatic Rate Updates</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            {/* Development reset button - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700"
                onClick={(e) => {
                  e.stopPropagation();
                  resetTimeLimits();
                }}
                title="Reset API time limits (Dev only)"
              >
                ⏰
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-lime-700" />
              ) : (
                <ChevronDown className="h-4 w-4 text-lime-700" />
              )}
            </Button>
          </div>
        </div>
        {!isExpanded && (
          <CardDescription className="text-sm text-lime-600">
            Click to expand • Select currencies and update rates 
            {(selectedFiatCurrencies.length + selectedCryptoCurrencies.length > 0) && 
              <span className="font-medium"> • {selectedFiatCurrencies.length + selectedCryptoCurrencies.length} selected</span>
            }
          </CardDescription>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-2">
          {/* Currency Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Select Currencies to Update</h4>
              <span className="text-xs text-gray-500">({selectedFiatCurrencies.length + selectedCryptoCurrencies.length}/6 selected)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FIAT Currency Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">FIAT Currencies</Label>
                  <span className="text-xs text-gray-500">({selectedFiatCurrencies.length}/3)</span>
                </div>
                
                {/* Selected FIAT currencies display */}
                {selectedFiatCurrencies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedFiatCurrencies.map((code) => {
                      const currency = AVAILABLE_FIAT_CURRENCIES.find(c => c.code === code);
                      return (
                        <div key={code} className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          <span className="font-medium">{code}</span>
                          <button
                            onClick={() => removeFiatCurrency(code)}
                            className="text-blue-600 hover:text-blue-800 ml-1"
                            title={`Remove ${currency?.name || code}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* FIAT Selection Grid */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABLE_FIAT_CURRENCIES.map((currency) => {
                      const isSelected = selectedFiatCurrencies.includes(currency.code);
                      const canSelect = selectedFiatCurrencies.length < 3;
                      const isDisabled = !isSelected && !canSelect;
                      
                      return (
                        <button
                          key={currency.code}
                          onClick={() => toggleFiatCurrency(currency.code)}
                          disabled={isDisabled}
                          className={`
                            p-2 text-xs text-center rounded border transition-all
                            ${isSelected 
                              ? 'bg-blue-500 text-white border-blue-600 font-medium' 
                              : isDisabled 
                                ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                            }
                          `}
                          title={`${currency.name}${isDisabled ? ' (Max 3 FIAT currencies)' : ''}`}
                        >
                          <div className="font-medium">{currency.code}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Crypto Currency Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">Crypto Currencies</Label>
                  <span className="text-xs text-gray-500">({selectedCryptoCurrencies.length}/3)</span>
                </div>
                
                {/* Selected Crypto currencies display */}
                {selectedCryptoCurrencies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedCryptoCurrencies.map((code) => {
                      const currency = AVAILABLE_CRYPTO_CURRENCIES.find(c => c.code === code);
                      return (
                        <div key={code} className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                          <span className="font-medium">{code}</span>
                          <button
                            onClick={() => removeCryptoCurrency(code)}
                            className="text-orange-600 hover:text-orange-800 ml-1"
                            title={`Remove ${currency?.name || code}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Crypto Selection Grid */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABLE_CRYPTO_CURRENCIES.map((currency) => {
                      const isSelected = selectedCryptoCurrencies.includes(currency.code);
                      const canSelect = selectedCryptoCurrencies.length < 3;
                      const isDisabled = !isSelected && !canSelect;
                      
                      return (
                        <button
                          key={currency.code}
                          onClick={() => toggleCryptoCurrency(currency.code)}
                          disabled={isDisabled}
                          className={`
                            p-2 text-xs text-center rounded border transition-all
                            ${isSelected 
                              ? 'bg-orange-500 text-white border-orange-600 font-medium' 
                              : isDisabled 
                                ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-300'
                            }
                          `}
                          title={`${currency.name}${isDisabled ? ' (Max 3 crypto currencies)' : ''}`}
                        >
                          <div className="font-medium">{currency.code}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Helper message when no currencies selected */}
          {(selectedFiatCurrencies.length + selectedCryptoCurrencies.length === 0) && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertDescription className="text-amber-800 text-sm">
                💡 Select at least one currency above to enable automatic rate updates
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Latest Rates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Current Rates</h4>
                {latestStatus.lastUsed && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {canUseAPI(latestStatus.lastUsed) 
                        ? 'Available' 
                        : `${getTimeUntilNextUse(latestStatus.lastUsed)} left`
                      }
                    </span>
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleFetchLatestRates}
                disabled={latestStatus.loading || !canUseAPI(latestStatus.lastUsed)}
                className="w-full h-8"
                variant={latestStatus.loading ? "secondary" : "default"}
                size="sm"
              >
                {latestStatus.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Download className="h-3 w-3" />
                    <span className="text-xs">Update Rates</span>
                  </div>
                )}
              </Button>

              {latestStatus.success && (
                <Alert className="border-green-200 bg-green-50 py-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <AlertDescription className="text-green-800 text-xs">
                    {latestStatus.success}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Historical Rates */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Historical Data</h4>
                {historicalStatus.lastUsed && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {canUseAPI(historicalStatus.lastUsed) 
                        ? 'Available' 
                        : `${getTimeUntilNextUse(historicalStatus.lastUsed)} left`
                      }
                    </span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full h-8 text-xs"
                />
              </div>

              <Button
                onClick={handleFetchHistoricalRates}
                disabled={historicalStatus.loading || !canUseAPI(historicalStatus.lastUsed)}
                variant={historicalStatus.loading ? "secondary" : "outline"}
                className="w-full h-8"
                size="sm"
              >
                {historicalStatus.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">Get Historical Rates</span>
                  </div>
                )}
              </Button>

              {historicalStatus.success && (
                <Alert className="border-green-200 bg-green-50 py-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <AlertDescription className="text-green-800 text-xs">
                    {historicalStatus.success}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Compact Info Note */}
          <Alert className="py-2">
            <AlertDescription className="text-xs text-gray-600">
              💡 Updates limited to once every {RATE_LIMIT_HOURS} hours. Select max 3 FIAT + 3 crypto currencies. Custom settings preserved.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
};