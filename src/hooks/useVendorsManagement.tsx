import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  Vendor, 
  FormattedVendor, 
  VendorFormData, 
  VendorFilters,
  VendorStatistics,
  CURRENCIES,
  COUNTRIES,
  PAYMENT_TERMS_OPTIONS,
  PAYMENT_METHODS
} from '@/types/vendor.types';
import { Company } from '@/types/company.types';
import { Product } from '@/types/products.types';
import { VendorStorageService } from '@/services/storage/vendorStorageService';
import { ProductStorageService } from '@/services/storage/productStorageService';
import { VendorBusinessService } from '@/services/business/vendorBusinessService';
import { VendorValidationService } from '@/services/validation/vendorValidationService';

export interface VendorsManagementHook {
  // Data
  vendors: Vendor[];
  products: Product[];
  filteredVendors: FormattedVendor[];
  statistics: VendorStatistics;
  
  // UI Data Lists
  availableCurrencies: string[];
  availableCountries: string[];
  availablePaymentTermsOptions: Array<{ value: string; label: string }>;
  availablePaymentMethods: Array<{ value: string; label: string }>;
  
  // UI State
  isLoaded: boolean;
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
  setEditingVendor: (vendor: Vendor | null) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;
  setViewMode: (mode: 'active' | 'archived') => void;
  setProductSearchTerm: (term: string) => void;
  
  // Form Handlers
  handleVendorFormChange: (field: string, value: string | number | string[]) => void;
  handleCustomPaymentTermsChange: (value: string) => void;
  resetForm: () => void;
  
