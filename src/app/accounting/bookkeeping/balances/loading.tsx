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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow border p-4 sm:p-6">
              <div className="flex items-center mb-2">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="mb-6 bg-white rounded-lg shadow border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-18 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-20" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Balance List */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b border-gray-200">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="text-center">
                      <Skeleton className="h-4 w-20 mx-auto mb-2" />
                      <Skeleton className="h-5 w-16 mx-auto" />
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <Skeleton className="h-8 w-32" />
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