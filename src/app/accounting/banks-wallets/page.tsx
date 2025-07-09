"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Banknote } from "lucide-react";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useBanksWalletsManagementDB } from "@/hooks/useBanksWalletsManagementDB";
import { BanksWalletsFilterBar } from "@/components/features/BanksWalletsFilterBar";
import { BanksWalletsSummaryCards } from "@/components/features/BanksWalletsSummaryCards";
import { BankAccountsList } from "@/components/features/BankAccountsList";
import { DigitalWalletsList } from "@/components/features/DigitalWalletsList";
import { BanksWalletsDialogs } from "@/components/features/BanksWalletsDialogs";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function BanksWalletsPage() {
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

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Computed derived data for UI
  const summary = {
    totalBanks: bankAccounts.length,
    activeBanks: bankAccounts.filter(b => b.isActive).length,
    totalWallets: digitalWallets.length,
    activeWallets: digitalWallets.filter(w => w.isActive).length
  };


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

  // Determine if banks/wallets can be added (only when a specific company is selected)
  const canAddBankWallet = globalSelectedCompany !== 'all' && globalSelectedCompany !== null;

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
    // Auto-set company ID when opening add form
    if (globalSelectedCompany !== 'all') {
      updateNewDigitalWallet('companyId', globalSelectedCompany);
    }
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

        {/* Summary Cards */}
        <BanksWalletsSummaryCards summary={summary} />

        {/* Filter Bar with Search */}
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

        {/* Bank Accounts Section */}
        {(viewFilter === 'all' || viewFilter === 'banks') && (
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
        )}

        {/* Digital Wallets Section */}
        {(viewFilter === 'all' || viewFilter === 'wallets') && (
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
  );
}