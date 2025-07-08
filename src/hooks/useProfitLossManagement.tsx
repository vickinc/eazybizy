import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { BookkeepingEntry, Company } from '@/types';
import { ProfitLossStorageService } from '@/services/storage/profitLossStorageService';
import { 
  ProfitLossBusinessService,
  PLData,
  PLSummary,
  PLComparison,
  EnhancedPLData
} from '@/services/business/profitLossBusinessService';
import { 
  ProfitLossExportService,
  ExportOptions
} from '@/services/export/profitLossExportService';

export type PeriodType = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom' | 'allTime';
export type ComparisonPeriodType = 'lastMonth' | 'lastYear' | 'thisYear';

export interface ProfitLossManagementHook {
  // Core Data
  entries: BookkeepingEntry[];
  
  // Enhanced Computed Data
  enhancedData: EnhancedPLData | null;
  
  // UI State
  isLoaded: boolean;
  period: PeriodType;
  customStartDate: string;
  customEndDate: string;
  comparisonPeriod: ComparisonPeriodType;
  showComparison: boolean;
  
  // Page Metadata
  pageTitle: string;
  pageDescription: string;
  
  // Period Controls
  setPeriod: (period: PeriodType) => void;
  setCustomStartDate: (date: string) => void;
  setCustomEndDate: (date: string) => void;
  setComparisonPeriod: (period: ComparisonPeriodType) => void;
  setShowComparison: (show: boolean) => void;
  
  // Export Functions
  exportToPDF: () => Promise<void>;
  exportToExcel: () => Promise<void>;
  exportToJSON: () => Promise<void>;
  exportToCSV: () => Promise<void>;
  exportMultipleFormats: (formats: string[]) => Promise<void>;
  
  // Data Management
  refreshData: () => Promise<void>;
  getStorageInfo: () => Promise<any>;
  
  // Validation
  isCustomPeriodValid: boolean;
  customPeriodError: string | null;
}

