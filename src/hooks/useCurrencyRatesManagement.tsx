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
  handleResetToDefaults: (type: 'fiat' | 'crypto') => Promise<void>;
  updateRatesFromAPI?: (apiRates: CurrencyRate[], updateType: 'latest' | 'historical') => Promise<void>;
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
    console.log('🎬 useCurrencyRatesManagement: useEffect triggered', { initialData: !!initialData, fiatRatesLength: fiatRates.length });
    
    if (initialData) {
      console.log('📡 Has initial SSR data, syncing with database...');
      // If we have SSR data, still sync with database for persistence
      Promise.all([
        CurrencyRatesStorageService.saveFiatRates(fiatRates),
        CurrencyRatesStorageService.saveCryptoRates(cryptoRates)
      ]).catch(error => {
        console.error('Error syncing SSR data with database:', error);
      });
      return;
    }

    console.log('🔄 No initial data, loading from storage...');
    const loadData = async () => {
      try {
        console.log('📞 Calling CurrencyRatesStorageService.loadAllCurrencyRatesData()');
        const data = await CurrencyRatesStorageService.loadAllCurrencyRatesData();
        
        console.log(`📊 Loaded data: ${data.fiatRates.length} fiat, ${data.cryptoRates.length} crypto rates`);
        setFiatRates(data.fiatRates);
        setCryptoRates(data.cryptoRates);
        setIsLoaded(true);
        
      } catch (error) {
        console.error('❌ Error loading currency rates data:', error);
        toast.error('Failed to load currency rates data');
        
        // Load defaults on error
        console.log('🏗️ Loading defaults due to error');
        setFiatRates(CurrencyRatesBusinessService.getDefaultFiatCurrencies());
        setCryptoRates(CurrencyRatesBusinessService.getDefaultCryptoCurrencies());
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, [initialData]);

  // Debug effect to track component re-renders
  useEffect(() => {
    console.log('🔍 Component state changed:', { 
      isLoaded, 
      fiatRatesCount: fiatRates.length, 
      cryptoRatesCount: cryptoRates.length,
      hasInitialData: !!initialData 
    });
  }, [isLoaded, fiatRates.length, cryptoRates.length, initialData]);

  // Auto-save data when it changes
  useEffect(() => {
    if (isLoaded && fiatRates.length > 0) {
      CurrencyRatesStorageService.saveFiatRates(fiatRates).catch(error => {
        console.error('Error auto-saving fiat rates:', error);
      });
    }
  }, [fiatRates, isLoaded]);

  useEffect(() => {
    if (isLoaded && cryptoRates.length > 0) {
      CurrencyRatesStorageService.saveCryptoRates(cryptoRates).catch(error => {
        console.error('Error auto-saving crypto rates:', error);
      });
    }
  }, [cryptoRates, isLoaded]);

  // Custom crypto order
  const CRYPTO_ORDER = ['BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'USDT', 'USDC', 'BUSD'];
  
  // Sort crypto rates according to specified order
  const sortedCryptoRates = useMemo(() => {
    const sorted = [...cryptoRates];
    sorted.sort((a, b) => {
      const indexA = CRYPTO_ORDER.indexOf(a.code);
      const indexB = CRYPTO_ORDER.indexOf(b.code);
      
      // If both are in the order list, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one is in the order list, it comes first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Otherwise, sort alphabetically
      return a.code.localeCompare(b.code);
    });
    return sorted;
  }, [cryptoRates]);

  // Computed data using business service
  const processedData = useMemo((): CurrencyRatesData => {
    return CurrencyRatesBusinessService.processRatesData(fiatRates, sortedCryptoRates, validationErrors);
  }, [fiatRates, sortedCryptoRates, validationErrors]);

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
      // Auto-save fiat rates to storage
      setSaveStatus('saving');
      CurrencyRatesStorageService.saveFiatRates(updatedRates)
        .then(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        })
        .catch(error => {
          console.error('Error auto-saving fiat rates:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        });
    } else {
      const updatedRates = CurrencyRatesBusinessService.updateCurrencyRate(cryptoRates, code, rate);
      setCryptoRates(updatedRates);
      // Auto-save crypto rates to storage
      setSaveStatus('saving');
      CurrencyRatesStorageService.saveCryptoRates(updatedRates)
        .then(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        })
        .catch(error => {
          console.error('Error auto-saving crypto rates:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        });
    }
    
    // Trigger event to notify other components immediately
    window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
  }, [fiatRates, cryptoRates]);

  // Manual save handler
  const handleSaveRates = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await CurrencyRatesStorageService.saveAllRates(fiatRates, cryptoRates);
      
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
  const handleResetToDefaults = useCallback(async (type: 'fiat' | 'crypto') => {
    const confirmMessage = `Are you sure you want to reset all ${type} currency rates to default values?`;
    
    if (confirm(confirmMessage)) {
      setSaveStatus('saving');
      try {
        // Clear validation errors for this type
        setValidationErrors(prev => {
          const newErrors = new Map(prev);
          const ratesToClear = type === 'fiat' ? fiatRates : cryptoRates;
          ratesToClear.forEach(rate => newErrors.delete(rate.code));
          return newErrors;
        });

        if (type === 'fiat') {
          const defaultRates = await CurrencyRatesStorageService.resetFiatRatesToDefaults();
          setFiatRates(defaultRates);
        } else {
          const defaultRates = await CurrencyRatesStorageService.resetCryptoRatesToDefaults();
          setCryptoRates(defaultRates);
        }
        
        // Auto-save is already handled by the reset functions in storage service
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        
        // Trigger event to notify other components
        window.dispatchEvent(new CustomEvent('currencyRatesUpdated'));
        toast.success(`${type === 'fiat' ? 'FIAT' : 'Crypto'} rates reset to defaults`);
      } catch (error) {
        console.error(`Error resetting ${type} rates:`, error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        toast.error(`Failed to reset ${type} rates`);
      }
    }
  }, [fiatRates, cryptoRates]);

  // Update rates from API data
  const updateRatesFromAPI = useCallback(async (apiRates: CurrencyRate[], updateType: 'latest' | 'historical') => {
    setSaveStatus('saving');
    try {
      // Use business service to merge API rates with existing rates
      const { fiatRates: updatedFiatRates, cryptoRates: updatedCryptoRates } = 
        CurrencyRatesBusinessService.mergeWithAPIRates(fiatRates, cryptoRates, apiRates);
      
      // Update state with merged rates
      setFiatRates(updatedFiatRates);
      setCryptoRates(updatedCryptoRates);
      
      // Auto-save API updates to storage
      try {
        await CurrencyRatesStorageService.saveAllRates(updatedFiatRates, updatedCryptoRates);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Error auto-saving API rates:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
      
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
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
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