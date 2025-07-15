"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Plus from "lucide-react/dist/esm/icons/plus";
import Users from "lucide-react/dist/esm/icons/users";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useBusinessCardsManagementDB } from "@/hooks/useBusinessCardsManagementDB";
import { CreateCardDialog } from "@/components/features/CreateCardDialog";
import { InfiniteBusinessCardList } from "@/components/features/InfiniteBusinessCardList";
import { PreviewCardDialog } from "@/components/features/PreviewCardDialog";
import { ArchivedCardsDialog } from "@/components/features/ArchivedCardsDialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

export default function BusinessCardsPage() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  const router = useRouter();
  
  // Loading state for navigation
  const [isNavigatingToProfile, setIsNavigatingToProfile] = useState(false);
  
  // Clean up any old localStorage data on first load
  React.useEffect(() => {
    try {
      localStorage.removeItem('app-businessCards');
      localStorage.removeItem('business-cards-migration-completed');
    } catch (error) {
      // Ignore storage cleanup errors
    }
  }, []);
  
  const {
    // Data
    businessCards,
    
    // UI State
    isDialogOpen,
    previewCard,
    isPreviewOpen,
    showArchived,
    
    // Form State
    formData,
    
    // Person Options
    personOptions,
    
    // Company Info
    selectedCompanyName,
    canAddCard,
    hasRepresentativesOrShareholders,
    
    // Loading & Error States
    isLoading,
    isError,
    error,
    
    // Infinite Scrolling
    hasMore,
    isLoadingMore,
    loadMore,
    
    // Actions
    handleCreateCard,
    handleShareCard,
    handlePreview,
    handleDelete,
    handleDownloadCard,
    
    // Dialog Management
    openDialog,
    closeDialog,
    closePreview,
    toggleArchiveView,
    
    // Form Actions
    handleInputChange,
    handleSelectChange,
    
    // Utility Functions
    setHoveredButton,
    getTemplateStyles,
    
    // Data Refresh
    refetch
  } = useBusinessCardsManagementDB(globalSelectedCompany, companies);

  // Get current filter info
  const selectedCompanyObj = globalSelectedCompany !== 'all' ? companies.find(c => c.id === globalSelectedCompany) : null;
  const isFiltered = globalSelectedCompany !== 'all';

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Handle navigation to company profile
  const handleNavigateToProfile = async () => {
    setIsNavigatingToProfile(true);
    try {
      router.push(`/companies/company-onboarding?edit=${selectedCompanyObj?.id}&step=owners`);
    } catch (error) {
      console.error('Navigation error:', error);
      setIsNavigatingToProfile(false);
    }
  };

  // Handle loading state
  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Error State */}
        {isError && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load business cards: {error?.message || 'Unknown error'}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
              {isFiltered ? `${selectedCompanyObj?.tradingName || 'Selected Company'} Business Cards` : "Business Cards"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              {isFiltered 
                ? `Business cards for ${selectedCompanyObj?.tradingName || 'selected company'}` 
                : "Create and manage professional business cards with QR codes"
              }
            </p>
          </div>
        </div>

        {/* Add Business Card Section */}
        {canAddCard && hasRepresentativesOrShareholders ? (
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogTrigger asChild>
              <Button className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-lg font-bold text-white" onClick={openDialog}>
                <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
                Create Card
              </Button>
            </DialogTrigger>
            <CreateCardDialog 
              formData={formData}
              personOptions={personOptions}
              selectedCompany={selectedCompanyObj}
              handleSelectChange={handleSelectChange}
              handleCreateCard={handleCreateCard}
              closeDialog={closeDialog}
            />
          </Dialog>
        ) : canAddCard ? null : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-amber-800 font-semibold">Select a Company</h3>
                <p className="text-amber-700 text-sm">Please select a specific company from the filter to add business cards.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Representatives/Shareholders Notice */}
      {canAddCard && !hasRepresentativesOrShareholders && (
        <div className="mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-amber-800 font-semibold">Add Company Representatives and Shareholders Required</h3>
                <p className="text-amber-700 text-sm mt-1">Before creating business cards, please add company representatives and/or shareholders to your company profile.</p>
              </div>
              <Button 
                variant="outline" 
                className="bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                onClick={handleNavigateToProfile}
                disabled={isNavigatingToProfile}
              >
                {isNavigatingToProfile ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  "Go to Company Profile"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <InfiniteBusinessCardList 
        businessCards={businessCards}
        companies={companies}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        loadMore={loadMore}
        handleShareCard={handleShareCard}
        handleDownloadCard={handleDownloadCard}
        handleDelete={handleDelete}
        getTemplateStyles={getTemplateStyles}
        setHoveredButton={setHoveredButton}
      />

      <PreviewCardDialog 
        isPreviewOpen={isPreviewOpen}
        closePreview={closePreview}
        previewCard={previewCard}
        handleDownloadCard={handleDownloadCard}
        getTemplateStyles={getTemplateStyles}
        setHoveredButton={setHoveredButton}
      />

      <ArchivedCardsDialog 
        showArchived={showArchived}
        toggleArchiveView={toggleArchiveView}
        visibleCards={businessCards}
        handlePreview={handlePreview}
        handleDownloadCard={handleDownloadCard}
        handleDelete={handleDelete}
        getTemplateStyles={getTemplateStyles}
        setHoveredButton={setHoveredButton}
      />
      </div>
    </div>
  );
}