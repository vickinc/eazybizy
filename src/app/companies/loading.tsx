import Building2 from "lucide-react/dist/esm/icons/building-2";
import { Card } from "@/components/ui/card";

export default function CompaniesLoading() {
  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
          <div className="h-12 sm:h-14 w-full sm:w-48 bg-gray-300 rounded animate-pulse" />
          <div className="h-12 sm:h-14 w-full sm:w-48 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Active Companies Section Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          
          {/* Company Cards Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
                    <div>
                      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Passive Companies Section Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <Card className="p-8 text-center">
            <div className="h-8 w-8 mx-auto bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 mx-auto bg-gray-200 rounded animate-pulse" />
          </Card>
        </div>
      </div>
    </div>
  );
}