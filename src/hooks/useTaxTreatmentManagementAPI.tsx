import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  TaxTreatment,
  TaxTreatmentFormData,
  TaxTreatmentStats,
  TaxTreatmentFilter,
  TaxTreatmentTableSortConfig,
  TaxCategory,
  TaxApplicability
} from '@/types/taxTreatment.types';
import { TaxTreatmentBusinessService } from '@/services/business/taxTreatmentBusinessService';
import { TaxTreatmentValidationService, ValidationError } from '@/services/business/taxTreatmentValidationService';
import { 
  useTaxTreatments, 
  useTaxTreatmentsOperations,
  useBulkCreateTaxTreatments
} from '@/hooks/useTaxTreatmentsAPI';

export interface TaxTreatmentManagementHook {
  // Data
  treatments: TaxTreatment[];
  filteredTreatments: TaxTreatment[];
  stats: TaxTreatmentStats;
  isLoaded: boolean;
  
  // Dialog state
  showDialog: boolean;
  editingTreatment: TaxTreatment | null;
  
  // Form state
  formData: TaxTreatmentFormData;
  validationErrors: ValidationError[];
  isSubmitting: boolean;
  
  // Filter and sort state
  filter: TaxTreatmentFilter;
  sortConfig: TaxTreatmentTableSortConfig;
  
  // CRUD operations
  handleCreate: () => void;
  handleEdit: (treatment: TaxTreatment) => void;
  handleDelete: (id: string) => void;
  handleToggleActive: (id: string) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  handleFormInputChange: (field: keyof TaxTreatmentFormData, value: unknown) => void;
  
  // Dialog management
  setShowDialog: (show: boolean) => void;
  resetForm: () => void;
  
  // Filter and sort
  handleFilterChange: (field: keyof TaxTreatmentFilter, value: unknown) => void;
  clearFilters: () => void;
  handleSort: (field: TaxTreatmentTableSortConfig['field']) => void;
  
  // Utility functions
  exportToCSV: () => string;
  initializeDefaults: () => void;
  resetToDefaults: () => void;
  getFieldError: (field: keyof TaxTreatmentFormData) => string | undefined;
  hasFieldError: (field: keyof TaxTreatmentFormData) => boolean;
}

const initialFormData: TaxTreatmentFormData = {
  code: '',
  name: '',
  description: '',
  rate: '',
  category: 'standard',
  applicability: ['sales'],
  isActive: true
};

const initialFilter: TaxTreatmentFilter = {
  search: '',
  category: 'all',
  isActive: 'all',
  applicability: 'all',
  rateRange: { min: 0, max: 100 }
};

const initialSortConfig: TaxTreatmentTableSortConfig = {
  field: 'code',
  direction: 'asc'
};

