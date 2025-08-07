import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/loading-states";
import Building from "lucide-react/dist/esm/icons/building";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import { CurrencyBreakdown } from '@/types/balance.types';
import { BalanceBusinessService } from '@/services/business/balanceBusinessService';
import { CurrencyService } from '@/services/business/currencyService';

interface CurrencyBreakdownPieChartProps {
  currencyBreakdown: Record<string, CurrencyBreakdown>;
  baseCurrency?: string;
  onCurrencyClick?: (currency: string) => void;
  loading?: boolean;
}

interface PieChartDataItem {
  currency: string;
  netWorthUSD: number;
  assets: number;
  liabilities: number;
  netWorth: number;
  percentage: number;
  color: string;
  originalAmount: number;
}

// Blockchain/cryptocurrency specific color palette - Muted, user-friendly colors
const CRYPTOCURRENCY_COLORS: { [key: string]: string } = {
  // Bitcoin ecosystem - Soft orange
  'BTC': '#FED7AA', // Soft orange
  'SATS': '#FED7AA', // Same as Bitcoin
  
  // Ethereum ecosystem - Soft blue
  'ETH': '#BFDBFE', // Soft blue
  'USDC': '#93C5FD', // Soft blue for USD Coin
  
  // Tron ecosystem - Soft red
  'TRX': '#FECACA', // Soft red
  'USDT': '#BBF7D0', // Soft green
  
  // Other major cryptocurrencies - All muted versions
  'SOL': '#E9D5FF', // Soft purple
  'BNB': '#FEF3C7', // Soft yellow
  'ADA': '#7DD3FC', // Soft sky blue
  'DOT': '#FDA4AF', // Soft rose
  'MATIC': '#C4B5FD', // Soft purple
  'AVAX': '#FCA5A5', // Soft red
  'LINK': '#93C5FD', // Soft blue
  'UNI': '#F9A8D4', // Soft hot pink
  
  // Stablecoins - Muted versions
  'BUSD': '#FDE047', // Softer gold
  'DAI': '#FCD34D', // Softer orange
  'TUSD': '#60A5FA', // Softer navy (more blue)
  
  // Traditional currencies - Muted versions
  'USD': '#86EFAC', // Soft green
  'EUR': '#93C5FD', // Soft blue
  'GBP': '#FCA5A5', // Soft red
  'JPY': '#FCD34D', // Soft amber
  'CAD': '#FCA5A5', // Soft red
  'AUD': '#86EFAC', // Soft green
  'CHF': '#FCA5A5', // Soft red
  'CNY': '#FCA5A5', // Soft red
};

// Fallback colors for currencies not in the specific mapping - All muted, user-friendly
const FALLBACK_COLORS = [
  '#93C5FD', // Soft blue
  '#86EFAC', // Soft green
  '#FCD34D', // Soft amber
  '#FCA5A5', // Soft red
  '#A78BFA', // Soft purple
  '#67E8F9', // Soft cyan
  '#FBBF24', // Soft orange
  '#BEF264', // Soft lime
  '#F9A8D4', // Soft pink
  '#D1D5DB', // Soft gray
];

// Function to get currency-specific color
const getCurrencyColor = (currency: string, fallbackIndex: number): string => {
  return CRYPTOCURRENCY_COLORS[currency.toUpperCase()] || FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
};

