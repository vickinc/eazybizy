import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Search from "lucide-react/dist/esm/icons/search";

interface ProductFilterBarProps {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'inactive';
  currencyFilter?: string | 'all';
  vendorFilter?: string | 'all';
  companyFilter?: number | 'all';
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  onCurrencyFilterChange?: (value: string | 'all') => void;
  onVendorFilterChange?: (value: string | 'all') => void;
  onCompanyFilterChange?: (value: number | 'all') => void;
  onSortFieldChange?: (value: string) => void;
  onSortDirectionChange?: (value: 'asc' | 'desc') => void;
  availableCurrencies?: string[];
  activeCompanies?: unknown[];
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  searchTerm,
  statusFilter,
  currencyFilter,
  vendorFilter,
  companyFilter,
  sortField,
  sortDirection,
  onSearchTermChange,
  onStatusFilterChange,
  onCurrencyFilterChange,
  onVendorFilterChange,
  onCompanyFilterChange,
  onSortFieldChange,
  onSortDirectionChange,
  availableCurrencies = [],
  activeCompanies = []
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products by name or description..."
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <Label className="text-sm font-medium text-gray-600 min-w-fit">Status:</Label>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => onStatusFilterChange(value)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currencyFilter !== undefined && onCurrencyFilterChange && (
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Label className="text-sm font-medium text-gray-600 min-w-fit">Currency:</Label>
                <Select value={String(currencyFilter)} onValueChange={(value) => onCurrencyFilterChange(value)}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Filter by currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    {availableCurrencies.map(currency => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {sortField !== undefined && onSortFieldChange && (
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <Label className="text-sm font-medium text-gray-600 min-w-fit">Sort:</Label>
                <div className="flex gap-2">
                  <Select value={sortField} onValueChange={onSortFieldChange}>
                    <SelectTrigger className="w-full sm:w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="cost">Cost</SelectItem>
                      <SelectItem value="createdAt">Date</SelectItem>
                    </SelectContent>
                  </Select>
                  {onSortDirectionChange && (
                    <Select value={sortDirection} onValueChange={onSortDirectionChange}>
                      <SelectTrigger className="w-full sm:w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">A-Z</SelectItem>
                        <SelectItem value="desc">Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};