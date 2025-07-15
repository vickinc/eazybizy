import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Save from "lucide-react/dist/esm/icons/save";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Globe from "lucide-react/dist/esm/icons/globe";
import Bitcoin from "lucide-react/dist/esm/icons/bitcoin";
import { CurrencyRatesSummary } from '@/services/business/currencyRatesBusinessService';

interface CurrencyRatesFilterBarProps {
  activeTab: 'fiat' | 'crypto';
  setActiveTab: (tab: 'fiat' | 'crypto') => void;
  summary: CurrencyRatesSummary;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onSaveRates: () => void;
}

export const CurrencyRatesFilterBar: React.FC<CurrencyRatesFilterBarProps> = ({
  activeTab,
  setActiveTab,
  summary,
  saveStatus,
  onSaveRates
}) => {
  return (
    <div className="flex items-center justify-between">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'fiat' | 'crypto')}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="fiat" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>FIAT Currencies ({summary.totalFiatCurrencies})</span>
          </TabsTrigger>
          <TabsTrigger value="crypto" className="flex items-center space-x-2">
            <Bitcoin className="h-4 w-4" />
            <span>Crypto Currencies ({summary.totalCryptoCurrencies})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex items-center space-x-3">
        <span className="text-sm text-green-600 font-medium">
          ✓ Changes auto-saved
        </span>
        <Button 
          onClick={onSaveRates} 
          disabled={saveStatus === 'saving'}
          variant="outline"
          className="flex items-center space-x-2"
        >
          {saveStatus === 'saving' ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>
            {saveStatus === 'saving' ? 'Saving...' : 
             saveStatus === 'saved' ? 'Saved!' : 
             saveStatus === 'error' ? 'Error!' : 'Manual Save'}
          </span>
        </Button>
      </div>
    </div>
  );
};