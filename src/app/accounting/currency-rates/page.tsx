"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { useCurrencyRatesManagement } from "@/hooks/useCurrencyRatesManagement";
import { CurrencyRatesFilterBar } from "@/components/features/CurrencyRatesFilterBar";
import { CurrencyRatesList } from "@/components/features/CurrencyRatesList";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from '@/hooks/useDelayedLoading';

export default function CurrencyRatesPage() {
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
    handleResetToDefaults
  } = useCurrencyRatesManagement();

  const showLoader = useDelayedLoading(!isLoaded);

  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      {/* Info Banner */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Exchange Rate Information</p>
              <p>
                These rates are used throughout the application for currency conversion in invoices and client statistics. 
                For FIAT currencies, enter how much 1 unit equals in USD. For cryptocurrencies, enter how much USD 1 crypto equals.
              </p>
              <p className="mt-2 font-medium">
                Example: EUR rate 1.09 means 1 EUR = 1.09 USD. BTC rate 105,000 means 1 BTC = 105,000 USD.
              </p>
              <p className="mt-2 text-sm text-blue-700">
                💡 <strong>Auto-Save:</strong> Changes are automatically saved as you type and immediately reflected across all pages.
              </p>
            </div>
          </div>
        </CardContent>
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
      </div>
    </div>
  );
} 