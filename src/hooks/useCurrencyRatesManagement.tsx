import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { CurrencyRate } from '@/types';
import { CurrencyRatesStorageService } from '@/services/storage/currencyRatesStorageService';
import { 
  CurrencyRatesBusinessService,
  EnhancedCurrencyRate,
  CurrencyRatesSummary,
  CurrencyRatesData
} from '@/services/business/currencyRatesBusinessService';

export interface CurrencyRatesManagementHook {
  // Core Data
  fiatRates: CurrencyRate[];
  cryptoRates: CurrencyRate[];
  
  // Computed Data
  enhancedFiatRates: EnhancedCurrencyRate[];
  enhancedCryptoRates: EnhancedCurrencyRate[];
  summary: CurrencyRatesSummary;
  pageTitle: string;
  pageDescription: string;
  
  // UI State
  isLoaded: boolean;
  activeTab: 'fiat' | 'crypto';
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  
  // Event Handlers
  setActiveTab: (tab: 'fiat' | 'crypto') => void;
  
  // Rate Management
  handleRateChange: (code: string, newRate: string, type: 'fiat' | 'crypto') => void;
  handleSaveRates: () => Promise<void>;
  handleResetToDefaults: (type: 'fiat' | 'crypto') => void;
  updateRatesFromAPI?: (apiRates: CurrencyRate[], updateType: 'latest' | 'historical') => void;
}

interface InitialCurrencyData {
  fiatRates: EnhancedCurrencyRate[];
  cryptoRates: EnhancedCurrencyRate[];
  baseCurrency: string;
  lastSaved: string;
  metadata?: {
    userId?: string;
    companyId?: string;
    cached?: boolean;
  };
}

