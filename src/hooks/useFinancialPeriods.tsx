import { useState, useEffect, useCallback } from 'react';
import { 
  FinancialPeriod, 
  FinancialYear, 
  FinancialPeriodsSettings,
  PeriodFilter,
  PeriodFormData,
  PeriodClosingData,
  PeriodComparison,
  PeriodType
} from '../types/financialPeriods.types';
import { FinancialPeriodsBusinessService } from '../services/business/financialPeriodsBusinessService';

interface UseFinancialPeriodsReturn {
  // State
  periods: FinancialPeriod[];
  years: FinancialYear[];
  settings: FinancialPeriodsSettings | null;
  filteredPeriods: FinancialPeriod[];
  currentPeriod: FinancialPeriod | null;
  activePeriods: FinancialPeriod[];
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filter: PeriodFilter;
  setFilter: (filter: PeriodFilter) => void;
  
  // Form Management
  formData: PeriodFormData;
  setFormData: (data: PeriodFormData) => void;
  resetForm: () => void;
  
  // Period Operations
  createPeriod: (data: PeriodFormData) => Promise<FinancialPeriod>;
  updatePeriod: (id: string, data: Partial<PeriodFormData>) => Promise<FinancialPeriod>;
  deletePeriod: (id: string) => Promise<void>;
  closePeriod: (id: string, closedBy: string, notes?: string) => Promise<PeriodClosingData>;
  reopenPeriod: (id: string) => Promise<void>;
  
  // Year Operations
  createFinancialYear: (year: number) => Promise<FinancialYear>;
  deleteFinancialYear: (id: string) => Promise<void>;
  
  // Settings Operations
  updateSettings: (settings: Partial<FinancialPeriodsSettings>) => Promise<FinancialPeriodsSettings>;
  
  // Comparison Operations
  comparePeriods: (currentId: string, comparativeId: string) => Promise<PeriodComparison>;
  
  // Utility Functions
  refreshData: () => Promise<void>;
  getPeriodById: (id: string) => FinancialPeriod | null;
  getYearById: (id: string) => FinancialYear | null;
  validatePeriod: (period: FinancialPeriod) => void;
  
  // Export/Import
  exportData: () => any;
  importData: (data: any) => Promise<void>;
}

const defaultFilter: PeriodFilter = {
  fiscalYear: 'all',
  periodType: 'all',
  status: 'all'
};

const defaultFormData: PeriodFormData = {
  name: '',
  startDate: '',
  endDate: '',
  periodType: 'Annual',
  fiscalYear: new Date().getFullYear()
};

