"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Plus from "lucide-react/dist/esm/icons/plus";
import Banknote from "lucide-react/dist/esm/icons/banknote";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useBanksWalletsManagementDB } from "@/hooks/useBanksWalletsManagementDB";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import dynamic from 'next/dynamic';
import { Suspense, useCallback } from 'react';
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

// Lazy load heavy components to improve initial bundle size

const BanksWalletsFilterBar = dynamic(
  () => import('@/components/features/BanksWalletsFilterBar').then(mod => ({ default: mod.BanksWalletsFilterBar })),
  {
    loading: () => (
      <div className="mb-6 bg-white rounded-lg shadow border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    ),
    ssr: true
  }
);

const BankAccountsList = dynamic(
  () => import('@/components/features/BankAccountsList').then(mod => ({ default: mod.BankAccountsList })),
  {
    loading: () => (
      <div className="bg-white rounded-lg shadow border mb-8">
        <div className="p-4 border-b border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 sm:p-6">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: true
  }
);

const DigitalWalletsList = dynamic(
  () => import('@/components/features/DigitalWalletsList').then(mod => ({ default: mod.DigitalWalletsList })),
  {
    loading: () => (
      <div className="bg-white rounded-lg shadow border mb-8">
        <div className="p-4 border-b border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 sm:p-6">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: true
  }
);

const BanksWalletsDialogs = dynamic(
  () => import('@/components/features/BanksWalletsDialogs').then(mod => ({ default: mod.BanksWalletsDialogs })),
  {
    loading: () => null,
    ssr: false
  }
);

export default function BanksWalletsClient() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  const {
    // Data
    bankAccounts,
    digitalWallets,
    filteredBankAccounts,
    filteredDigitalWallets,
    
    // UI State
    isLoading,
    searchTerm,
    activeTab,
    expandedBanks,
    expandedWallets,
    isAllBanksExpanded,
    isAllWalletsExpanded,
    
    // Filter State
    viewFilter,
    currencyFilter,
    typeFilter,
    
    // Filter Data
    availableCurrencies,
    availableBankTypes,
    availableWalletTypes,
    
    // Dialog State
    showAddBankForm,
    showAddWalletForm,
    editingBank,
    editingWallet,
    newBankAccount,
    newDigitalWallet,
    
    // Actions
    setSearchTerm,
    setActiveTab,
    setShowAddBankForm,
    setShowAddWalletForm,
    setEditingBank,
    setEditingWallet,
    
    // Filter Actions
    setViewFilter,
    setCurrencyFilter,
    setTypeFilter,
    
    // Form handlers
    updateNewBankAccount,
    updateNewDigitalWallet,
    
    // CRUD operations
    handleCreateBankAccount,
    handleUpdateBankAccount,
    handleDeleteBankAccount,
    handleCreateDigitalWallet,
    handleUpdateDigitalWallet,
    handleDeleteDigitalWallet,
    
    // Utility
    toggleBankExpansion,
    toggleWalletExpansion,
    toggleAllBanksExpansion,
    toggleAllWalletsExpansion,
    resetForms
  } = useBanksWalletsManagementDB(globalSelectedCompany, companies);

  // Determine if banks/wallets can be added (only when a specific company is selected)
  // Use hydration-safe approach to avoid SSR mismatch
  const [canAddBankWallet, setCanAddBankWallet] = useState(false);
  
  useEffect(() => {
    setCanAddBankWallet(globalSelectedCompany !== 'all' && globalSelectedCompany !== null);
  }, [globalSelectedCompany]);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Memoized retry handler to prevent unnecessary re-renders
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Handle loading state with skeleton UI
  if (showLoader) {
    return <LoadingScreen />;
  }


  const banksNoDataMessage = globalSelectedCompany === 'all'
    ? 'No bank accounts found across any company'
    : 'No bank accounts found for this company';

  const walletsNoDataMessage = globalSelectedCompany === 'all'
    ? 'No digital wallets found across any company'
    : 'No digital wallets found for this company';

  const companyOptions = companies.map(company => ({
    value: company.id.toString(),
    label: company.tradingName
  }));

  // Dialog handlers
  const handleShowAddBankForm = () => {
    // Auto-set company ID and account name when opening add form
    if (globalSelectedCompany !== 'all') {
      const selectedCompanyData = companies.find(c => c.id === globalSelectedCompany);
      updateNewBankAccount('companyId', globalSelectedCompany);
      // Set account name to company's legal name by default
      if (selectedCompanyData?.legalName) {
        updateNewBankAccount('accountName', selectedCompanyData.legalName);
      }
    }
    setShowAddBankForm(true);
  };
  
  const handleShowAddWalletForm = () => {
    // Auto-set company ID and ensure crypto is default when opening add form
    if (globalSelectedCompany !== 'all') {
      updateNewDigitalWallet('companyId', globalSelectedCompany);
    }
    // Ensure crypto is always the default but user must select currency
    updateNewDigitalWallet('walletType', 'crypto');
    updateNewDigitalWallet('currency', '');
    setShowAddWalletForm(true);
  };
  
  const handleCloseAddBankForm = () => { setShowAddBankForm(false); resetForms(); };
  const handleCloseAddWalletForm = () => { setShowAddWalletForm(false); resetForms(); };
  const handleCloseEditBankForm = () => { setEditingBank(null); resetForms(); };
  const handleCloseEditWalletForm = () => { setEditingWallet(null); resetForms(); };
  
  // Status toggle handlers (soft delete - set isActive to false)
  const handleToggleBankStatus = async (id: string) => {
    const bank = bankAccounts.find(b => b.id === id);
    if (bank) {
      await handleUpdateBankAccount();
    }
  };
  
  const handleToggleWalletStatus = async (id: string) => {
    const wallet = digitalWallets.find(w => w.id === id);
    if (wallet) {
      await handleUpdateDigitalWallet();
    }
  };

  return (
    <ErrorBoundary level="page">
      <ApiErrorBoundary onRetry={handleRetry}>
        <div className="min-h-screen bg-lime-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Banknote className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    Banks & Wallets
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Manage bank accounts and digital wallets for payment processing
                  </p>
                </div>
              </div>
            </div>

            {/* Add Bank/Wallet Section */}
            <div className="mb-8">
              {canAddBankWallet ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white"
                    onClick={handleShowAddBankForm}
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
                    Add Bank Account
                  </Button>
                  <Button 
                    className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white"
                    onClick={handleShowAddWalletForm}
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
                    Add Wallet
                  </Button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Banknote className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-amber-800 font-semibold">Select a Company</h3>
                      <p className="text-amber-700 text-sm">Please select a specific company from the filter to add bank accounts and wallets.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Filter Bar with Search */}
            <Suspense fallback={
              <div className="mb-6 bg-white rounded-lg shadow border p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            }>
              <BanksWalletsFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                viewFilter={viewFilter}
                setViewFilter={setViewFilter}
                currencyFilter={currencyFilter}
                setCurrencyFilter={setCurrencyFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                availableCurrencies={availableCurrencies}
                availableBankTypes={availableBankTypes}
                availableWalletTypes={availableWalletTypes}
              />
            </Suspense>

            {/* Bank Accounts Section */}
            {(viewFilter === 'all' || viewFilter === 'banks') && (
              <Suspense fallback={
                <div className="bg-white rounded-lg shadow border mb-8">
                  <div className="p-4 border-b border-gray-200">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="divide-y divide-gray-200">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="p-4 sm:p-6">
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
                        <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              }>
                <div className="mb-8">
                  <BankAccountsList
                    filteredBankAccounts={filteredBankAccounts}
                    noDataMessage={banksNoDataMessage}
                    expandedBanks={expandedBanks}
                    toggleBankExpansion={toggleBankExpansion}
                    handleToggleBankStatus={handleToggleBankStatus}
                    handleDeleteBankAccount={handleDeleteBankAccount}
                    setEditingBank={setEditingBank}
                    isAllBanksExpanded={isAllBanksExpanded}
                    toggleAllBanksExpansion={toggleAllBanksExpansion}
                  />
                </div>
              </Suspense>
            )}

            {/* Digital Wallets Section */}
            {(viewFilter === 'all' || viewFilter === 'wallets') && (
              <Suspense fallback={
                <div className="bg-white rounded-lg shadow border mb-8">
                  <div className="p-4 border-b border-gray-200">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="divide-y divide-gray-200">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="p-4 sm:p-6">
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
                        <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              }>
                <div className="mb-8">
                  <DigitalWalletsList
                    filteredDigitalWallets={filteredDigitalWallets}
                    noDataMessage={walletsNoDataMessage}
                    expandedWallets={expandedWallets}
                    toggleWalletExpansion={toggleWalletExpansion}
                    handleToggleWalletStatus={handleToggleWalletStatus}
                    handleDeleteDigitalWallet={handleDeleteDigitalWallet}
                    setEditingWallet={setEditingWallet}
                    isAllWalletsExpanded={isAllWalletsExpanded}
                    toggleAllWalletsExpansion={toggleAllWalletsExpansion}
                  />
                </div>
              </Suspense>
            )}

            {/* Dialogs */}
            <BanksWalletsDialogs
              companyOptions={companyOptions}
              showAddBankForm={showAddBankForm}
              editingBank={editingBank}
              newBankAccount={newBankAccount}
              showAddWalletForm={showAddWalletForm}
              editingWallet={editingWallet}
              newDigitalWallet={newDigitalWallet}
              setEditingBank={setEditingBank}
              updateNewBankAccount={updateNewBankAccount}
              handleCreateBankAccount={handleCreateBankAccount}
              handleUpdateBankAccount={handleUpdateBankAccount}
              onCloseAddBankDialog={handleCloseAddBankForm}
              onCloseEditBankDialog={handleCloseEditBankForm}
              setEditingWallet={setEditingWallet}
              updateNewDigitalWallet={updateNewDigitalWallet}
              handleCreateDigitalWallet={handleCreateDigitalWallet}
              handleUpdateDigitalWallet={handleUpdateDigitalWallet}
              onCloseAddWalletDialog={handleCloseAddWalletForm}
              onCloseEditWalletDialog={handleCloseEditWalletForm}
            />
          </div>
        </div>
      </ApiErrorBoundary>
    </ErrorBoundary>
  );
}