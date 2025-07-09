import { useState, useCallback, useMemo } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { Company } from '@/types/company.types';
import { 
  InvoicesApiService,
  Invoice,
  InvoiceFormData,
  InvoiceQueryParams,
  InvoiceStatistics,
  InvoiceItem
} from '@/services/api/invoicesApiService.enhanced';
import { InvoicesBusinessService } from '@/services/business/invoicesBusinessService';

// Create service instance
const invoicesApiService = new InvoicesApiService();

export interface InvoicesManagementDBHook {
  // Data
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  groupedInvoices: Array<{ key: string; name: string; invoices: Invoice[] }>;
  statistics: InvoiceStatistics | null;
  clients: unknown[];
  paymentMethods: unknown[];
  
  // UI Data Lists
  availableStatuses: Array<{ value: string; label: string; color: string }>;
  availableCurrencies: string[];
  availableClients: Array<{ id: string; name: string }>;
  
  // Computed Filtered Data
  activeProducts: unknown[];
  formPaymentMethods: unknown[];
  
  // Page Header Data
  pageTitle: string;
  pageDescription: string;
  
  // Company Info
  selectedCompanyName: string;
  canAddInvoice: boolean;
  
  // UI State
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  showAddForm: boolean;
  editingInvoice: Invoice | null;
  previewingInvoice: Invoice | null;
  expandedInvoices: Set<string>;
  isAllExpanded: boolean;
  viewMode: 'active' | 'archived';
  selectedInvoices: Set<string>;
  
  // Form State
  invoiceForm: InvoiceFormData;
  
  // New Filter State
  viewFilter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived';
  selectedPeriod: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom';
  customDateRange: { start: string; end: string };
  groupedView: boolean;
  groupBy: 'none' | 'month' | 'client' | 'currency' | 'status';
  expandedGroups: Set<string>;
  
  // Legacy Filters (for backward compatibility)
  searchTerm: string;
  filterStatus: 'all' | 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'ARCHIVED';
  filterClient: string;
  filterCurrency: string;
  
  // Sorting
  sortField: string;
  sortDirection: 'asc' | 'desc';
  
  // Actions
  setShowAddForm: (show: boolean) => void;
  setEditingInvoice: (invoice: Invoice | null) => void;
  setPreviewingInvoice: (invoice: Invoice | null) => void;
  setViewMode: (mode: 'active' | 'archived') => void;
  
