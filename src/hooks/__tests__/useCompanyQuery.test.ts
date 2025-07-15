import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCompanyQuery, CompanyQueryFilters, CompanyQuerySorting, CompanyQueryPagination } from '../useCompanyQuery';
import { companyApiService } from '@/services/api';
import { Company } from '@/types/company.types';

// Mock the API service
jest.mock('@/services/api', () => ({
  companyApiService: {
    getCompanies: jest.fn(),
  },
}));

// Mock the business service
jest.mock('@/services/business/companyBusinessService', () => ({
  CompanyBusinessService: {
    formatCompaniesForDisplay: jest.fn((companies) => companies),
    filterCompaniesByStatus: jest.fn((companies, status) => 
      companies.filter((c: Company) => c.status === status)
    ),
  },
}));

const mockApiService = companyApiService as jest.Mocked<typeof companyApiService>;

// Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
  
  return { wrapper, queryClient };
};

const mockCompanyResponse = {
  data: [
    {
      id: 1,
      tradingName: 'Company 1',
      legalName: 'Company 1 Ltd',
      status: 'Active' as const,
      industry: 'Technology',
      registrationNo: 'REG001',
      email: 'test1@company.com',
      phone: '123-456-7890',
      address: '123 Test St',
      website: 'https://company1.com',
    },
    {
      id: 2,
      tradingName: 'Company 2',
      legalName: 'Company 2 Ltd',
      status: 'Passive' as const,
      industry: 'Finance',
      registrationNo: 'REG002',
      email: 'test2@company.com',
      phone: '123-456-7891',
      address: '124 Test St',
      website: 'https://company2.com',
    },
  ] as Company[],
  pagination: {
    skip: 0,
    take: 20,
    total: 2,
    hasMore: false,
  },
  statistics: {
    totalActive: 1,
    totalPassive: 1,
    byIndustry: { Technology: 1, Finance: 1 },
    newThisMonth: 2,
  },
};

const defaultFilters: CompanyQueryFilters = {
  searchTerm: '',
  statusFilter: 'all',
  industryFilter: '',
};

const defaultSorting: CompanyQuerySorting = {
  sortField: 'tradingName',
  sortDirection: 'asc',
};

const defaultPagination: CompanyQueryPagination = {
  skip: 0,
  take: 20,
};

