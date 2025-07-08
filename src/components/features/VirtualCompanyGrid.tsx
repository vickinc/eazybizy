import React, { useMemo, useCallback } from 'react';
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { VirtualGrid, InfiniteVirtualList } from "@/components/ui/virtual-scroll";
import { Company } from '@/types/company.types';
import { CompanyCard } from './CompanyCard';
import { cn } from '@/utils/cn';

interface VirtualCompanyGridProps {
  companies: Company[];
  copiedFields: { [key: string]: boolean };
  handleEdit: (company: Company) => void;
  handleDelete: (id: number) => void;
  copyToClipboard: (text: string, fieldName: string, companyId: number) => Promise<void>;
  handleWebsiteClick: (website: string, e: React.MouseEvent) => void;
  isLoading: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
  isFetchingNextPage: boolean;
  height?: number;
  className?: string;
  viewMode?: 'grid' | 'list';
}

export const VirtualCompanyGrid: React.FC<VirtualCompanyGridProps> = ({
  companies,
  copiedFields,
  handleEdit,
  handleDelete,
  copyToClipboard,
  handleWebsiteClick,
  isLoading,
  hasNextPage,
  loadMore,
  isFetchingNextPage,
  height = 600,
  className,
  viewMode = 'grid'
}) => {
  // Calculate grid dimensions based on viewport
  const gridDimensions = useMemo(() => {
    if (viewMode === 'list') {
      return {
        columnCount: 1,
        columnWidth: '100%',
        rowHeight: 120, // Compact row height for list view
        itemHeight: 120
      };
    }

    // Grid view - responsive columns
    const minCardWidth = 320; // Minimum card width
    const gap = 24; // Gap between cards
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth - 100 : 1200;
    const availableWidth = containerWidth - 64; // Subtract padding
    
    const columnsCanFit = Math.floor((availableWidth + gap) / (minCardWidth + gap));
    const columnCount = Math.max(1, Math.min(4, columnsCanFit)); // 1-4 columns max
    const columnWidth = (availableWidth - (gap * (columnCount - 1))) / columnCount;
    
    return {
      columnCount,
      columnWidth,
      rowHeight: 280, // Standard card height
      itemHeight: 280
    };
  }, [viewMode]);

  // Render function for grid view
  const renderGridCell = useCallback((
    company: Company, 
    rowIndex: number, 
    columnIndex: number, 
    style: React.CSSProperties
  ) => {
    if (!company) return null;
    
    return (
      <div 
        style={{
          ...style,
          padding: '12px', // Add padding around each card
          boxSizing: 'border-box'
        }}
      >
        <CompanyCard
          company={company}
          copiedFields={copiedFields}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          copyToClipboard={copyToClipboard}
          handleWebsiteClick={handleWebsiteClick}
          isPassive={company.status === 'Passive'}
        />
      </div>
    );
  }, [companies, copiedFields, handleEdit, handleDelete, copyToClipboard, handleWebsiteClick]);

  // Render function for list view
  const renderListItem = useCallback((
    company: Company,
    index: number,
    style: React.CSSProperties
  ) => {
    if (!company) return null;

    return (
      <div 
        style={{
          ...style,
          padding: '8px 16px',
          boxSizing: 'border-box'
        }}
      >
        <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          {/* Company Logo/Initials */}
          <div className="flex-shrink-0">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {company.logo && company.logo.startsWith('http') ? (
                <img 
                  src={company.logo} 
                  alt={`${company.tradingName} logo`} 
                  className="h-8 w-8 object-cover rounded"
                />
              ) : (
                <span className="text-blue-600 font-bold text-lg">
                  {company.tradingName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Company Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {company.tradingName}
              </h3>
              <span className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                company.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              )}>
                {company.status}
              </span>
            </div>
            <p className="text-xs text-gray-600 truncate mt-1">
              {company.legalName}
            </p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-gray-500">{company.industry}</span>
              <span className="text-xs text-gray-500">{company.email}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex-shrink-0 flex items-center space-x-2">
            <button
              onClick={() => handleEdit(company)}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Edit company"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }, [companies, copiedFields, handleEdit, handleDelete, copyToClipboard, handleWebsiteClick]);

  // Handle infinite loading
  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number) => {
    if (hasNextPage && !isFetchingNextPage) {
      loadMore();
    }
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  // Loading component
  const loadingComponent = (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-32 rounded-lg"></div>
        </div>
      ))}
    </div>
  );

  // Empty state
  const emptyComponent = (
    <Card className="p-12 text-center">
      <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
      <p className="text-gray-600 mb-6">Get started by adding your first company to the platform.</p>
    </Card>
  );

  if (isLoading && companies.length === 0) {
    return (
      <div className={cn('virtual-company-grid', className)}>
        {loadingComponent}
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className={cn('virtual-company-grid', className)}>
        {emptyComponent}
      </div>
    );
  }

  // For large datasets, use virtual scrolling
  if (companies.length > 100) {
    if (viewMode === 'list') {
      // Use InfiniteVirtualList for list view
      return (
        <div className={cn('virtual-company-grid', className)}>
          <InfiniteVirtualList
            items={companies}
            itemHeight={gridDimensions.itemHeight}
            renderItem={renderListItem}
            hasNextPage={hasNextPage}
            loadMoreItems={loadMoreItems}
            isLoading={isFetchingNextPage}
            height={height}
            loadingComponent={<div className="p-4 text-center">Loading more companies...</div>}
          />
        </div>
      );
    } else {
      // Use VirtualGrid for grid view
      return (
        <div className={cn('virtual-company-grid', className)}>
          <VirtualGrid
            items={companies}
            columnCount={gridDimensions.columnCount}
            rowHeight={gridDimensions.rowHeight}
            columnWidth={gridDimensions.columnWidth}
            renderCell={renderGridCell}
            height={height}
          />
          
          {/* Manual load more button for grid view */}
          {hasNextPage && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={isFetchingNextPage}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More Companies'}
              </button>
            </div>
          )}
        </div>
      );
    }
  }

  // For smaller datasets, use regular grid for better UX
  return (
    <div className={cn('virtual-company-grid', className)}>
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {companies.map((company) => (
            <div key={company.id}>
              {renderListItem(company, 0, {})}
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(
          'grid gap-6',
          gridDimensions.columnCount === 1 && 'grid-cols-1',
          gridDimensions.columnCount === 2 && 'grid-cols-1 lg:grid-cols-2',
          gridDimensions.columnCount === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          gridDimensions.columnCount === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        )}>
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              copiedFields={copiedFields}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              copyToClipboard={copyToClipboard}
              handleWebsiteClick={handleWebsiteClick}
              isPassive={company.status === 'Passive'}
            />
          ))}
        </div>
      )}
      
      {/* Load more button for non-virtual view */}
      {hasNextPage && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={isFetchingNextPage}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load More Companies'}
          </button>
        </div>
      )}
    </div>
  );
};

export default VirtualCompanyGrid;