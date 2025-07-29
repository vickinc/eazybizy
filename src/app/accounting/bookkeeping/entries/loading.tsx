import Receipt from "lucide-react/dist/esm/icons/receipt";
import { Card } from "@/components/ui/card";

function EntriesLoading() {
  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div>
              <div className="h-8 w-80 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="h-12 w-48 bg-gray-300 rounded animate-pulse" />
            <div className="h-12 w-40 bg-gray-300 rounded animate-pulse" />
          </div>
        </div>

        {/* Statistics Cards Skeleton */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
              </Card>
            ))}
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="mb-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Entries List Skeleton */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Entry Items Skeleton */}
            <div className="divide-y divide-gray-200">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-16 bg-blue-100 rounded animate-pulse" />
                          </div>
                          <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                        <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EntriesLoading;
export { EntriesLoading };