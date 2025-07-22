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

export const CurrencyRatesAPIControls: React.FC<CurrencyRatesAPIControlsProps> = ({
  onRatesUpdated,
  isAPIConfigured
}) => {
  const [latestStatus, setLatestStatus] = useState<APIStatus>({ loading: false });
  const [historicalStatus, setHistoricalStatus] = useState<APIStatus>({ loading: false });
  const [selectedDate, setSelectedDate] = useState('2025-07-21');
  const [isExpanded, setIsExpanded] = useState(false);
  
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

    setLatestStatus({ loading: true });

    try {
      const response = await fetch('/api/currency-rates/latest', {
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

      setLatestStatus({
        loading: false,
        success: `Updated ${result.data.length} currencies`,
        lastUsed: currentTime
      });

      onRatesUpdated(result.data, 'latest');
      toast.success(`Exchange rates updated successfully!`);

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

    setHistoricalStatus({ loading: true });

    try {
      const response = await fetch(`/api/currency-rates/historical?date=${selectedDate}`, {
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
        success: `Fetched ${result.data.length} currencies for ${selectedDate}`,
        lastUsed: currentTime
      });

      onRatesUpdated(result.data, 'historical');
      toast.success(`Historical rates loaded for ${new Date(selectedDate).toLocaleDateString()}`);

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
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-lime-700" />
            ) : (
              <ChevronDown className="h-4 w-4 text-lime-700" />
            )}
          </Button>
        </div>
        {!isExpanded && (
          <CardDescription className="text-sm text-lime-600">
            Click to expand • Latest rates and historical data
          </CardDescription>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4 pt-2">
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
              💡 Updates limited to once every {RATE_LIMIT_HOURS} hours. Custom settings preserved.
            </AlertDescription>
          </Alert>
        </CardContent>
      )}
    </Card>
  );
};