export const useTaxTreatmentManagementAPI = (): TaxTreatmentManagementHook => {
  // Form State
  const [showDialog, setShowDialog] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<TaxTreatment | null>(null);
  const [formData, setFormData] = useState<TaxTreatmentFormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter and Sort State
  const [filter, setFilter] = useState<TaxTreatmentFilter>(initialFilter);
  const [sortConfig, setSortConfig] = useState<TaxTreatmentTableSortConfig>(initialSortConfig);
  
  // API Query parameters based on filter
  const queryParams = useMemo(() => ({
    search: filter.search,
    category: filter.category,
    isActive: filter.isActive,
    applicability: filter.applicability,
    minRate: filter.rateRange.min,
    maxRate: filter.rateRange.max,
    sortField: sortConfig.field,
    sortDirection: sortConfig.direction,
    take: 1000, // Get all treatments for now (can be paginated later)
  }), [filter, sortConfig]);
  
  // API Hooks
  const { data: treatmentsResponse, isLoading, error } = useTaxTreatments(queryParams);
  const { createTreatment, updateTreatment, deleteTreatment } = useTaxTreatmentsOperations();
  const bulkCreate = useBulkCreateTaxTreatments();
  
  // Derived state
  const treatments = treatmentsResponse?.data || [];
  const isLoaded = !isLoading;

  // Filtered treatments are now handled by the API query, but we still apply local sorting
  const filteredTreatments = useMemo(() => {
    // The API already handles filtering, we just apply sorting here
    return [...treatments].sort((a, b) => {
      const aValue = a[sortConfig.field as keyof TaxTreatment];
      const bValue = b[sortConfig.field as keyof TaxTreatment];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [treatments, sortConfig]);

  // Stats calculation from API response or calculated locally
  const stats = useMemo((): TaxTreatmentStats => {
    if (treatmentsResponse?.statistics) {
      // Use API statistics if available
      return {
        total: treatmentsResponse.statistics.total,
        active: treatmentsResponse.statistics.activeStats?.active || 0,
        inactive: treatmentsResponse.statistics.activeStats?.inactive || 0,
        byCategory: treatmentsResponse.statistics.categoryStats as any || {}
      };
    } else {
      // Fallback to local calculation
      const total = treatments.length;
      const active = treatments.filter(t => t.isActive).length;
      const inactive = total - active;
      const byCategory: { [key in TaxCategory]: number } = {
        standard: 0,
        reduced: 0,
        exempt: 0,
        special: 0,
        acquisition: 0,
        margin: 0,
        property: 0
      };
      
      treatments.forEach(treatment => {
        byCategory[treatment.category]++;
      });
      
      return { total, active, inactive, byCategory };
    }
  }, [treatments, treatmentsResponse?.statistics]);

  // CRUD Operations
  const handleCreate = useCallback(() => {
    setEditingTreatment(null);
    setFormData(initialFormData);
    setValidationErrors([]);
    setShowDialog(true);
  }, []);

  const handleEdit = useCallback((treatment: TaxTreatment) => {
    setEditingTreatment(treatment);
    setFormData({
      code: treatment.code,
      name: treatment.name,
      description: treatment.description,
      rate: treatment.rate.toString(),
      category: treatment.category,
      applicability: treatment.applicability,
      isActive: treatment.isActive
    });
    setValidationErrors([]);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this tax treatment? This action cannot be undone.')) {
      try {
        await deleteTreatment.mutateAsync(id);
      } catch (error) {
        console.error('Delete treatment error:', error);
      }
    }
  }, [deleteTreatment]);

  const handleToggleActive = useCallback(async (id: string) => {
    const treatment = treatments.find(t => t.id === id);
    if (treatment) {
      try {
        await updateTreatment.mutateAsync({
          id,
          data: { isActive: !treatment.isActive }
        });
      } catch (error) {
        console.error('Toggle active treatment error:', error);
      }
    }
  }, [treatments, updateTreatment]);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = TaxTreatmentValidationService.validateForm(formData);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      toast.error(errors[0].message);
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingTreatment) {
        // Update existing treatment
        await updateTreatment.mutateAsync({
          id: editingTreatment.id,
          data: formData
        });
      } else {
        // Create new treatment
        await createTreatment.mutateAsync(formData);
      }

      resetForm();
      setShowDialog(false);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingTreatment, updateTreatment, createTreatment]);

  const handleFormInputChange = useCallback((field: keyof TaxTreatmentFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  // Dialog management
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setEditingTreatment(null);
    setValidationErrors([]);
    setIsSubmitting(false);
  }, []);

  // Filter and sort handlers
  const handleFilterChange = useCallback((field: keyof TaxTreatmentFilter, value: unknown) => {
    setFilter(prev => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter(initialFilter);
  }, []);

  const handleSort = useCallback((field: TaxTreatmentTableSortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Utility functions
  const exportToCSV = useCallback(() => {
    return TaxTreatmentBusinessService.exportToCSV(filteredTreatments);
  }, [filteredTreatments]);

  const initializeDefaults = useCallback(async () => {
    try {
      const defaultTreatments = TaxTreatmentBusinessService.getDefaultTreatments();
      const treatmentsToCreate = defaultTreatments.map(treatment => ({
        code: treatment.code,
        name: treatment.name,
        description: treatment.description,
        rate: treatment.rate.toString(),
        category: treatment.category,
        applicability: treatment.applicability,
        isActive: treatment.isActive,
        isDefault: true,
      }));
      
      await bulkCreate.mutateAsync(treatmentsToCreate);
    } catch (error) {
      console.error('Initialize defaults error:', error);
    }
  }, [bulkCreate]);

  const resetToDefaults = useCallback(async () => {
    if (confirm('This will replace all current treatments with defaults. Are you sure?')) {
      try {
        // First delete all existing treatments
        const deletePromises = treatments.map(treatment => deleteTreatment.mutateAsync(treatment.id));
        await Promise.all(deletePromises);
        
        // Then initialize defaults
        await initializeDefaults();
      } catch (error) {
        console.error('Reset to defaults error:', error);
      }
    }
  }, [treatments, deleteTreatment, initializeDefaults]);

  // Validation helpers
  const getFieldError = useCallback((field: keyof TaxTreatmentFormData) => {
    const error = validationErrors.find(err => err.field === field);
    return error?.message;
  }, [validationErrors]);

  const hasFieldError = useCallback((field: keyof TaxTreatmentFormData) => {
    return validationErrors.some(err => err.field === field);
  }, [validationErrors]);

  return {
    // Data
    treatments,
    filteredTreatments,
    stats,
    isLoaded,
    
    // Dialog state
    showDialog,
    editingTreatment,
    
    // Form state
    formData,
    validationErrors,
    isSubmitting: isSubmitting || createTreatment.isPending || updateTreatment.isPending,
    
    // Filter and sort state
    filter,
    sortConfig,
    
    // CRUD operations
    handleCreate,
    handleEdit,
    handleDelete,
    handleToggleActive,
    handleFormSubmit,
    handleFormInputChange,
    
    // Dialog management
    setShowDialog,
    resetForm,
    
    // Filter and sort
    handleFilterChange,
    clearFilters,
    handleSort,
    
    // Utility functions
    exportToCSV,
    initializeDefaults,
    resetToDefaults,
    getFieldError,
    hasFieldError
  };
};