export const useCurrencyRatesManagement = (initialData?: InitialCurrencyData): CurrencyRatesManagementHook => {
  // Core Data State - initialize with SSR data if available
  const [fiatRates, setFiatRates] = useState<CurrencyRate[]>(
    initialData?.fiatRates.map(rate => ({
      code: rate.code,
      name: rate.name,
      rate: rate.rate,
      type: rate.type,
      lastUpdated: rate.lastUpdated
    })) || []
  );
  const [cryptoRates, setCryptoRates] = useState<CurrencyRate[]>(
    initialData?.cryptoRates.map(rate => ({
      code: rate.code,
      name: rate.name,
      rate: rate.rate,
      type: rate.type,
      lastUpdated: rate.lastUpdated
    })) || []
  );
  
  // UI State - set as loaded if we have initial data
  const [isLoaded, setIsLoaded] = useState(!!initialData);
  const [activeTab, setActiveTab] = useState<'fiat' | 'crypto'>('fiat');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Validation State
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());

  // Load data on mount (only if no initial data provided)
  useEffect(() => {
    if (initialData) {
      // If we have SSR data, still sync with localStorage for client-side persistence
      try {
        CurrencyRatesStorageService.saveFiatRates(fiatRates);
        CurrencyRatesStorageService.saveCryptoRates(cryptoRates);
      } catch (error) {
        console.error('Error syncing SSR data with localStorage:', error);
      }
      return;
    }

    const loadData = async () => {
      try {
        const data = await CurrencyRatesStorageService.loadAllCurrencyRatesData();
        
        setFiatRates(data.fiatRates);
        setCryptoRates(data.cryptoRates);
        setIsLoaded(true);
        
      } catch (error) {
        console.error('Error loading currency rates data:', error);
        toast.error('Failed to load currency rates data');
        
        // Load defaults on error
        setFiatRates(CurrencyRatesBusinessService.getDefaultFiatCurrencies());
        setCryptoRates(CurrencyRatesBusinessService.getDefaultCryptoCurrencies());
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, [initialData]);

  // Auto-save data when it changes
  useEffect(() => {
    if (isLoaded && fiatRates.length > 0) {
      try {
        CurrencyRatesStorageService.saveFiatRates(fiatRates);
      } catch (error) {
        console.error('Error auto-saving fiat rates:', error);
      }
    }
  }, [fiatRates, isLoaded]);

  useEffect(() => {
    if (isLoaded && cryptoRates.length > 0) {
      try {
        CurrencyRatesStorageService.saveCryptoRates(cryptoRates);
      } catch (error) {
        console.error('Error auto-saving crypto rates:', error);
      }
    }
  }, [cryptoRates, isLoaded]);

  // Computed data using business service
  const processedData = useMemo((): CurrencyRatesData => {
    return CurrencyRatesBusinessService.processRatesData(fiatRates, cryptoRates, validationErrors);
  }, [fiatRates, cryptoRates, validationErrors]);

  // Extract computed values
  const {
    enhancedFiatRates,
    enhancedCryptoRates,
    summary
  } = processedData;

  // Page metadata
  const pageTitle = useMemo(() => {
    return CurrencyRatesBusinessService.generatePageTitle();
  }, []);

  const pageDescription = useMemo(() => {
    return CurrencyRatesBusinessService.generatePageDescription();
  }, []);

  // Rate change handler with auto-save and validation
  const handleRateChange = useCallback((code: string, newRateValue: string, type: 'fiat' | 'crypto') => {
    // Don't allow editing base currency
    if (CurrencyRatesBusinessService.isBaseRate(code)) {
      return;
    }

    // Validate input format first
    if (!CurrencyRatesBusinessService.validateRateInput(newRateValue)) {
      // Set validation error for invalid format
      setValidationErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.set(code, 'Invalid format: numbers and decimal points only');
        return newErrors;
      });
      return;
    }

    // Validate rate value
    const validation = CurrencyRatesBusinessService.validateRateValue(newRateValue);
    
    if (!validation.isValid) {
      // Set validation error
      setValidationErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.set(code, validation.error!);
        return newErrors;
      });
      return;
    }

    // Clear any existing validation error
    setValidationErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(code);
      return newErrors;
    });

    const rate = CurrencyRatesBusinessService.parseRateInput(newRateValue);
    
    if (type === 'fiat') {
      const updatedRates = CurrencyRatesBusinessService.updateCurrencyRate(fiatRates, code, rate);
      setFiatRates(updatedRates);
    } else {
      const updatedRates = CurrencyRatesBusinessService.updateCurrencyRate(cryptoRates, code, rate);
      setCryptoRates(updatedRates);
    }
    
    // Trigger event to notify other components immediately
    window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
  }, [fiatRates, cryptoRates]);

  // Manual save handler
  const handleSaveRates = useCallback(async () => {
    setSaveStatus('saving');
    try {
      CurrencyRatesStorageService.saveAllRates(fiatRates, cryptoRates);
      
      // Trigger custom event to notify other components
      window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving currency rates:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      toast.error('Failed to save currency rates');
    }
  }, [fiatRates, cryptoRates]);

  // Reset to defaults handler
  const handleResetToDefaults = useCallback((type: 'fiat' | 'crypto') => {
    const confirmMessage = `Are you sure you want to reset all ${type} currency rates to default values?`;
    
    if (confirm(confirmMessage)) {
      try {
        // Clear validation errors for this type
        setValidationErrors(prev => {
          const newErrors = new Map(prev);
          const ratesToClear = type === 'fiat' ? fiatRates : cryptoRates;
          ratesToClear.forEach(rate => newErrors.delete(rate.code));
          return newErrors;
        });

        if (type === 'fiat') {
          const defaultRates = CurrencyRatesStorageService.resetFiatRatesToDefaults();
          setFiatRates(defaultRates);
        } else {
          const defaultRates = CurrencyRatesStorageService.resetCryptoRatesToDefaults();
          setCryptoRates(defaultRates);
        }
        
        // Trigger event to notify other components
        window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
        toast.success(`${type === 'fiat' ? 'FIAT' : 'Crypto'} rates reset to defaults`);
      } catch (error) {
        console.error(`Error resetting ${type} rates:`, error);
        toast.error(`Failed to reset ${type} rates`);
      }
    }
  }, [fiatRates, cryptoRates]);

  // Update rates from API data
  const updateRatesFromAPI = useCallback((apiRates: CurrencyRate[], updateType: 'latest' | 'historical') => {
    try {
      // Use business service to merge API rates with existing rates
      const { fiatRates: updatedFiatRates, cryptoRates: updatedCryptoRates } = 
        CurrencyRatesBusinessService.mergeWithAPIRates(fiatRates, cryptoRates, apiRates);
      
      // Update state with merged rates
      setFiatRates(updatedFiatRates);
      setCryptoRates(updatedCryptoRates);
      
      // Create update summary
      const fiatSummary = CurrencyRatesBusinessService.createUpdateSummary(fiatRates, updatedFiatRates);
      const cryptoSummary = CurrencyRatesBusinessService.createUpdateSummary(cryptoRates, updatedCryptoRates);
      
      console.log(`API Update (${updateType}):`, {
        fiat: fiatSummary,
        crypto: cryptoSummary
      });
      
      // Trigger event to notify other components
      window.dispatchEvent(new CustomEvent('currencyRatesUpdated', {
        detail: { updateType, apiRates }
      }));
      
    } catch (error) {
      console.error('Error updating rates from API:', error);
      toast.error('Failed to update currency rates from API');
    }
  }, [fiatRates, cryptoRates]);

  return {
    // Core Data
    fiatRates,
    cryptoRates,
    
    // Computed Data
    enhancedFiatRates,
    enhancedCryptoRates,
    summary,
    pageTitle,
    pageDescription,
    
    // UI State
    isLoaded,
    activeTab,
    saveStatus,
    
    // Event Handlers
    setActiveTab,
    
    // Rate Management
    handleRateChange,
    handleSaveRates,
    handleResetToDefaults,
    updateRatesFromAPI
  };
};