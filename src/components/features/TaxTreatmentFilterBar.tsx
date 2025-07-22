import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Search from "lucide-react/dist/esm/icons/search";
import Filter from "lucide-react/dist/esm/icons/filter";
import X from "lucide-react/dist/esm/icons/x";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import {
  TaxTreatmentFilter,
  TAX_CATEGORIES,
  TAX_APPLICABILITIES,
  TaxCategory,
  TaxApplicability
} from '@/types/taxTreatment.types';
import { cn } from '@/utils/cn';

interface TaxTreatmentFilterBarProps {
  filter: TaxTreatmentFilter;
  onFilterChange: (field: keyof TaxTreatmentFilter, value: unknown) => void;
  onClearFilters: () => void;
  className?: string;
  treatmentCount?: number;
  totalCount?: number;
}

export const TaxTreatmentFilterBar: React.FC<TaxTreatmentFilterBarProps> = ({
  filter,
  onFilterChange,
  onClearFilters,
  className,
  treatmentCount,
  totalCount
}) => {
  const hasActiveFilters = () => {
    return (
      filter.search.trim() !== '' ||
      filter.category !== 'all' ||
      filter.isActive !== 'all' ||
      filter.applicability !== 'all' ||
      filter.rateRange.min !== 0 ||
      filter.rateRange.max !== 100
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filter.search.trim() !== '') count++;
    if (filter.category !== 'all') count++;
    if (filter.isActive !== 'all') count++;
    if (filter.applicability !== 'all') count++;
    if (filter.rateRange.min !== 0 || filter.rateRange.max !== 100) count++;
    return count;
  };

  const formatCategoryLabel = (category: TaxCategory | 'all') => {
    if (category === 'all') return 'All Categories';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatApplicabilityLabel = (applicability: TaxApplicability | 'all') => {
    if (applicability === 'all') return 'All Types';
    return applicability.charAt(0).toUpperCase() + applicability.slice(1);
  };

  const formatStatusLabel = (status: boolean | 'all') => {
    if (status === 'all') return 'All Status';
    return status ? 'Active Only' : 'Inactive Only';
  };

  return (
    <Card className={cn("border-gray-200", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with filter icon and results count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter Tax Treatments</span>
              {hasActiveFilters() && (
                <Badge variant="secondary" className="text-xs">
                  {getActiveFilterCount()} active filter{getActiveFilterCount() !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {/* Results count */}
            {treatmentCount !== undefined && totalCount !== undefined && (
              <div className="text-sm text-gray-500">
                Showing {treatmentCount} of {totalCount} treatments
              </div>
            )}
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-xs font-medium text-gray-700">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search treatments..."
                  className="pl-9 h-8 text-xs"
                  value={filter.search}
                  onChange={(e) => onFilterChange('search', e.target.value)}
                />
                {filter.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-6 w-6 p-0 -translate-y-1/2 hover:bg-gray-100"
                    onClick={() => onFilterChange('search', '')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Category</Label>
              <Select
                value={filter.category}
                onValueChange={(value) => onFilterChange('category', value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    All Categories
                  </SelectItem>
                  {TAX_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category} className="text-xs capitalize">
                      {formatCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Status</Label>
              <Select
                value={filter.isActive.toString()}
                onValueChange={(value) => 
                  onFilterChange('isActive', value === 'all' ? 'all' : value === 'true')
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Status</SelectItem>
                  <SelectItem value="true" className="text-xs">Active Only</SelectItem>
                  <SelectItem value="false" className="text-xs">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Applicability */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Applicability</Label>
              <Select
                value={filter.applicability}
                onValueChange={(value) => onFilterChange('applicability', value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Types</SelectItem>
                  {TAX_APPLICABILITIES.map((applicability) => (
                    <SelectItem key={applicability} value={applicability} className="text-xs capitalize">
                      {formatApplicabilityLabel(applicability)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rate Range */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-700">Tax Rate Range</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Min"
                  className="h-8 text-xs w-16"
                  value={filter.rateRange.min}
                  onChange={(e) => 
                    onFilterChange('rateRange', {
                      ...filter.rateRange,
                      min: parseFloat(e.target.value) || 0
                    })
                  }
                />
                <span className="text-xs text-gray-400">-</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Max"
                  className="h-8 text-xs w-16"
                  value={filter.rateRange.max}
                  onChange={(e) => 
                    onFilterChange('rateRange', {
                      ...filter.rateRange,
                      max: parseFloat(e.target.value) || 100
                    })
                  }
                />
                <span className="text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>

          {/* Active filters display and clear button */}
          {hasActiveFilters() && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Active filters:</span>
                
                {filter.search && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    Search: "{filter.search}"
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 hover:bg-transparent"
                      onClick={() => onFilterChange('search', '')}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}

                {filter.category !== 'all' && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    Category: {formatCategoryLabel(filter.category as TaxCategory)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 hover:bg-transparent"
                      onClick={() => onFilterChange('category', 'all')}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}

                {filter.isActive !== 'all' && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    Status: {formatStatusLabel(filter.isActive)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 hover:bg-transparent"
                      onClick={() => onFilterChange('isActive', 'all')}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}

                {filter.applicability !== 'all' && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    Type: {formatApplicabilityLabel(filter.applicability as TaxApplicability)}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 hover:bg-transparent"
                      onClick={() => onFilterChange('applicability', 'all')}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}

                {(filter.rateRange.min !== 0 || filter.rateRange.max !== 100) && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    Rate: {filter.rateRange.min}%-{filter.rateRange.max}%
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 hover:bg-transparent"
                      onClick={() => onFilterChange('rateRange', { min: 0, max: 100 })}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="h-7 text-xs flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Clear All
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};