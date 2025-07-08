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
}

export const useCurrencyRatesManagement = (): CurrencyRatesManagementHook => {
  // Core Data State
  const [fiatRates, setFiatRates] = useState<CurrencyRate[]>([]);
  const [cryptoRates, setCryptoRates] = useState<CurrencyRate[]>([]);
  
  // UI State
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'fiat' | 'crypto'>('fiat');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Validation State
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await CurrencyRatesStorageService.loadAllCurrencyRatesData();
        
        setFiatRates(data.fiatRates);
        setCryptoRates(data.cryptoRates);
        setIsLoaded(true);
        
        console.log('Currency rates loaded successfully');
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
  }, []);

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
      console.log(`Auto-saved FIAT rate change: ${code} = ${rate}`);
    } else {
      const updatedRates = CurrencyRatesBusinessService.updateCurrencyRate(cryptoRates, code, rate);
      setCryptoRates(updatedRates);
      console.log(`Auto-saved crypto rate change: ${code} = ${rate}`);
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
      console.log('Currency rates saved successfully');
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
          console.log('Reset and saved FIAT rates to defaults');
        } else {
          const defaultRates = CurrencyRatesStorageService.resetCryptoRatesToDefaults();
          setCryptoRates(defaultRates);
          console.log('Reset and saved crypto rates to defaults');
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
    handleResetToDefaults
  };
};