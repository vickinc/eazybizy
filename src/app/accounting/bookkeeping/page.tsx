"use client";

import React from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { useBookkeepingManagement } from '@/hooks/useBookkeepingManagement.new';
import PieChart from "lucide-react/dist/esm/icons/pie-chart";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataIntegrityAlert, useDataIntegrityCheck } from "@/components/features/DataIntegrityAlert";
import { BookkeepingStats } from "@/components/features/BookkeepingStats";
import { RecentEntriesList } from "@/components/features/RecentEntriesList";
import { BookkeepingReport } from "@/components/features/BookkeepingReport";
import { ExpenseAnalytics } from "@/components/features/ExpenseAnalytics";
import { BookkeepingEntryDialog } from "@/components/features/BookkeepingEntryDialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";


export default function BookkeepingPage() {
  const { selectedCompany, companies } = useCompanyFilter();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const { shouldShowAlert, dismissAlert } = useDataIntegrityCheck();
  
  const bookkeeping = useBookkeepingManagement(selectedCompany, companies);

  // Show loading state while data is being fetched
  if (bookkeeping.isEntriesLoading || bookkeeping.isAccountsLoading) {
    return <LoadingScreen />;
  }

  // Show error state if there's an error
  if (bookkeeping.isEntriesError) {
    return (
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-4">Error loading bookkeeping data</div>
            <p className="text-gray-600">{bookkeeping.entriesError?.message || 'An unexpected error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }









  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Integrity Alert */}
        {shouldShowAlert && (
          <DataIntegrityAlert onDismiss={dismissAlert} />
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Bookkeeping</h1>
              <p className="text-sm sm:text-base text-gray-600">Simplified accounting for tracking income and expenses</p>
            </div>
          </div>
          <div className="flex flex-col space-y-3 md:items-end">
            {/* Time Period Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <Label className="text-sm font-semibold text-gray-700 min-w-fit">
                Time Period:
              </Label>
              <Select value={bookkeeping.selectedPeriod} onValueChange={bookkeeping.setSelectedPeriod}>
                <SelectTrigger className="w-full sm:w-[200px] h-10 border-2 border-green-200 focus:border-green-500 bg-green-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">📅 This Month</SelectItem>
                  <SelectItem value="lastMonth">📅 Last Month</SelectItem>
                  <SelectItem value="thisYear">📊 This Year</SelectItem>
                  <SelectItem value="lastYear">📊 Last Year</SelectItem>
                  <SelectItem value="allTime">🕐 All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Current Period Display */}
            <div className="text-left md:text-right">
              <div className="text-sm text-gray-500">Current Period</div>
              <div className="font-semibold text-gray-900">
                {bookkeeping.selectedPeriod === 'thisMonth' ? 'This Month' : 
                 bookkeeping.selectedPeriod === 'lastMonth' ? 'Last Month' :
                 bookkeeping.selectedPeriod === 'thisYear' ? 'This Year' :
                 bookkeeping.selectedPeriod === 'lastYear' ? 'Last Year' : 'All Time'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Link 
              href="/accounting/bookkeeping/categories" 
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Manage Categories
            </Link>
            <Link 
              href="/accounting/bookkeeping/entries" 
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              📝 Entries
            </Link>
            <Link 
              href="/accounting/bookkeeping/transactions" 
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              💳 Transactions
            </Link>
            <Link 
              href="/accounting/bookkeeping/balances" 
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              ⚖️ Balances
            </Link>
          </div>
        </div>

        {/* Enhanced Tab Navigation - Only Dashboard, Analytics, Reports */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 h-14 p-1 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Enhanced Summary Cards */}
            <BookkeepingStats 
              financialSummary={bookkeeping.financialSummary}
              formatCurrency={bookkeeping.formatCurrency}
            />

            {/* Enhanced Recent Entries */}
            <RecentEntriesList
              enrichedEntries={bookkeeping.enrichedEntries}
              filteredEntries={bookkeeping.filteredEntries}
              expandedEntries={bookkeeping.expandedEntries}
              isAllExpanded={bookkeeping.isAllExpanded}
              onToggleEntryExpansion={bookkeeping.toggleEntryExpansion}
              onToggleAllEntriesExpansion={bookkeeping.toggleAllEntriesExpansion}
              onEditEntry={bookkeeping.handleEditEntry}
              onShowEntryDialog={bookkeeping.setShowEntryDialog}
              formatCurrency={bookkeeping.formatCurrency}
            />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <BookkeepingReport 
              financialSummary={bookkeeping.financialSummary}
              formatCurrency={bookkeeping.formatCurrency}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <ExpenseAnalytics 
              expenseBreakdown={bookkeeping.expenseBreakdown}
              formatCurrency={bookkeeping.formatCurrency}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Global Entry Dialog - Available across all tabs */}
      <BookkeepingEntryDialog
        isOpen={bookkeeping.showEntryDialog}
        onOpenChange={bookkeeping.setShowEntryDialog}
        editingEntry={!!bookkeeping.editingEntry}
        entryFormData={bookkeeping.entryFormData}
        activeCompanies={bookkeeping.activeCompanies}
        availableInvoices={bookkeeping.availableInvoices}
        showInvoiceSelect={bookkeeping.showInvoiceSelect}
        onSetShowInvoiceSelect={bookkeeping.setShowInvoiceSelect}
        onEntryInputChange={bookkeeping.handleEntryInputChange}
        onInvoiceReferenceChange={bookkeeping.handleInvoiceReferenceChange}
        onDialogCancel={bookkeeping.handleDialogCancel}
        onEntrySubmit={bookkeeping.handleEntrySubmit}
        formatCurrency={bookkeeping.formatCurrency}
      />
    </div>
  );
} 