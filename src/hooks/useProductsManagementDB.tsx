import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Product, 
  Vendor, 
  FormattedProduct,
  ProductFormData as ProductFormType,
  CURRENCIES
} from '@/types/products.types';
import { Company } from '@/types/company.types';
import { 
  ProductApiService, 
  ProductFormData as ApiProductFormData,
  ProductQueryParams
} from '@/services/api/productApiService';
import { VendorApiService } from '@/services/api/vendorApiService';
import { ProductBusinessService } from '@/services/business/productBusinessService';
import { ProductValidationService } from '@/services/validation/productValidationService';

export interface ProductsManagementDBHook {
  // Data
  products: Product[];
  vendors: Vendor[];
  filteredProducts: FormattedProduct[];
  statistics: {
    totalProducts: number;
    activeProducts: number;
    avgPrice: number;
    avgMargin: number;
  };
  
  // UI Data Lists
  availableCurrencies: string[];
  activeCompanies: Company[];
  
  // UI State
  isLoaded: boolean;
  showAddForm: boolean;
  editingProduct: Product | null;
  expandedProducts: Set<string>;
  isAllExpanded: boolean;
  highlightedProductId: string | null;
  
  // Filters
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'inactive';
  currencyFilter: string;
  vendorFilter: string;
  companyFilter: number | 'all';
  sortField: string;
  sortDirection: 'asc' | 'desc';
  
  // Form Data
  newProduct: ProductFormType;
  productFormData: ProductFormType;
  
  // Company Info
  selectedCompanyName: string;
  canAddProduct: boolean;
  
  // Loading & Error States
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isMutating: boolean;
  
  // Actions
  setShowAddForm: (show: boolean) => void;
  setEditingProduct: (product: Product | null) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: 'all' | 'active' | 'inactive') => void;
  setCurrencyFilter: (filter: string) => void;
  setVendorFilter: (filter: string) => void;
  setCompanyFilter: (filter: number | 'all') => void;
  setSortField: (field: string) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  
  // Form Handlers
  handleProductFormChange: (field: string, value: string | number | boolean) => void;
  resetProductForm: () => void;
  updateProductFormData: (data: Partial<ProductFormType>) => void;
  
  // Product Operations
  handleAddProduct: () => void;
  handleUpdateProduct: () => void;
  handleEditProduct: (product: Product) => void;
  handleDeleteProduct: (id: string) => void;
  handleDuplicateProduct: (id: string) => void;
  handleToggleStatus: (id: string) => void;
  
  // Expansion Operations
  toggleProductExpansion: (productId: string) => void;
  toggleAllProductsExpansion: () => void;
  
  // Helper Functions
  getFilteredVendors: () => Vendor[];
  formatCurrency: (amount: number, currency: string) => string;
  getCompanyName: (companyId: number) => string;
  getVendorName: (vendorId: string | null) => string;
  getSelectedCompanyName: () => string;
  
  // Data Refresh
  refetch: () => void;
}

const initialNewProduct: ProductFormType = {
  name: '',
  description: '',
  price: '',
  currency: 'USD',
  cost: '',
  costCurrency: 'USD',
  vendorId: 'N/A'
};

