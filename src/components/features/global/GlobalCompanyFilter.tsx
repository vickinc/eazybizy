"use client";

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { isImageLogo, validateLogo } from '@/utils/logoUtils';
import Search from "lucide-react/dist/esm/icons/search";
import ChevronsUpDown from "lucide-react/dist/esm/icons/chevrons-up-down";
import Check from "lucide-react/dist/esm/icons/check";
import { cn } from '@/utils/cn';

export function GlobalCompanyFilter() {
  const { selectedCompany, setSelectedCompany, companies, isLoading, isError } = useCompanyFilter();
  const activeCompanies = companies.filter(c => c.status === 'Active');
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // Filter companies based on search
  const filteredCompanies = activeCompanies.filter(company =>
    company.tradingName.toLowerCase().includes(searchValue.toLowerCase()) ||
    company.legalName.toLowerCase().includes(searchValue.toLowerCase())
  );
  
  // Find selected company for display
  const selectedCompanyData = selectedCompany === 'all' 
    ? null 
    : activeCompanies.find(c => c.id === selectedCompany);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <Label className="text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap flex-shrink-0">
          Company:
        </Label>
        <div className="min-w-[120px] w-auto max-w-[50vw] h-8 bg-gray-100 animate-pulse rounded"></div>
      </div>
    );
  }
  
  // Hide on error or no companies
  if (isError || activeCompanies.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <Label className="text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap flex-shrink-0">
        Company:
      </Label>
      <Popover open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setSearchValue(''); // Reset search when closing
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[120px] w-auto max-w-[50vw] h-8 text-xs sm:text-sm border-2 border-blue-200 focus:border-blue-500 bg-blue-50/50 justify-between font-normal"
          >
            {selectedCompanyData ? (
              <div className="flex items-center gap-2 truncate">
                <div className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                  isImageLogo(selectedCompanyData.logo)
                    ? '' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {isImageLogo(selectedCompanyData.logo) ? (
                    <img 
                      src={selectedCompanyData.logo} 
                      alt={`${selectedCompanyData.tradingName} logo`} 
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <span className="text-xs">
                      {validateLogo(selectedCompanyData.logo, selectedCompanyData.tradingName)}
                    </span>
                  )}
                </div>
                <span className="font-medium truncate">{selectedCompanyData.tradingName}</span>
              </div>
            ) : (
              <span className="font-bold">All Companies</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-[600px] min-w-[350px] p-0" align="start">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search companies..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-8 border-0 focus:ring-0 px-0 flex-1"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {/* All Companies Option */}
            <div 
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                selectedCompany === 'all' && "bg-blue-50"
              )}
              onClick={() => {
                setSelectedCompany('all');
                setOpen(false);
                setSearchValue('');
              }}
            >
              <Check className={cn("h-4 w-4", selectedCompany === 'all' ? "opacity-100" : "opacity-0")} />
              <span className="font-bold">All Companies</span>
            </div>
            
            {filteredCompanies.length === 0 ? (
              <div className="py-6 text-center text-sm">No companies found.</div>
            ) : (
              filteredCompanies.map((company) => (
                <div 
                  key={company.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                    selectedCompany === company.id && "bg-blue-50"
                  )}
                  onClick={() => {
                    setSelectedCompany(company.id);
                    setOpen(false);
                    setSearchValue('');
                  }}
                >
                  <Check className={cn("h-4 w-4", selectedCompany === company.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0 ${
                      isImageLogo(company.logo)
                        ? '' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {isImageLogo(company.logo) ? (
                        <img 
                          src={company.logo} 
                          alt={`${company.tradingName} logo`} 
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="text-xs">
                          {validateLogo(company.logo, company.tradingName)}
                        </span>
                      )}
                    </div>
                    <span className="font-medium whitespace-nowrap">{company.tradingName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 