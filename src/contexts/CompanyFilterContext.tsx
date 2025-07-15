"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';
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
  const { companies: rawCompanies, isLoading, isError, refetch } = useCompanies();

  // Memoize companies to ensure stable reference
  const companies = useMemo(() => rawCompanies || [], [rawCompanies]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    selectedCompany,
    setSelectedCompany,
    companies,
    isLoading,
    isError,
    refetch
  }), [selectedCompany, companies, isLoading, isError, refetch]);

  return (
    <CompanyFilterContext.Provider value={contextValue}>
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