export function useProductsManagementDB(
  globalSelectedCompany: number | 'all',
  companies: Company[]
): ProductsManagementDBHook {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const productService = new ProductApiService();
  const vendorService = new VendorApiService();
  
  // Load vendors from API
  const { 
    data: vendorsResponse, 
    isLoading: isVendorsLoading,
    error: vendorsError 
  } = useQuery({
    queryKey: ['vendors', globalSelectedCompany],
    queryFn: () => vendorService.getVendors({
      company: globalSelectedCompany,
      status: 'active'
    }),
    enabled: !!globalSelectedCompany
  });
  
  const vendors = vendorsResponse?.data || [];
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(true);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState<number | 'all'>('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Form State
  const [newProduct, setNewProduct] = useState<ProductFormType>(initialNewProduct);
  const [productFormData, setProductFormData] = useState<ProductFormType>(initialNewProduct);
  
  // Query Key
  const productsQueryKey = ['products', {
    company: globalSelectedCompany,
    search: searchTerm,
    status: statusFilter,
    currency: currencyFilter === 'all' ? undefined : currencyFilter,
    sortField,
    sortDirection
  }];
  
  // Products Query
  const { 
    data: productsResponse, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery({
    queryKey: productsQueryKey,
    queryFn: () => {
      const params: ProductQueryParams = {
        company: globalSelectedCompany,
        search: searchTerm || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        currency: currencyFilter === 'all' ? undefined : currencyFilter,
        sortField,
        sortDirection,
        take: 1000 // Get all products for now
      };
      
      return productService.getProducts(params);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const products = productsResponse?.data || [];
  const statistics = productsResponse?.statistics || {
    total: 0,
    averagePrice: 0,
    averageCost: 0,
    totalValue: 0,
    activeStats: {}
  };
  
  
  // Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: (data: ApiProductFormData) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetProductForm();
      setShowAddForm(false);
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create product');
      console.error('Failed to create product:', error);
    }
  });
  
  // Update Product Mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApiProductFormData> }) => 
      productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingProduct(null);
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update product');
      console.error('Failed to update product:', error);
    }
  });
  
  // Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: unknown) => {
      // Try to extract detailed error message from API response
      const errorMessage = error?.message || 'Failed to delete product';
      const errorDetails = error?.details;
      const suggestion = error?.suggestion;
      
      if (errorDetails && suggestion) {
        // Show detailed error with suggestion
        toast.error(`${errorMessage}. ${suggestion}`, { duration: 6000 });
      } else if (errorDetails) {
        // Show detailed error
        toast.error(`${errorMessage}. ${errorDetails}`, { duration: 6000 });
      } else {
        // Show generic error
        toast.error(errorMessage);
      }
      
      console.error('Failed to delete product:', error);
    }
  });
  
  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      productService.updateProduct(id, { isActive }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Product ${variables.isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error) => {
      toast.error('Failed to update product status');
      console.error('Failed to toggle product status:', error);
    }
  });
  
  // Handle URL highlight parameter
  useState(() => {
    const highlight = searchParams.get('highlight');
    if (highlight) {
      setHighlightedProductId(highlight);
      setExpandedProducts(prev => new Set([...prev, highlight]));
      setSearchTerm('');
      setStatusFilter('all');
      
      setTimeout(() => {
        const element = document.getElementById(`product-${highlight}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      setTimeout(() => {
        setHighlightedProductId(null);
      }, 5000);
    }
  });
  
  // Calculate statistics
  const formattedStatistics = useMemo(() => {
    const activeProducts = products.filter(p => p.isActive);
    const avgPrice = statistics?.averagePrice || 0;
    const avgMargin = activeProducts.length > 0
      ? activeProducts.reduce((sum, product) => {
          const margin = ProductBusinessService.calculateMargin(product.price, product.cost);
          return sum + margin;
        }, 0) / activeProducts.length
      : 0;
    
    return {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      avgPrice,
      avgMargin
    };
  }, [products, statistics]);
  
  // UI Data Lists
  const availableCurrencies = useMemo(() => CURRENCIES, []);
  const activeCompanies = useMemo(() => companies.filter(company => company.status === 'Active'), [companies]);
  
  // Filter products with vendor filter
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Apply vendor filter if needed
    if (vendorFilter !== 'all') {
      filtered = filtered.filter(product => product.vendorId === vendorFilter);
    }
    
    // Format products for display
    return filtered.map(product => {
      const company = companies.find(c => c.id === product.companyId);
      const vendor = vendors.find(v => v.id === product.vendorId) || null;
      
      return ProductBusinessService.formatProductForDisplay(product, company, null, vendor);
    });
  }, [products, vendors, companies, vendorFilter]);
  
  // Update isAllExpanded based on individual expansions
  useState(() => {
    if (filteredProducts.length > 0) {
      const allExpanded = filteredProducts.every(product => expandedProducts.has(product.id));
      setIsAllExpanded(allExpanded);
    }
  });
  
  // Form Handlers
  const handleProductFormChange = useCallback((field: string, value: unknown) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  const resetProductForm = useCallback(() => {
    setNewProduct(initialNewProduct);
    setProductFormData(initialNewProduct);
  }, []);
  
  const updateProductFormData = useCallback((data: Partial<ProductFormType>) => {
    setProductFormData(prev => ({ ...prev, ...data }));
  }, []);
  
  // Product Operations
  const handleAddProduct = useCallback(() => {
    // Check if a specific company is selected
    if (globalSelectedCompany === 'all') {
      toast.error('Please select a specific company to add products');
      return;
    }
    
    const validation = ProductValidationService.validateProduct({
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      currency: newProduct.currency,
      cost: newProduct.cost,
      costCurrency: newProduct.costCurrency,
      vendorId: newProduct.vendorId
    });
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }
    
    const productData: ApiProductFormData = {
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      currency: newProduct.currency,
      cost: parseFloat(newProduct.cost) || 0,
      costCurrency: newProduct.costCurrency,
      vendorId: newProduct.vendorId === 'N/A' ? null : newProduct.vendorId,
      isActive: true,
      companyId: Number(globalSelectedCompany)
    };
    
    createProductMutation.mutate(productData);
  }, [newProduct, globalSelectedCompany, createProductMutation]);
  
  const handleUpdateProduct = useCallback(() => {
    if (!editingProduct) return;
    
    const updatedData: Partial<ApiProductFormData> = {
      name: editingProduct.name,
      description: editingProduct.description,
      price: editingProduct.price,
      currency: editingProduct.currency,
      cost: editingProduct.cost,
      costCurrency: editingProduct.costCurrency,
      vendorId: editingProduct.vendorId === 'N/A' ? null : editingProduct.vendorId,
      isActive: editingProduct.isActive,
      companyId: editingProduct.companyId
    };
    
    updateProductMutation.mutate({ id: editingProduct.id, data: updatedData });
  }, [editingProduct, updateProductMutation]);
  
  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      currency: product.currency,
      cost: product.cost.toString(),
      costCurrency: product.costCurrency,
      vendorId: product.vendorId || 'N/A'
    });
  }, []);
  
  const handleDeleteProduct = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  }, [deleteProductMutation]);

  const handleDuplicateProduct = useCallback(async (id: string) => {
    try {
      const productToDuplicate = products.find(p => p.id === id);
      if (!productToDuplicate) {
        toast.error('Product not found');
        return;
      }

      // Create a new product based on the existing one
      const duplicatedProduct: ApiProductFormData = {
        name: `${productToDuplicate.name} (Copy)`,
        description: productToDuplicate.description,
        price: productToDuplicate.price,
        currency: productToDuplicate.currency,
        cost: productToDuplicate.cost,
        costCurrency: productToDuplicate.costCurrency,
        vendorId: productToDuplicate.vendorId,
        isActive: true,
        companyId: productToDuplicate.companyId,
      };

      createProductMutation.mutate(duplicatedProduct);
      toast.success('Product duplicated successfully');
    } catch (error) {
      console.error('Error duplicating product:', error);
      toast.error('Failed to duplicate product');
    }
  }, [products, createProductMutation]);
  
  const handleToggleStatus = useCallback((id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      toggleStatusMutation.mutate({ id, isActive: !product.isActive });
    }
  }, [products, toggleStatusMutation]);
  
  // Expansion Operations
  const toggleProductExpansion = useCallback((productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);
  
  const toggleAllProductsExpansion = useCallback(() => {
    if (isAllExpanded) {
      setExpandedProducts(new Set());
      setIsAllExpanded(false);
    } else {
      setExpandedProducts(new Set(filteredProducts.map(p => p.id)));
      setIsAllExpanded(true);
    }
  }, [isAllExpanded, filteredProducts]);
  
  // Helper Functions
  const getFilteredVendors = useCallback(() => {
    if (globalSelectedCompany === 'all') return vendors;
    return vendors.filter(vendor => vendor.companyId === Number(globalSelectedCompany));
  }, [vendors, globalSelectedCompany]);
  
  const formatCurrency = useCallback((amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }, []);
  
  const getCompanyName = useCallback((companyId: number) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.tradingName : 'Unknown Company';
  }, [companies]);
  
  const getVendorName = useCallback((vendorId: string | null) => {
    if (!vendorId || vendorId === 'N/A') return 'No Vendor';
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor ? vendor.companyName : 'Unknown Vendor';
  }, [vendors]);
  
  const getSelectedCompanyName = useCallback(() => {
    if (globalSelectedCompany === 'all') return 'All Companies';
    const company = companies.find(c => c.id === globalSelectedCompany);
    return company ? company.tradingName : 'Unknown Company';
  }, [globalSelectedCompany, companies]);
  
  // Computed values
  const selectedCompanyName = getSelectedCompanyName();
  const canAddProduct = globalSelectedCompany !== 'all' && globalSelectedCompany !== null;
  const isLoaded = !isLoading && !isVendorsLoading;
  const isMutating = createProductMutation.isPending || updateProductMutation.isPending || 
                     deleteProductMutation.isPending || toggleStatusMutation.isPending;
  
  return {
    // Data
    products,
    vendors,
    filteredProducts,
    statistics: formattedStatistics,
    
    // UI Data Lists
    availableCurrencies,
    activeCompanies,
    
    // UI State
    isLoaded,
    showAddForm,
    editingProduct,
    expandedProducts,
    isAllExpanded,
    highlightedProductId,
    
    // Filters
    searchTerm,
    statusFilter,
    currencyFilter,
    vendorFilter,
    companyFilter,
    sortField,
    sortDirection,
    
    // Form Data
    newProduct,
    productFormData,
    
    // Company Info
    selectedCompanyName,
    canAddProduct,
    
    // Loading & Error States
    isLoading,
    isError,
    error,
    isMutating,
    
    // Actions
    setShowAddForm,
    setEditingProduct,
    setSearchTerm,
    setStatusFilter,
    setCurrencyFilter,
    setVendorFilter,
    setCompanyFilter,
    setSortField,
    setSortDirection,
    
    // Form Handlers
    handleProductFormChange,
    resetProductForm,
    updateProductFormData,
    
    // Product Operations
    handleAddProduct,
    handleUpdateProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleDuplicateProduct,
    handleToggleStatus,
    
    // Expansion Operations
    toggleProductExpansion,
    toggleAllProductsExpansion,
    
    // Helper Functions
    getFilteredVendors,
    formatCurrency,
    getCompanyName,
    getVendorName,
    getSelectedCompanyName,
    
    // Data Refresh
    refetch
  };
}