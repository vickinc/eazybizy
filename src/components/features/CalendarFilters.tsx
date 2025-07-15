import React, { useMemo, useCallback } from 'react';
import Search from "lucide-react/dist/esm/icons/search";
import Filter from "lucide-react/dist/esm/icons/filter";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Clock from "lucide-react/dist/esm/icons/clock";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import X from "lucide-react/dist/esm/icons/x";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarEvent } from '@/types/calendar.types';
import { Company } from '@/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface CalendarFiltersProps {
  filters: {
    searchTerm: string;
    dateRange: { start?: Date; end?: Date };
    eventType: string;
    priority: string;
    company: string;
  };
  events: CalendarEvent[];
  companies: Company[];
  updateFilters: (newFilters: Partial<CalendarFiltersProps['filters']>) => void;
  clearFilters: () => void;
  className?: string;
  compact?: boolean;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  filters,
  events,
  companies,
  updateFilters,
  clearFilters,
  className = "",
  compact = false
}) => {
  
  // Debounced search for performance
  const debouncedSearch = useDebouncedValue(filters.searchTerm, 300);
  
  // Memoized filter options derived from data
  const filterOptions = useMemo(() => {
    const eventTypes = [...new Set(events.map(e => e.type))];
    const priorities = [...new Set(events.map(e => e.priority))];
    const eventCompanies = [...new Set(events.map(e => e.company).filter(Boolean))];
    
    return {
      eventTypes: eventTypes.sort(),
      priorities: ['low', 'medium', 'high', 'critical'],
      companies: eventCompanies.sort()
    };
  }, [events]);
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    const count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.eventType !== 'all') count++;
    if (filters.priority !== 'all') count++;
    if (filters.company !== 'all') count++;
    if (filters.dateRange.start && filters.dateRange.end) count++;
    return count;
  }, [filters]);
  
  // Handle search input with debouncing
  const handleSearchChange = useCallback((value: string) => {
    updateFilters({ searchTerm: value });
  }, [updateFilters]);
  
  // Handle date range selection
  const handleDateRangeChange = useCallback((range: { start?: Date; end?: Date }) => {
    updateFilters({ dateRange: range });
  }, [updateFilters]);
  
  // Quick filter presets
  const quickFilters = useMemo(() => [
    {
      label: 'Today',
      action: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        handleDateRangeChange({ start: today, end: tomorrow });
      }
    },
    {
      label: 'This Week',
      action: () => {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        handleDateRangeChange({ start: startOfWeek, end: endOfWeek });
      }
    },
    {
      label: 'This Month',
      action: () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        handleDateRangeChange({ start: startOfMonth, end: endOfMonth });
      }
    },
    {
      label: 'High Priority',
      action: () => updateFilters({ priority: 'high' })
    },
    {
      label: 'Critical',
      action: () => updateFilters({ priority: 'critical' })
    }
  ], [handleDateRangeChange, updateFilters]);
  
  // Format date for display
  const formatDateRange = useCallback(() => {
    const { start, end } = filters.dateRange;
    if (!start || !end) return null;
    
    const startStr = start.toLocaleDateString();
    const endStr = end.toLocaleDateString();
    return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
  }, [filters.dateRange]);
  
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>
        
        {/* Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {activeFilterCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter Events</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Quick Filters */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quick Filters
                </label>
                <div className="flex flex-wrap gap-1">
                  {quickFilters.map((filter, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={filter.action}
                      className="text-xs"
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Event Type Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Event Type
                </label>
                <Select
                  value={filters.eventType}
                  onValueChange={(value) => updateFilters({ eventType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {filterOptions.eventTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Priority Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Priority
                </label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => updateFilters({ priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {filterOptions.priorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        <div className="flex items-center">
                          <AlertTriangle className={`h-3 w-3 mr-2 ${
                            priority === 'critical' ? 'text-red-500' :
                            priority === 'high' ? 'text-orange-500' :
                            priority === 'medium' ? 'text-yellow-500' :
                            'text-green-500'
                          }`} />
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Company Filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Company
                </label>
                <Select
                  value={filters.company}
                  onValueChange={(value) => updateFilters({ company: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {filterOptions.companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        <div className="flex items-center">
                          <Building2 className="h-3 w-3 mr-2" />
                          {company}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
  
  // Full filter panel
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filter Events
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Search Events
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by title, description, or company..."
              value={filters.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Quick Filters */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Quick Filters
          </label>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={filter.action}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Event Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Event Type
            </label>
            <Select
              value={filters.eventType}
              onValueChange={(value) => updateFilters({ eventType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Priority */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Priority
            </label>
            <Select
              value={filters.priority}
              onValueChange={(value) => updateFilters({ priority: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {filterOptions.priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Company */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Company
            </label>
            <Select
              value={filters.company}
              onValueChange={(value) => updateFilters({ company: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {filterOptions.companies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Active Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.searchTerm.trim() && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{filters.searchTerm}"
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.eventType !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {filters.eventType}
                  <button
                    onClick={() => updateFilters({ eventType: 'all' })}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.priority !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Priority: {filters.priority}
                  <button
                    onClick={() => updateFilters({ priority: 'all' })}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.company !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Company: {filters.company}
                  <button
                    onClick={() => updateFilters({ company: 'all' })}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {formatDateRange() && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDateRange()}
                  <button
                    onClick={() => handleDateRangeChange({})}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarFilters;