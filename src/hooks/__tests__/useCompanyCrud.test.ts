import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCompanyCrud } from '../useCompanyCrud';
import { companyApiService } from '@/services/api';
import { Company } from '@/types/company.types';
import { CompanyFormData } from '@/services/business/companyValidationService';

// Mock the API service
jest.mock('@/services/api', () => ({
  companyApiService: {
    createCompany: jest.fn(),
    updateCompany: jest.fn(),
    deleteCompany: jest.fn(),
    archiveCompany: jest.fn(),
    unarchiveCompany: jest.fn(),
    bulkUpdateStatus: jest.fn(),
    bulkDelete: jest.fn(),
    getCompaniesFresh: jest.fn(),
  },
}));

// Mock sonner for toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock window.confirm
const mockConfirm = jest.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

const mockApiService = companyApiService as jest.Mocked<typeof companyApiService>;

// Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  
  // Spy on QueryClient methods to verify invalidation timing
  const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
  const refetchQueriesSpy = jest.spyOn(queryClient, 'refetchQueries');
  const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
  
  return { 
    wrapper, 
    queryClient, 
    invalidateQueriesSpy, 
    refetchQueriesSpy, 
    setQueryDataSpy 
  };
};

const mockCompany: Company = {
  id: 1,
  tradingName: 'Test Company',
  legalName: 'Test Company Ltd',
  status: 'Active',
  industry: 'Technology',
  registrationNo: 'REG001',
  email: 'test@company.com',
  phone: '123-456-7890',
  address: '123 Test St',
  website: 'https://testcompany.com',
};

const mockCompanyFormData: CompanyFormData = {
  tradingName: 'New Company',
  legalName: 'New Company Ltd',
  industry: 'Technology',
  registrationNo: 'REG002',
  email: 'new@company.com',
  phone: '123-456-7891',
  address: '124 Test St',
  website: 'https://newcompany.com',
};

