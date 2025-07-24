"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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

function CompanyFilterProviderInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Initialize from URL search params or default to 'all'
  const initialCompanyId = searchParams.get('companyId') || 'all';
  const [selectedCompany, setSelectedCompanyState] = useState<number | 'all'>(
    initialCompanyId === 'all' ? 'all' : parseInt(initialCompanyId)
  );

  // Sync with URL search params when they change
  useEffect(() => {
    const urlCompanyId = searchParams.get('companyId') || 'all';
    const parsedCompanyId = urlCompanyId === 'all' ? 'all' : parseInt(urlCompanyId);
    if (parsedCompanyId !== selectedCompany) {
      setSelectedCompanyState(parsedCompanyId);
    }
  }, [searchParams, selectedCompany]);

  // Enhanced setSelectedCompany that updates URL
  const setSelectedCompany = (companyId: number | 'all') => {
    setSelectedCompanyState(companyId);
    
    // Update URL search params
    const params = new URLSearchParams(searchParams.toString());
    if (companyId === 'all') {
      params.delete('companyId');
    } else {
      params.set('companyId', companyId.toString());
    }
    
    const newUrl = `${pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.push(newUrl);
  };
  
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

export function CompanyFilterProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompanyFilterProviderInner>
        {children}
      </CompanyFilterProviderInner>
    </Suspense>
  );
}

export function useCompanyFilter() {
  const context = useContext(CompanyFilterContext);
  if (context === undefined) {
    throw new Error('useCompanyFilter must be used within a CompanyFilterProvider');
  }
  return context;
} 