import { Skeleton } from '@/components/ui/loading-states';
import { Landmark } from 'lucide-react';

export default function BalancesLoading() {
  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Landmark className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="mb-8">
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow border p-4 sm:p-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Filter Bar - Simplified */}
        <div className="mb-6 bg-white rounded-lg shadow border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Balance List - Simplified */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b border-gray-200">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="divide-y divide-gray-200">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}