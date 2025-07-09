import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  Invoice, 
  FormattedInvoice, 
  InvoiceFormData, 
  InvoiceFilters,
  InvoiceStatistics,
  ViewMode,
  PaidPeriod,
  SortField,
  SortDirection,
  NewInvoiceItem,
  INVOICE_STATUSES
} from '@/types/invoice.types';
import { Company } from '@/types/company.types';
import { Client } from '@/types/client.types';
import { Product } from '@/types/products.types';
import { InvoiceStorageService } from '@/services/storage/invoiceStorageService';
import { InvoiceBusinessService } from '@/services/business/invoiceBusinessService';
import { InvoiceValidationService } from '@/services/validation/invoiceValidationService';
import { getTodayString, getDateStringFromToday } from '@/utils/dateUtils';
import { useSupportingData } from '@/hooks/useSupportingData';

export interface InvoicesManagementHook {
  // Data
  invoices: Invoice[];
  filteredInvoices: FormattedInvoice[];
  statistics: InvoiceStatistics;
  paymentMethods: unknown[];
  clients: Client[];
  products: Product[];
  
  // UI Data Lists
  availableStatuses: Array<{ value: string; label: string; color: string; bgColor: string }>;
  availableCurrencies: string[];
  availableClients: string[];
  
  // Computed Filtered Data
  activeProducts: Product[];
  formPaymentMethods: unknown[];
  
  // Page Header Data
  pageTitle: string;
  pageDescription: string;
  
  // UI State
  isLoaded: boolean;
  showAddForm: boolean;
  editingInvoice: Invoice | null;
  previewingInvoice: Invoice | null;
  expandedInvoices: Set<string>;
  isAllExpanded: boolean;
  viewMode: ViewMode;
  paidPeriod: PaidPeriod;
  selectedInvoices: string[];
  calendarOpenInvoiceId: string | null;
  editDialogCalendarOpen: boolean;
  
  // Form State
  invoiceForm: InvoiceFormData;
  
  // Filters
  searchTerm: string;
  filterStatus: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived';
  filterClient: string;
  filterCurrency: string;
  filterDateRange: 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';
  
  // Sorting
  sortField: SortField;
  sortDirection: SortDirection;
  
  // Exchange Rates
  exchangeRates: { [key: string]: number };
  
