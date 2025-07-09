import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  VATTreatment,
  VATTreatmentFormData,
  VATTreatmentStats,
  VATTreatmentFilter,
  TableSortConfig,
  VAT_CATEGORIES,
  VAT_APPLICABILITIES,
  VATCategory,
  VATApplicability
} from '@/types/vatTreatment.types';
import { VATTreatmentBusinessService } from '@/services/business/vatTreatmentBusinessService';
import { VATTreatmentValidationService, ValidationError } from '@/services/business/vatTreatmentValidationService';

export interface VATTreatmentManagementHook {
  // Data
  treatments: VATTreatment[];
  filteredTreatments: VATTreatment[];
  stats: VATTreatmentStats;
  isLoaded: boolean;
  
  // Dialog state
  showDialog: boolean;
  editingTreatment: VATTreatment | null;
  
  // Form state
  formData: VATTreatmentFormData;
  validationErrors: ValidationError[];
  isSubmitting: boolean;
  
  // Filter and sort state
  filter: VATTreatmentFilter;
  sortConfig: TableSortConfig;
  
  // CRUD operations
  handleCreate: () => void;
  handleEdit: (treatment: VATTreatment) => void;
  handleDelete: (id: string) => void;
  handleToggleActive: (id: string) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
  handleFormInputChange: (field: keyof VATTreatmentFormData, value: unknown) => void;
  
  // Dialog management
  setShowDialog: (show: boolean) => void;
  resetForm: () => void;
  
  // Filter and sort
  handleFilterChange: (field: keyof VATTreatmentFilter, value: unknown) => void;
  clearFilters: () => void;
  handleSort: (field: TableSortConfig['field']) => void;
  
  // Utility functions
  exportToCSV: () => string;
  initializeDefaults: () => void;
  resetToDefaults: () => void;
  getFieldError: (field: keyof VATTreatmentFormData) => string | undefined;
  hasFieldError: (field: keyof VATTreatmentFormData) => boolean;
}

const initialFormData: VATTreatmentFormData = {
  code: '',
  name: '',
  description: '',
  rate: '',
  category: 'standard',
  applicability: ['sales'],
  isActive: true
};

const initialFilter: VATTreatmentFilter = {
  search: '',
  category: 'all',
  isActive: 'all',
  applicability: 'all',
  rateRange: { min: 0, max: 100 }
};

const initialSortConfig: TableSortConfig = {
  field: 'code',
  direction: 'asc'
};

export const useVATTreatmentManagement = (): VATTreatmentManagementHook => {
  // State
  const [treatments, setTreatments] = useState<VATTreatment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<VATTreatment | null>(null);
  const [formData, setFormData] = useState<VATTreatmentFormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<VATTreatmentFilter>(initialFilter);
  const [sortConfig, setSortConfig] = useState<TableSortConfig>(initialSortConfig);

  // Load treatments on mount
  useEffect(() => {
    loadTreatments();
  }, []);

  const loadTreatments = useCallback(() => {
    try {
      const allTreatments = VATTreatmentBusinessService.getAllTreatments();
      setTreatments(allTreatments);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading VAT treatments:', error);
      toast.error('Failed to load VAT treatments');
      setIsLoaded(true);
    }
  }, []);

  // Computed values
  const stats = useMemo(() => {
    return VATTreatmentBusinessService.getStats();
  }, [treatments]);

  const filteredTreatments = useMemo(() => {
    const filtered = VATTreatmentBusinessService.filterTreatments(treatments, filter);
    return VATTreatmentBusinessService.sortTreatments(filtered, sortConfig);
  }, [treatments, filter, sortConfig]);

  // CRUD operations
  const handleCreate = useCallback(() => {
    setEditingTreatment(null);
    setFormData(initialFormData);
    setValidationErrors([]);
    setShowDialog(true);
  }, []);

  const handleEdit = useCallback((treatment: VATTreatment) => {
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
    try {
      // Validate deletion
      const validation = VATTreatmentValidationService.validateForDeletion(id);
      if (!validation.isValid) {
        toast.error(validation.errors[0]?.message || 'Cannot delete this VAT treatment');
        return;
      }

      const success = VATTreatmentBusinessService.deleteTreatment(id);
      if (success) {
        toast.success('VAT treatment deleted successfully');
        loadTreatments();
      } else {
        toast.error('Failed to delete VAT treatment');
      }
    } catch (error: unknown) {
      console.error('Error deleting VAT treatment:', error);
      toast.error(error.message || 'Failed to delete VAT treatment');
    }
  }, [loadTreatments]);

  const handleToggleActive = useCallback(async (id: string) => {
    try {
      const updatedTreatment = VATTreatmentBusinessService.toggleActive(id);
      toast.success(`VAT treatment ${updatedTreatment.isActive ? 'activated' : 'deactivated'} successfully`);
      loadTreatments();
    } catch (error: unknown) {
      console.error('Error toggling VAT treatment status:', error);
      toast.error(error.message || 'Failed to update VAT treatment status');
    }
  }, [loadTreatments]);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      const validation = VATTreatmentValidationService.validateFormData(
        formData,
        editingTreatment?.id
      );

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      // Clear previous errors
      setValidationErrors([]);

      // Submit form
      if (editingTreatment) {
        // Update existing treatment
        VATTreatmentBusinessService.updateTreatment(editingTreatment.id, formData);
        toast.success('VAT treatment updated successfully');
      } else {
        // Create new treatment
        VATTreatmentBusinessService.createTreatment(formData);
        toast.success('VAT treatment created successfully');
      }

      // Close dialog and refresh data
      setShowDialog(false);
      resetForm();
      loadTreatments();
    } catch (error: unknown) {
      console.error('Error submitting VAT treatment form:', error);
      toast.error(error.message || 'Failed to save VAT treatment');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, editingTreatment, loadTreatments]);

  const handleFormInputChange = useCallback((field: keyof VATTreatmentFormData, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific validation errors
    setValidationErrors(prev => 
      prev.filter(error => error.field !== field)
    );
  }, []);

  // Dialog management
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setEditingTreatment(null);
    setValidationErrors([]);
  }, []);

  // Filter and sort
  const handleFilterChange = useCallback((field: keyof VATTreatmentFilter, value: unknown) => {
    setFilter(prev => ({
      ...prev,
      [field]: value
    }));
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
    return VATTreatmentBusinessService.exportToCSV();
  }, []);

  const initializeDefaults = useCallback(() => {
    try {
      const defaultTreatments = VATTreatmentBusinessService.initializeDefaultTreatments();
      setTreatments(defaultTreatments);
      toast.success('Default VAT treatments loaded successfully');
    } catch (error) {
      console.error('Error initializing default VAT treatments:', error);
      toast.error('Failed to load default VAT treatments');
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    try {
      const defaultTreatments = VATTreatmentBusinessService.resetToDefaults();
      setTreatments(defaultTreatments);
      toast.success('VAT treatments reset to defaults successfully');
    } catch (error) {
      console.error('Error resetting VAT treatments to defaults:', error);
      toast.error('Failed to reset VAT treatments to defaults');
    }
  }, []);

  const getFieldError = useCallback((field: keyof VATTreatmentFormData) => {
    return VATTreatmentValidationService.getFieldValidationMessage(field, validationErrors);
  }, [validationErrors]);

  const hasFieldError = useCallback((field: keyof VATTreatmentFormData) => {
    return VATTreatmentValidationService.hasFieldError(field, validationErrors);
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
    isSubmitting,
    
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