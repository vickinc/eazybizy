import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Search, Filter } from 'lucide-react';
import {
  FixedAssetFilter,
  AssetCategory,
  AssetStatus,
  DepreciationMethod,
  ASSET_CATEGORIES,
  ASSET_STATUSES,
  DEPRECIATION_METHODS
} from '@/types/fixedAssets.types';
import { cn } from '@/utils/cn';

interface FixedAssetFilterBarProps {
  filter: FixedAssetFilter;
  onFilterChange: (field: keyof FixedAssetFilter, value: any) => void;
  onClearFilters: () => void;
  className?: string;
  assetCount: number;
  totalCount: number;
}

export const FixedAssetFilterBar: React.FC<FixedAssetFilterBarProps> = ({
  filter,
  onFilterChange,
  onClearFilters,
  className,
  assetCount,
  totalCount
}) => {
  const hasActiveFilters = 
    filter.search ||
    filter.category !== 'all' ||
    filter.status !== 'all' ||
    filter.depreciationMethod !== 'all' ||
    filter.location ||
    filter.department ||
    filter.acquisitionDateRange.start ||
    filter.acquisitionDateRange.end ||
    filter.bookValueRange.min > 0 ||
    filter.bookValueRange.max < Number.MAX_VALUE;

  const formatStatus = (status: string): string => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDepreciationMethod = (method: string): string => {
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by code, name, description, location..."
                  value={filter.search}
                  onChange={(e) => onFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filter.category}
                onValueChange={(value) => onFilterChange('category', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {ASSET_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filter.status}
                onValueChange={(value) => onFilterChange('status', value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {ASSET_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters - Collapsible */}
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                <Filter className="h-4 w-4" />
                <span>Advanced Filters</span>
                <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
              </div>
            </summary>
            
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Depreciation Method */}
                <div className="space-y-2">
                  <Label htmlFor="depreciationMethod">Depreciation Method</Label>
                  <Select
                    value={filter.depreciationMethod}
                    onValueChange={(value) => onFilterChange('depreciationMethod', value)}
                  >
                    <SelectTrigger id="depreciationMethod">
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {DEPRECIATION_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {formatDepreciationMethod(method)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="Filter by location"
                    value={filter.location}
                    onChange={(e) => onFilterChange('location', e.target.value)}
                  />
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    type="text"
                    placeholder="Filter by department"
                    value={filter.department}
                    onChange={(e) => onFilterChange('department', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Acquisition Date Range */}
                <div className="space-y-2">
                  <Label>Acquisition Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="From"
                      value={filter.acquisitionDateRange.start}
                      onChange={(e) => onFilterChange('acquisitionDateRange', {
                        ...filter.acquisitionDateRange,
                        start: e.target.value
                      })}
                    />
                    <Input
                      type="date"
                      placeholder="To"
                      value={filter.acquisitionDateRange.end}
                      onChange={(e) => onFilterChange('acquisitionDateRange', {
                        ...filter.acquisitionDateRange,
                        end: e.target.value
                      })}
                    />
                  </div>
                </div>

                {/* Book Value Range */}
                <div className="space-y-2">
                  <Label>Book Value Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filter.bookValueRange.min || ''}
                      onChange={(e) => onFilterChange('bookValueRange', {
                        ...filter.bookValueRange,
                        min: parseFloat(e.target.value) || 0
                      })}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filter.bookValueRange.max === Number.MAX_VALUE ? '' : filter.bookValueRange.max}
                      onChange={(e) => onFilterChange('bookValueRange', {
                        ...filter.bookValueRange,
                        max: parseFloat(e.target.value) || Number.MAX_VALUE
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </details>

          {/* Filter Summary and Actions */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Showing {assetCount} of {totalCount} assets
                </span>
                {filter.search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {filter.search}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => onFilterChange('search', '')}
                    />
                  </Badge>
                )}
                {filter.category !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {filter.category}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => onFilterChange('category', 'all')}
                    />
                  </Badge>
                )}
                {filter.status !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {formatStatus(filter.status)}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => onFilterChange('status', 'all')}
                    />
                  </Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};