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
const VIRTUAL_RENDERING_THRESHOLD = 50;

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

  // Combine companies for virtual rendering
  const allCompanies = useMemo(() => [
    ...activeCompanies,
    ...passiveCompanies
  ], [activeCompanies, passiveCompanies]);

  // Show performance notice when approaching threshold
  const showPerformanceNotice = totalCompanies > VIRTUAL_RENDERING_THRESHOLD * 0.8 && !shouldUseVirtualRendering;

  if (shouldUseVirtualRendering) {
    return (
      <div className="space-y-6">
        {/* Performance notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-blue-700">
              <strong>Virtual Rendering Active:</strong> Displaying {totalCompanies} companies efficiently using virtual scrolling to maintain performance.
            </p>
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
          hasNextPage={hasNextPage}
          loadMore={loadMore || (() => {})}
          isFetchingNextPage={isFetchingNextPage}
          height={800} // Taller for better UX with many companies
          viewMode="grid"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance warning when approaching threshold */}
      {showPerformanceNotice && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <p className="text-sm text-amber-700">
              <strong>Performance Notice:</strong> You have {totalCompanies} companies loaded. 
              At {VIRTUAL_RENDERING_THRESHOLD}+ companies, we'll automatically switch to virtual scrolling for better performance.
            </p>
          </div>
        </div>
      )}

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