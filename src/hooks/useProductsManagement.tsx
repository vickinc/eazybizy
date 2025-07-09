import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Product, 
  Vendor, 
  NewProduct, 
  FormattedProduct,
  ProductFormData,
  CURRENCIES
} from '@/types/products.types';
import { Company } from '@/types/company.types';
import { ProductStorageService } from '@/services/storage/productStorageService';
import { VendorStorageService } from '@/services/storage/vendorStorageService';
import { ProductBusinessService } from '@/services/business/productBusinessService';
import { ProductValidationService } from '@/services/validation/productValidationService';

export interface ProductsManagementHook {
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
  newProduct: ProductFormData;
  productFormData: ProductFormData;
  
  // Company Info
  selectedCompanyName: string;
  canAddProduct: boolean;
  
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
  updateProductFormData: (data: Partial<ProductFormData>) => void;
  
  // Product Operations
  handleAddProduct: () => void;
  handleUpdateProduct: () => void;
  handleEditProduct: (product: Product) => void;
  handleDeleteProduct: (id: string) => void;
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
}

const initialNewProduct: ProductFormData = {
  name: '',
  description: '',
  price: '',
  currency: 'USD',
  cost: '',
  costCurrency: 'USD',
  vendorId: 'N/A'
};

export function useProductsManagement(
  globalSelectedCompany: number | 'all',
  companies: Company[]
): ProductsManagementHook {
  const searchParams = useSearchParams();
  
  // Core Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
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
  const [newProduct, setNewProduct] = useState<ProductFormData>(initialNewProduct);
  const [productFormData, setProductFormData] = useState<ProductFormData>(initialNewProduct);

  // Load initial data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVendors(VendorStorageService.getVendors());
      const loadedProducts = ProductStorageService.getProducts();
      setProducts(loadedProducts);
      setIsLoaded(true);
    }
  }, [companies]);

  // Handle URL highlight parameter
  useEffect(() => {
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
  }, [searchParams]);

  // Filter products for statistics
  const companyFilteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCompany = globalSelectedCompany === 'all' || product.companyId === globalSelectedCompany;
      return matchesCompany && product.isActive;
    });
  }, [products, globalSelectedCompany]);

  // Calculate statistics
  const statistics = useMemo(() => {
    return ProductBusinessService.calculateStatistics(companyFilteredProducts);
  }, [companyFilteredProducts]);

  // UI Data Lists
  const availableCurrencies = useMemo(() => CURRENCIES, []);
  const activeCompanies = useMemo(() => companies.filter(company => company.status === 'Active'), [companies]);

  // Filter and format products for display
  const filteredProducts = useMemo(() => {
    const filtered = ProductBusinessService.filterProducts(products, {
      searchTerm,
      statusFilter,
      companyFilter: globalSelectedCompany,
      currencyFilter,
      vendorFilter,
      sortField,
      sortDirection
    });

    return filtered.map(product => {
      const company = companies.find(c => c.id === product.companyId);
      const vendor = vendors.find(v => v.id === product.vendorId) || null;
      
      return ProductBusinessService.formatProductForDisplay(product, company, null, vendor);
    });
  }, [products, vendors, companies, searchTerm, statusFilter, globalSelectedCompany, currencyFilter, vendorFilter, sortField, sortDirection]);

  // Update isAllExpanded based on individual expansions
  useEffect(() => {
    if (filteredProducts.length > 0) {
      const allExpanded = filteredProducts.every(product => expandedProducts.has(product.id));
      setIsAllExpanded(allExpanded);
    }
  }, [expandedProducts, filteredProducts]);

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

  const updateProductFormData = useCallback((data: Partial<ProductFormData>) => {
    setProductFormData(prev => ({ ...prev, ...data }));
  }, []);

  // Product Operations
  const handleAddProduct = useCallback(() => {
    // Check if a specific company is selected
    if (globalSelectedCompany === 'all') {
      toast.error('Please select a specific company to add products');
      return;
    }

    const validation = ProductValidationService.validateProduct(newProduct as NewProduct);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const product = ProductBusinessService.createProduct({
      name: newProduct.name,
      description: newProduct.description,
      price: parseFloat(newProduct.price),
      currency: newProduct.currency,
      cost: parseFloat(newProduct.cost) || 0,
      costCurrency: newProduct.costCurrency,
      vendorId: newProduct.vendorId || 'N/A',
      companyId: Number(globalSelectedCompany)
    });

    const updatedProducts = [product, ...products];
    setProducts(updatedProducts);
    ProductStorageService.saveProducts(updatedProducts);
    
    resetProductForm();
    setShowAddForm(false);
    toast.success('Product created successfully');
  }, [newProduct, products, resetProductForm, globalSelectedCompany]);

  const handleUpdateProduct = useCallback(() => {
    if (!editingProduct) return;

    const updatedProducts = products.map(product => 
      product.id === editingProduct.id ? editingProduct : product
    );

    setProducts(updatedProducts);
    ProductStorageService.saveProducts(updatedProducts);
    setEditingProduct(null);
    toast.success('Product updated successfully');
  }, [editingProduct, products]);

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      currency: product.currency,
      cost: product.cost.toString(),
      costCurrency: product.costCurrency,
      vendorId: product.vendorId || 'N/A',
      companyId: product.companyId
    });
  }, []);

  const handleDeleteProduct = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = products.filter(product => product.id !== id);
      setProducts(updatedProducts);
      ProductStorageService.saveProducts(updatedProducts);
      toast.success('Product deleted successfully');
    }
  }, [products]);

  const handleToggleStatus = useCallback((id: string) => {
    const updatedProducts = products.map(product => 
      product.id === id 
        ? { ...product, isActive: !product.isActive }
        : product
    );
    setProducts(updatedProducts);
    ProductStorageService.saveProducts(updatedProducts);
    
    const product = products.find(p => p.id === id);
    if (product) {
      toast.success(`Product ${product.isActive ? 'deactivated' : 'activated'} successfully`);
    }
  }, [products]);

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

  return {
    // Data
    products,
    vendors,
    filteredProducts,
    statistics,
    
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
    handleToggleStatus,
    
    // Expansion Operations
    toggleProductExpansion,
    toggleAllProductsExpansion,
    
    // Helper Functions
    getFilteredVendors,
    formatCurrency,
    getCompanyName,
    getVendorName,
    getSelectedCompanyName
  };
}