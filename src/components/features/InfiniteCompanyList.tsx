import React, { useMemo, useState, useCallback } from 'react';
import Building2 from "lucide-react/dist/esm/icons/building-2";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company } from '@/types/company.types';
import { CompanyCard } from './CompanyCard';

interface InfiniteCompanyListProps {
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
}

// Configuration for sliding window
const WINDOW_SIZE = 30; // Number of companies to keep in DOM
const BUFFER_SIZE = 10; // Buffer before/after visible window

export const InfiniteCompanyList: React.FC<InfiniteCompanyListProps> = ({
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
  isFetchingNextPage = false
}) => {
  const [windowStart, setWindowStart] = useState(0);
  
  // Combine all companies
  const allCompanies = useMemo(() => [
    ...activeCompanies,
    ...passiveCompanies
  ], [activeCompanies, passiveCompanies]);

  const totalCompanies = allCompanies.length;
  
  // Calculate visible window
  const windowEnd = Math.min(windowStart + WINDOW_SIZE, totalCompanies);
  const visibleCompanies = allCompanies.slice(windowStart, windowEnd);
  
  // Navigation handlers
  const goToNext = useCallback(() => {
    const nextStart = Math.min(windowStart + WINDOW_SIZE, totalCompanies - WINDOW_SIZE);
    setWindowStart(Math.max(0, nextStart));
  }, [windowStart, totalCompanies]);
  
  const goToPrevious = useCallback(() => {
    const prevStart = Math.max(0, windowStart - WINDOW_SIZE);
    setWindowStart(prevStart);
  }, [windowStart]);
  
  const goToStart = useCallback(() => {
    setWindowStart(0);
  }, []);
  
  const goToEnd = useCallback(() => {
    const endStart = Math.max(0, totalCompanies - WINDOW_SIZE);
    setWindowStart(endStart);
  }, [totalCompanies]);

  // Calculate pagination info
  const currentPage = Math.floor(windowStart / WINDOW_SIZE) + 1;
  const totalPages = Math.ceil(totalCompanies / WINDOW_SIZE);
  const canGoPrevious = windowStart > 0;
  const canGoNext = windowEnd < totalCompanies;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading companies...</div>
      </div>
    );
  }

  if (totalCompanies === 0) {
    return (
      <Card className="p-8 text-center">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
        <p className="text-gray-500">Get started by adding your first company.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance and Navigation Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-green-700">
              <strong>Infinite List Mode:</strong> Showing {visibleCompanies.length} of {totalCompanies} companies 
              (Page {currentPage} of {totalPages})
            </p>
          </div>
          <div className="text-xs text-green-600">
            DOM optimized: Only {WINDOW_SIZE} companies rendered
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToStart}
              disabled={!canGoPrevious}
            >
              ⏮ First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              disabled={!canGoPrevious}
            >
              ← Previous
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            Companies {windowStart + 1} - {windowEnd} of {totalCompanies}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={!canGoNext}
            >
              Next →
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToEnd}
              disabled={!canGoNext}
            >
              Last ⏭
            </Button>
          </div>
        </div>
      )}

      {/* Company Grid - Only visible companies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {visibleCompanies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            copiedFields={copiedFields}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onArchive={handleArchive}
            copyToClipboard={copyToClipboard}
            onWebsiteClick={handleWebsiteClick}
          />
        ))}
      </div>

      {/* Load More from API */}
      {hasNextPage && loadMore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={loadMore}
            disabled={isFetchingNextPage}
            size="lg"
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More from Server'}
          </Button>
        </div>
      )}

      {/* Bottom Navigation (if needed) */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Page {currentPage} of {totalPages}</span>
            {totalPages > 5 && (
              <span className="text-xs">• Use navigation controls above to jump to specific pages</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};