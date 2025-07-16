import React, { useState, useMemo, useCallback, startTransition } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, QrCode, Building2 } from "lucide-react";
import { BusinessCard } from './BusinessCard';
import { BusinessCardSkeleton } from '@/components/ui/loading-states';
import { FormattedBusinessCard } from "@/types/businessCards.types";
import { Company } from '@/types';

interface TemplateStyles {
  background?: string;
  color?: string;
  border?: string;
  textColor: string;
}

interface InfiniteBusinessCardListProps {
  businessCards: FormattedBusinessCard[];
  companies: Company[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  handleShareCard: (card: FormattedBusinessCard) => void;
  handleDownloadCard: (card: FormattedBusinessCard) => void;
  handleDelete: (cardId: string) => void;
  getTemplateStyles: (template: "modern" | "classic" | "minimal" | "eazy" | "bizy") => TemplateStyles;
  setHoveredButton: (buttonId: string | null) => void;
  initialDisplay?: number; // Initial number of cards to display
  loadMoreSize?: number; // Number of cards to load on "Load More"
  showSkeleton?: boolean; // Show skeleton loading state
}

export const InfiniteBusinessCardList: React.FC<InfiniteBusinessCardListProps> = ({
  businessCards,
  companies,
  hasMore,
  isLoadingMore,
  loadMore,
  handleShareCard,
  handleDownloadCard,
  handleDelete,
  getTemplateStyles,
  setHoveredButton,
  initialDisplay = 20, // Show 20 cards initially
  loadMoreSize = 20, // Load 20 more cards each time
  showSkeleton = false // Show skeleton loading state
}) => {
  const [displayLimit, setDisplayLimit] = useState(initialDisplay);

  // Get cards to display based on current limit
  const displayedCards = useMemo(() => {
    return businessCards.slice(0, displayLimit);
  }, [businessCards, displayLimit]);
  
  // Memoize expensive calculations
  const { hasMoreLocal, remainingCount, totalCount } = useMemo(() => ({
    hasMoreLocal: displayLimit < businessCards.length,
    remainingCount: businessCards.length - displayLimit,
    totalCount: businessCards.length
  }), [displayLimit, businessCards.length]);

  // Load more cards with transition for smooth UI
  const handleLoadMoreLocal = useCallback(() => {
    if (hasMoreLocal) {
      // Load more from current data
      startTransition(() => {
        setDisplayLimit(prev => prev + loadMoreSize);
      });
    } else if (hasMore && !isLoadingMore) {
      // Load more from server
      loadMore();
    }
  }, [hasMoreLocal, hasMore, isLoadingMore, loadMore, loadMoreSize]);

  // Reset display limit when businessCards change (new filter/company)
  React.useEffect(() => {
    startTransition(() => {
      setDisplayLimit(initialDisplay);
    });
  }, [businessCards.length, initialDisplay]);

  const showLoadMoreButton = hasMoreLocal || (hasMore && !isLoadingMore);

  // Show skeleton loading state
  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 place-items-start">
          {[...Array(3)].map((_, index) => (
            <BusinessCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <>
        {companies.length > 0 ? (
          <div className="text-center py-16">
            <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Business Cards Yet</h3>
            <p className="text-gray-600 mb-6">Create professional business cards for your companies with QR codes and custom details.</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Companies</h3>
            <p className="text-gray-600 mb-6">You need to add active companies first before creating business cards.</p>
            <Button variant="outline">Go to Companies</Button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 place-items-start">
        {displayedCards.map((card) => (
          <BusinessCard 
            key={card.id} 
            card={card}
            handleShareCard={handleShareCard}
            handleDownloadCard={handleDownloadCard}
            handleDelete={handleDelete}
            getTemplateStyles={getTemplateStyles}
            setHoveredButton={setHoveredButton}
          />
        ))}
      </div>

      {/* Load More Button */}
      {showLoadMoreButton && (
        <div className="flex flex-col items-center justify-center py-6">
          <p className="text-sm text-gray-600 mb-4">
            Showing {displayedCards.length} of {totalCount} business cards
            {(hasMoreLocal ? remainingCount : 0) > 0 && ` (${hasMoreLocal ? remainingCount : 'more'} available)`}
          </p>
          <button
            onClick={handleLoadMoreLocal}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-4 py-2 bg-lime-300 text-black rounded-md hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <ChevronDown className="h-4 w-4" />
            {isLoadingMore ? 'Loading...' : hasMoreLocal ? 
              `Load More (${Math.min(loadMoreSize, remainingCount)} cards)` : 
              'Load More Cards'
            }
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="text-center py-4">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading more business cards...
          </div>
        </div>
      )}

      {/* Summary when all cards are loaded */}
      {!hasMore && !hasMoreLocal && totalCount > initialDisplay && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            All {totalCount} business cards loaded
          </p>
        </div>
      )}
    </div>
  );
};