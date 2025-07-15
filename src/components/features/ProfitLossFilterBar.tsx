import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Download from "lucide-react/dist/esm/icons/download";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Table from "lucide-react/dist/esm/icons/table";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import { PeriodType, ComparisonPeriodType } from '@/hooks/useProfitLossManagement';

interface ProfitLossFilterBarProps {
  // Period Selection
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  
  // Custom Period Validation
  isCustomPeriodValid: boolean;
  customPeriodError: string | null;
  
  // Comparison
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
  comparisonPeriod: ComparisonPeriodType;
  setComparisonPeriod: (period: ComparisonPeriodType) => void;
  
  // Export Functions
  onExportPDF: () => Promise<void>;
  onExportExcel: () => Promise<void>;
  onExportJSON: () => Promise<void>;
  onExportCSV: () => Promise<void>;
  
  // Data Management
  onRefreshData: () => Promise<void>;
  
  // Data State
  hasData: boolean;
  isLoaded: boolean;
}

export const ProfitLossFilterBar: React.FC<ProfitLossFilterBarProps> = ({
  period,
  setPeriod,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  isCustomPeriodValid,
  customPeriodError,
  showComparison,
  setShowComparison,
  comparisonPeriod,
  setComparisonPeriod,
  onExportPDF,
  onExportExcel,
  onExportJSON,
  onExportCSV,
  onRefreshData,
  hasData,
  isLoaded
}) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleExport = async (exportFunction: () => Promise<void>) => {
    if (!hasData) return;
    
    setIsExporting(true);
    try {
      await exportFunction();
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Period Selection & Export</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!hasData || isExporting || !isLoaded}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export'}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport(onExportPDF)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(onExportExcel)}>
                  <Table className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(onExportCSV)}>
                  <Table className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(onExportJSON)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Period</label>
            <Select value={period} onValueChange={(value) => setPeriod(value as PeriodType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
                <SelectItem value="allTime">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Inputs */}
          {period === 'custom' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !isCustomPeriodValid ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !isCustomPeriodValid ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
            </>
          )}
        </div>

        {/* Custom Period Error */}
        {period === 'custom' && customPeriodError && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{customPeriodError}</span>
          </div>
        )}

        {/* Comparison Controls */}
        <div className="flex items-center space-x-4 pt-2 border-t">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium">Show Period Comparison</span>
          </label>

          {showComparison && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Compare with:</span>
              <Select 
                value={comparisonPeriod} 
                onValueChange={(value) => setComparisonPeriod(value as ComparisonPeriodType)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="lastYear">Last Year</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Export Status */}
        {!hasData && isLoaded && (
          <div className="text-sm text-gray-500 italic">
            No financial data available for export
          </div>
        )}
      </CardContent>
    </Card>
  );
};