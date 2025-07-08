/**
 * Pagination and Progressive Loading Components
 * 
 * Advanced pagination system with progressive loading, infinite scroll,
 * and intelligent data fetching strategies for optimal performance.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, Loader2, Eye, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/utils/cn';

/**
 * Basic Pagination Component
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  className?: string;
  disabled?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 7,
  className,
  disabled = false
}) => {
  const getVisiblePages = useMemo(() => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination logic
      const leftSide = Math.floor(maxVisiblePages / 2);
      const rightSide = maxVisiblePages - leftSide - 1;
      
      if (currentPage <= leftSide + 1) {
        // Near the beginning
        for (let i = 1; i <= maxVisiblePages - 2; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - rightSide) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - maxVisiblePages + 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - leftSide + 1; i <= currentPage + rightSide - 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  return (
    <div className={cn('flex items-center justify-center space-x-1', className)}>
      {showFirstLast && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={disabled || currentPage === 1}
          className="hidden sm:inline-flex"
        >
          First
        </Button>
      )}
      
      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>
      )}

      {getVisiblePages.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="px-3 py-2 text-gray-500">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <Button
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              disabled={disabled}
              className={cn(
                'min-w-[2.5rem]',
                currentPage === page && 'bg-blue-600 text-white'
              )}
            >
              {page}
            </Button>
          )}
        </React.Fragment>
      ))}

      {showPrevNext && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {showFirstLast && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || currentPage === totalPages}
          className="hidden sm:inline-flex"
        >
          Last
        </Button>
      )}
    </div>
  );
};

/**
 * Advanced Pagination with Page Size Control
 */
interface AdvancedPaginationProps extends PaginationProps {
  pageSize: number;
  totalItems: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  showPageInfo?: boolean;
  showItemRange?: boolean;
}

export const AdvancedPagination: React.FC<AdvancedPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageInfo = true,
  showItemRange = true,
  className,
  disabled = false,
  ...paginationProps
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0', className)}>
      <div className="flex items-center space-x-4">
        {/* Page Size Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
            disabled={disabled}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-700">per page</span>
        </div>

        {/* Item Range Info */}
        {showItemRange && (
          <div className="text-sm text-gray-700">
            Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {totalItems.toLocaleString()} items
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Page Info */}
        {showPageInfo && (
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
        )}

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          disabled={disabled}
          {...paginationProps}
        />
      </div>
    </div>
  );
};

/**
 * Infinite Scroll Component
 */
interface InfiniteScrollProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  loading?: boolean;
  threshold?: number;
  className?: string;
  loadingComponent?: React.ReactNode;
  endMessage?: React.ReactNode;
  itemHeight?: number;
}

export function InfiniteScroll<T>({
  items,
  renderItem,
  hasMore,
  loadMore,
  loading = false,
  threshold = 100,
  className,
  loadingComponent,
  endMessage,
  itemHeight
}: InfiniteScrollProps<T>) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(async () => {
    if (!containerRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const nearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

    if (nearBottom) {
      setIsLoadingMore(true);
      try {
        await loadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isLoadingMore, loadMore, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div 
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: itemHeight ? `${itemHeight * 10}px` : '400px' }}
    >
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {(loading || isLoadingMore) && (
        <div className="flex justify-center py-4">
          {loadingComponent || (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-600">Loading more...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && !loading && endMessage && (
        <div className="flex justify-center py-4 text-gray-500 text-sm">
          {endMessage}
        </div>
      )}
    </div>
  );
}

/**
 * Progressive Loading Component
 */
interface ProgressiveLoadingProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemsPerPage?: number;
  loadingDelay?: number;
  className?: string;
  showProgress?: boolean;
}

export function ProgressiveLoading<T>({
  data,
  renderItem,
  itemsPerPage = 20,
  loadingDelay = 100,
  className,
  showProgress = true
}: ProgressiveLoadingProps<T>) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadNextBatch = useCallback(async () => {
    if (currentIndex >= data.length || isLoading) return;

    setIsLoading(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, loadingDelay));
    
    const nextBatch = data.slice(currentIndex, currentIndex + itemsPerPage);
    setVisibleItems(prev => [...prev, ...nextBatch]);
    setCurrentIndex(prev => prev + itemsPerPage);
    setIsLoading(false);
  }, [data, currentIndex, itemsPerPage, loadingDelay, isLoading]);

  // Load initial batch
  useEffect(() => {
    if (data.length > 0 && visibleItems.length === 0) {
      loadNextBatch();
    }
  }, [data, visibleItems.length, loadNextBatch]);

  const progress = data.length > 0 ? (visibleItems.length / data.length) * 100 : 0;
  const hasMore = currentIndex < data.length;

  return (
    <div className={cn('space-y-4', className)}>
      {showProgress && data.length > itemsPerPage && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Loading progress</span>
            <span>{Math.round(progress)}% ({visibleItems.length} of {data.length})</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {visibleItems.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={loadNextBatch}
            disabled={isLoading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Load More ({Math.min(itemsPerPage, data.length - currentIndex)} items)</span>
              </>
            )}
          </Button>
        </div>
      )}

      {!hasMore && visibleItems.length > 0 && (
        <div className="text-center text-gray-500 text-sm py-4">
          All items loaded ({visibleItems.length} total)
        </div>
      )}
    </div>
  );
}

/**
 * Data View Toggle Component
 */
interface DataViewToggleProps {
  view: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
  className?: string;
}

export const DataViewToggle: React.FC<DataViewToggleProps> = ({
  view,
  onViewChange,
  className
}) => (
  <div className={cn('flex items-center space-x-1 bg-gray-100 rounded-lg p-1', className)}>
    <Button
      variant={view === 'list' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onViewChange('list')}
      className={cn(
        'px-3 py-1',
        view === 'list' && 'bg-white shadow-sm'
      )}
    >
      <List className="h-4 w-4" />
      <span className="hidden sm:inline ml-1">List</span>
    </Button>
    <Button
      variant={view === 'grid' ? 'default' : 'ghost'}
      size="sm"
      onClick={() => onViewChange('grid')}
      className={cn(
        'px-3 py-1',
        view === 'grid' && 'bg-white shadow-sm'
      )}
    >
      <Grid className="h-4 w-4" />
      <span className="hidden sm:inline ml-1">Grid</span>
    </Button>
  </div>
);

/**
 * Smart Pagination Hook
 */
interface UseSmartPaginationOptions {
  totalItems: number;
  defaultPageSize?: number;
  maxPageSize?: number;
}

export function useSmartPagination({
  totalItems,
  defaultPageSize = 25,
  maxPageSize = 100
}: UseSmartPaginationOptions) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const changePageSize = useCallback((newSize: number) => {
    const clampedSize = Math.max(1, Math.min(newSize, maxPageSize));
    setPageSize(clampedSize);
    
    // Adjust current page to maintain position
    const currentFirstItem = (currentPage - 1) * pageSize + 1;
    const newPage = Math.ceil(currentFirstItem / clampedSize);
    setCurrentPage(newPage);
  }, [currentPage, pageSize, maxPageSize]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const reset = useCallback(() => {
    setCurrentPage(1);
    setPageSize(defaultPageSize);
  }, [defaultPageSize]);

  return {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    reset,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
}

export default {
  Pagination,
  AdvancedPagination,
  InfiniteScroll,
  ProgressiveLoading,
  DataViewToggle,
  useSmartPagination
};