  // New Filter Actions
  setViewFilter: (filter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived') => void;
  setSelectedPeriod: (period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom') => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setGroupedView: (grouped: boolean) => void;
  setGroupBy: (groupBy: 'none' | 'month' | 'client' | 'currency' | 'status') => void;
  setExpandedGroups: (groups: Set<string>) => void;
  toggleGroupExpansion: (groupKey: string) => void;
  
  // Legacy Filter Actions (for backward compatibility)
  setSearchTerm: (term: string) => void;
  setFilterStatus: (filter: 'all' | 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'ARCHIVED') => void;
  setFilterClient: (client: string) => void;
  setFilterCurrency: (currency: string) => void;
  
  // Sorting Actions
  handleSort: (field: string) => void;
  handleSortFieldChange: (field: string) => void;
  handleSortDirectionChange: (direction: 'asc' | 'desc') => void;
  
  // Form Handlers
  handleInvoiceFormChange: (field: string, value: unknown) => void;
  resetForm: () => void;
  
  // Form Management Actions
  handleCreateInvoiceClick: () => void;
  handleInvoiceSelectionToggle: (id: string) => void;
  handleSelectAllInvoices: () => void;
  handleDeselectAllInvoices: () => void;
  isAllInvoicesSelected: boolean;
  handleAddFormItem: () => void;
  handleRemoveFormItem: (index: number) => void;
  handleUpdateFormItemProduct: (index: number, productId: string) => void;
  handleUpdateFormItemQuantity: (index: number, quantity: number | string) => void;
  handleUpdateFormItemUnitPrice: (index: number, unitPrice: number) => void;
  handleInvoiceRowClick: (invoice: Invoice) => void;
  handlePaymentMethodToggle: (methodId: string) => void;
  
  // Invoice Operations
  handleCreateInvoice: () => Promise<void>;
  handleUpdateInvoice: () => Promise<void>;
  handleDeleteInvoice: (id: string) => Promise<void>;
  handleArchiveInvoice: (id: string) => Promise<void>;
  handleRestoreInvoice: (id: string) => Promise<void>;
  handleMarkAsPaid: (id: string) => Promise<void>;
  handleMarkAsSent: (id: string) => Promise<void>;
  handleDuplicateInvoice: (id: string) => Promise<void>;
  updateOverdueInvoices: () => Promise<void>;
  
  // Bulk Operations
  handleBulkArchive: (ids: string[]) => Promise<void>;
  handleBulkMarkPaid: (ids: string[]) => Promise<void>;
  handleBulkMarkSent: (ids: string[]) => Promise<void>;
  handleBulkDelete: (ids: string[]) => Promise<void>;
  
  // Expansion Operations
  toggleAllExpansion: () => void;
  
  // PDF Operations
  downloadInvoicePDF: (invoice: Invoice) => void;
  
  // Helper Functions
  refetch: () => void;
}

const initialInvoiceForm: InvoiceFormData = {
  invoiceNumber: '',
  clientName: '',
  clientEmail: '',
  clientAddress: '',
  clientId: '',
  subtotal: 0,
  currency: 'USD',
  status: 'DRAFT',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
  issueDate: new Date().toISOString().split('T')[0],
  template: 'professional',
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 0,
  fromCompanyId: 0,
  notes: '',
  items: [],
  paymentMethodIds: []
};

export function useInvoicesManagementDB(
  globalSelectedCompany: number | 'all',
  companies: Company[]
): InvoicesManagementDBHook {
  const queryClient = useQueryClient();
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  
  // Form State
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormData>(initialInvoiceForm);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived'>('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom'>('allTime');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  
  // Grouping State  
  const [groupedView, setGroupedView] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'month' | 'client' | 'currency' | 'status'>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Legacy filter state for backward compatibility
  const [filterStatus, setFilterStatus] = useState<'all' | 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'ARCHIVED'>('all');
  
  // Sorting State
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Query parameters for API calls
  const queryParams = useMemo((): InvoiceQueryParams => {
    const params: InvoiceQueryParams = {
      take: 1000, // Load all invoices for now
      search: searchTerm || undefined,
      status: 'all', // Fetch all invoices and filter client-side for better UX
      client: filterClient === 'all' ? undefined : filterClient,
      currency: filterCurrency === 'all' ? undefined : filterCurrency,
      company: globalSelectedCompany === 'all' ? 'all' : globalSelectedCompany.toString(),
      sortField: sortField as any,
      sortDirection: sortDirection
    };
    return params;
  }, [searchTerm, filterClient, filterCurrency, globalSelectedCompany, sortField, sortDirection]);

  // Fetch invoices with React Query
  const {
    data: invoicesResponse,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['invoices', queryParams],
    queryFn: () => invoicesApiService.getInvoices(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ['invoices-statistics', globalSelectedCompany],
    queryFn: () => invoicesApiService.getStatistics({
      companyId: globalSelectedCompany === 'all' ? undefined : globalSelectedCompany
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch clients for the current company
  const { data: clientsResponse } = useQuery({
    queryKey: ['clients', globalSelectedCompany],
    queryFn: async () => {
      // Import ClientsApiService
      const { ClientsApiService } = await import('@/services/api/clientsApiService');
      const clientsService = new ClientsApiService();
      return clientsService.getClients({
        take: 1000,
        company: globalSelectedCompany === 'all' ? 'all' : globalSelectedCompany.toString(),
        status: 'ACTIVE'
      });
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch products for the current company
  const { data: productsResponse } = useQuery({
    queryKey: ['products', globalSelectedCompany],
    queryFn: async () => {
      // Import ProductApiService
      const { ProductApiService } = await import('@/services/api/productApiService');
      const productsService = new ProductApiService();
      return productsService.getProducts({
        take: 1000,
        company: globalSelectedCompany === 'all' ? 'all' : globalSelectedCompany.toString()
      });
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Fetch payment methods for the current company
  const { data: paymentMethodsResponse, isLoading: isLoadingPaymentMethods, error: paymentMethodsError } = useQuery({
    queryKey: ['payment-methods', globalSelectedCompany],
    queryFn: async () => {
      if (globalSelectedCompany === 'all') {
        return { data: [] };
      }
      
      // Fetch payment methods directly from the PaymentMethod table
      const response = await fetch(`/api/payment-methods?companyId=${globalSelectedCompany}`);
      
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payment methods: ${response.status}`);
      }
      
      const paymentMethods = await response.json();
      
      return paymentMethods;
    },
    enabled: globalSelectedCompany !== 'all' && globalSelectedCompany !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Extract data from responses
  const rawInvoices = useMemo(() => invoicesResponse?.data || [], [invoicesResponse]);
  const clients = useMemo(() => clientsResponse?.data || [], [clientsResponse]);
  const products = useMemo(() => productsResponse?.data || [], [productsResponse]);
  const paymentMethods = useMemo(() => {
    console.log('PaymentMethods useMemo - paymentMethodsError:', paymentMethodsError);
    return paymentMethodsResponse?.data || [];
  }, [paymentMethodsResponse, globalSelectedCompany, isLoadingPaymentMethods, paymentMethodsError]);

  // Transform invoices to FormattedInvoice objects
  const invoices = useMemo(() => {
    // Import required constants
    const INVOICE_STATUSES = [
      { value: 'DRAFT', label: 'Draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
      { value: 'SENT', label: 'Sent', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      { value: 'PAID', label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-100' },
      { value: 'OVERDUE', label: 'Overdue', color: 'text-red-700', bgColor: 'bg-red-100' },
      { value: 'ARCHIVED', label: 'Archived', color: 'text-gray-500', bgColor: 'bg-gray-50' }
    ];

    return rawInvoices.map((invoice): unknown => {
      // Find status config
      const statusConfig = INVOICE_STATUSES.find(s => s.value === invoice.status) || {
        value: invoice.status,
        label: invoice.status,
        color: 'text-gray-700',
        bgColor: 'bg-gray-100'
      };

      // Find company info
      const company = companies.find(c => Number(c.id) === Number(invoice.fromCompanyId));
      const companyInfo = company ? {
        id: company.id,
        tradingName: company.tradingName,
        legalName: company.legalName,
        logo: company.logo || company.tradingName.charAt(0)
      } : undefined;

      // Format currency amounts
      const formattedSubtotal = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: invoice.currency || 'USD'
      }).format(invoice.subtotal);

      const formattedTaxAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: invoice.currency || 'USD'
      }).format(invoice.taxAmount);

      const formattedTotalAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: invoice.currency || 'USD'
      }).format(invoice.totalAmount);

      // Format dates
      const formattedIssueDate = new Date(invoice.issueDate).toLocaleDateString();
      const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString();
      const formattedPaidDate = invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : undefined;
      const formattedCreatedAt = invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : undefined;
      const formattedUpdatedAt = invoice.updatedAt ? new Date(invoice.updatedAt).toLocaleDateString() : undefined;

      // Calculate overdue status
      const today = new Date();
      const dueDate = new Date(invoice.dueDate);
      const daysToDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isOverdue = invoice.status !== 'PAID' && invoice.status !== 'ARCHIVED' && daysToDue < 0;
      const daysOverdue = isOverdue ? Math.abs(daysToDue) : undefined;

      return {
        ...invoice,
        statusConfig,
        companyInfo,
        formattedSubtotal,
        formattedTaxAmount,
        formattedTotalAmount,
        formattedIssueDate,
        formattedDueDate,
        formattedPaidDate,
        formattedCreatedAt,
        formattedUpdatedAt,
        daysToDue,
        isOverdue,
        daysOverdue,
        // Add paymentMethodIds from paymentMethodInvoices if available
        paymentMethodIds: invoice.paymentMethodInvoices?.map((pmi: unknown) => pmi.paymentMethodId) || [],
        // Add empty paymentMethodNames for now (will be populated by individual components)
        paymentMethodNames: []
      };
    });
  }, [rawInvoices, companies]);

  // Filter invoices using business service
  const filteredInvoices = useMemo(() => {
    // Apply all filters through the business service
    let filtered = InvoicesBusinessService.getFilteredInvoices(
      invoices,
      globalSelectedCompany,
      selectedPeriod,
      customDateRange,
      viewFilter,
      filterClient,
      filterCurrency,
      searchTerm
    );
    
    // Apply viewMode filtering for backward compatibility
    // This handles the Active/Archived toggle from the old UI
    if (viewMode === 'active') {
      filtered = filtered.filter(invoice => invoice.status !== 'ARCHIVED');
    } else if (viewMode === 'archived') {
      filtered = filtered.filter(invoice => invoice.status === 'ARCHIVED');
    }
    
    return filtered;
  }, [invoices, globalSelectedCompany, selectedPeriod, customDateRange, viewFilter, filterClient, filterCurrency, searchTerm, viewMode]);

  // Group invoices if grouped view is enabled
  const groupedInvoices = useMemo(() => {
    if (!groupedView || groupBy === 'none') {
      return [{ key: 'all', name: 'All Invoices', invoices: filteredInvoices }];
    }
    return InvoicesBusinessService.groupInvoices(filteredInvoices, groupBy);
  }, [filteredInvoices, groupedView, groupBy]);

  // UI Data Lists
  const availableStatuses = useMemo(() => [
    { value: 'all', label: 'All Statuses', color: 'bg-gray-100 text-gray-800' },
    { value: 'DRAFT', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'SENT', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
    { value: 'PAID', label: 'Paid', color: 'bg-green-100 text-green-800' },
    { value: 'OVERDUE', label: 'Overdue', color: 'bg-red-100 text-red-800' },
    { value: 'ARCHIVED', label: 'Archived', color: 'bg-yellow-100 text-yellow-800' }
  ], []);

  const availableCurrencies = useMemo(() => ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'], []);

  const availableClients = useMemo(() => {
    // Use the clients from the API response with proper id and name format
    return clients.map(client => ({
      id: client.id,
      name: client.name
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients]);

  // Computed filtered data for forms
  const activeProducts = useMemo(() => {
    return products.filter(p => p.isActive);
  }, [products]);

  const formPaymentMethods = useMemo(() => {
    // Filter payment methods for the selected company
    const filtered = paymentMethods.filter(pm => pm.type && pm.name);
    return filtered;
  }, [paymentMethods]);

  // Page Header Data
  const pageTitle = useMemo(() => {
    if (globalSelectedCompany === 'all') {
      return 'All Invoices';
    }
    const company = companies.find(c => c.id === globalSelectedCompany);
    return company ? `${company.tradingName} - Invoices` : 'Invoices';
  }, [globalSelectedCompany, companies]);

  const pageDescription = useMemo(() => {
    return globalSelectedCompany === 'all' 
      ? 'Manage invoices across all companies'
      : 'Create and manage professional invoices for the selected company';
  }, [globalSelectedCompany]);

  // Compute selected company name
  const selectedCompanyName = useMemo(() => {
    if (globalSelectedCompany === 'all' || globalSelectedCompany === null) {
      return 'All Companies';
    }
    const company = companies.find(c => c.id === globalSelectedCompany);
    return company?.name || 'Unknown Company';
  }, [globalSelectedCompany, companies]);

  // Determine if invoices can be added (only when a specific company is selected)
  const canAddInvoice = globalSelectedCompany !== 'all' && globalSelectedCompany !== null;

  // Create Invoice Mutation
  const createInvoiceMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => invoicesApiService.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-statistics'] });
      resetForm();
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });

  // Update Invoice Mutation
  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvoiceFormData> }) => 
      invoicesApiService.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-statistics'] });
      resetForm();
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });

  // Delete Invoice Mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => invoicesApiService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-statistics'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });

  // Form Handlers
  const handleInvoiceFormChange = useCallback((field: string, value: unknown) => {
    setInvoiceForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Recalculate totals when tax rate changes
      if (field === 'taxRate') {
        const subtotal = updated.items.reduce((sum, item) => sum + (item.total || 0), 0);
        const taxAmount = subtotal * (value || 0) / 100;
        const totalAmount = subtotal + taxAmount;
        
        return {
          ...updated,
          subtotal,
          taxAmount,
          totalAmount
        };
      }
      
      return updated;
    });
  }, []);

  const resetForm = useCallback(() => {
    setInvoiceForm(initialInvoiceForm);
    setEditingInvoice(null);
    setShowAddForm(false);
  }, []);

  // Form Management Actions
  const handleCreateInvoiceClick = useCallback(() => {
    if (globalSelectedCompany === 'all') {
      toast.error('Please select a specific company to create invoices');
      return;
    }
    
    setInvoiceForm(prev => ({
      ...prev,
      fromCompanyId: Number(globalSelectedCompany)
    }));
    setShowAddForm(true);
  }, [globalSelectedCompany]);

  const handleInvoiceSelectionToggle = useCallback((id: string) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllInvoices = useCallback(() => {
    const allInvoiceIds = new Set(filteredInvoices.map(invoice => invoice.id));
    setSelectedInvoices(allInvoiceIds);
  }, [filteredInvoices]);

  const handleDeselectAllInvoices = useCallback(() => {
    setSelectedInvoices(new Set());
  }, []);

  const isAllInvoicesSelected = useMemo(() => {
    if (filteredInvoices.length === 0) return false;
    return filteredInvoices.every(invoice => selectedInvoices.has(invoice.id));
  }, [filteredInvoices, selectedInvoices]);

  const handleAddFormItem = useCallback(() => {
    const newItem: InvoiceItem = {
      productId: '',
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      currency: invoiceForm.currency,
      total: 0
    };
    
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  }, [invoiceForm.currency]);

  const handleRemoveFormItem = useCallback((index: number) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }, []);

  const handleUpdateFormItemProduct = useCallback((index: number, productId: string) => {
    setInvoiceForm(prev => {
      const selectedProduct = products.find(p => p.id === productId);
      
      const updatedItems = prev.items.map((item, i) => {
        if (i === index) {
          if (selectedProduct) {
            // Populate item with product data
            const updatedItem = {
              ...item,
              productId,
              productName: selectedProduct.name,
              description: selectedProduct.description || '',
              unitPrice: selectedProduct.price || 0,
              total: item.quantity * (selectedProduct.price || 0)
            };
            return updatedItem;
          } else {
            // If no product selected, clear the fields
            return {
              ...item,
              productId,
              productName: '',
              description: '',
              unitPrice: 0,
              total: 0
            };
          }
        }
        return item;
      });
      
      // Recalculate totals
      const subtotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const taxAmount = subtotal * (prev.taxRate || 0) / 100;
      const totalAmount = subtotal + taxAmount;
      
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        taxAmount,
        totalAmount
      };
    });
  }, [products]);

  const handleUpdateFormItemQuantity = useCallback((index: number, quantity: number | string) => {
    setInvoiceForm(prev => {
      const numQuantity = typeof quantity === 'string' ? parseFloat(quantity) || 0 : quantity;
      const updatedItems = prev.items.map((item, i) => 
        i === index ? { ...item, quantity: numQuantity, total: numQuantity * item.unitPrice } : item
      );
      
      // Recalculate totals
      const subtotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const taxAmount = subtotal * (prev.taxRate || 0) / 100;
      const totalAmount = subtotal + taxAmount;
      
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        taxAmount,
        totalAmount
      };
    });
  }, []);

  const handleUpdateFormItemUnitPrice = useCallback((index: number, unitPrice: number) => {
    setInvoiceForm(prev => {
      const updatedItems = prev.items.map((item, i) => 
        i === index ? { ...item, unitPrice, total: item.quantity * unitPrice } : item
      );
      
      // Recalculate totals
      const subtotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const taxAmount = subtotal * (prev.taxRate || 0) / 100;
      const totalAmount = subtotal + taxAmount;
      
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        taxAmount,
        totalAmount
      };
    });
  }, []);

  const handleInvoiceRowClick = useCallback((id: string, e: React.MouseEvent) => {
    // Toggle expansion for this invoice
    setExpandedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handlePaymentMethodToggle = useCallback((methodId: string) => {
    setInvoiceForm(prev => ({
      ...prev,
      paymentMethodIds: prev.paymentMethodIds?.includes(methodId)
        ? prev.paymentMethodIds.filter(id => id !== methodId)
        : [...(prev.paymentMethodIds || []), methodId]
    }));
  }, []);

  // Sorting Actions
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const handleSortFieldChange = useCallback((field: string) => {
    setSortField(field);
  }, []);

  const handleSortDirectionChange = useCallback((direction: 'asc' | 'desc') => {
    setSortDirection(direction);
  }, []);

  // Invoice Operations
  const handleCreateInvoice = useCallback(async () => {
    // Auto-generate invoice number if empty
    const finalInvoiceData = { ...invoiceForm };
    if (!finalInvoiceData.invoiceNumber || finalInvoiceData.invoiceNumber.trim() === '') {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const randomSuffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      finalInvoiceData.invoiceNumber = `INV-${year}-${month}${randomSuffix}`;
    }

    // Validate required fields
    if (!finalInvoiceData.clientName) {
      toast.error('Client name is required');
      return;
    }
    if (!finalInvoiceData.clientEmail) {
      toast.error('Client email is required');
      return;
    }
    if (!finalInvoiceData.fromCompanyId || finalInvoiceData.fromCompanyId === 0) {
      toast.error('Company is required');
      return;
    }
    if (finalInvoiceData.items.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    await createInvoiceMutation.mutateAsync(finalInvoiceData);
  }, [invoiceForm, createInvoiceMutation]);

  const handleUpdateInvoice = useCallback(async () => {
    if (!editingInvoice) return;
    await updateInvoiceMutation.mutateAsync({
      id: editingInvoice.id,
      data: invoiceForm
    });
  }, [editingInvoice, invoiceForm, updateInvoiceMutation]);

  const handleDeleteInvoice = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await deleteInvoiceMutation.mutateAsync(id);
    }
  }, [deleteInvoiceMutation]);

  const handleArchiveInvoice = useCallback(async (id: string) => {
    await updateInvoiceMutation.mutateAsync({
      id,
      data: { status: 'ARCHIVED' }
    });
  }, [updateInvoiceMutation]);

  const handleRestoreInvoice = useCallback(async (id: string) => {
    await updateInvoiceMutation.mutateAsync({
      id,
      data: { status: 'DRAFT' }
    });
  }, [updateInvoiceMutation]);

  const handleMarkAsPaid = useCallback(async (id: string) => {
    await updateInvoiceMutation.mutateAsync({
      id,
      data: { 
        status: 'PAID',
        paidDate: new Date().toISOString()
      }
    });
  }, [updateInvoiceMutation]);

  const handleMarkAsSent = useCallback(async (id: string) => {
    await updateInvoiceMutation.mutateAsync({
      id,
      data: { status: 'SENT' }
    });
  }, [updateInvoiceMutation]);

  const handleDuplicateInvoice = useCallback(async (id: string) => {
    try {
      const response = await invoicesApiService.duplicateInvoice(id);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice duplicated successfully');
    } catch (error: unknown) {
      toast.error(`Failed to duplicate invoice: ${error.message}`);
    }
  }, [queryClient]);

  const updateOverdueInvoices = useCallback(async () => {
    // This would typically be handled by the backend automatically
    refetch();
  }, [refetch]);

  // Bulk Operations
  const handleBulkArchive = useCallback(async () => {
    const ids = Array.from(selectedInvoices);
    if (ids.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    try {
      await Promise.all(ids.map(id => 
        updateInvoiceMutation.mutateAsync({
          id,
          data: { status: 'ARCHIVED' }
        })
      ));
      
      // Clear selection after successful operation
      setSelectedInvoices(new Set());
      toast.success(`${ids.length} invoice(s) archived successfully`);
    } catch (error: unknown) {
      toast.error(`Failed to archive invoices: ${error.message}`);
    }
  }, [selectedInvoices, updateInvoiceMutation]);

  const handleBulkMarkPaid = useCallback(async () => {
    const ids = Array.from(selectedInvoices);
    if (ids.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    try {
      await Promise.all(ids.map(id => 
        updateInvoiceMutation.mutateAsync({
          id,
          data: { 
            status: 'PAID',
            paidDate: new Date().toISOString()
          }
        })
      ));
      
      // Clear selection after successful operation
      setSelectedInvoices(new Set());
      toast.success(`${ids.length} invoice(s) marked as paid successfully`);
    } catch (error: unknown) {
      toast.error(`Failed to mark invoices as paid: ${error.message}`);
    }
  }, [selectedInvoices, updateInvoiceMutation]);

  const handleBulkMarkSent = useCallback(async () => {
    const ids = Array.from(selectedInvoices);
    if (ids.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    try {
      await Promise.all(ids.map(id => 
        updateInvoiceMutation.mutateAsync({
          id,
          data: { 
            status: 'SENT',
            sentDate: new Date().toISOString()
          }
        })
      ));
      
      // Clear selection after successful operation
      setSelectedInvoices(new Set());
      toast.success(`${ids.length} invoice(s) marked as sent successfully`);
    } catch (error: unknown) {
      toast.error(`Failed to mark invoices as sent: ${error.message}`);
    }
  }, [selectedInvoices, updateInvoiceMutation]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedInvoices);
    if (ids.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${ids.length} invoice(s)?`)) {
      return;
    }

    try {
      await Promise.all(ids.map(id => 
        deleteInvoiceMutation.mutateAsync(id)
      ));
      
      // Clear selection after successful operation
      setSelectedInvoices(new Set());
      toast.success(`${ids.length} invoice(s) deleted successfully`);
    } catch (error: unknown) {
      toast.error(`Failed to delete invoices: ${error.message}`);
    }
  }, [selectedInvoices, deleteInvoiceMutation]);

  // Expansion Operations
  const toggleAllExpansion = useCallback(() => {
    if (isAllExpanded) {
      setExpandedInvoices(new Set());
      setIsAllExpanded(false);
    } else {
      const allInvoiceIds = new Set(filteredInvoices.map(i => i.id));
      setExpandedInvoices(allInvoiceIds);
      setIsAllExpanded(true);
    }
  }, [isAllExpanded, filteredInvoices]);

  // PDF Operations
  const downloadInvoicePDF = useCallback(async (invoice: Invoice) => {
    try {
      // Import PDF service
      const { PDFService } = await import('@/services/business/pdfService');
      const company = companies.find(c => Number(c.id) === Number(invoice.fromCompanyId));
      
      // Fetch payment methods specifically for this invoice's company
      const [bankAccountsRes, digitalWalletsRes] = await Promise.all([
        fetch(`/api/bank-accounts?companyId=${invoice.fromCompanyId}`),
        fetch(`/api/digital-wallets?companyId=${invoice.fromCompanyId}`)
      ]);
      
      const bankAccounts = bankAccountsRes.ok ? await bankAccountsRes.json() : { data: [] };
      const digitalWallets = digitalWalletsRes.ok ? await digitalWalletsRes.json() : { data: [] };
      
      // Transform to payment method format
      const invoicePaymentMethods = [
        ...(bankAccounts.data || []).map((bank: unknown) => ({
          id: bank.id,
          type: 'BANK',
          name: bank.bankName,
          accountName: bank.accountName,
          bankName: bank.bankName,
          bankAddress: bank.bankAddress,
          iban: bank.iban,
          swiftCode: bank.swiftCode,
          accountNumber: bank.accountNumber,
          currency: bank.currency,
          details: bank.notes || ''
        })),
        ...(digitalWallets.data || []).map((wallet: unknown) => ({
          id: wallet.id,
          type: 'WALLET',
          name: wallet.walletName,
          walletAddress: wallet.walletAddress,
          currency: wallet.currency,
          details: wallet.description || ''
        }))
      ];
      
      
      await PDFService.generateInvoicePDF(invoice, company, invoicePaymentMethods, clients);
      toast.success('Invoice PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please install @react-pdf/renderer: npm install @react-pdf/renderer');
    }
  }, [companies, clients]);

  // Handle edit invoice
  const handleEditInvoice = useCallback((invoice: Invoice) => {
    setEditingInvoice(invoice);
    setInvoiceForm({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientAddress: invoice.clientAddress || '',
      clientId: invoice.clientId || '',
      subtotal: invoice.subtotal,
      currency: invoice.currency,
      status: invoice.status,
      dueDate: invoice.dueDate,
      issueDate: invoice.issueDate,
      paidDate: invoice.paidDate || '',
      template: invoice.template,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      fromCompanyId: invoice.fromCompanyId,
      notes: invoice.notes || '',
      items: invoice.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
        total: item.total
      })),
      paymentMethodIds: invoice.paymentMethodInvoices?.map(pm => pm.paymentMethodId) || []
    });
    setShowAddForm(true);
  }, []);

  // Update setEditingInvoice to also populate form
  const setEditingInvoiceWrapper = useCallback((invoice: Invoice | null) => {
    if (invoice) {
      handleEditInvoice(invoice);
    } else {
      setEditingInvoice(null);
    }
  }, [handleEditInvoice]);

  // Group expansion handlers
  const toggleGroupExpansion = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupKey)) {
        newExpanded.delete(groupKey);
      } else {
        newExpanded.add(groupKey);
      }
      return newExpanded;
    });
  }, []);

  return {
    // Data
    invoices,
    filteredInvoices,
    groupedInvoices,
    statistics: statistics || null,
    clients,
    paymentMethods,
    
    // UI Data Lists
    availableStatuses,
    availableCurrencies,
    availableClients,
    
    // Computed Filtered Data
    activeProducts,
    formPaymentMethods,
    
    // Page Header Data
    pageTitle,
    pageDescription,
    
    // Company Info
    selectedCompanyName,
    canAddInvoice,
    
    // UI State
    isLoading,
    isError,
    error: error as Error | null,
    showAddForm,
    editingInvoice,
    previewingInvoice,
    expandedInvoices,
    isAllExpanded,
    viewMode,
    selectedInvoices,
    
    // Form State
    invoiceForm,
    
    // New Filter State
    viewFilter,
    selectedPeriod,
    customDateRange,
    groupedView,
    groupBy,
    expandedGroups,
    
    // Legacy Filters (for backward compatibility)
    searchTerm,
    filterStatus,
    filterClient,
    filterCurrency,
    
    // Sorting
    sortField,
    sortDirection,
    
    // Actions
    setShowAddForm,
    setEditingInvoice: setEditingInvoiceWrapper,
    setPreviewingInvoice,
    setViewMode,
    
    // New Filter Actions
    setViewFilter,
    setSelectedPeriod,
    setCustomDateRange,
    setGroupedView,
    setGroupBy,
    setExpandedGroups,
    toggleGroupExpansion,
    
    // Legacy Filter Actions (for backward compatibility)
    setSearchTerm,
    setFilterStatus,
    setFilterClient,
    setFilterCurrency,
    
    // Sorting Actions
    handleSort,
    handleSortFieldChange,
    handleSortDirectionChange,
    
    // Form Handlers
    handleInvoiceFormChange,
    resetForm,
    
    // Form Management Actions
    handleCreateInvoiceClick,
    handleInvoiceSelectionToggle,
    handleSelectAllInvoices,
    handleDeselectAllInvoices,
    isAllInvoicesSelected,
    handleAddFormItem,
    handleRemoveFormItem,
    handleUpdateFormItemProduct,
    handleUpdateFormItemQuantity,
    handleUpdateFormItemUnitPrice,
    handleInvoiceRowClick,
    handlePaymentMethodToggle,
    
    // Invoice Operations
    handleCreateInvoice,
    handleUpdateInvoice,
    handleDeleteInvoice,
    handleArchiveInvoice,
    handleRestoreInvoice,
    handleMarkAsPaid,
    handleMarkAsSent,
    handleDuplicateInvoice,
    updateOverdueInvoices,
    
    // Bulk Operations
    handleBulkArchive,
    handleBulkMarkPaid,
    handleBulkMarkSent,
    handleBulkDelete,
    
    // Expansion Operations
    toggleAllExpansion,
    
    // PDF Operations
    downloadInvoicePDF,
    
    // Helper Functions
    refetch
  };
}