  // Actions
  setShowAddForm: (show: boolean) => void;
  setEditingInvoice: (invoice: Invoice | null) => void;
  setPreviewingInvoice: (invoice: Invoice | null) => void;
  setSearchTerm: (term: string) => void;
  setFilterStatus: (filter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived') => void;
  setFilterClient: (client: string) => void;
  setFilterCurrency: (currency: string) => void;
  setFilterDateRange: (range: 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear') => void;
  setViewMode: (mode: ViewMode) => void;
  setPaidPeriod: (period: PaidPeriod) => void;
  setSelectedInvoices: (invoices: string[]) => void;
  setCalendarOpenInvoiceId: (id: string | null) => void;
  setEditDialogCalendarOpen: (open: boolean) => void;
  
  // Sorting Actions
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  handleSort: (field: SortField) => void;
  
  // Form Handlers
  handleInvoiceFormChange: (field: string, value: string | number | string[] | NewInvoiceItem[]) => void;
  resetForm: () => void;
  
  // Form Management Actions
  handleCreateInvoiceClick: () => void;
  handleInvoiceSelectionToggle: (invoiceId: string, checked: boolean) => void;
  handleAddFormItem: () => void;
  handleRemoveFormItem: (index: number) => void;
  handleUpdateFormItemProduct: (index: number, productId: string) => void;
  handleUpdateFormItemQuantity: (index: number, quantity: string) => void;
  handleInvoiceRowClick: (invoiceId: string, event: React.MouseEvent) => void;
  handlePaymentMethodToggle: (methodId: string, checked: boolean) => void;
  
  // Invoice Operations
  handleCreateInvoice: () => void;
  handleUpdateInvoice: () => void;
  handleDeleteInvoice: (id: string) => void;
  handleArchiveInvoice: (id: string) => void;
  handleRestoreInvoice: (id: string) => void;
  handleMarkAsPaid: (id: string, paidDate?: string) => void;
  handleMarkAsSent: (id: string) => void;
  handleDuplicateInvoice: (id: string) => void;
  updateOverdueInvoices: () => void;
  
  // Bulk Operations
  handleBulkArchive: () => void;
  handleBulkMarkPaid: () => void;
  handleBulkMarkSent: () => void;
  handleBulkDelete: () => void;
  
  // Expansion Operations
  toggleInvoiceExpansion: (invoiceId: string) => void;
  toggleAllExpansion: () => void;
  
  // Helper Functions
  getCompanyById: (companyId: number) => Company | undefined;
  getClientById: (clientId: string) => Client | undefined;
  getProductById: (productId: string) => Product | undefined;
  generateInvoiceNumber: () => string;
  
  // PDF Operations
  downloadInvoicePDF: (invoice: Invoice) => Promise<void>;
  printInvoice: (invoice: Invoice) => void;
}

const initialInvoiceForm: InvoiceFormData = {
  invoiceNumber: '',
  clientId: '',
  items: [],
  issueDate: getTodayString(),
  dueDate: getDateStringFromToday(15),
  taxRate: '0',
  fromCompanyId: '',
  paymentMethodIds: [],
  notes: ''
};

export function useInvoicesManagement(
  globalSelectedCompany: number | 'all',
  companies: Company[]
): InvoicesManagementHook {
  // Load supporting data
  const { clients, products, paymentMethods, isLoaded: supportingDataLoaded } = useSupportingData();
  
  // Core Data State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [paidPeriod, setPaidPeriod] = useState<PaidPeriod>('allTime');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [calendarOpenInvoiceId, setCalendarOpenInvoiceId] = useState<string | null>(null);
  const [editDialogCalendarOpen, setEditDialogCalendarOpen] = useState(false);
  
  // Form State
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormData>(initialInvoiceForm);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived'>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'>('all');
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Load initial data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInvoices(InvoiceStorageService.getInvoices());
      setExchangeRates(InvoiceBusinessService.getExchangeRates());
      
      // Update overdue invoices on load
      setTimeout(() => {
        InvoiceStorageService.updateOverdueStatus();
      }, 100);
    }
  }, []);

  // Update isLoaded when both invoices and supporting data are loaded
  useEffect(() => {
    setIsLoaded(supportingDataLoaded);
  }, [supportingDataLoaded]);

  // Listen for currency rate updates
  useEffect(() => {
    const handleCurrencyRatesUpdate = () => {
      setExchangeRates(InvoiceBusinessService.getExchangeRates());
    };

    window.addEventListener('currencyRatesUpdated', handleCurrencyRatesUpdate);
    return () => {
      window.removeEventListener('currencyRatesUpdated', handleCurrencyRatesUpdate);
    };
  }, []);

  // Listen for invoice updates from other components
  useEffect(() => {
    const handleInvoicesUpdate = () => {
      setInvoices(InvoiceStorageService.getInvoices());
    };

    window.addEventListener('invoicesUpdated', handleInvoicesUpdate);
    return () => {
      window.removeEventListener('invoicesUpdated', handleInvoicesUpdate);
    };
  }, []);

  // UI Data Lists
  const availableStatuses = useMemo(() => INVOICE_STATUSES, []);
  const availableCurrencies = useMemo(() => 
    InvoiceBusinessService.getUniqueCurrencies(invoices), 
    [invoices]
  );
  const availableClients = useMemo(() => 
    InvoiceBusinessService.getUniqueClients(invoices), 
    [invoices]
  );

  // Computed filtered data for forms
  const activeProducts = useMemo(() => {
    return products.filter(p => p.isActive);
  }, [products]);

  const formPaymentMethods = useMemo(() => {
    if (invoiceForm.fromCompanyId === '') {
      return [];
    }
    return paymentMethods.filter(pm => pm.companyId === invoiceForm.fromCompanyId);
  }, [paymentMethods, invoiceForm.fromCompanyId]);

  // Calculate page header data
  const pageHeaderData = useMemo(() => {
    if (globalSelectedCompany === 'all') {
      return {
        title: 'Invoices',
        description: 'Create, manage and track your invoices'
      };
    }
    
    const company = companies.find(c => c.id === globalSelectedCompany);
    if (company) {
      return {
        title: `${company.tradingName} - Invoices`,
        description: `Managing invoices for ${company.tradingName}`
      };
    }
    
    return {
      title: 'Invoices',
      description: 'Create, manage and track your invoices'
    };
  }, [globalSelectedCompany, companies]);

  // Filter invoices based on current filters and view mode
  const filteredInvoices = useMemo(() => {
    const filters: InvoiceFilters = {
      searchTerm,
      statusFilter: filterStatus,
      companyFilter: globalSelectedCompany,
      clientFilter: filterClient,
      dateRangeFilter: filterDateRange,
      currencyFilter: filterCurrency
    };

    let filtered = InvoiceBusinessService.filterInvoices(invoices, filters);
    
    // Apply view mode and paid period filter
    filtered = InvoiceBusinessService.filterByViewMode(filtered, viewMode, paidPeriod);

    // Format invoices for display
    const formatted = filtered.map(invoice => 
      InvoiceBusinessService.formatInvoiceForDisplay(invoice, companies, clients, paymentMethods)
    );

    // Apply sorting
    return InvoiceBusinessService.sortInvoices(formatted, sortField, sortDirection);
  }, [invoices, companies, clients, paymentMethods, searchTerm, filterStatus, filterClient, filterCurrency, filterDateRange, globalSelectedCompany, viewMode, paidPeriod, sortField, sortDirection]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const allInvoices = InvoiceBusinessService.filterInvoices(invoices, {
      searchTerm: '',
      statusFilter: 'all',
      companyFilter: globalSelectedCompany,
      clientFilter: 'all',
      dateRangeFilter: 'all',
      currencyFilter: 'all'
    });
    return InvoiceBusinessService.calculateStatistics(allInvoices, exchangeRates);
  }, [invoices, globalSelectedCompany, exchangeRates]);

  // Update isAllExpanded based on individual expansions
  useEffect(() => {
    if (filteredInvoices.length > 0) {
      const allExpanded = filteredInvoices.every(invoice => expandedInvoices.has(invoice.id));
      setIsAllExpanded(allExpanded);
    }
  }, [expandedInvoices, filteredInvoices]);

  // Auto-generate invoice number when form opens
  useEffect(() => {
    if (showAddForm && !editingInvoice && !invoiceForm.invoiceNumber) {
      const newInvoiceNumber = InvoiceStorageService.getNextInvoiceNumber();
      setInvoiceForm(prev => ({
        ...prev,
        invoiceNumber: newInvoiceNumber,
        fromCompanyId: globalSelectedCompany !== 'all' ? globalSelectedCompany as number : ''
      }));
    }
  }, [showAddForm, editingInvoice, globalSelectedCompany, invoiceForm.invoiceNumber]);

  // Form Handlers
  const handleInvoiceFormChange = useCallback((field: string, value: string | number | string[] | NewInvoiceItem[]) => {
    setInvoiceForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setInvoiceForm(initialInvoiceForm);
    setEditingInvoice(null);
    setShowAddForm(false);
  }, []);

  // Sorting Handlers
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as the sort field with default direction
      setSortField(field);
      setSortDirection(field === 'createdAt' || field === 'dueDate' || field === 'amount' ? 'desc' : 'asc');
    }
  }, [sortField, sortDirection]);

  // Invoice Operations
  const handleCreateInvoice = useCallback(() => {
    try {
      const validation = InvoiceValidationService.validateForCreation(
        invoiceForm, 
        invoices, 
        products, 
        clients, 
        companies
      );
      
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
      }

      const invoice = InvoiceBusinessService.createInvoice(
        invoiceForm, 
        products, 
        clients, 
        companies, 
        exchangeRates
      );
      
      const updatedInvoices = InvoiceStorageService.addInvoice(invoice);
      setInvoices(updatedInvoices);
      
      resetForm();
      toast.success('Invoice created successfully');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    }
  }, [invoiceForm, invoices, products, clients, companies, exchangeRates, resetForm]);

  const handleUpdateInvoice = useCallback(() => {
    if (!editingInvoice) return;

    try {
      const validation = InvoiceValidationService.validateForUpdate(
        invoiceForm, 
        editingInvoice,
        invoices, 
        products, 
        clients, 
        companies
      );
      
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        return;
      }

      const updatedInvoice = InvoiceBusinessService.updateInvoice(
        editingInvoice,
        invoiceForm, 
        products, 
        clients, 
        companies, 
        exchangeRates
      );
      
      const result = InvoiceStorageService.updateInvoice(updatedInvoice);
      
      if (result.success) {
        setInvoices(InvoiceStorageService.getInvoices());
        resetForm();
        toast.success('Invoice updated successfully');
      } else {
        toast.error(result.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update invoice');
    }
  }, [editingInvoice, invoiceForm, invoices, products, clients, companies, exchangeRates, resetForm]);

  const handleDeleteInvoice = useCallback((id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;
    
    if (invoice.status !== 'archived') {
      toast.error('Invoices can only be deleted from archive. Please archive the invoice first.');
      return;
    }
    
    if (confirm('Are you sure you want to permanently delete this invoice? This action cannot be undone.')) {
      const updatedInvoices = InvoiceStorageService.deleteInvoice(id);
      setInvoices(updatedInvoices);
      toast.success('Invoice deleted successfully');
    }
  }, [invoices]);

  const handleArchiveInvoice = useCallback((id: string) => {
    const updatedInvoices = InvoiceStorageService.archiveInvoice(id);
    setInvoices(updatedInvoices);
    toast.success('Invoice archived successfully');
  }, []);

  const handleRestoreInvoice = useCallback((id: string) => {
    const updatedInvoices = InvoiceStorageService.restoreInvoice(id);
    setInvoices(updatedInvoices);
    toast.success('Invoice restored successfully');
  }, []);

  const handleMarkAsPaid = useCallback((id: string, paidDate?: string) => {
    const updatedInvoices = InvoiceStorageService.markInvoiceAsPaid(id, paidDate);
    setInvoices(updatedInvoices);
    toast.success('Invoice marked as paid');
  }, []);

  const handleMarkAsSent = useCallback((id: string) => {
    const updatedInvoices = InvoiceStorageService.markInvoiceAsSent(id);
    setInvoices(updatedInvoices);
    toast.success('Invoice marked as sent');
  }, []);

  const handleDuplicateInvoice = useCallback((id: string) => {
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return;

    const newInvoiceNumber = InvoiceStorageService.getNextInvoiceNumber();
    const duplicatedInvoice = {
      ...invoice,
      id: Date.now().toString(),
      invoiceNumber: newInvoiceNumber,
      status: 'draft' as const,
      issueDate: getTodayString(),
      dueDate: getDateStringFromToday(15),
      paidDate: undefined,
      createdAt: new Date().toISOString()
    };

    const updatedInvoices = InvoiceStorageService.addInvoice(duplicatedInvoice);
    setInvoices(updatedInvoices);
    toast.success('Invoice duplicated successfully');
  }, [invoices]);

  const updateOverdueInvoices = useCallback(() => {
    const updatedInvoices = InvoiceStorageService.updateOverdueStatus();
    setInvoices(updatedInvoices);
    
    const { updatedCount } = InvoiceBusinessService.updateOverdueInvoices(invoices);
    if (updatedCount > 0) {
      toast.success(`Updated ${updatedCount} invoice(s) to overdue status`);
    } else {
      toast.info('No invoices needed status updates');
    }
  }, [invoices]);

  // Bulk Operations
  const handleBulkArchive = useCallback(() => {
    if (selectedInvoices.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    const validation = InvoiceValidationService.validateBulkOperation(
      selectedInvoices, 
      'archive', 
      invoices
    );
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const updatedInvoices = InvoiceStorageService.bulkUpdateStatus(selectedInvoices, 'archived');
    setInvoices(updatedInvoices);
    setSelectedInvoices([]);
    toast.success(`Archived ${selectedInvoices.length} invoice(s)`);
  }, [selectedInvoices, invoices]);

  const handleBulkMarkPaid = useCallback(() => {
    if (selectedInvoices.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    const validation = InvoiceValidationService.validateBulkOperation(
      selectedInvoices, 
      'markPaid', 
      invoices
    );
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const updatedInvoices = InvoiceStorageService.bulkUpdateStatus(selectedInvoices, 'paid');
    setInvoices(updatedInvoices);
    setSelectedInvoices([]);
    toast.success(`Marked ${selectedInvoices.length} invoice(s) as paid`);
  }, [selectedInvoices, invoices]);

  const handleBulkMarkSent = useCallback(() => {
    if (selectedInvoices.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    const validation = InvoiceValidationService.validateBulkOperation(
      selectedInvoices, 
      'markSent', 
      invoices
    );
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const updatedInvoices = InvoiceStorageService.bulkUpdateStatus(selectedInvoices, 'sent');
    setInvoices(updatedInvoices);
    setSelectedInvoices([]);
    toast.success(`Marked ${selectedInvoices.length} invoice(s) as sent`);
  }, [selectedInvoices, invoices]);

  const handleBulkDelete = useCallback(() => {
    if (selectedInvoices.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    const validation = InvoiceValidationService.validateBulkOperation(
      selectedInvoices, 
      'delete', 
      invoices
    );
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    if (confirm(`Are you sure you want to permanently delete ${selectedInvoices.length} invoice(s)? This action cannot be undone.`)) {
      selectedInvoices.forEach(id => {
        InvoiceStorageService.deleteInvoice(id);
      });
      
      setInvoices(InvoiceStorageService.getInvoices());
      setSelectedInvoices([]);
      toast.success(`Deleted ${selectedInvoices.length} invoice(s)`);
    }
  }, [selectedInvoices, invoices]);

  // Edit operation
  const handleEdit = useCallback((invoice: Invoice) => {
    const client = clients.find(c => c.name === invoice.clientName);
    
    setEditingInvoice(invoice);
    setInvoiceForm({
      invoiceNumber: invoice.invoiceNumber,
      clientId: client?.id || '',
      items: invoice.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity.toString()
      })),
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      taxRate: invoice.taxRate.toString(),
      fromCompanyId: invoice.fromCompanyId,
      paymentMethodIds: invoice.paymentMethodIds,
      notes: invoice.notes || ''
    });
    setShowAddForm(true);
  }, [clients]);

  // Expansion Operations
  const toggleInvoiceExpansion = useCallback((invoiceId: string) => {
    setExpandedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  }, []);

  const toggleAllExpansion = useCallback(() => {
    if (isAllExpanded) {
      setExpandedInvoices(new Set());
      setIsAllExpanded(false);
    } else {
      const allInvoiceIds = new Set(filteredInvoices.map(inv => inv.id));
      setExpandedInvoices(allInvoiceIds);
      setIsAllExpanded(true);
    }
  }, [isAllExpanded, filteredInvoices]);

  // Helper Functions
  const getCompanyById = useCallback((companyId: number) => {
    return companies.find(c => c.id === companyId);
  }, [companies]);

  const getClientById = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId);
  }, [clients]);

  const getProductById = useCallback((productId: string) => {
    return products.find(p => p.id === productId);
  }, [products]);

  const generateInvoiceNumber = useCallback(() => {
    return InvoiceStorageService.getNextInvoiceNumber();
  }, []);

  // PDF Operations
  const downloadInvoicePDF = useCallback(async (invoice: Invoice) => {
    try {
      // Import PDF generation library
      const { pdf } = await import('@react-pdf/renderer');
      const { ReactPDFTemplate } = await import('@/components/features/invoices');
      
      // Get company info
      const company = companies.find(c => c.id === invoice.fromCompanyId);
      const companyInfo = company ? {
        name: company.legalName || company.tradingName,
        registrationNo: company.registrationNo,
        vatNumber: company.vatNumber,
        address: company.address,
        city: '',
        zipCode: '',
        country: '',
        phone: company.phone,
        email: company.email,
        website: company.website,
        logo: company.logo
      } : undefined;

      // Get payment methods for this invoice
      const invoicePaymentMethods = paymentMethods.filter(method => 
        invoice.paymentMethodIds?.includes(method.id) || false
      ).map(pm => ({
        id: pm.id,
        type: pm.type as 'bank' | 'wallet' | 'crypto',
        name: pm.name,
        accountName: pm.accountName,
        bankName: pm.bankName,
        bankAddress: pm.bankAddress,
        iban: pm.iban,
        swiftCode: pm.swiftCode,
        accountNumber: pm.accountNumber || '',
        sortCode: '',
        routingNumber: '',
        walletAddress: pm.walletAddress,
        qrCode: '',
        details: pm.details,
        currency: pm.currency
      }));


      // Get client info
      const client = clients.find(c => c.name === invoice.clientName && c.email === invoice.clientEmail);
      const clientRegistrationNo = client?.clientType === 'Legal Entity' 
        ? client.registrationNumber 
        : client?.passportNumber;
      const clientVatNumber = client?.clientType === 'Legal Entity' ? client?.vatNumber : undefined;

      // Calculate currency conversions
      const currencyConversions = InvoiceBusinessService.calculatePaymentCurrencyConversions(
        invoice,
        invoicePaymentMethods,
        exchangeRates
      );

      // Create the PDF document using ReactPDFTemplate
      const doc = React.createElement(ReactPDFTemplate, {
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          clientRegistrationNo: clientRegistrationNo,
          clientVatNumber: clientVatNumber,
          clientEmail: invoice.clientEmail,
          clientAddress: invoice.clientAddress,
          amount: invoice.totalAmount || 0,
          currency: invoice.currency,
          status: invoice.status,
          dueDate: invoice.dueDate,
          issueDate: invoice.issueDate,
          description: '', // Legacy field
          template: invoice.template,
          taxRate: invoice.taxRate,
          notes: invoice.notes,
          subtotal: invoice.subtotal,
          taxAmount: invoice.taxAmount,
          totalAmount: invoice.totalAmount,
          items: invoice.items?.map(item => ({
            date: invoice.issueDate,
            description: `${item.productName}${item.description ? ` - ${item.description}` : ''}`,
            quantity: item.quantity,
            rate: item.unitPrice,
            amount: item.total
          })) || []
        },
        companyInfo,
        paymentMethods: invoicePaymentMethods,
        currencyConversions
      });

      // Generate PDF blob
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      
      // Download the PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  }, [companies, clients, paymentMethods]);

  const printInvoice = useCallback((invoice: Invoice) => {
    try {
      // This would integrate with print functionality
      // For now, we'll show a placeholder
      toast.info('Print functionality to be implemented');
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Failed to print invoice');
    }
  }, []);

  // Form Management Actions
  const handleCreateInvoiceClick = useCallback(() => {
    if (globalSelectedCompany === 'all') {
      toast.error('Please select a company from the top menu before creating an invoice');
      return;
    }
    setShowAddForm(true);
  }, [globalSelectedCompany, setShowAddForm]);

  const handleInvoiceSelectionToggle = useCallback((invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  }, []);

  const handleAddFormItem = useCallback(() => {
    const newItems = [...invoiceForm.items, { productId: '', quantity: '1' }];
    handleInvoiceFormChange('items', newItems);
  }, [invoiceForm.items, handleInvoiceFormChange]);

  const handleRemoveFormItem = useCallback((index: number) => {
    const newItems = invoiceForm.items.filter((_, i) => i !== index);
    handleInvoiceFormChange('items', newItems);
  }, [invoiceForm.items, handleInvoiceFormChange]);

  const handleUpdateFormItemProduct = useCallback((index: number, productId: string) => {
    const newItems = [...invoiceForm.items];
    newItems[index].productId = productId;
    handleInvoiceFormChange('items', newItems);
  }, [invoiceForm.items, handleInvoiceFormChange]);

  const handleUpdateFormItemQuantity = useCallback((index: number, quantity: string) => {
    const newItems = [...invoiceForm.items];
    newItems[index].quantity = quantity;
    handleInvoiceFormChange('items', newItems);
  }, [invoiceForm.items, handleInvoiceFormChange]);

  const handleInvoiceRowClick = useCallback((invoiceId: string, event: React.MouseEvent) => {
    // Don't expand if clicking on checkbox or action buttons
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('input')
    ) {
      return;
    }
    toggleInvoiceExpansion(invoiceId);
  }, [toggleInvoiceExpansion]);

  const handlePaymentMethodToggle = useCallback((methodId: string, checked: boolean) => {
    let newPaymentMethods;
    if (checked) {
      newPaymentMethods = [...invoiceForm.paymentMethodIds, methodId];
    } else {
      newPaymentMethods = invoiceForm.paymentMethodIds.filter(id => id !== methodId);
    }
    handleInvoiceFormChange('paymentMethodIds', newPaymentMethods);
  }, [invoiceForm.paymentMethodIds, handleInvoiceFormChange]);

  return {
    // Data
    invoices,
    filteredInvoices,
    statistics,
    paymentMethods,
    clients,
    products,
    
    // UI Data Lists
    availableStatuses,
    availableCurrencies,
    availableClients,
    
    // Computed Filtered Data
    activeProducts,
    formPaymentMethods,
    
    // Page Header Data
    pageTitle: pageHeaderData.title,
    pageDescription: pageHeaderData.description,
    
    // UI State
    isLoaded,
    showAddForm,
    editingInvoice,
    previewingInvoice,
    expandedInvoices,
    isAllExpanded,
    viewMode,
    paidPeriod,
    selectedInvoices,
    calendarOpenInvoiceId,
    editDialogCalendarOpen,
    
    // Form State
    invoiceForm,
    
    // Filters
    searchTerm,
    filterStatus,
    filterClient,
    filterCurrency,
    filterDateRange,
    
    // Sorting
    sortField,
    sortDirection,
    
    // Exchange Rates
    exchangeRates,
    
    // Actions
    setShowAddForm,
    setEditingInvoice: handleEdit,
    setPreviewingInvoice,
    setSearchTerm,
    setFilterStatus,
    setFilterClient,
    setFilterCurrency,
    setFilterDateRange,
    setViewMode,
    setPaidPeriod,
    setSelectedInvoices,
    setCalendarOpenInvoiceId,
    setEditDialogCalendarOpen,
    
    // Sorting Actions
    setSortField,
    setSortDirection,
    handleSort,
    
    // Form Handlers
    handleInvoiceFormChange,
    resetForm,
    
    // Form Management Actions
    handleCreateInvoiceClick,
    handleInvoiceSelectionToggle,
    handleAddFormItem,
    handleRemoveFormItem,
    handleUpdateFormItemProduct,
    handleUpdateFormItemQuantity,
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
    toggleInvoiceExpansion,
    toggleAllExpansion,
    
    // Helper Functions
    getCompanyById,
    getClientById,
    getProductById,
    generateInvoiceNumber,
    
    // PDF Operations
    downloadInvoicePDF,
    printInvoice
  };
}