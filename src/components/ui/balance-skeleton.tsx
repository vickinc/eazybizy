import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton for balance statistics cards
export const BalanceStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Skeleton for individual balance list item
export const BalanceListItemSkeleton: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-6 w-16 mx-auto" />
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton for group header
export const BalanceGroupHeaderSkeleton: React.FC = () => {
  return (
    <div className="mb-2 border border-gray-200 rounded-lg">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-6 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for entire balance list
export const BalanceListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Header card skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
      </Card>

      {/* Group headers and items */}
      {[1, 2].map((groupIndex) => (
        <div key={groupIndex}>
          <BalanceGroupHeaderSkeleton />
          <div className="ml-4 space-y-4">
            {[1, 2].map((itemIndex) => (
              <BalanceListItemSkeleton key={itemIndex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton for filter bar
export const BalanceFilterSkeleton: React.FC = () => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-8 w-20" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Complete balance page skeleton
export const BalancePageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>

        {/* Stats skeleton */}
        <BalanceStatsSkeleton />

        {/* Filter skeleton */}
        <BalanceFilterSkeleton />

        {/* Results summary skeleton */}
        <div className="mb-4">
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Balance list skeleton */}
        <BalanceListSkeleton />
      </div>
    </div>
  );
};

// Compact skeleton for refresh/updates (shows header but skeletons for content)
export const BalanceRefreshSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <BalanceStatsSkeleton />
      <div className="mb-4">
        <Skeleton className="h-4 w-32" />
      </div>
      <BalanceListSkeleton />
    </div>
  );
};