import React, { useMemo } from "react";
import Search from "lucide-react/dist/esm/icons/search";
import X from "lucide-react/dist/esm/icons/x";
import Filter from "lucide-react/dist/esm/icons/filter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChartOfAccountsFilter, ACCOUNT_TYPES, ACCOUNT_CATEGORIES } from "@/types/chartOfAccounts.types";
import { VATTypesIntegrationService } from "@/services/business/vatTypesIntegrationService";
import { cn } from "@/utils/cn";

interface CategoryFilterBarProps {
  filter: ChartOfAccountsFilter;
  onFilterChange: (field: string, value: string | boolean) => void;
  onClearFilters: () => void;
  className?: string;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  filter,
  onFilterChange,
  onClearFilters,
  className
}) => {
  // Get dynamic VAT types (static + custom treatments)
  const vatTypes = useMemo(() => VATTypesIntegrationService.getAllVATTypes(), []);

  const hasActiveFilters = 
    filter.search !== '' ||
    filter.type !== 'all' ||
    filter.category !== 'all' ||
    filter.vat !== 'all' ||
    filter.accountType !== 'all' ||
    filter.isActive !== 'all';

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Filters</Label>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-xs text-muted-foreground">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Code, name, vendor..."
                value={filter.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Account Type
            </Label>
            <Select 
              value={filter.type} 
              onValueChange={(value) => onFilterChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ACCOUNT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Category */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Category
            </Label>
            <Select 
              value={filter.category} 
              onValueChange={(value) => onFilterChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ACCOUNT_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VAT Treatment */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              VAT Treatment
            </Label>
            <Select 
              value={filter.vat} 
              onValueChange={(value) => onFilterChange('vat', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All VAT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All VAT Types</SelectItem>
                {vatTypes.map(vat => {
                  const isCustom = VATTypesIntegrationService.isCustomVATTreatment(vat);
                  const displayText = vat.length > 30 ? `${vat.substring(0, 30)}...` : vat;
                  
                  return (
                    <SelectItem key={vat} value={vat}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{displayText}</span>
                        {isCustom && (
                          <span className="text-xs text-blue-600">Custom Treatment</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Classification */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Classification
            </Label>
            <Select 
              value={filter.accountType} 
              onValueChange={(value) => onFilterChange('accountType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classifications</SelectItem>
                <SelectItem value="Detail">Detail</SelectItem>
                <SelectItem value="Header">Header</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Status
            </Label>
            <Select 
              value={filter.isActive.toString()} 
              onValueChange={(value) => onFilterChange('isActive', value === 'true' ? true : value === 'false' ? false : 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};