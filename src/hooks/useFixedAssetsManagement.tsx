import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  FixedAsset,
  FixedAssetFormData,
  FixedAssetStats,
  FixedAssetFilter,
  TableSortConfig,
  AssetCategory,
  AssetStatus,
  DepreciationMethod
} from '@/types/fixedAssets.types';
import { FixedAssetsBusinessService } from '@/services/business/fixedAssetsBusinessService';
import { FixedAssetsValidationService } from '@/services/business/fixedAssetsValidationService';
import { FixedAssetsDepreciationService } from '@/services/business/fixedAssetsDepreciationService';
import { FixedAssetsStorageService } from '@/services/storage/fixedAssetsStorageService';
import { ValidationError } from '@/services/business/fixedAssetsValidationService';

export interface FixedAssetsManagementHook {
  // Data
  assets: FixedAsset[];
  filteredAssets: FixedAsset[];
  stats: FixedAssetStats;
  isLoaded: boolean;
  
  // Dialog state
  showAssetDialog: boolean;
  showDisposalDialog: boolean;
  editingAsset: FixedAsset | null;
  disposingAsset: FixedAsset | null;
  
  // Form state
  formData: FixedAssetFormData;
  validationErrors: ValidationError[];
  isSubmitting: boolean;
  
  // Filter and sort state
  filter: FixedAssetFilter;
  sortConfig: TableSortConfig;
  
  // CRUD operations
  handleCreate: () => void;
  handleEdit: (asset: FixedAsset) => void;
  handleDelete: (id: string) => void;
  handleDispose: (asset: FixedAsset) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  handleFormInputChange: (field: keyof FixedAssetFormData, value: any) => void;
  
  // Dialog management
  setShowAssetDialog: (show: boolean) => void;
  setShowDisposalDialog: (show: boolean) => void;
  resetForm: () => void;
  
  // Filter and sort
  handleFilterChange: (field: keyof FixedAssetFilter, value: any) => void;
  clearFilters: () => void;
  handleSort: (field: TableSortConfig['field']) => void;
  
  // Utility functions
  exportToCSV: () => string;
  initializeDefaultAssets: () => void;
  refreshDepreciation: () => void;
  getFieldError: (field: keyof FixedAssetFormData) => string | undefined;
  hasFieldError: (field: keyof FixedAssetFormData) => boolean;
  
  // Depreciation functions
  generateDepreciationSchedule: (asset: FixedAsset) => any[];
  calculateCurrentDepreciation: (asset: FixedAsset) => number;
}

const initialFormData: FixedAssetFormData = {
  code: '',
  name: '',
  description: '',
  category: 'Computer Equipment',
  subcategory: '',
  acquisitionDate: new Date().toISOString().split('T')[0],
  acquisitionCost: '',
  depreciationMethod: 'straight_line',
  usefulLifeYears: '5',
  residualValue: '0',
  depreciationStartDate: new Date().toISOString().split('T')[0],
  location: '',
  assignedTo: '',
  department: '',
  supplier: '',
  invoiceNumber: '',
  assetAccountCode: '',
  depreciationAccountCode: '',
  accumulatedDepreciationAccountCode: '',
  notes: '',
  tags: ''
};

const initialFilter: FixedAssetFilter = {
  search: '',
  category: 'all',
  status: 'all',
  depreciationMethod: 'all',
  location: '',
  department: '',
  acquisitionDateRange: {
    start: '',
    end: ''
  },
  bookValueRange: {
    min: 0,
    max: Number.MAX_VALUE
  }
};

const initialSortConfig: TableSortConfig = {
  field: 'code',
  direction: 'asc'
};

