"use client";

import React from "react";
import { TrendingUp, Calculator, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { useProfitLossManagement } from '@/hooks/useProfitLossManagement';
import { ProfitLossFilterBar } from '@/components/features/ProfitLossFilterBar';
import { ProfitLossStatement } from '@/components/features/ProfitLossStatement';
import { ProfitLossMetrics } from '@/components/features/ProfitLossMetrics';
import { ProfitLossComparison } from '@/components/features/ProfitLossComparison';
import { ProfitLossBusinessService } from '@/services/business/profitLossBusinessService';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';

export default function ProfitLossPage() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  const {
    // Enhanced Computed Data
    enhancedData,
    
    // UI State
    isLoaded,
    period,
    customStartDate,
    customEndDate,
    comparisonPeriod,
    showComparison,
    
    // Page Metadata
    pageTitle,
    pageDescription,
    
    // Period Controls
    setPeriod,
    setCustomStartDate,
    setCustomEndDate,
    setComparisonPeriod,
    setShowComparison,
    
    // Export Functions
    exportToPDF,
    exportToExcel,
    exportToJSON,
    exportToCSV,
    
    // Data Management
    refreshData,
    
    // Validation
    isCustomPeriodValid,
    customPeriodError
  } = useProfitLossManagement(globalSelectedCompany, companies);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(!isLoaded);

  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="p-4 sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {pageTitle}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {pageDescription}
              </p>
              {enhancedData && (
                <p className="text-xs text-gray-500">
                  {enhancedData.companyName} • {enhancedData.periodName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <ProfitLossFilterBar
        period={period}
        setPeriod={setPeriod}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        isCustomPeriodValid={isCustomPeriodValid}
        customPeriodError={customPeriodError}
        showComparison={showComparison}
        setShowComparison={setShowComparison}
        comparisonPeriod={comparisonPeriod}
        setComparisonPeriod={setComparisonPeriod}
        onExportPDF={exportToPDF}
        onExportExcel={exportToExcel}
        onExportJSON={exportToJSON}
        onExportCSV={exportToCSV}
        onRefreshData={refreshData}
        hasData={enhancedData?.summary.hasData || false}
        isLoaded={isLoaded}
      />

      {/* Main Content */}
      {enhancedData && !enhancedData.isEmpty ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* P&L Statement */}
          <ProfitLossStatement
            plData={enhancedData.plData}
            periodName={enhancedData.periodName}
            formatCurrency={ProfitLossBusinessService.formatCurrency}
          />

          {/* Metrics and Comparison */}
          <div className="space-y-6">
            {/* Key Metrics */}
            <ProfitLossMetrics
              summary={enhancedData.summary}
              formatCurrency={ProfitLossBusinessService.formatCurrency}
            />

            {/* Period Comparison */}
            {showComparison && enhancedData.comparison && (
              <ProfitLossComparison
                comparison={enhancedData.comparison}
                currentPeriodName={enhancedData.periodName}
                comparisonPeriodName={ProfitLossBusinessService.getPeriodDisplayName(comparisonPeriod)}
                formatCurrency={ProfitLossBusinessService.formatCurrency}
              />
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <PieChart className="h-16 w-16 mx-auto text-gray-300 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Financial Data</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              No financial entries found for the selected period and company. 
              Add income and expense entries to generate your profit & loss statement.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/accounting/bookkeeping/entries'}
            >
              Add Financial Entries
            </Button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}