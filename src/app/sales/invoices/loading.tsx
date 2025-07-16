import React from 'react';
import { 
  StatsCardSkeleton, 
  InvoiceCardSkeleton 
} from '@/components/ui/loading-states';

export default function InvoicesLoading() {
  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-blue-600 rounded animate-pulse" />
            </div>
            <div>
              <div className="h-6 sm:h-8 lg:h-10 w-32 sm:w-40 lg:w-48 bg-gray-300 rounded animate-pulse mb-2" />
              <div className="h-4 sm:h-5 w-48 sm:w-56 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Create Invoice Button */}
        <div className="mb-8">
          <div className="h-12 sm:h-14 w-40 sm:w-48 bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Filter Bar */}
        <div className="mb-6 bg-white rounded-lg shadow border p-4">
          <div className="flex flex-wrap gap-4">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Invoice List */}
        <div className="space-y-4">
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
        </div>
      </div>
    </div>
  );
}