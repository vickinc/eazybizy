"use client";

import React from "react";
import Link from "next/link";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Plus from "lucide-react/dist/esm/icons/plus";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import { Button } from "@/components/ui/button";
import { useChartOfAccountsManagement } from '@/hooks';
import { CategoryFilterBar } from '@/components/features/CategoryFilterBar';
import { ProfessionalAccountTable } from '@/components/features/ProfessionalAccountTable';
import { CategoryDialog } from '@/components/features/CategoryDialog';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useState, useEffect } from 'react';

export default function CategoriesClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const chartOfAccounts = useChartOfAccountsManagement();

  useEffect(() => {
    // Simulate initial load time for chart of accounts
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleInitializeDefaults = async () => {
    setIsCreatingDefaults(true);
    try {
      await chartOfAccounts.initializeDefaultData();
    } finally {
      setIsCreatingDefaults(false);
    }
  };

  const handleRefreshDataset = async () => {
    setIsRefreshing(true);
    try {
      await chartOfAccounts.forceRefreshCompleteDataset();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await chartOfAccounts.clearAllData();
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                Chart of Accounts
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage your accounting categories and financial structure
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Clear All Data Button - Only show when there are accounts */}
            {chartOfAccounts.accounts.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleClearAllData}
                disabled={isClearing}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              >
                {isClearing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Clearing...</span>
                  </div>
                ) : (
                  "Clear All Data"
                )}
              </Button>
            )}
            {chartOfAccounts.accounts.length === 0 && (
              <Button
                variant="default"
                onClick={handleInitializeDefaults}
                disabled={isCreatingDefaults}
                className="w-full sm:w-auto"
              >
                {isCreatingDefaults ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Default Chart of Accounts"
                )}
              </Button>
            )}
            {chartOfAccounts.accounts.length > 0 && chartOfAccounts.accounts.length < 218 && (
              <Button
                variant="default"
                onClick={handleRefreshDataset}
                disabled={isRefreshing}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {isRefreshing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  `Load Complete Dataset (${chartOfAccounts.accounts.length}/218)`
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                const csvData = chartOfAccounts.exportToCSV();
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'chart-of-accounts.csv';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="w-full sm:w-auto"
            >
              Export CSV
            </Button>
            <Button
              onClick={() => chartOfAccounts.setShowAccountDialog(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/accounting/bookkeeping/categories/tax-treatments" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-lime-200 border border-lime-200 rounded-md hover:bg-lime-300 hover:border-lime-300 transition-colors"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Manage Tax Treatments
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <CategoryFilterBar
          filter={chartOfAccounts.filter}
          onFilterChange={chartOfAccounts.handleFilterChange}
          onClearFilters={chartOfAccounts.clearFilters}
          className="mb-6"
        />

        {/* Main Content */}
        <ProfessionalAccountTable
          accounts={chartOfAccounts.filteredAccounts}
          onEditAccount={chartOfAccounts.handleEditAccount}
          onDeleteAccount={chartOfAccounts.handleDeleteAccount}
          onDeactivateAccount={chartOfAccounts.handleDeactivateAccount}
          onReactivateAccount={chartOfAccounts.handleReactivateAccount}
          isLoaded={chartOfAccounts.isLoaded}
        />

        {/* Account Dialog */}
        <CategoryDialog
          isOpen={chartOfAccounts.showAccountDialog}
          onOpenChange={chartOfAccounts.setShowAccountDialog}
          formData={chartOfAccounts.formData}
          editingAccount={chartOfAccounts.editingAccount}
          onFormInputChange={chartOfAccounts.handleFormInputChange}
          onFormSubmit={chartOfAccounts.handleFormSubmit}
          onCancel={() => {
            chartOfAccounts.setShowAccountDialog(false);
            chartOfAccounts.resetForm();
          }}
        />
      </div>
    </div>
  );
}