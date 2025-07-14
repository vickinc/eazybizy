import React, { useMemo, useState, useCallback } from 'react';
import { Company } from '@/types/company.types';
import { CompanyList } from './CompanyList';
import { VirtualCompanyGrid } from './VirtualCompanyGrid';

interface SmartCompanyListProps {
  activeCompanies: Company[];
  passiveCompanies: Company[];
  isLoaded: boolean;
  copiedFields: { [key: string]: boolean };
  handleEdit: (company: Company) => void;
  handleDelete: (id: number) => void;
  handleArchive: (company: Company) => void;
  copyToClipboard: (text: string, fieldName: string, companyId: number) => Promise<void>;
  handleWebsiteClick: (website: string, e: React.MouseEvent) => void;
  hasNextPage?: boolean;
  loadMore?: () => void;
  isFetchingNextPage?: boolean;
  // Separate pagination props for Active and Passive companies
  hasMoreActive?: boolean;
  hasMorePassive?: boolean;
  loadMoreActive?: () => void;
  loadMorePassive?: () => void;
  isLoadingActive?: boolean;
  isLoadingPassive?: boolean;
}

// Threshold for switching to virtual rendering
const VIRTUAL_RENDERING_THRESHOLD = 200;

const SmartCompanyListComponent: React.FC<SmartCompanyListProps> = ({
  activeCompanies,
  passiveCompanies,
  isLoaded,
  copiedFields,
  handleEdit,
  handleDelete,
  handleArchive,
  copyToClipboard,
  handleWebsiteClick,
  hasNextPage = false,
  loadMore,
  isFetchingNextPage = false,
  hasMoreActive = false,
  hasMorePassive = false,
  loadMoreActive,
  loadMorePassive,
  isLoadingActive = false,
  isLoadingPassive = false
}) => {
  const totalCompanies = activeCompanies.length + passiveCompanies.length;
  const shouldUseVirtualRendering = totalCompanies > VIRTUAL_RENDERING_THRESHOLD;

  // Combine companies for virtual rendering with separator
  const allCompanies = useMemo(() => {
    const companies = [...activeCompanies];
    
    // Add separator if we have both active and passive companies
    if (activeCompanies.length > 0 && passiveCompanies.length > 0) {
      companies.push({
        id: 'separator-passive',
        isSeparator: true,
        title: 'Passive Companies'
      } as any);
    }
    
    companies.push(...passiveCompanies);
    return companies;
  }, [activeCompanies, passiveCompanies]);


  // Combined load more function for virtual rendering
  const handleVirtualLoadMore = useCallback(() => {
    // Load more active companies if available
    if (hasMoreActive && loadMoreActive) {
      loadMoreActive();
    }
    // Load more passive companies if available
    if (hasMorePassive && loadMorePassive) {
      loadMorePassive();
    }
  }, [hasMoreActive, hasMorePassive, loadMoreActive, loadMorePassive]);

  if (shouldUseVirtualRendering) {
    return (
      <div className="space-y-6">
        {/* Company Statistics Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-green-600">{activeCompanies.length}</span> Active Companies
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-500">{passiveCompanies.length}</span> Passive Companies
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{totalCompanies}</span> Total
            </div>
          </div>
        </div>

        {/* Virtual Grid */}
        <VirtualCompanyGrid
          companies={allCompanies}
          copiedFields={copiedFields}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          handleArchive={handleArchive}
          copyToClipboard={copyToClipboard}
          handleWebsiteClick={handleWebsiteClick}
          isLoading={!isLoaded}
          hasNextPage={hasMoreActive || hasMorePassive}
          loadMore={handleVirtualLoadMore}
          isFetchingNextPage={isLoadingActive || isLoadingPassive}
          height={800} // Taller for better UX with many companies
          viewMode="grid"
        />

        {/* Manual Load More Button */}
        {(hasMoreActive || hasMorePassive) && (
          <div className="flex justify-center mt-6">
            <button
              onClick={handleVirtualLoadMore}
              disabled={isLoadingActive || isLoadingPassive}
              className="px-6 py-3 bg-lime-300 text-black rounded-md hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoadingActive || isLoadingPassive ? 'Loading...' : 'Load More Companies'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Regular List with Separate Pagination */}
      <CompanyList
        activeCompanies={activeCompanies}
        passiveCompanies={passiveCompanies}
        isLoaded={isLoaded}
        copiedFields={copiedFields}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleArchive={handleArchive}
        copyToClipboard={copyToClipboard}
        handleWebsiteClick={handleWebsiteClick}
        hasMoreActive={hasMoreActive}
        hasMorePassive={hasMorePassive}
        loadMoreActive={loadMoreActive}
        loadMorePassive={loadMorePassive}
        isLoadingActive={isLoadingActive}
        isLoadingPassive={isLoadingPassive}
      />
    </div>
  );
};

// Custom comparison function for optimal React.memo performance
const arePropsEqual = (
  prevProps: SmartCompanyListProps,
  nextProps: SmartCompanyListProps
): boolean => {
  // Compare primitive props
  if (
    prevProps.isLoaded !== nextProps.isLoaded ||
    prevProps.hasNextPage !== nextProps.hasNextPage ||
    prevProps.isFetchingNextPage !== nextProps.isFetchingNextPage ||
    prevProps.hasMoreActive !== nextProps.hasMoreActive ||
    prevProps.hasMorePassive !== nextProps.hasMorePassive ||
    prevProps.isLoadingActive !== nextProps.isLoadingActive ||
    prevProps.isLoadingPassive !== nextProps.isLoadingPassive
  ) {
    return false;
  }

  // Compare function props (should be stable with useCallback)
  if (
    prevProps.handleEdit !== nextProps.handleEdit ||
    prevProps.handleDelete !== nextProps.handleDelete ||
    prevProps.handleArchive !== nextProps.handleArchive ||
    prevProps.copyToClipboard !== nextProps.copyToClipboard ||
    prevProps.handleWebsiteClick !== nextProps.handleWebsiteClick ||
    prevProps.loadMore !== nextProps.loadMore ||
    prevProps.loadMoreActive !== nextProps.loadMoreActive ||
    prevProps.loadMorePassive !== nextProps.loadMorePassive
  ) {
    return false;
  }

  // Deep compare arrays (most expensive check, do last)
  if (
    prevProps.activeCompanies.length !== nextProps.activeCompanies.length ||
    prevProps.passiveCompanies.length !== nextProps.passiveCompanies.length
  ) {
    return false;
  }

  // Compare company IDs for efficient array comparison
  for (let i = 0; i < prevProps.activeCompanies.length; i++) {
    if (prevProps.activeCompanies[i].id !== nextProps.activeCompanies[i].id) {
      return false;
    }
  }

  for (let i = 0; i < prevProps.passiveCompanies.length; i++) {
    if (prevProps.passiveCompanies[i].id !== nextProps.passiveCompanies[i].id) {
      return false;
    }
  }

  // Shallow compare copiedFields object
  const prevCopiedKeys = Object.keys(prevProps.copiedFields);
  const nextCopiedKeys = Object.keys(nextProps.copiedFields);
  
  if (prevCopiedKeys.length !== nextCopiedKeys.length) {
    return false;
  }

  for (const key of prevCopiedKeys) {
    if (prevProps.copiedFields[key] !== nextProps.copiedFields[key]) {
      return false;
    }
  }

  return true;
};

// Export memoized component with custom comparison
export const SmartCompanyList = React.memo(SmartCompanyListComponent, arePropsEqual);