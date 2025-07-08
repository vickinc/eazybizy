import { useState, useCallback, useMemo } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { Company } from '@/types/company.types';
import { 
  VendorApiService,
  Vendor,
  VendorFormData,
  VendorQueryParams,
  VendorStatistics as ApiVendorStatistics
} from '@/services/api/vendorApiService';
import { FormattedVendor } from '@/types/vendor.types';
import { Product } from '@/types/products.types';
import { productApiService } from '@/services/api/productApiService';
import { CURRENCIES, COUNTRIES, PAYMENT_TERMS_OPTIONS, PAYMENT_METHODS, VendorStatistics } from '@/types/vendor.types';

// Create service instance
const vendorApiService = new VendorApiService();

export interface VendorsManagementDBHook {
  // Data
  vendors: FormattedVendor[];
  products: (Product & { formattedPrice: string })[];
  filteredVendors: FormattedVendor[];
  statistics: VendorStatistics | null;
  
  // UI Data Lists
  availableCurrencies: string[];
  availableCountries: string[];
  availablePaymentTermsOptions: Array<{ value: string; label: string }>;
  availablePaymentMethods: Array<{ value: string; label: string }>;
  
  // UI State
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  showAddForm: boolean;
  editingVendor: Vendor | null;
  expandedVendors: Set<string>;
  isAllExpanded: boolean;
  viewMode: 'active' | 'archived';
  
  // Company Info
  selectedCompanyName: string;
  canAddVendor: boolean;
  
  // Form State
  vendorForm: VendorFormData;
  customPaymentTerms: string;
  productSearchTerm: string;
  
  // Filters
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'inactive';
  
  // Actions
  setShowAddForm: (show: boolean) => void;
  setEditingVendor: (vendor: FormattedVendor | null) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;
  setViewMode: (mode: 'active' | 'archived') => void;
  setProductSearchTerm: (term: string) => void;
  
  // Form Handlers
  handleVendorFormChange: (field: string, value: string | number | string[]) => void;
  handleCustomPaymentTermsChange: (value: string) => void;
  resetForm: () => void;
  
  // Vendor Operations
  handleCreateVendor: () => Promise<void>;
  handleUpdateVendor: () => Promise<void>;
  handleDeleteVendor: (id: string) => Promise<void>;
  handleDuplicateVendor: (id: string) => Promise<void>;
  handleToggleStatus: (id: string) => Promise<void>;
  
  // Product Operations
  handleProductToggle: (productId: string) => void;
  getFilteredProducts: () => Product[];
  getSelectedProducts: () => Product[];
  
  // Expansion Operations
  toggleVendorExpansion: (vendorId: string) => void;
  toggleAllExpansion: () => void;
  
  // Helper Functions
  navigateToProducts: () => void;
  getSelectedCompanyName: () => string;
  refetch: () => void;
}

const initialVendorForm: VendorFormData = {
  companyName: '',
  contactPerson: '',
  contactEmail: '',
  phone: '',
  website: '',
  paymentTerms: '30',
  currency: 'USD',
  paymentMethod: 'Bank',
  billingAddress: '',
  itemsServicesSold: '',
  notes: '',
  companyRegistrationNr: '',
  vatNr: '',
  vendorCountry: '',
  productIds: []
};