describe('useCompanyCrud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('Invalidation Timing', () => {
    it('should invalidate and refetch queries after successful create', async () => {
      const { wrapper, invalidateQueriesSpy, refetchQueriesSpy } = createWrapper();
      
      mockApiService.createCompany.mockResolvedValueOnce(mockCompany);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      await act(async () => {
        await result.current.createCompany(mockCompanyFormData);
      });

      // Verify invalidation happened
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies-simple'] 
      });

      // Verify refetch happened
      expect(refetchQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });
      expect(refetchQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies-simple'] 
      });

      expect(mockApiService.createCompany).toHaveBeenCalledWith(mockCompanyFormData);
    });

    it('should invalidate, refetch, and update cache after successful update', async () => {
      const { wrapper, invalidateQueriesSpy, refetchQueriesSpy, setQueryDataSpy } = createWrapper();
      
      const updatedCompany = { ...mockCompany, tradingName: 'Updated Company' };
      const freshCompaniesData = [updatedCompany];
      
      mockApiService.updateCompany.mockResolvedValueOnce(updatedCompany);
      mockApiService.getCompaniesFresh.mockResolvedValueOnce(freshCompaniesData);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      const updateData = { tradingName: 'Updated Company' };

      await act(async () => {
        await result.current.updateCompany('1', updateData);
      });

      // Verify invalidation happened
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies-simple'] 
      });

      // Verify fresh data fetch and cache update happened
      expect(mockApiService.getCompaniesFresh).toHaveBeenCalledWith({ take: 1000 });
      expect(setQueryDataSpy).toHaveBeenCalledWith(['companies-simple'], freshCompaniesData);

      expect(mockApiService.updateCompany).toHaveBeenCalledWith('1', updateData);
    });

    it('should handle fresh data fetch error during update gracefully', async () => {
      const { wrapper, invalidateQueriesSpy, setQueryDataSpy } = createWrapper();
      
      const updatedCompany = { ...mockCompany, tradingName: 'Updated Company' };
      
      mockApiService.updateCompany.mockResolvedValueOnce(updatedCompany);
      mockApiService.getCompaniesFresh.mockRejectedValueOnce(new Error('Fetch failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      const updateData = { tradingName: 'Updated Company' };

      await act(async () => {
        await result.current.updateCompany('1', updateData);
      });

      // Verify invalidation still happened
      expect(invalidateQueriesSpy).toHaveBeenCalled();

      // Verify error was logged and cache update didn't happen
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch fresh simple companies:', expect.any(Error));
      expect(setQueryDataSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should invalidate and refetch queries after successful delete', async () => {
      const { wrapper, invalidateQueriesSpy, refetchQueriesSpy } = createWrapper();
      
      mockApiService.deleteCompany.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      await act(async () => {
        await result.current.deleteCompany('1');
      });

      // Verify invalidation and refetch happened
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });
      expect(refetchQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });

      expect(mockApiService.deleteCompany).toHaveBeenCalledWith('1');
    });

    it('should invalidate and refetch queries after successful archive', async () => {
      const { wrapper, invalidateQueriesSpy, refetchQueriesSpy } = createWrapper();
      
      mockApiService.archiveCompany.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      await act(async () => {
        await result.current.archiveCompany('1');
      });

      // Verify invalidation and refetch happened
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });
      expect(refetchQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });

      expect(mockApiService.archiveCompany).toHaveBeenCalledWith('1');
    });

    it('should invalidate and refetch queries after successful unarchive', async () => {
      const { wrapper, invalidateQueriesSpy, refetchQueriesSpy } = createWrapper();
      
      mockApiService.unarchiveCompany.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      await act(async () => {
        await result.current.unarchiveCompany('1', 'Active');
      });

      // Verify invalidation and refetch happened
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });
      expect(refetchQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });

      expect(mockApiService.unarchiveCompany).toHaveBeenCalledWith('1', 'Active');
    });

    it('should invalidate and refetch after bulk operations', async () => {
      const { wrapper, invalidateQueriesSpy, refetchQueriesSpy } = createWrapper();
      
      mockApiService.bulkUpdateStatus.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      // Set some selected companies
      act(() => {
        result.current.setSelectedCompanies(['1', '2']);
      });

      await act(async () => {
        await result.current.bulkUpdateStatus('Passive');
      });

      // Verify invalidation and refetch happened
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });
      expect(refetchQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });

      // Verify selected companies were cleared
      expect(result.current.selectedCompanies).toEqual([]);

      expect(mockApiService.bulkUpdateStatus).toHaveBeenCalledWith(['1', '2'], 'Passive');
    });

    it('should not perform operation when no companies selected for bulk operations', async () => {
      const { wrapper } = createWrapper();
      
      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      await act(async () => {
        await result.current.bulkUpdateStatus('Active');
      });

      // Should not call API when no companies selected
      expect(mockApiService.bulkUpdateStatus).not.toHaveBeenCalled();
    });

    it('should handle bulk delete with confirmation', async () => {
      const { wrapper, invalidateQueriesSpy, refetchQueriesSpy } = createWrapper();
      
      mockApiService.bulkDelete.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      // Set some selected companies
      act(() => {
        result.current.setSelectedCompanies(['1', '2']);
      });

      await act(async () => {
        await result.current.bulkDelete();
      });

      // Verify confirmation was asked
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete 2 company(ies)?');

      // Verify invalidation and refetch happened
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });
      expect(refetchQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });

      // Verify selected companies were cleared
      expect(result.current.selectedCompanies).toEqual([]);

      expect(mockApiService.bulkDelete).toHaveBeenCalledWith(['1', '2']);
    });

    it('should not delete when confirmation is declined', async () => {
      const { wrapper } = createWrapper();
      
      mockConfirm.mockReturnValueOnce(false);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      // Set some selected companies
      act(() => {
        result.current.setSelectedCompanies(['1', '2']);
      });

      await act(async () => {
        await result.current.bulkDelete();
      });

      // Should not call API when confirmation is declined
      expect(mockApiService.bulkDelete).not.toHaveBeenCalled();
      
      // Selected companies should remain
      expect(result.current.selectedCompanies).toEqual(['1', '2']);
    });
  });

  describe('Manual Cache Management', () => {
    it('should manually invalidate queries when invalidateQueries is called', () => {
      const { wrapper, invalidateQueriesSpy } = createWrapper();
      
      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      act(() => {
        result.current.invalidateQueries();
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies-simple'] 
      });
    });

    it('should manually refetch queries when refetchQueries is called', () => {
      const { wrapper, refetchQueriesSpy } = createWrapper();
      
      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      act(() => {
        result.current.refetchQueries();
      });

      expect(refetchQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies'], 
        exact: false 
      });
      expect(refetchQueriesSpy).toHaveBeenCalledWith({ 
        queryKey: ['companies-simple'] 
      });
    });
  });

  describe('Mutation States', () => {
    it('should track loading states for all mutations', async () => {
      const { wrapper } = createWrapper();
      
      // Mock a slow API call
      let resolveCreate: (value: any) => void;
      const slowCreatePromise = new Promise((resolve) => {
        resolveCreate = resolve;
      });
      
      mockApiService.createCompany.mockReturnValueOnce(slowCreatePromise as any);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      // Start create operation
      const createPromise = act(async () => {
        return result.current.createCompany(mockCompanyFormData);
      });

      // Should be in loading state
      expect(result.current.isCreating).toBe(true);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isDeleting).toBe(false);

      // Resolve the operation
      act(() => {
        resolveCreate!(mockCompany);
      });

      await createPromise;

      // Should no longer be loading
      expect(result.current.isCreating).toBe(false);
    });

    it('should track bulk operation states', async () => {
      const { wrapper } = createWrapper();
      
      // Mock a slow bulk operation
      let resolveBulk: (value: any) => void;
      const slowBulkPromise = new Promise((resolve) => {
        resolveBulk = resolve;
      });
      
      mockApiService.bulkUpdateStatus.mockReturnValueOnce(slowBulkPromise as any);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      // Set selected companies
      act(() => {
        result.current.setSelectedCompanies(['1', '2']);
      });

      // Start bulk operation
      const bulkPromise = act(async () => {
        return result.current.bulkUpdateStatus('Active');
      });

      // Should be in bulk loading state
      expect(result.current.isBulkOperating).toBe(true);

      // Resolve the operation
      act(() => {
        resolveBulk!(undefined);
      });

      await bulkPromise;

      // Should no longer be bulk loading
      expect(result.current.isBulkOperating).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors without invalidating cache', async () => {
      const { wrapper, invalidateQueriesSpy } = createWrapper();
      
      const apiError = new Error('API Error');
      mockApiService.createCompany.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      await act(async () => {
        try {
          await result.current.createCompany(mockCompanyFormData);
        } catch (error) {
          // Expected to throw
        }
      });

      // Should not have invalidated cache on error
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });

    it('should handle update error without cache invalidation', async () => {
      const { wrapper, invalidateQueriesSpy, setQueryDataSpy } = createWrapper();
      
      const apiError = new Error('Update failed');
      mockApiService.updateCompany.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      await act(async () => {
        try {
          await result.current.updateCompany('1', { tradingName: 'Failed Update' });
        } catch (error) {
          // Expected to throw
        }
      });

      // Should not have invalidated cache or updated fresh data on error
      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
      expect(setQueryDataSpy).not.toHaveBeenCalled();
      expect(mockApiService.getCompaniesFresh).not.toHaveBeenCalled();
    });
  });

  describe('Selection Management', () => {
    it('should manage selected companies state', () => {
      const { wrapper } = createWrapper();
      
      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      expect(result.current.selectedCompanies).toEqual([]);

      act(() => {
        result.current.setSelectedCompanies(['1', '2', '3']);
      });

      expect(result.current.selectedCompanies).toEqual(['1', '2', '3']);

      act(() => {
        result.current.setSelectedCompanies([]);
      });

      expect(result.current.selectedCompanies).toEqual([]);
    });

    it('should clear selected companies after successful bulk operations', async () => {
      const { wrapper } = createWrapper();
      
      mockApiService.bulkUpdateStatus.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCompanyCrud(), { wrapper });

      act(() => {
        result.current.setSelectedCompanies(['1', '2', '3']);
      });

      expect(result.current.selectedCompanies).toHaveLength(3);

      await act(async () => {
        await result.current.bulkUpdateStatus('Active');
      });

      expect(result.current.selectedCompanies).toEqual([]);
    });
  });
});