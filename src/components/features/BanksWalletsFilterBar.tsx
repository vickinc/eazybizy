import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Search from "lucide-react/dist/esm/icons/search";
import Banknote from "lucide-react/dist/esm/icons/banknote";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Filter from "lucide-react/dist/esm/icons/filter";

interface BanksWalletsFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // Filter controls
  viewFilter: 'all' | 'banks' | 'wallets';
  setViewFilter: (filter: 'all' | 'banks' | 'wallets') => void;
  currencyFilter: string;
  setCurrencyFilter: (currency: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  // Available filter options
  availableCurrencies: string[];
  availableBankTypes: string[];
  availableWalletTypes: string[];
}

export const BanksWalletsFilterBar: React.FC<BanksWalletsFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  viewFilter,
  setViewFilter,
  currencyFilter,
  setCurrencyFilter,
  typeFilter,
  setTypeFilter,
  availableCurrencies,
  availableBankTypes,
  availableWalletTypes
}) => {
  // Get current type options based on view filter
  const getCurrentTypeOptions = () => {
    if (viewFilter === 'banks') return []; // Banks don't have types
    if (viewFilter === 'wallets') return availableWalletTypes;
    return availableWalletTypes; // Only show wallet types for 'all' view
  };

  return (
    <>
      {/* Search and Filters */}
      <Card className="mb-6 bg-lime-100">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Filter */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1 w-full lg:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, account, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            {/* Filter Pills Section */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* View Filter Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">Show:</span>
                <div className="flex gap-1">
                  <Button
                    variant={viewFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewFilter('all')}
                    className={`${
                      viewFilter === 'all' 
                        ? 'bg-black text-white hover:bg-gray-800' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    All Payment
                  </Button>
                  <Button
                    variant={viewFilter === 'banks' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewFilter('banks')}
                    className={`flex items-center gap-1 ${
                      viewFilter === 'banks' 
                        ? 'bg-black text-white hover:bg-gray-800' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Banknote className="h-3 w-3" />
                    Banks
                  </Button>
                  <Button
                    variant={viewFilter === 'wallets' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewFilter('wallets')}
                    className={`flex items-center gap-1 ${
                      viewFilter === 'wallets' 
                        ? 'bg-black text-white hover:bg-gray-800' 
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Wallet className="h-3 w-3" />
                    Wallets
                  </Button>
                </div>
              </div>
              
              {/* Additional Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Currency Filter - Always render but disable when no options */}
                <Select 
                  value={currencyFilter} 
                  onValueChange={setCurrencyFilter}
                  disabled={availableCurrencies.length === 0}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    {availableCurrencies.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Type Filter - Always render but disable when no options */}
                <Select 
                  value={typeFilter} 
                  onValueChange={setTypeFilter}
                  disabled={getCurrentTypeOptions().length === 0}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {getCurrentTypeOptions().map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};