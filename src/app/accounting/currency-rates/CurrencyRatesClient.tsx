"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import { useCurrencyRatesManagement } from "@/hooks/useCurrencyRatesManagement";
import { CurrencyRatesFilterBar } from "@/components/features/CurrencyRatesFilterBar";
import { CurrencyRatesList } from "@/components/features/CurrencyRatesList";
import { CurrencyRatesAPIControls } from "@/components/features/CurrencyRatesAPIControls";
import { EnhancedCurrencyRate } from '@/services/business/currencyRatesBusinessService';
import { CurrencyRate } from '@/types';

interface CurrencyRatesClientProps {
  initialData: {
    fiatRates: EnhancedCurrencyRate[];
    cryptoRates: EnhancedCurrencyRate[];
    baseCurrency: string;
    lastSaved: string;
    metadata?: {
      userId?: string;
      companyId?: string;
      cached?: boolean;
    };
  };
  isAPIConfigured: boolean;
}

export function CurrencyRatesClient({ initialData, isAPIConfigured }: CurrencyRatesClientProps) {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const {
    // Computed Data
    enhancedFiatRates,
    enhancedCryptoRates,
    summary,
    pageTitle,
    pageDescription,
    
    // UI State
    isLoaded,
    activeTab,
    saveStatus,
    
    // Event Handlers
    setActiveTab,
    
    // Rate Management
    handleRateChange,
    handleSaveRates,
    handleResetToDefaults,
    updateRatesFromAPI
  } = useCurrencyRatesManagement(initialData);

  // API configuration passed from server component to prevent hydration mismatch

  // Handle API rate updates
  const handleAPIRatesUpdated = (apiRates: CurrencyRate[], updateType: 'latest' | 'historical') => {
    if (updateRatesFromAPI) {
      updateRatesFromAPI(apiRates, updateType);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              {pageTitle}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
              {pageDescription}
            </p>
          </div>
        </div>
      </div>

      {/* API Controls */}
      <CurrencyRatesAPIControls 
        onRatesUpdated={handleAPIRatesUpdated}
        isAPIConfigured={isAPIConfigured}
      />

      {/* Info Banner - Expandable */}
      <Card 
        className="mb-6 bg-lime-50 border-lime-200 cursor-pointer" 
        onClick={() => setIsInfoExpanded(!isInfoExpanded)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-lime-600" />
              <span>Exchange Rate Information</span>
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isInfoExpanded ? (
                <ChevronUp className="h-4 w-4 text-lime-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-lime-600" />
              )}
            </Button>
          </div>
          {!isInfoExpanded && (
            <p className="text-sm text-lime-600">
              Click to expand • Usage guidelines and examples
            </p>
          )}
        </CardHeader>
        
        {isInfoExpanded && (
          <CardContent className="pt-2">
            <div className="text-sm text-lime-800 space-y-3">
              <p>
                These rates are used throughout the application for currency conversion in invoices and client statistics. 
                For FIAT currencies, enter how much 1 unit equals in USD. For cryptocurrencies, enter how much USD 1 crypto equals.
              </p>
              <p className="font-medium">
                Example: EUR rate 1.09 means 1 EUR = 1.09 USD. BTC rate 105,000 means 1 BTC = 105,000 USD.
              </p>
              <p className="text-sm text-lime-700">
                💡 <strong>Auto-Save:</strong> Changes are automatically saved as you type and immediately reflected across all pages.
              </p>
              {isAPIConfigured && (
                <p className="text-sm text-lime-700">
                  🌐 <strong>Live Rates:</strong> Use the controls above to automatically update rates.
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Currency Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'fiat' | 'crypto')} className="space-y-6">
        <CurrencyRatesFilterBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          summary={summary}
          saveStatus={saveStatus}
          onSaveRates={handleSaveRates}
        />

        <TabsContent value="fiat">
          <CurrencyRatesList
            currencies={enhancedFiatRates}
            type="fiat"
            onRateChange={handleRateChange}
            onResetToDefaults={handleResetToDefaults}
          />
        </TabsContent>

        <TabsContent value="crypto">
          <CurrencyRatesList
            currencies={enhancedCryptoRates}
            type="crypto"
            onRateChange={handleRateChange}
            onResetToDefaults={handleResetToDefaults}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}