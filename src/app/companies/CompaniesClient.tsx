"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Plus from "lucide-react/dist/esm/icons/plus";
import Archive from "lucide-react/dist/esm/icons/archive";
import { useRouter } from "next/navigation";
import { useCompanyManagementComposed as useCompanyManagement } from "@/hooks/useCompanyManagement.composed";
import { useSeparateCompanyPagination } from "@/hooks/useSeparateCompanyPagination";
import { useCompanyFilters } from "@/hooks/useCompanyFilters";
import { useCompanyCrud } from "@/hooks/useCompanyCrud";
import { useCompanyForm } from "@/hooks/useCompanyForm";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import CompaniesLoading from "./loading";
import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';

// Lazy load heavy components to improve initial bundle size
const SmartCompanyList = dynamic(
  () => import('@/components/features/SmartCompanyList').then(mod => ({ default: mod.SmartCompanyList })),
  {
    loading: () => <CompaniesLoading />,
    ssr: true // Enable SSR for better initial render performance
  }
);

export default function CompaniesClient() {
  const router = useRouter();
  
  // Use individual hooks for better separation
  const filters = useCompanyFilters();
  const form = useCompanyForm();
  const crud = useCompanyCrud();
  
  // Use the new separate pagination hook
  const {
    activeCompanies,
    passiveCompanies,
    isLoadingActive,
    isLoadingPassive,
    isError: isCompaniesError,
    error: companiesError,
    hasMoreActive,
    hasMorePassive,
    loadMoreActive,
    loadMorePassive,
    invalidateQueries
  } = useSeparateCompanyPagination(
    filters.filters.searchTerm,
    'all', // We handle Active/Passive separately
    filters.filters.industryFilter,
    filters.sorting.sortField,
    filters.sorting.sortDirection
  );
  
  // Combine data for backward compatibility
  const companies = [...activeCompanies, ...passiveCompanies];
  const isCompaniesLoading = isLoadingActive || isLoadingPassive;

  // Removed explicit invalidation on mount to prevent double network requests
  // React Query's refetchOnMount handles fresh data fetching automatically

  // Navigation handlers
  const handleAddCompany = () => {
    router.push('/companies/company-onboarding');
  };

  const handleViewArchive = () => {
    router.push('/companies/archive');
  };

  // Handle loading state with skeleton UI
  if (isCompaniesLoading && companies.length === 0) {
    return <CompaniesLoading />;
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

      {/* Action Buttons */}
      <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
        <Button 
          onClick={handleAddCompany}
          className="bg-black hover:bg-gray-800 w-full sm:w-auto py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white"
        >
          <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
          Add Company
        </Button>
        
        <Button 
          onClick={handleViewArchive}
          variant="outline"
          className="w-full sm:w-auto py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-medium"
        >
          <Archive className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
          View Archive
        </Button>
      </div>

      <ApiErrorBoundary onRetry={invalidateQueries}>
        <Suspense fallback={<CompaniesLoading />}>
          <SmartCompanyList
            activeCompanies={activeCompanies}
            passiveCompanies={passiveCompanies}
            isLoaded={!isCompaniesLoading}
            copiedFields={form.uiState.state.copiedFields}
            handleEdit={form.handleEdit}
            handleDelete={(id: number) => {
              if (confirm("Are you sure you want to delete this company?")) {
                crud.deleteCompany(id.toString());
              }
            }}
            handleArchive={(company) => crud.archiveCompany(company.id.toString())}
            copyToClipboard={form.copyToClipboard}
            handleWebsiteClick={form.handleWebsiteClick}
            // New separate pagination props
            hasMoreActive={hasMoreActive}
            hasMorePassive={hasMorePassive}
            loadMoreActive={loadMoreActive}
            loadMorePassive={loadMorePassive}
            isLoadingActive={isLoadingActive}
            isLoadingPassive={isLoadingPassive}
          />
        </Suspense>
      </ApiErrorBoundary>

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