  // Vendor Operations
  handleCreateVendor: () => void;
  handleUpdateVendor: () => void;
  handleDeleteVendor: (id: string) => void;
  handleToggleStatus: (id: string) => void;
  handleEdit: (vendor: Vendor) => void;
  
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

export function useVendorsManagement(
  globalSelectedCompany: number | 'all',
  companies: Company[]
): VendorsManagementHook {
  // Core Data State
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
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

  // Load initial data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVendors(VendorStorageService.getVendors());
      setProducts(ProductStorageService.getProducts());
      setIsLoaded(true);
    }
  }, []);

  // UI Data Lists
  const availableCurrencies = useMemo(() => CURRENCIES, []);
  const availableCountries = useMemo(() => COUNTRIES, []);
  const availablePaymentTermsOptions = useMemo(() => PAYMENT_TERMS_OPTIONS, []);
  const availablePaymentMethods = useMemo(() => PAYMENT_METHODS, []);

  // Filter vendors based on current filters
  const filteredVendors = useMemo(() => {
    const filters: VendorFilters = {
      searchTerm,
      statusFilter,
      companyFilter: globalSelectedCompany
    };

    const filtered = VendorBusinessService.filterVendors(vendors, filters);
    
    // Apply view mode filter
    const viewFiltered = filtered.filter(vendor => {
      if (viewMode === 'active') {
        return vendor.isActive;
      } else {
        return !vendor.isActive;
      }
    });

    // Format vendors for display
    return viewFiltered.map(vendor => 
      VendorBusinessService.formatVendorForDisplay(vendor, companies, products)
    );
  }, [vendors, companies, products, searchTerm, statusFilter, globalSelectedCompany, viewMode]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const allVendors = VendorBusinessService.filterVendors(vendors, {
      searchTerm: '',
      statusFilter: 'all',
      companyFilter: globalSelectedCompany
    });
    return VendorBusinessService.calculateStatistics(allVendors);
  }, [vendors, globalSelectedCompany]);

  // Update isAllExpanded based on individual expansions
  useEffect(() => {
    if (filteredVendors.length > 0) {
      const allExpanded = filteredVendors.every(vendor => expandedVendors.has(vendor.id));
      setIsAllExpanded(allExpanded);
    }
  }, [expandedVendors, filteredVendors]);

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
  const handleCreateVendor = useCallback(() => {
    // Check if a specific company is selected
    if (globalSelectedCompany === 'all') {
      toast.error('Please select a specific company to add vendors');
      return;
    }

    const validation = VendorValidationService.validateVendor(vendorForm, customPaymentTerms);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const vendorDataWithCompany = {
      ...vendorForm,
      companyId: Number(globalSelectedCompany)
    } as NewVendor;
    
    const vendor = VendorBusinessService.createVendor(vendorDataWithCompany, customPaymentTerms);
    const updatedVendors = VendorStorageService.addVendor(vendor);
    setVendors(updatedVendors);

    // Update products with vendor associations
    if (vendorForm.productIds.length > 0) {
      let updatedProducts = VendorBusinessService.updateProductVendorAssociations(
        products,
        vendor.id,
        vendorForm.productIds,
        true
      );

      // Apply vendor to other products in the same groups
      updatedProducts = VendorBusinessService.syncGroupProductVendors(
        updatedProducts,
        vendorForm.productIds,
        vendor.id
      );

      setProducts(updatedProducts);
      ProductStorageService.saveProducts(updatedProducts);
    }

    resetForm();
    toast.success('Vendor created successfully');
  }, [vendorForm, customPaymentTerms, products]);

  const handleUpdateVendor = useCallback(() => {
    if (!editingVendor) return;

    const validation = VendorValidationService.validateVendor(vendorForm, customPaymentTerms);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const updatedVendor = VendorBusinessService.updateVendor(editingVendor, vendorForm, customPaymentTerms);
    const updatedVendors = VendorStorageService.updateVendor(updatedVendor);
    setVendors(updatedVendors);

    // Update product associations
    let updatedProducts = VendorBusinessService.updateProductVendorAssociations(
      products,
      editingVendor.id,
      vendorForm.productIds
    );

    // Apply vendor changes to other products in the same groups
    updatedProducts = VendorBusinessService.syncGroupProductVendors(
      updatedProducts,
      vendorForm.productIds,
      editingVendor.id
    );

    setProducts(updatedProducts);
    ProductStorageService.saveProducts(updatedProducts);

    resetForm();
    toast.success('Vendor updated successfully');
  }, [editingVendor, vendorForm, customPaymentTerms, products]);

  const handleDeleteVendor = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      const updatedVendors = VendorStorageService.deleteVendor(id);
      setVendors(updatedVendors);
      toast.success('Vendor deleted successfully');
    }
  }, []);

  const handleToggleStatus = useCallback((id: string) => {
    const updatedVendors = VendorStorageService.toggleVendorStatus(id);
    setVendors(updatedVendors);
  }, []);

  const handleEdit = useCallback((vendor: Vendor) => {
    setEditingVendor(vendor);
    
    // Find products that have this vendor assigned
    const vendorProductIds = products
      .filter(product => product.vendorId === vendor.id)
      .map(product => product.id);

    setVendorForm({
      companyName: vendor.companyName || '',
      contactPerson: vendor.contactPerson || '',
      contactEmail: vendor.contactEmail || '',
      phone: vendor.phone || '',
      website: vendor.website || '',
      paymentTerms: vendor.paymentTerms.toString(),
      currency: vendor.currency || 'USD',
      paymentMethod: vendor.paymentMethod || 'Bank',
      billingAddress: vendor.billingAddress || '',
      itemsServicesSold: vendor.itemsServicesSold || '',
      notes: vendor.notes || '',
      companyRegistrationNr: vendor.companyRegistrationNr || '',
      vatNr: vendor.vatNr || '',
      vendorCountry: vendor.vendorCountry || '',
      productIds: vendorProductIds
    });
    setShowAddForm(true);
  }, [products]);

  // Product Operations
  const handleProductToggle = useCallback((productId: string) => {
    setVendorForm(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId]
    }));
  }, []);

  const getFilteredProducts = useCallback(() => {
    return VendorBusinessService.getFilteredProducts(
      products,
      globalSelectedCompany,
      globalSelectedCompany,
      productSearchTerm
    );
  }, [products, globalSelectedCompany, productSearchTerm]);

  const getSelectedProducts = useCallback(() => {
    return products.filter(product => vendorForm.productIds.includes(product.id));
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
    if (globalSelectedCompany === 'all') return 'All Companies';
    const company = companies.find(c => c.id === globalSelectedCompany);
    return company ? company.tradingName : 'Unknown Company';
  }, [globalSelectedCompany, companies]);

  // Computed values
  const selectedCompanyName = getSelectedCompanyName();
  const canAddVendor = globalSelectedCompany !== 'all' && globalSelectedCompany !== null;

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
    isLoaded,
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
    setEditingVendor,
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
    handleToggleStatus,
    handleEdit,
    
    // Product Operations
    handleProductToggle,
    getFilteredProducts,
    getSelectedProducts,
    
    // Expansion Operations
    toggleVendorExpansion,
    toggleAllExpansion,
    
    // Helper Functions
    navigateToProducts,
    getSelectedCompanyName
  };
}