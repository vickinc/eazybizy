"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { isImageLogo, validateLogo } from '@/utils/logoUtils';

export function GlobalCompanyFilter() {
  const { selectedCompany, setSelectedCompany, companies, isLoading, isError } = useCompanyFilter();
  const activeCompanies = companies.filter(c => c.status === 'Active');
  
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
      <Select 
        value={selectedCompany === 'all' ? 'all' : String(selectedCompany)} 
        onValueChange={(value) => setSelectedCompany(value === 'all' ? 'all' : parseInt(value))}
      >
        <SelectTrigger className="min-w-[120px] w-auto max-w-[50vw] h-8 text-xs sm:text-sm border-2 border-blue-200 focus:border-blue-500 bg-blue-50/50">
          <SelectValue placeholder="Select company" className="truncate" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="font-bold">All Companies</span>
          </SelectItem>
          {activeCompanies.map(company => (
            <SelectItem key={company.id} value={String(company.id)}>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
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
                <span className="font-medium">{company.tradingName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 