export const useFixedAssetsManagement = (): FixedAssetsManagementHook => {
  // State
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [showDisposalDialog, setShowDisposalDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [disposingAsset, setDisposingAsset] = useState<FixedAsset | null>(null);
  const [formData, setFormData] = useState<FixedAssetFormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<FixedAssetFilter>(initialFilter);
  const [sortConfig, setSortConfig] = useState<TableSortConfig>(initialSortConfig);

  // Load assets on mount
  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = useCallback(() => {
    try {
      const allAssets = FixedAssetsBusinessService.getAllAssets();
      setAssets(allAssets);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading fixed assets:', error);
      toast.error('Failed to load fixed assets');
      setIsLoaded(true);
    }
  }, []);

  // Save assets when changed
  useEffect(() => {
    if (isLoaded && assets.length > 0) {
      FixedAssetsStorageService.saveAssets(assets);
    }
  }, [assets, isLoaded]);

  // Computed values
  const stats = useMemo(() => {
    return FixedAssetsBusinessService.calculateStats(assets);
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const filtered = FixedAssetsBusinessService.filterAssets(assets, filter);
    return FixedAssetsBusinessService.sortAssets(filtered, sortConfig);
  }, [assets, filter, sortConfig]);

  // CRUD operations
  const handleCreate = useCallback(() => {
    setEditingAsset(null);
    setFormData(initialFormData);
    setValidationErrors([]);
    setShowAssetDialog(true);
  }, []);

  const handleEdit = useCallback((asset: FixedAsset) => {
    setEditingAsset(asset);
    setFormData({
      code: asset.code,
      name: asset.name,
      description: asset.description,
      category: asset.category,
      subcategory: asset.subcategory || '',
      acquisitionDate: asset.acquisitionDate.split('T')[0],
      acquisitionCost: asset.acquisitionCost.toString(),
      supplier: asset.supplier || '',
      invoiceNumber: asset.invoiceNumber || '',
      depreciationMethod: asset.depreciationMethod,
      usefulLifeYears: asset.usefulLifeYears.toString(),
      residualValue: asset.residualValue.toString(),
      depreciationStartDate: asset.depreciationStartDate.split('T')[0],
      location: asset.location || '',
      assignedTo: asset.assignedTo || '',
      department: asset.department || '',
      assetAccountCode: asset.assetAccountCode || '',
      depreciationAccountCode: asset.depreciationAccountCode || '',
      accumulatedDepreciationAccountCode: asset.accumulatedDepreciationAccountCode || '',
      notes: asset.notes || '',
      tags: asset.tags?.join(', ') || ''
    });
    setValidationErrors([]);
    setShowAssetDialog(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const validation = FixedAssetsValidationService.validateAssetDeletion(id);
      
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
      }

      if (confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
        setAssets(prev => prev.filter(asset => asset.id !== id));
        FixedAssetsStorageService.deleteAsset(id);
        toast.success('Asset deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset');
    }
  }, []);

  const handleDispose = useCallback((asset: FixedAsset) => {
    setDisposingAsset(asset);
    setShowDisposalDialog(true);
  }, []);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      const validation = FixedAssetsValidationService.validateAssetForm(
        formData,
        editingAsset?.id
      );

      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        setIsSubmitting(false);
        return;
      }

      if (editingAsset) {
        // Update existing asset
        const updatedAsset = FixedAssetsBusinessService.updateAssetFromFormData(
          editingAsset,
          formData
        );
        
        setAssets(prev => prev.map(asset => 
          asset.id === editingAsset.id ? updatedAsset : asset
        ));
        
        toast.success('Asset updated successfully');
      } else {
        // Create new asset
        const newAsset = FixedAssetsBusinessService.createAssetFromFormData(formData);
        setAssets(prev => [newAsset, ...prev]);
        toast.success('Asset created successfully');
      }

      resetForm();
      setShowAssetDialog(false);
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error('Failed to save asset');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingAsset]);

  const handleFormInputChange = useCallback((field: keyof FixedAssetFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(error => error.field !== field));
    
    // Validate field in real-time
    const fieldErrors = FixedAssetsValidationService.validateFormField(field, value, formData);
    if (fieldErrors.length > 0) {
      setValidationErrors(prev => [...prev.filter(e => e.field !== field), ...fieldErrors]);
    }
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setEditingAsset(null);
    setValidationErrors([]);
  }, []);

  // Filter and sort handlers
  const handleFilterChange = useCallback((field: keyof FixedAssetFilter, value: any) => {
    setFilter(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter(initialFilter);
  }, []);

  const handleSort = useCallback((field: TableSortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Utility functions
  const exportToCSV = useCallback(() => {
    return FixedAssetsBusinessService.exportToCSV(filteredAssets);
  }, [filteredAssets]);

  const initializeDefaultAssets = useCallback(() => {
    const defaultAssets = FixedAssetsBusinessService.initializeDefaultAssets();
    setAssets(defaultAssets);
    toast.success('Default assets loaded successfully');
  }, []);

  const refreshDepreciation = useCallback(() => {
    const updatedAssets = assets.map(asset => {
      if (FixedAssetsDepreciationService.needsDepreciationUpdate(asset)) {
        return FixedAssetsDepreciationService.updateAssetDepreciation(asset);
      }
      return asset;
    });
    
    setAssets(updatedAssets);
    toast.success('Depreciation calculations updated');
  }, [assets]);

  const getFieldError = useCallback((field: keyof FixedAssetFormData): string | undefined => {
    const error = validationErrors.find(e => e.field === field);
    return error?.message;
  }, [validationErrors]);

  const hasFieldError = useCallback((field: keyof FixedAssetFormData): boolean => {
    return validationErrors.some(e => e.field === field);
  }, [validationErrors]);

  const generateDepreciationSchedule = useCallback((asset: FixedAsset) => {
    return FixedAssetsDepreciationService.generateDepreciationSchedule(asset);
  }, []);

  const calculateCurrentDepreciation = useCallback((asset: FixedAsset) => {
    return FixedAssetsDepreciationService.calculateCurrentPeriodDepreciation(asset);
  }, []);

  return {
    // Data
    assets,
    filteredAssets,
    stats,
    isLoaded,
    
    // Dialog state
    showAssetDialog,
    showDisposalDialog,
    editingAsset,
    disposingAsset,
    
    // Form state
    formData,
    validationErrors,
    isSubmitting,
    
    // Filter and sort state
    filter,
    sortConfig,
    
    // CRUD operations
    handleCreate,
    handleEdit,
    handleDelete,
    handleDispose,
    handleFormSubmit,
    handleFormInputChange,
    
    // Dialog management
    setShowAssetDialog,
    setShowDisposalDialog,
    resetForm,
    
    // Filter and sort
    handleFilterChange,
    clearFilters,
    handleSort,
    
    // Utility functions
    exportToCSV,
    initializeDefaultAssets,
    refreshDepreciation,
    getFieldError,
    hasFieldError,
    
    // Depreciation functions
    generateDepreciationSchedule,
    calculateCurrentDepreciation
  };
};