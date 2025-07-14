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

export const SmartCompanyList: React.FC<SmartCompanyListProps> = ({
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