const CurrencyBreakdownPieChart: React.FC<CurrencyBreakdownPieChartProps> = ({
  currencyBreakdown,
  baseCurrency = 'USD',
  onCurrencyClick,
  loading = false
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [chartData, setChartData] = useState<PieChartDataItem[]>([]);
  const [isCalculating, setIsCalculating] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed

  // Process and transform data for the pie chart with proper USD conversion
  useEffect(() => {
    const calculateChartData = async () => {
      setIsCalculating(true);
      
      const entries = Object.entries(currencyBreakdown);
      
      // Calculate USD values for each currency using the same service as stats cards
      const dataWithUSD = await Promise.all(
        entries.map(async ([currency, breakdown], index) => {
          try {
            // Convert net worth to USD using the same service that works for stats cards
            const netWorthUSD = Math.abs(await CurrencyService.convertToUSDAsync(Math.abs(breakdown.netWorth), currency));
            
            return {
              currency,
              netWorthUSD,
              assets: breakdown.assets,
              liabilities: breakdown.liabilities,
              netWorth: breakdown.netWorth,
              percentage: 0, // Will calculate after we have all USD values
              color: getCurrencyColor(currency, index),
              originalAmount: Math.abs(breakdown.netWorth)
            };
          } catch (error) {
            console.error(`Error converting ${currency} to USD:`, error);
            // Fallback: use a minimal USD value for currencies that fail conversion
            return {
              currency,
              netWorthUSD: Math.abs(breakdown.netWorth) * 0.001, // Very small fallback value
              assets: breakdown.assets,
              liabilities: breakdown.liabilities,
              netWorth: breakdown.netWorth,
              percentage: 0,
              color: getCurrencyColor(currency, index),
              originalAmount: Math.abs(breakdown.netWorth)
            };
          }
        })
      );
      
      // Filter out currencies with very small USD values (less than $0.01)
      const significantEntries = dataWithUSD.filter(item => item.netWorthUSD >= 0.01);
      
      if (significantEntries.length === 0) {
        setChartData([]);
        setIsCalculating(false);
        return;
      }
      
      // Calculate total USD value for percentage calculation
      const totalNetWorthUSD = significantEntries.reduce((sum, item) => sum + item.netWorthUSD, 0);
      
      // Calculate percentages and sort by USD value
      const finalData = significantEntries
        .map(item => ({
          ...item,
          percentage: (item.netWorthUSD / totalNetWorthUSD) * 100
        }))
        .sort((a, b) => b.netWorthUSD - a.netWorthUSD);
      
      setChartData(finalData);
      setIsCalculating(false);
    };

    if (Object.keys(currencyBreakdown).length > 0) {
      calculateChartData();
    } else {
      setChartData([]);
      setIsCalculating(false);
    }
  }, [currencyBreakdown]);

  const formatCurrency = (amount: number, currency: string): string => {
    return BalanceBusinessService.formatCurrency(amount, currency);
  };

  const handlePieEnter = (data: PieChartDataItem, index: number) => {
    setActiveIndex(index);
  };

  const handlePieLeave = () => {
    setActiveIndex(null);
  };

  const handleCurrencyClick = (data: PieChartDataItem) => {
    const newSelection = selectedCurrency === data.currency ? null : data.currency;
    setSelectedCurrency(newSelection);
    onCurrencyClick?.(data.currency);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PieChartDataItem;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <div className="font-semibold text-lg mb-2 flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: data.color }}
            />
            {data.currency}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Assets:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(data.assets, data.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Liabilities:</span>
              <span className="font-medium text-red-600">
                {formatCurrency(data.liabilities, data.currency)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="text-gray-600">Net Worth:</span>
              <span className={`font-medium ${data.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.netWorth, data.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">USD Equivalent:</span>
              <span className="font-medium">
                {formatCurrency(data.netWorthUSD, 'USD')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Percentage:</span>
              <span className="font-medium">
                {data.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const CustomLegend = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4" role="list" aria-label="Currency breakdown legend">
      {chartData.map((entry, index) => (
        <div
          key={entry.currency}
          role="listitem"
          tabIndex={0}
          className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-1 ${
            selectedCurrency === entry.currency 
              ? 'bg-lime-200 border-2 border-lime-400' 
              : 'bg-lime-100 hover:bg-lime-200 border border-lime-300'
          } ${activeIndex === index ? 'bg-lime-200' : ''}`}
          onClick={() => handleCurrencyClick(entry)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCurrencyClick(entry);
            }
          }}
          aria-label={`${entry.currency}: ${formatCurrency(entry.netWorthUSD, 'USD')} (${entry.percentage.toFixed(1)}%)`}
        >
          <div 
            className="w-3 h-3 rounded-full mr-3 flex-shrink-0" 
            style={{ backgroundColor: entry.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{entry.currency}</span>
              <Badge variant="outline" className="text-xs ml-2">
                {entry.percentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-xs text-gray-600 truncate">
              {formatCurrency(entry.netWorthUSD, 'USD')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading || isCalculating) {
    return (
      <Card className="mb-6 bg-lime-100 border-lime-300">
        <CardHeader className="bg-lime-100 cursor-wait">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Currency Breakdown
            </div>
            <div className="p-1 bg-lime-200 rounded">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-lime-100">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-56 sm:h-72 md:h-80 lg:h-96 flex items-center justify-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full bg-lime-200 animate-pulse"></div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center p-2">
                    <Skeleton className="w-3 h-3 rounded-full mr-3" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-12 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card 
      className="mb-6 bg-lime-100 border-lime-300" 
      role="region" 
      aria-labelledby="currency-breakdown-title"
    >
      <CardHeader 
        className="bg-lime-100 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }
        }}
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Expand currency breakdown" : "Collapse currency breakdown"}
      >
        <CardTitle id="currency-breakdown-title" className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Building className="h-5 w-5 mr-2" aria-hidden="true" />
            Currency Breakdown
          </div>
          <div className="p-1 bg-lime-200 rounded">
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="bg-lime-100 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" onClick={(e) => e.stopPropagation()}>
          {/* Pie Chart */}
          <div className="lg:col-span-2">
            <div className="h-56 sm:h-72 md:h-80 lg:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius="85%"
                    paddingAngle={1}
                    dataKey="netWorthUSD"
                    onMouseEnter={handlePieEnter}
                    onMouseLeave={handlePieLeave}
                    onClick={handleCurrencyClick}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={selectedCurrency === entry.currency ? '#65a30d' : 'none'}
                        strokeWidth={selectedCurrency === entry.currency ? 3 : 0}
                        style={{
                          filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend and Currency Details */}
          <div className="lg:col-span-1">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Currency Distribution
            </h3>
            <CustomLegend />
            
            {selectedCurrency && (
              <div className="mt-4 p-3 bg-lime-200 rounded-lg border border-lime-300">
                <h4 className="text-sm font-medium text-gray-800 mb-2">
                  {selectedCurrency} Details
                </h4>
                {(() => {
                  const selected = chartData.find(d => d.currency === selectedCurrency);
                  if (!selected) return null;
                  
                  return (
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Assets:</span>
                        <span className="font-medium">
                          {formatCurrency(selected.assets, selected.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Liabilities:</span>
                        <span className="font-medium">
                          {formatCurrency(selected.liabilities, selected.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-lime-300 pt-1">
                        <span className="text-gray-700">Net:</span>
                        <span className="font-medium">
                          {formatCurrency(selected.netWorth, selected.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      )}
    </Card>
  );
};

export default CurrencyBreakdownPieChart;