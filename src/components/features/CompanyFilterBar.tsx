import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface CompanyFilters {
  searchTerm: string;
  countryFilter: string;
  currencyFilter: string;
  industryFilter: string;
  sortField: 'legalName' | 'tradingName' | 'createdAt' | 'registrationDate' | 'countryOfRegistration' | 'baseCurrency' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
}

interface CompanyFilterBarProps {
  filters: CompanyFilters;
  onFiltersChange: (filters: CompanyFilters) => void;
  totalCompanies: number;
  isLoading?: boolean;
}

// Common country options
const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Netherlands',
  'Spain',
  'Italy',
  'Sweden',
  'Norway',
  'Denmark',
  'Switzerland',
  'Austria',
  'Belgium',
  'Ireland',
  'Portugal',
  'Finland',
  'Poland',
  'Czech Republic',
  'Hungary',
  'Slovakia',
  'Slovenia',
  'Croatia',
  'Estonia',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Cyprus',
  'Bulgaria',
  'Romania',
  'Greece',
  'Other'
];

// Common currency options
const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'BGN', 'RON', 'HRK', 'ISK', 'TRY', 'RUB', 'CNY', 'INR', 'BRL', 'MXN', 'ZAR', 'KRW', 'SGD', 'HKD', 'NZD', 'THB', 'PHP', 'MYR', 'IDR', 'VND', 'AED', 'SAR', 'EGP', 'MAD', 'NGN', 'KES', 'GHS', 'XOF', 'XAF', 'ETB', 'UGX', 'TZS', 'RWF', 'Other'
];

// Common industry options
const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Construction',
  'Transportation',
  'Energy',
  'Agriculture',
  'Entertainment',
  'Food & Beverage',
  'Telecommunications',
  'Automotive',
  'Aerospace',
  'Pharmaceuticals',
  'Biotechnology',
  'Consulting',
  'Legal Services',
  'Marketing',
  'Media',
  'Insurance',
  'Banking',
  'Investment',
  'Logistics',
  'Tourism',
  'Hospitality',
  'Sports',
  'Non-profit',
  'Government',
  'Other'
];

// Sort options
const SORT_OPTIONS = [
  { value: 'legalName', label: 'Legal Name' },
  { value: 'tradingName', label: 'Trading Name' },
  { value: 'createdAt', label: 'Date Added' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'registrationDate', label: 'Registration Date' },
  { value: 'countryOfRegistration', label: 'Country' },
  { value: 'baseCurrency', label: 'Currency' },
];

export const CompanyFilterBar: React.FC<CompanyFilterBarProps> = ({
  filters,
  onFiltersChange,
  totalCompanies,
  isLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchTerm !== filters.searchTerm) {
        onFiltersChange({
          ...filters,
          searchTerm: localSearchTerm
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm, filters, onFiltersChange]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.searchTerm || 
           filters.countryFilter || 
           filters.currencyFilter || 
           filters.industryFilter ||
           filters.sortField !== 'updatedAt' ||
           filters.sortDirection !== 'desc';
  }, [filters]);

  const clearAllFilters = () => {
    const resetFilters: CompanyFilters = {
      searchTerm: '',
      countryFilter: '',
      currencyFilter: '',
      industryFilter: '',
      sortField: 'updatedAt',
      sortDirection: 'desc'
    };
    setLocalSearchTerm('');
    onFiltersChange(resetFilters);
  };

  const toggleSortDirection = () => {
    onFiltersChange({
      ...filters,
      sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc'
    });
  };

  return (
    <Card className="p-4 mb-6 bg-white border border-gray-200">
      <div className="space-y-4">
        {/* Search Bar and Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search companies by name, email, or registration number..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
              disabled={isLoading}
            />
            {localSearchTerm && (
              <button
                onClick={() => setLocalSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {totalCompanies} companies
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {isExpanded ? 'Hide Filters' : 'Show Filters'}
              {hasActiveFilters && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {[filters.countryFilter, filters.currencyFilter, filters.industryFilter].filter(Boolean).length + 
                   (filters.sortField !== 'updatedAt' || filters.sortDirection !== 'desc' ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            {/* Country Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <Select
                value={filters.countryFilter || "all"}
                onValueChange={(value) => onFiltersChange({
                  ...filters,
                  countryFilter: value === "all" ? "" : value
                })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <Select
                value={filters.currencyFilter || "all"}
                onValueChange={(value) => onFiltersChange({
                  ...filters,
                  currencyFilter: value === "all" ? "" : value
                })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All currencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All currencies</SelectItem>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Industry Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <Select
                value={filters.industryFilter || "all"}
                onValueChange={(value) => onFiltersChange({
                  ...filters,
                  industryFilter: value === "all" ? "" : value
                })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <div className="flex gap-2">
                <Select
                  value={filters.sortField}
                  onValueChange={(value) => onFiltersChange({
                    ...filters,
                    sortField: value as CompanyFilters['sortField']
                  })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSortDirection}
                  disabled={isLoading}
                  className="px-3"
                >
                  {filters.sortDirection === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};