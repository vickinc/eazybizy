"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, RotateCcw, ArrowLeft } from "lucide-react";
import { CompanyCard } from "@/components/features/CompanyCard";
import { useRouter } from "next/navigation";
import { useCompanyManagement } from "@/hooks/useCompanyManagement";
import { CompanyList } from "@/components/features/CompanyList";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useEffect } from "react";

export default function CompaniesArchive() {
  const router = useRouter();
  const {
    // Data with loading states
    companies,
    isCompaniesLoading,
    isCompaniesError,
    companiesError,
    
    // Formatted data - we'll filter for archived companies
    formattedCompanies,
    
    // Pagination
    pagination,
    
    // UI State
    copiedFields,
    
    // CRUD Operations
    handleEdit,
    handleDelete,
    handleArchive,
    handleUnarchive,
    
    // Utility Actions
    copyToClipboard,
    handleWebsiteClick,
    
    // Filter management
    updateFilters,
    
    // Pagination
    loadMore
  } = useCompanyManagement();

  // Set filter to show only archived companies when component mounts
  useEffect(() => {
    updateFilters({ statusFilter: 'Archived' });
  }, [updateFilters]);

  // Navigation handlers
  const handleBackToCompanies = () => {
    router.push('/companies');
  };

  // Custom unarchive handler with confirmation
  const handleUnarchiveWithConfirm = (company: any) => {
    if (confirm(`Are you sure you want to unarchive "${company.tradingName}"? It will be moved back to active companies.`)) {
      handleUnarchive(company);
    }
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
            <h3 className="text-lg font-semibold mb-2">Error Loading Archived Companies</h3>
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

  // Filter archived companies from the formatted data
  const archivedCompanies = formattedCompanies.filter(company => company.status === 'Archived');

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Archived Companies</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                  Companies that have been archived ({archivedCompanies.length} total)
                </p>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mb-8">
            <Button 
              onClick={handleBackToCompanies}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Companies</span>
            </Button>
          </div>

          <ApiErrorBoundary>
            {/* Show archived companies in a grid */}
            {archivedCompanies.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <RotateCcw className="h-5 w-5 mr-2 text-gray-500" />
                    Archived Companies ({archivedCompanies.length})
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {archivedCompanies.map((company) => (
                      <CompanyCard
                        key={company.id}
                        company={company}
                        copiedFields={copiedFields}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        handleArchive={handleUnarchiveWithConfirm} // Use unarchive handler
                        copyToClipboard={copyToClipboard}
                        handleWebsiteClick={handleWebsiteClick}
                        isPassive={true} // Show as dimmed
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State for No Archived Companies */
              <Card className="p-12 text-center">
                <RotateCcw className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No archived companies</h3>
                <p className="text-gray-600 mb-6">
                  Companies that are archived will appear here. You can archive companies from the main companies page.
                </p>
                <Button 
                  onClick={handleBackToCompanies}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Go to Companies
                </Button>
              </Card>
            )}
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
        </div>
      </div>
    </ErrorBoundary>
  );
}