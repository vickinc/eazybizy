"use client";

import React, { createContext, useContext, useState } from 'react';
import { Company } from '@/types/company.types';
import { useCompanies } from '@/hooks/useCompanies';

interface CompanyFilterContextType {
  selectedCompany: number | 'all';
  setSelectedCompany: (companyId: number | 'all') => void;
  companies: Company[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const CompanyFilterContext = createContext<CompanyFilterContextType | undefined>(undefined);

export function CompanyFilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState<number | 'all'>('all');
  
  // Use API-based companies hook instead of localStorage
  const { companies, isLoading, isError, refetch } = useCompanies();

  return (
    <CompanyFilterContext.Provider
      value={{
        selectedCompany,
        setSelectedCompany,
        companies,
        isLoading,
        isError,
        refetch
      }}
    >
      {children}
    </CompanyFilterContext.Provider>
  );
}

export function useCompanyFilter() {
  const context = useContext(CompanyFilterContext);
  if (context === undefined) {
    throw new Error('useCompanyFilter must be used within a CompanyFilterProvider');
  }
  return context;
} 