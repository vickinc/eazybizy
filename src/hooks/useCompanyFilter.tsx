import { useState, useCallback } from 'react';

export interface CompanyFilterState {
  searchTerm: string;
  countryFilter: string;
  currencyFilter: string;
  industryFilter: string;
  sortField: 'legalName' | 'tradingName' | 'createdAt' | 'registrationDate' | 'countryOfRegistration' | 'baseCurrency' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
}

const DEFAULT_FILTERS: CompanyFilterState = {
  searchTerm: '',
  countryFilter: '',
  currencyFilter: '',
  industryFilter: '',
  sortField: 'updatedAt',
  sortDirection: 'desc'
};

export const useCompanyFilter = () => {
  const [filters, setFilters] = useState<CompanyFilterState>(DEFAULT_FILTERS);

  const updateFilters = useCallback((newFilters: CompanyFilterState) => {
    setFilters(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters
  };
};