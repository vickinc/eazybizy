"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompanyManagement } from "@/hooks/useCompanyManagement";
import { CompanyList } from "@/components/features/CompanyList";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

export default function Companies() {
  const router = useRouter();
  const {
    // Data with loading states
    companies,
    isCompaniesLoading,
    isCompaniesError,
    companiesError,
    
    // Formatted data
    activeCompanies,
    passiveCompanies,
    
    // Pagination
    pagination,
    
    // UI State
    copiedFields,
    
    // CRUD Operations
    handleEdit,
    handleDelete,
    
    // Utility Actions
    copyToClipboard,
    handleWebsiteClick,
    
    // Pagination
    loadMore
  } = useCompanyManagement();

  // Navigation handler
  const handleAddCompany = () => {
    router.push('/companies/company-onboarding');
  };

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isCompaniesLoading);

  // Handle loading state
  if (showLoader) {
    return <LoadingScreen />;
  }

  // Handle error state
  if (isCompaniesError) {
    return (
      <div className="min-h-screen bg-lime-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <Building2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Companies</h3>
            <p className="text-gray-600 mb-4">
              {companiesError?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Companies</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage your business portfolio</p>
          </div>
        </div>
      </div>

      {/* Add Company Button */}
      <div className="mb-8">
        <Button 
          onClick={handleAddCompany}
          className="bg-black hover:bg-gray-800 w-full max-w-md py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white"
        >
          <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
          Add Company
        </Button>
      </div>

      <ApiErrorBoundary>
        <CompanyList
          activeCompanies={activeCompanies}
          passiveCompanies={passiveCompanies}
          isLoaded={!isCompaniesLoading}
          copiedFields={copiedFields}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          copyToClipboard={copyToClipboard}
          handleWebsiteClick={handleWebsiteClick}
        />
      </ApiErrorBoundary>

      {/* Load More Button */}
      {companies.length > 0 && pagination.hasMore && (
        <div className="mt-6 text-center">
          <Button
            onClick={loadMore}
            variant="outline"
            disabled={isCompaniesLoading}
          >
            {isCompaniesLoading ? (
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-gray-900 rounded-full" />
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Empty State for All Companies */}
      {!isCompaniesLoading && companies.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first company to the platform.</p>
          <Button 
            className="bg-black hover:bg-gray-800 text-white" 
            onClick={handleAddCompany}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Company
          </Button>
        </Card>
      )}
        </div>
      </div>
    </ErrorBoundary>
  );
}