export function useVendorsManagementDB(
  globalSelectedCompany: number | 'all',
  companies: Company[]
): VendorsManagementDBHook {
  const queryClient = useQueryClient();
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<FormattedVendor | null>(null);
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  
  // Form State
  const [vendorForm, setVendorForm] = useState<VendorFormData>(initialVendorForm);
  const [customPaymentTerms, setCustomPaymentTerms] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch products from database
  const { data: productsResponse } = useQuery({
    queryKey: ['products', globalSelectedCompany],
    queryFn: () => productApiService.getProducts({
      company: globalSelectedCompany === 'all' ? 'all' : globalSelectedCompany,
      isActive: true,
      take: 1000
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const products = useMemo(() => {
    return (productsResponse?.data || []).map(product => ({
      ...product,
      formattedPrice: `${product.currency} ${product.price.toFixed(2)}`
    })) as (Product & { formattedPrice: string })[];
  }, [productsResponse]);

  // Query parameters for API calls
  const queryParams = useMemo((): VendorQueryParams => {
    const params: VendorQueryParams = {
      take: 1000, // Load all vendors for now
      search: searchTerm || undefined,
      status: statusFilter === 'all' ? 'all' : statusFilter,
      company: globalSelectedCompany === 'all' ? 'all' : globalSelectedCompany.toString(),
      sortField: 'createdAt',
      sortDirection: 'desc'
    };
    return params;
  }, [searchTerm, statusFilter, globalSelectedCompany]);

  // Fetch vendors with React Query
  const {
    data: vendorsResponse,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['vendors', queryParams],
    queryFn: () => vendorApiService.getVendors(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch statistics
  const { data: apiStatistics } = useQuery({
    queryKey: ['vendors-statistics', globalSelectedCompany],
    queryFn: () => vendorApiService.getStatistics({
      companyId: globalSelectedCompany === 'all' ? undefined : globalSelectedCompany
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Transform API statistics to match VendorStats component expectations
  const statistics = useMemo(() => {
    if (!apiStatistics) return null;
    
    return {
      total: apiStatistics.summary.totalVendors,
      active: apiStatistics.summary.activeVendors,
      inactive: apiStatistics.summary.inactiveVendors,
      avgPaymentTerms: apiStatistics.summary.avgPaymentTerms
    };
  }, [apiStatistics]);

  // Extract and transform vendors from response to FormattedVendor format
  const vendors = useMemo(() => {
    return (vendorsResponse?.data || []).map(vendor => {
      // Transform single company to relatedCompanies array
      const relatedCompanies = vendor.company ? [{
        id: vendor.company.id,
        tradingName: vendor.company.tradingName,
        logo: vendor.company.logo || vendor.company.tradingName.charAt(0)
      }] : [];

      // Transform products to vendorProducts format
      const vendorProducts = (vendor.products || []).map(product => ({
        ...product,
        companyName: vendor.company?.tradingName || 'Unknown',
        formattedPrice: `${product.currency} ${product.price.toFixed(2)}`
      }));

      return {
        ...vendor,
        // Company Information
        relatedCompanies,
        
        // Product Information
        productCount: vendor.products?.length || 0,
        uniqueProductCount: vendor.products?.length || 0,
        vendorProducts,
        
        // Formatted Dates
        formattedCreatedAt: new Date(vendor.createdAt).toLocaleDateString(),
        formattedUpdatedAt: new Date(vendor.updatedAt).toLocaleDateString(),
        
        // Pre-constructed URLs
        websiteUrl: vendor.website?.startsWith('http') ? vendor.website : `https://${vendor.website}`,
        mailtoLink: `mailto:${vendor.contactEmail}`,
        phoneLink: vendor.phone ? `tel:${vendor.phone}` : '',
        
        // Display Properties
        hasMultipleCompanies: relatedCompanies.length > 1,
      };
    });
  }, [vendorsResponse]);

  // Filter vendors based on view mode
  const filteredVendors = useMemo(() => {
    if (viewMode === 'active') {
      return vendors.filter(vendor => vendor.isActive);
    } else {
      return vendors.filter(vendor => !vendor.isActive);
    }
  }, [vendors, viewMode]);

  // UI Data Lists
  const availableCurrencies = useMemo(() => CURRENCIES, []);
  const availableCountries = useMemo(() => COUNTRIES, []);
  const availablePaymentTermsOptions = useMemo(() => PAYMENT_TERMS_OPTIONS, []);
  const availablePaymentMethods = useMemo(() => PAYMENT_METHODS, []);

  // Company Info
  const selectedCompanyName = useMemo(() => {
    if (globalSelectedCompany === 'all') return 'All Companies';
    const company = companies.find(c => c.id === globalSelectedCompany);
    return company ? company.tradingName : 'Unknown Company';
  }, [globalSelectedCompany, companies]);

  const canAddVendor = globalSelectedCompany !== 'all' && globalSelectedCompany !== null;

  // Create Vendor Mutation
  const createVendorMutation = useMutation({
    mutationFn: (data: VendorFormData) => vendorApiService.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-statistics'] });
      resetForm();
      toast.success('Vendor created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create vendor: ${error.message}`);
    },
  });

  // Update Vendor Mutation
  const updateVendorMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorFormData> }) => 
      vendorApiService.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-statistics'] });
      resetForm();
      toast.success('Vendor updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update vendor: ${error.message}`);
    },
  });

  // Delete Vendor Mutation
  const deleteVendorMutation = useMutation({
    mutationFn: (id: string) => vendorApiService.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendors-statistics'] });
      toast.success('Vendor deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete vendor: ${error.message}`);
    },
  });

  // Form Handlers
  const handleVendorFormChange = useCallback((field: string, value: string | number | string[]) => {
    setVendorForm(prev => ({ ...prev, [field]: value }));
    
    // Handle conditional logic for payment terms
    if (field === 'paymentTerms' && value !== 'custom') {
      setCustomPaymentTerms('');
    }
  }, []);

  const handleCustomPaymentTermsChange = useCallback((value: string) => {
    setCustomPaymentTerms(value);
  }, []);

  const resetForm = useCallback(() => {
    setVendorForm(initialVendorForm);
    setCustomPaymentTerms('');
    setProductSearchTerm('');
    setEditingVendor(null);
    setShowAddForm(false);
  }, []);

  // Vendor Operations
  const handleCreateVendor = useCallback(async () => {
    if (globalSelectedCompany === 'all') {
      toast.error('Please select a specific company to add vendors');
      return;
    }

    const formData = {
      ...vendorForm,
      companyId: Number(globalSelectedCompany),
      paymentTerms: vendorForm.paymentTerms === 'custom' ? customPaymentTerms : vendorForm.paymentTerms
    };

    await createVendorMutation.mutateAsync(formData);
  }, [vendorForm, customPaymentTerms, globalSelectedCompany, createVendorMutation]);

  const handleUpdateVendor = useCallback(async () => {
    if (!editingVendor) return;

    const formData = {
      ...vendorForm,
      paymentTerms: vendorForm.paymentTerms === 'custom' ? customPaymentTerms : vendorForm.paymentTerms
    };

    await updateVendorMutation.mutateAsync({
      id: editingVendor.id,
      data: formData
    });
  }, [editingVendor, vendorForm, customPaymentTerms, updateVendorMutation]);

  const handleDeleteVendor = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      await deleteVendorMutation.mutateAsync(id);
    }
  }, [deleteVendorMutation]);

  const handleDuplicateVendor = useCallback(async (id: string) => {
    try {
      const vendorToDuplicate = vendors.find(v => v.id === id);
      if (!vendorToDuplicate) {
        toast.error('Vendor not found');
        return;
      }

      // Create a new vendor based on the existing one
      const duplicatedVendor: VendorFormData = {
        companyId: vendorToDuplicate.companyId,
        companyName: `${vendorToDuplicate.companyName} (Copy)`,
        contactPerson: vendorToDuplicate.contactPerson,
        contactEmail: vendorToDuplicate.contactEmail,
        phone: vendorToDuplicate.phone || '',
        website: vendorToDuplicate.website || '',
        paymentTerms: vendorToDuplicate.paymentTerms.toString(),
        paymentMethod: vendorToDuplicate.paymentMethod,
        currency: vendorToDuplicate.currency,
        vendorCountry: vendorToDuplicate.vendorCountry || '',
        companyRegistrationNr: vendorToDuplicate.companyRegistrationNr || '',
        vatNr: vendorToDuplicate.vatNr || '',
        itemsServicesSold: vendorToDuplicate.itemsServicesSold || '',
        billingAddress: vendorToDuplicate.billingAddress || '',
        notes: vendorToDuplicate.notes || '',
        productIds: vendorToDuplicate.vendorProducts?.map(p => p.id) || [],
        companyIds: vendorToDuplicate.relatedCompanies?.map(c => c.id) || [],
      };

      await createVendorMutation.mutateAsync(duplicatedVendor);
      toast.success('Vendor duplicated successfully');
    } catch (error) {
      console.error('Error duplicating vendor:', error);
      toast.error('Failed to duplicate vendor');
    }
  }, [vendors, createVendorMutation]);

  const handleToggleStatus = useCallback(async (id: string) => {
    const vendor = vendors.find(v => v.id === id);
    if (vendor) {
      await updateVendorMutation.mutateAsync({
        id,
        data: { isActive: !vendor.isActive }
      });
    }
  }, [vendors, updateVendorMutation]);

  // Product Operations
  const handleProductToggle = useCallback((productId: string) => {
    setVendorForm(prev => {
      const currentProductIds = prev.productIds || [];
      const isSelected = currentProductIds.includes(productId);
      
      if (isSelected) {
        return {
          ...prev,
          productIds: currentProductIds.filter(id => id !== productId)
        };
      } else {
        return {
          ...prev,
          productIds: [...currentProductIds, productId]
        };
      }
    });
  }, []);

  const getFilteredProducts = useCallback(() => {
    if (!productSearchTerm) return products;
    return products.filter(product => 
      product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [products, productSearchTerm]);

  const getSelectedProducts = useCallback(() => {
    const selectedIds = vendorForm.productIds || [];
    return products.filter(product => selectedIds.includes(product.id));
  }, [products, vendorForm.productIds]);

  // Expansion Operations
  const toggleVendorExpansion = useCallback((vendorId: string) => {
    setExpandedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  }, []);

  const toggleAllExpansion = useCallback(() => {
    if (isAllExpanded) {
      setExpandedVendors(new Set());
      setIsAllExpanded(false);
    } else {
      const allVendorIds = new Set(filteredVendors.map(v => v.id));
      setExpandedVendors(allVendorIds);
      setIsAllExpanded(true);
    }
  }, [isAllExpanded, filteredVendors]);

  // Helper Functions
  const navigateToProducts = useCallback(() => {
    window.location.href = '/sales/products';
  }, []);

  const getSelectedCompanyName = useCallback(() => {
    return selectedCompanyName;
  }, [selectedCompanyName]);

  // Handle edit vendor
  const handleEditVendor = useCallback((vendor: FormattedVendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      companyName: vendor.companyName,
      contactPerson: vendor.contactPerson || '',
      contactEmail: vendor.contactEmail,
      phone: vendor.phone || '',
      website: vendor.website || '',
      paymentTerms: vendor.paymentTerms,
      currency: vendor.currency,
      paymentMethod: vendor.paymentMethod,
      billingAddress: vendor.billingAddress || '',
      itemsServicesSold: vendor.itemsServicesSold || '',
      notes: vendor.notes || '',
      companyRegistrationNr: vendor.companyRegistrationNr || '',
      vatNr: vendor.vatNr || '',
      vendorCountry: vendor.vendorCountry || '',
      productIds: vendor.vendorProducts?.map(p => p.id) || [],
      isActive: vendor.isActive
    });
    setShowAddForm(true);
  }, []);

  // Update setEditingVendor to also populate form
  const setEditingVendorWrapper = useCallback((vendor: FormattedVendor | null) => {
    if (vendor) {
      handleEditVendor(vendor);
    } else {
      setEditingVendor(null);
    }
  }, [handleEditVendor]);

  return {
    // Data
    vendors,
    products,
    filteredVendors,
    statistics,
    
    // UI Data Lists
    availableCurrencies,
    availableCountries,
    availablePaymentTermsOptions,
    availablePaymentMethods,
    
    // UI State
    isLoading,
    isError,
    error: error as Error | null,
    showAddForm,
    editingVendor,
    expandedVendors,
    isAllExpanded,
    viewMode,
    
    // Company Info
    selectedCompanyName,
    canAddVendor,
    
    // Form State
    vendorForm,
    customPaymentTerms,
    productSearchTerm,
    
    // Filters
    searchTerm,
    statusFilter,
    
    // Actions
    setShowAddForm,
    setEditingVendor: setEditingVendorWrapper,
    setSearchTerm,
    setStatusFilter,
    setViewMode,
    setProductSearchTerm,
    
    // Form Handlers
    handleVendorFormChange,
    handleCustomPaymentTermsChange,
    resetForm,
    
    // Vendor Operations
    handleCreateVendor,
    handleUpdateVendor,
    handleDeleteVendor,
    handleDuplicateVendor,
    handleToggleStatus,
    
    // Product Operations
    handleProductToggle,
    getFilteredProducts,
    getSelectedProducts,
    
    // Expansion Operations
    toggleVendorExpansion,
    toggleAllExpansion,
    
    // Helper Functions
    navigateToProducts,
    getSelectedCompanyName,
    refetch
  };
}