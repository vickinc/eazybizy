import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import {
  VATTreatmentFilter,
  VAT_CATEGORIES,
  VAT_APPLICABILITIES,
  VATCategory,
  VATApplicability
} from '@/types/vatTreatment.types';
import { cn } from '@/utils/cn';

interface VATTreatmentFilterBarProps {
  filter: VATTreatmentFilter;
  onFilterChange: (field: keyof VATTreatmentFilter, value: any) => void;
  onClearFilters: () => void;
  className?: string;
  treatmentCount?: number;
  totalCount?: number;
}

export const VATTreatmentFilterBar: React.FC<VATTreatmentFilterBarProps> = ({
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

  const formatCategoryLabel = (category: VATCategory | 'all') => {
    if (category === 'all') return 'All Categories';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatApplicabilityLabel = (applicability: VATApplicability | 'all') => {
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
              <span className="text-sm font-medium text-gray-700">Filter VAT Treatments</span>
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
            <div className="lg:col-span-2">
              <Label htmlFor="search" className="text-xs font-medium text-gray-600">
                Search
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name, code, or description..."
                  value={filter.search}
                  onChange={(e) => onFilterChange('search', e.target.value)}
                  className="pl-9 text-sm"
                />
                {filter.search && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => onFilterChange('search', '')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <Label className="text-xs font-medium text-gray-600">
                Category
              </Label>
              <Select
                value={filter.category}
                onValueChange={(value) => onFilterChange('category', value)}
              >
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {VAT_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {formatCategoryLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Applicability Filter */}
            <div>
              <Label className="text-xs font-medium text-gray-600">
                Applicability
              </Label>
              <Select
                value={filter.applicability}
                onValueChange={(value) => onFilterChange('applicability', value)}
              >
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {VAT_APPLICABILITIES.map(applicability => (
                    <SelectItem key={applicability} value={applicability}>
                      {formatApplicabilityLabel(applicability)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-xs font-medium text-gray-600">
                Status
              </Label>
              <Select
                value={filter.isActive.toString()}
                onValueChange={(value) => 
                  onFilterChange('isActive', value === 'all' ? 'all' : value === 'true')
                }
              >
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active Only</SelectItem>
                  <SelectItem value="false">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rate Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="minRate" className="text-xs font-medium text-gray-600">
                Min Rate (%)
              </Label>
              <Input
                id="minRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={filter.rateRange.min}
                onChange={(e) => onFilterChange('rateRange', {
                  ...filter.rateRange,
                  min: parseFloat(e.target.value) || 0
                })}
                className="mt-1 text-sm"
                placeholder="0"
              />
            </div>
            
            <div>
              <Label htmlFor="maxRate" className="text-xs font-medium text-gray-600">
                Max Rate (%)
              </Label>
              <Input
                id="maxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={filter.rateRange.max}
                onChange={(e) => onFilterChange('rateRange', {
                  ...filter.rateRange,
                  max: parseFloat(e.target.value) || 100
                })}
                className="mt-1 text-sm"
                placeholder="100"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClearFilters}
                disabled={!hasActiveFilters()}
                className="text-sm h-9"
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters() && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <span className="text-xs font-medium text-gray-600">Active filters:</span>
                
                {filter.search && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{filter.search}"
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-3 w-3 p-0"
                      onClick={() => onFilterChange('search', '')}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
                
                {filter.category !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Category: {formatCategoryLabel(filter.category)}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-3 w-3 p-0"
                      onClick={() => onFilterChange('category', 'all')}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
                
                {filter.applicability !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {formatApplicabilityLabel(filter.applicability)}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-3 w-3 p-0"
                      onClick={() => onFilterChange('applicability', 'all')}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
                
                {filter.isActive !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {formatStatusLabel(filter.isActive)}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-3 w-3 p-0"
                      onClick={() => onFilterChange('isActive', 'all')}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
                
                {(filter.rateRange.min !== 0 || filter.rateRange.max !== 100) && (
                  <Badge variant="secondary" className="text-xs">
                    Rate: {filter.rateRange.min}% - {filter.rateRange.max}%
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-3 w-3 p-0"
                      onClick={() => onFilterChange('rateRange', { min: 0, max: 100 })}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};