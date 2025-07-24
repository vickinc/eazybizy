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
  
  // Initialize from localStorage first, then URL params if present
  const getInitialCompanyId = (): number | 'all' => {
    // Check URL first
    const urlCompanyId = searchParams.get('companyId');
    if (urlCompanyId) {
      return urlCompanyId === 'all' ? 'all' : parseInt(urlCompanyId);
    }
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const savedCompanyId = localStorage.getItem('selectedCompanyId');
      if (savedCompanyId && savedCompanyId !== 'null') {
        return savedCompanyId === 'all' ? 'all' : parseInt(savedCompanyId);
      }
    }
    
    return 'all';
  };

  const [selectedCompany, setSelectedCompanyState] = useState<number | 'all'>(getInitialCompanyId);

  // Sync with URL search params when they change (only if URL has the parameter)
  useEffect(() => {
    const urlCompanyId = searchParams.get('companyId');
    if (urlCompanyId !== null) {
      const parsedCompanyId = urlCompanyId === 'all' ? 'all' : parseInt(urlCompanyId);
      if (parsedCompanyId !== selectedCompany) {
        setSelectedCompanyState(parsedCompanyId);
      }
    }
  }, [searchParams, selectedCompany]);

  // Enhanced setSelectedCompany that updates URL and localStorage
  const setSelectedCompany = (companyId: number | 'all') => {
    setSelectedCompanyState(companyId);
    
    // Save to localStorage for persistence across navigation
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCompanyId', companyId.toString());
    }
    
    // Update URL search params without navigation
    const params = new URLSearchParams(searchParams.toString());
    if (companyId === 'all') {
      params.delete('companyId');
    } else {
      params.set('companyId', companyId.toString());
    }
    
    const newUrl = `${pathname}${params.toString() ? '?' + params.toString() : ''}`;
    
    // Use replaceState to update URL without causing navigation/page reload
    window.history.replaceState(null, '', newUrl);
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