export const useProfitLossManagement = (
  selectedCompany: number | 'all',
  companies: Company[]
): ProfitLossManagementHook => {
  // Core Data State
  const [entries, setEntries] = useState<BookkeepingEntry[]>([]);
  
  // UI State
  const [isLoaded, setIsLoaded] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('thisYear');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriodType>('lastYear');
  const [showComparison, setShowComparison] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Migrate data if needed
        await ProfitLossStorageService.migrateData();
        
        // Load entries
        const loadedEntries = await ProfitLossStorageService.loadBookkeepingEntries();
        setEntries(loadedEntries);
        setIsLoaded(true);
        
        console.log(`Loaded ${loadedEntries.length} bookkeeping entries`);
      } catch (error) {
        console.error('Error loading P&L data:', error);
        toast.error('Failed to load financial data');
        setEntries([]);
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, []);

  // Validate custom period
  const customPeriodValidation = useMemo(() => {
    if (period !== 'custom') {
      return { isValid: true, error: null };
    }
    
    if (!customStartDate || !customEndDate) {
      return { isValid: false, error: 'Both start and end dates are required' };
    }
    
    const validation = ProfitLossBusinessService.validatePeriodDates(customStartDate, customEndDate);
    return { isValid: validation.isValid, error: validation.error || null };
  }, [period, customStartDate, customEndDate]);

  const isCustomPeriodValid = customPeriodValidation.isValid;
  const customPeriodError = customPeriodValidation.error;

  // Enhanced computed data
  const enhancedData = useMemo((): EnhancedPLData | null => {
    if (!isLoaded) return null;
    
    try {
      return ProfitLossBusinessService.processEnhancedPLData(
        entries,
        period,
        selectedCompany,
        companies,
        customStartDate,
        customEndDate,
        showComparison ? comparisonPeriod : undefined
      );
    } catch (error) {
      console.error('Error processing P&L data:', error);
      toast.error('Error processing financial data');
      return null;
    }
  }, [
    entries, 
    period, 
    selectedCompany, 
    companies, 
    customStartDate, 
    customEndDate, 
    showComparison, 
    comparisonPeriod,
    isLoaded
  ]);

  // Page metadata
  const pageTitle = useMemo(() => {
    return ProfitLossBusinessService.generatePageTitle();
  }, []);

  const pageDescription = useMemo(() => {
    return ProfitLossBusinessService.generatePageDescription();
  }, []);

  // Export options factory
  const createExportOptions = useCallback((): ExportOptions | null => {
    if (!enhancedData) return null;
    
    return {
      plData: enhancedData.plData,
      companyName: enhancedData.companyName,
      periodName: enhancedData.periodName,
      formatCurrency: ProfitLossBusinessService.formatCurrency
    };
  }, [enhancedData]);

  // Export functions
  const exportToPDF = useCallback(async () => {
    try {
      const options = createExportOptions();
      if (!options) {
        toast.error('No data available for export');
        return;
      }
      
      await ProfitLossExportService.exportToPDF(options);
      toast.success('P&L statement exported as PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  }, [createExportOptions]);

  const exportToExcel = useCallback(async () => {
    try {
      const options = createExportOptions();
      if (!options) {
        toast.error('No data available for export');
        return;
      }
      
      await ProfitLossExportService.exportToExcel(options);
      toast.success('P&L statement exported as Excel');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Failed to export Excel file');
    }
  }, [createExportOptions]);

  const exportToJSON = useCallback(async () => {
    try {
      const options = createExportOptions();
      if (!options) {
        toast.error('No data available for export');
        return;
      }
      
      await ProfitLossExportService.exportToJSON(options);
      toast.success('P&L statement exported as JSON');
    } catch (error) {
      console.error('JSON export error:', error);
      toast.error('Failed to export JSON');
    }
  }, [createExportOptions]);

  const exportToCSV = useCallback(async () => {
    try {
      const options = createExportOptions();
      if (!options) {
        toast.error('No data available for export');
        return;
      }
      
      await ProfitLossExportService.exportToCSV(options);
      toast.success('P&L statement exported as CSV');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV');
    }
  }, [createExportOptions]);

  const exportMultipleFormats = useCallback(async (formats: string[]) => {
    try {
      const options = createExportOptions();
      if (!options) {
        toast.error('No data available for export');
        return;
      }
      
      await ProfitLossExportService.exportMultipleFormats(options, formats);
      toast.success(`P&L statement exported in ${formats.length} formats`);
    } catch (error) {
      console.error('Multiple format export error:', error);
      toast.error('Failed to export in some formats');
    }
  }, [createExportOptions]);

  // Data management functions
  const refreshData = useCallback(async () => {
    try {
      const loadedEntries = await ProfitLossStorageService.loadBookkeepingEntries();
      setEntries(loadedEntries);
      console.log('P&L data refreshed successfully');
      toast.success('Financial data refreshed');
    } catch (error) {
      console.error('Error refreshing P&L data:', error);
      toast.error('Failed to refresh financial data');
    }
  }, []);

  const getStorageInfo = useCallback(async () => {
    try {
      return await ProfitLossStorageService.getStorageInfo();
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }, []);

  return {
    // Core Data
    entries,
    
    // Enhanced Computed Data
    enhancedData,
    
    // UI State
    isLoaded,
    period,
    customStartDate,
    customEndDate,
    comparisonPeriod,
    showComparison,
    
    // Page Metadata
    pageTitle,
    pageDescription,
    
    // Period Controls
    setPeriod,
    setCustomStartDate,
    setCustomEndDate,
    setComparisonPeriod,
    setShowComparison,
    
    // Export Functions
    exportToPDF,
    exportToExcel,
    exportToJSON,
    exportToCSV,
    exportMultipleFormats,
    
    // Data Management
    refreshData,
    getStorageInfo,
    
    // Validation
    isCustomPeriodValid,
    customPeriodError
  };
};