describe('useCompanyQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getCompanies.mockResolvedValue(mockCompanyResponse);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Pagination Logic', () => {
    it('should start with initial pagination values', async () => {
      const { wrapper } = createWrapper();
      
      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.pagination.skip).toBe(0);
        expect(result.current.pagination.take).toBe(20);
      });
    });

    it('should load more companies and accumulate results', async () => {
      const { wrapper } = createWrapper();
      
      // Mock first page response
      const firstPageResponse = {
        ...mockCompanyResponse,
        pagination: { skip: 0, take: 20, total: 4, hasMore: true },
      };
      
      // Mock second page response
      const secondPageResponse = {
        data: [
          {
            id: 3,
            tradingName: 'Company 3',
            legalName: 'Company 3 Ltd',
            status: 'Active' as const,
            industry: 'Healthcare',
            registrationNo: 'REG003',
            email: 'test3@company.com',
            phone: '123-456-7892',
            address: '125 Test St',
            website: 'https://company3.com',
          },
        ] as Company[],
        pagination: { skip: 20, take: 20, total: 4, hasMore: false },
        statistics: firstPageResponse.statistics,
      };

      mockApiService.getCompanies
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.companies).toHaveLength(2);
        expect(result.current.pagination.hasMore).toBe(true);
      });

      // Load more
      act(() => {
        result.current.loadMore();
      });

      // Wait for second page to load and accumulate
      await waitFor(() => {
        expect(result.current.companies).toHaveLength(3);
        expect(result.current.pagination.hasMore).toBe(false);
      });

      // Verify API was called with correct pagination
      expect(mockApiService.getCompanies).toHaveBeenCalledTimes(2);
      expect(mockApiService.getCompanies).toHaveBeenNthCalledWith(1, {
        ...defaultFilters,
        ...defaultPagination,
        ...defaultSorting,
      });
      expect(mockApiService.getCompanies).toHaveBeenNthCalledWith(2, {
        ...defaultFilters,
        skip: 20,
        take: 20,
        ...defaultSorting,
      });
    });

    it('should not load more when hasMore is false', async () => {
      const { wrapper } = createWrapper();
      
      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.pagination.hasMore).toBe(false);
      });

      const initialSkip = result.current.pagination.skip;
      
      act(() => {
        result.current.loadMore();
      });

      // Should not change pagination when hasMore is false
      expect(result.current.pagination.skip).toBe(initialSkip);
      expect(mockApiService.getCompanies).toHaveBeenCalledTimes(1);
    });

    it('should reset pagination when filters change', async () => {
      const { wrapper } = createWrapper();
      
      const { result, rerender } = renderHook(
        ({ filters }) => useCompanyQuery(filters, defaultSorting, defaultPagination),
        { 
          wrapper,
          initialProps: { filters: defaultFilters }
        }
      );

      await waitFor(() => {
        expect(result.current.companies).toHaveLength(2);
      });

      // Load more to increase skip
      const hasMoreResponse = {
        ...mockCompanyResponse,
        pagination: { skip: 0, take: 20, total: 4, hasMore: true },
      };
      mockApiService.getCompanies.mockResolvedValueOnce(hasMoreResponse);

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.pagination.skip).toBe(20);
      });

      // Change filters - should reset pagination
      const newFilters: CompanyQueryFilters = {
        ...defaultFilters,
        searchTerm: 'test',
      };

      rerender({ filters: newFilters });

      await waitFor(() => {
        expect(result.current.pagination.skip).toBe(0);
      });
    });

    it('should reset pagination when sorting changes', async () => {
      const { wrapper } = createWrapper();
      
      const { result, rerender } = renderHook(
        ({ sorting }) => useCompanyQuery(defaultFilters, sorting, defaultPagination),
        { 
          wrapper,
          initialProps: { sorting: defaultSorting }
        }
      );

      await waitFor(() => {
        expect(result.current.companies).toHaveLength(2);
      });

      // Load more to increase skip
      const hasMoreResponse = {
        ...mockCompanyResponse,
        pagination: { skip: 0, take: 20, total: 4, hasMore: true },
      };
      mockApiService.getCompanies.mockResolvedValueOnce(hasMoreResponse);

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.pagination.skip).toBe(20);
      });

      // Change sorting - should reset pagination
      const newSorting: CompanyQuerySorting = {
        sortField: 'legalName',
        sortDirection: 'desc',
      };

      rerender({ sorting: newSorting });

      await waitFor(() => {
        expect(result.current.pagination.skip).toBe(0);
      });
    });

    it('should handle resetPagination correctly', async () => {
      const { wrapper } = createWrapper();
      
      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.companies).toHaveLength(2);
      });

      // Load more to get some accumulated data
      const hasMoreResponse = {
        ...mockCompanyResponse,
        data: [
          ...mockCompanyResponse.data,
          {
            id: 3,
            tradingName: 'Company 3',
            legalName: 'Company 3 Ltd',
            status: 'Active' as const,
            industry: 'Healthcare',
            registrationNo: 'REG003',
            email: 'test3@company.com',
            phone: '123-456-7892',
            address: '125 Test St',
            website: 'https://company3.com',
          } as Company,
        ],
        pagination: { skip: 20, take: 20, total: 4, hasMore: false },
      };
      mockApiService.getCompanies.mockResolvedValueOnce(hasMoreResponse);

      act(() => {
        result.current.loadMore();
      });

      await waitFor(() => {
        expect(result.current.companies.length).toBeGreaterThan(2);
      });

      // Reset pagination
      act(() => {
        result.current.resetPagination();
      });

      // Should clear accumulated companies and reset pagination
      expect(result.current.companies).toHaveLength(0);
      expect(result.current.pagination.skip).toBe(0);
      expect(result.current.pagination.take).toBe(20);
    });
  });

  describe('Query Key Stability', () => {
    it('should generate stable query keys for identical parameters', () => {
      const { wrapper } = createWrapper();
      
      const { result: result1 } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      const { result: result2 } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      // Both hooks should generate the same query key
      // Since the query key is internal, we verify by checking that the same API call is made
      expect(mockApiService.getCompanies).toHaveBeenCalledWith({
        ...defaultFilters,
        ...defaultPagination,
        ...defaultSorting,
      });
    });

    it('should generate different query keys for different parameters', async () => {
      const { wrapper } = createWrapper();
      
      const differentFilters: CompanyQueryFilters = {
        ...defaultFilters,
        searchTerm: 'different',
      };

      renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      renderHook(
        () => useCompanyQuery(differentFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(mockApiService.getCompanies).toHaveBeenCalledTimes(2);
      });

      // Should make different API calls
      expect(mockApiService.getCompanies).toHaveBeenNthCalledWith(1, {
        ...defaultFilters,
        ...defaultPagination,
        ...defaultSorting,
      });
      expect(mockApiService.getCompanies).toHaveBeenNthCalledWith(2, {
        ...differentFilters,
        ...defaultPagination,
        ...defaultSorting,
      });
    });
  });

  describe('Invalidation Timing', () => {
    it('should invalidate query and refetch when invalidateQuery is called', async () => {
      const { wrapper, queryClient } = createWrapper();
      
      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.companies).toHaveLength(2);
        expect(mockApiService.getCompanies).toHaveBeenCalledTimes(1);
      });

      // Mock new response for invalidation
      const newResponse = {
        ...mockCompanyResponse,
        data: [
          ...mockCompanyResponse.data,
          {
            id: 3,
            tradingName: 'New Company',
            legalName: 'New Company Ltd',
            status: 'Active' as const,
            industry: 'Technology',
            registrationNo: 'REG003',
            email: 'new@company.com',
            phone: '123-456-7892',
            address: '125 Test St',
            website: 'https://newcompany.com',
          } as Company,
        ],
      };
      mockApiService.getCompanies.mockResolvedValueOnce(newResponse);

      // Invalidate query
      act(() => {
        result.current.invalidateQuery();
      });

      await waitFor(() => {
        expect(mockApiService.getCompanies).toHaveBeenCalledTimes(2);
        expect(result.current.companies).toHaveLength(3);
      });

      // Should reset pagination on invalidation
      expect(result.current.pagination.skip).toBe(0);
      expect(result.current.pagination.take).toBe(20);
    });

    it('should not clear accumulated companies immediately on invalidation', async () => {
      const { wrapper } = createWrapper();
      
      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.companies).toHaveLength(2);
      });

      // Invalidate - should not immediately clear companies
      act(() => {
        result.current.invalidateQuery();
      });

      // Companies should still be there during refetch
      expect(result.current.companies.length).toBeGreaterThan(0);

      await waitFor(() => {
        expect(mockApiService.getCompanies).toHaveBeenCalledTimes(2);
      });
    });

    it('should refetch when refetchQuery is called', async () => {
      const { wrapper } = createWrapper();
      
      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.companies).toHaveLength(2);
        expect(mockApiService.getCompanies).toHaveBeenCalledTimes(1);
      });

      // Refetch query
      act(() => {
        result.current.refetchQuery();
      });

      await waitFor(() => {
        expect(mockApiService.getCompanies).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Data Formatting and Filtering', () => {
    it('should separate active and passive companies correctly', async () => {
      const { wrapper } = createWrapper();
      
      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.activeCompanies).toHaveLength(1);
        expect(result.current.passiveCompanies).toHaveLength(1);
        expect(result.current.activeCompanies[0].status).toBe('Active');
        expect(result.current.passiveCompanies[0].status).toBe('Passive');
      });
    });

    it('should extract available industries correctly', async () => {
      const { wrapper } = createWrapper();
      
      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.availableIndustries).toEqual(['Finance', 'Technology']);
      });
    });

    it('should return statistics from API response', async () => {
      const { wrapper } = createWrapper();
      
      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.statistics).toEqual(mockCompanyResponse.statistics);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { wrapper } = createWrapper();
      
      const apiError = new Error('API Error');
      mockApiService.getCompanies.mockRejectedValueOnce(apiError);

      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
        expect(result.current.companies).toHaveLength(0);
      });
    });

    it('should maintain loading state during API calls', async () => {
      const { wrapper } = createWrapper();
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockApiService.getCompanies.mockReturnValueOnce(controlledPromise as any);

      const { result } = renderHook(
        () => useCompanyQuery(defaultFilters, defaultSorting, defaultPagination),
        { wrapper }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.companies).toHaveLength(0);

      // Resolve the promise
      act(() => {
        resolvePromise!(mockCompanyResponse);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.companies).toHaveLength(2);
      });
    });
  });
});