export const useFinancialPeriods = (): UseFinancialPeriodsReturn => {
  // State
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [years, setYears] = useState<FinancialYear[]>([]);
  const [settings, setSettings] = useState<FinancialPeriodsSettings | null>(null);
  const [filteredPeriods, setFilteredPeriods] = useState<FinancialPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<FinancialPeriod | null>(null);
  const [activePeriods, setActivePeriods] = useState<FinancialPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and Form
  const [filter, setFilter] = useState<PeriodFilter>(defaultFilter);
  const [formData, setFormData] = useState<PeriodFormData>(defaultFormData);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load periods, years, and settings
      const [periodsData, yearsData, settingsData] = await Promise.all([
        Promise.resolve(FinancialPeriodsBusinessService.getFilteredPeriods({ ...defaultFilter })),
        Promise.resolve([]), // Years would be loaded from storage
        Promise.resolve(FinancialPeriodsBusinessService.getSettings())
      ]);
      
      setPeriods(periodsData);
      setYears(yearsData);
      setSettings(settingsData);
      
      // Set derived state
      setCurrentPeriod(FinancialPeriodsBusinessService.getCurrentPeriod());
      setActivePeriods(FinancialPeriodsBusinessService.getActivePeriods());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financial periods data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply filters
  useEffect(() => {
    try {
      const filtered = FinancialPeriodsBusinessService.getFilteredPeriods(filter);
      setFilteredPeriods(filtered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter periods');
    }
  }, [filter, periods]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Period Operations
  const createPeriod = useCallback(async (data: PeriodFormData): Promise<FinancialPeriod> => {
    try {
      setError(null);
      const newPeriod = FinancialPeriodsBusinessService.createPeriod(data);
      setPeriods(prev => [...prev, newPeriod]);
      resetForm();
      return newPeriod;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create period';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updatePeriod = useCallback(async (id: string, data: Partial<PeriodFormData>): Promise<FinancialPeriod> => {
    try {
      setError(null);
      const updatedPeriod = FinancialPeriodsBusinessService.updatePeriod(id, data);
      setPeriods(prev => prev.map(p => p.id === id ? updatedPeriod : p));
      return updatedPeriod;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update period';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deletePeriod = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      FinancialPeriodsBusinessService.deletePeriod(id);
      setPeriods(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete period';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const closePeriod = useCallback(async (id: string, closedBy: string, notes?: string): Promise<PeriodClosingData> => {
    try {
      setError(null);
      const closingData = FinancialPeriodsBusinessService.closePeriod(id, closedBy, notes);
      setPeriods(prev => prev.map(p => 
        p.id === id 
          ? { ...p, isClosed: true, closedAt: closingData.closedAt, closedBy }
          : p
      ));
      return closingData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close period';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const reopenPeriod = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      FinancialPeriodsBusinessService.reopenPeriod(id);
      setPeriods(prev => prev.map(p => 
        p.id === id 
          ? { ...p, isClosed: false, closedAt: undefined, closedBy: undefined }
          : p
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reopen period';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Year Operations
  const createFinancialYear = useCallback(async (year: number): Promise<FinancialYear> => {
    try {
      setError(null);
      if (!settings) {
        throw new Error('Settings not loaded');
      }
      const newYear = FinancialPeriodsBusinessService.createFinancialYear(year, settings);
      setYears(prev => [...prev, newYear]);
      await refreshData(); // Refresh to get auto-created periods
      return newYear;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create financial year';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [settings]);

  const deleteFinancialYear = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      // In a real implementation, this would cascade delete periods
      setYears(prev => prev.filter(y => y.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete financial year';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Settings Operations
  const updateSettings = useCallback(async (newSettings: Partial<FinancialPeriodsSettings>): Promise<FinancialPeriodsSettings> => {
    try {
      setError(null);
      const updatedSettings = FinancialPeriodsBusinessService.saveSettings(newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Comparison Operations
  const comparePeriods = useCallback(async (currentId: string, comparativeId: string): Promise<PeriodComparison> => {
    try {
      setError(null);
      return FinancialPeriodsBusinessService.comparePeriods(currentId, comparativeId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare periods';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Utility Functions
  const refreshData = useCallback(async (): Promise<void> => {
    await loadData();
  }, [loadData]);

  const getPeriodById = useCallback((id: string): FinancialPeriod | null => {
    return periods.find(p => p.id === id) || null;
  }, [periods]);

  const getYearById = useCallback((id: string): FinancialYear | null => {
    return years.find(y => y.id === id) || null;
  }, [years]);

  const validatePeriod = useCallback((period: FinancialPeriod): void => {
    return FinancialPeriodsBusinessService.validatePeriod(period);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(defaultFormData);
  }, []);

  // Export/Import Operations
  const exportData = useCallback(() => {
    try {
      return {
        periods,
        years,
        settings,
        exportedAt: new Date().toISOString()
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      throw err;
    }
  }, [periods, years, settings]);

  const importData = useCallback(async (data: any): Promise<void> => {
    try {
      setError(null);
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid import data format');
      }
      
      if (data.periods) {
        setPeriods(data.periods);
      }
      if (data.years) {
        setYears(data.years);
      }
      if (data.settings) {
        setSettings(data.settings);
      }
      
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import data';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [refreshData]);

  return {
    // State
    periods,
    years,
    settings,
    filteredPeriods,
    currentPeriod,
    activePeriods,
    isLoading,
    error,
    
    // Filters
    filter,
    setFilter,
    
    // Form Management
    formData,
    setFormData,
    resetForm,
    
    // Period Operations
    createPeriod,
    updatePeriod,
    deletePeriod,
    closePeriod,
    reopenPeriod,
    
    // Year Operations
    createFinancialYear,
    deleteFinancialYear,
    
    // Settings Operations
    updateSettings,
    
    // Comparison Operations
    comparePeriods,
    
    // Utility Functions
    refreshData,
    getPeriodById,
    getYearById,
    validatePeriod,
    
    // Export/Import
    exportData,
    importData
  };
};