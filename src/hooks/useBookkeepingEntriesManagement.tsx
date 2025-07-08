import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  BookkeepingEntry, 
  CompanyAccount, 
  BookkeepingFormData, 
  AccountFormData,
  PeriodFilter,
  FinancialSummary,
  ExpenseBreakdownItem,
  Invoice,
  Product,
  Company
} from '@/types';
import { BookkeepingStorageService } from '@/services/storage';
import { BookkeepingBusinessService } from '@/services/business/bookkeepingBusinessService';
import { BookkeepingValidationService } from '@/services/business/bookkeepingValidationService';
import { getLocalDateString } from '@/utils';

interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
  website: string;
  paymentTerms: number;
  currency: string;
  paymentMethod: string;
  billingAddress: string;
  itemsServicesSold: string;
  notes: string;
  companyRegistrationNr: string;
  vatNr: string;
  vendorCountry: string;
  companyId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Extended form data interface for entries page
interface ExtendedEntryFormData {
  type: 'income' | 'expense';
  category: string;
  subcategory: string;
  amount: string;
  currency: string;
  description: string;
  date: string;
  companyId: string;
  reference: string;
  accountId: string;
  accountType: 'bank' | 'wallet';
  cogs: string;
  cogsPaid: string;
  selectedInvoiceData: Invoice | null;
  vendorData: Vendor | null;
  productData: Product[] | null;
  linkedIncomeId: string;
  vendorInvoice: string;
}

interface BulkEntryFormData {
  description: string;
  amount: string;
  currency: string;
  category: string;
  vendorInvoice: string;
  date: string;
  reference: string;
  cogs: string;
  cogsCurrency: string;
}

// Enhanced entry with pre-calculated values
interface EnhancedBookkeepingEntry extends BookkeepingEntry {
  company?: Company;
  totalLinkedExpenses: number;
  remainingAmount: number;
  linkedExpensesList: BookkeepingEntry[];
  linkedIncome?: BookkeepingEntry;
}

export interface BookkeepingEntriesManagementHook {
  // Core Data
  entries: BookkeepingEntry[];
  invoices: Invoice[];
  products: Product[];
  vendors: Vendor[];
  accounts: CompanyAccount[];
  
  // Computed Data (processed and ready for UI)
  filteredEntries: EnhancedBookkeepingEntry[];
  groupedEntries: { [key: string]: EnhancedBookkeepingEntry[] };
  processedGroupedEntries: Array<{ key: string; name: string; entries: EnhancedBookkeepingEntry[]; totalIncome: number; totalExpenses: number }>;
  linkedExpensesMap: Map<string, BookkeepingEntry[]>;
  remainingAmountsMap: Map<string, number>;
  filteredInvoicesForDropdown: Invoice[];
  activeCompanies: Company[];
  entriesToDeleteDetails: Array<{ id: string; display: string; amount: number; currency: string; type: string }>;
  availableIncomeEntriesForLinking: Array<EnhancedBookkeepingEntry & { display: string; companyName: string }>;
  financialSummary: FinancialSummary;
  expenseBreakdown: ExpenseBreakdownItem[];
  
  // UI State
  isLoaded: boolean;
  selectedPeriod: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom';
  customDateRange: { start: string; end: string };
  viewFilter: 'all' | 'income' | 'expense';
  groupedView: boolean;
  expandedGroups: Set<string>;
  expandedEntries: Set<string>;
  isAllExpanded: boolean;
  selectedEntries: Set<string>;
  searchTerm: string | null;
  highlightedEntryId?: string;
  filters: {
    selectedPeriod: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom';
    customDateRange: { start: string; end: string };
    viewFilter: 'all' | 'income' | 'expense';
    searchTerm: string | null;
  };
  
  // Dialog States
  showEntryDialog: boolean;
  showBulkAddDialog: boolean;
  showDeleteConfirmDialog: boolean;
  showDeleteSingleDialog: boolean;
  showInvoiceSelect: boolean;
  showLinkDialog: boolean;
  
  // Form States
  entryFormData: ExtendedEntryFormData;
  bulkEntries: BulkEntryFormData[];
  bulkAddType: 'income' | 'expense';
  editingEntry: BookkeepingEntry | null;
  entryToDelete: BookkeepingEntry | null;
  expenseToLink: BookkeepingEntry | null;
  selectedIncomeForLink: string;
  invoiceSearchTerm: string;
  
  // Computed Properties
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  pageTitle: string;
  pageDescription: string;
  validBulkEntriesCount: number;
  formCogsSummary?: { amount: number; currency: string };
  linkedIncomeMap: Map<string, BookkeepingEntry>;
  formSelectedLinkedIncome?: BookkeepingEntry;
  
  // Actions
  handleCreateEntry: () => void;
  handleUpdateEntry: () => void;
  handleEditEntry: (entry: BookkeepingEntry) => void;
  handleDeleteEntry: (entry?: BookkeepingEntry) => void;
  confirmDeleteEntry: () => void;
  confirmSingleDelete: () => void;
  handleBulkCreate: () => void;
  handleBulkDelete: () => void;
  
  // Form Actions
  updateEntryFormData: (field: string, value: any) => void;
  resetEntryForm: () => void;
  updateBulkEntries: (entries: BulkEntryFormData[]) => void;
  addBulkEntry: () => void;
  removeBulkEntry: (index: number) => void;
  
  // Dialog Actions
  setShowEntryDialog: (show: boolean) => void;
  setShowBulkAddDialog: (show: boolean) => void;
  setShowDeleteConfirmDialog: (show: boolean) => void;
  setShowDeleteSingleDialog: (show: boolean) => void;
  setShowInvoiceSelect: (show: boolean) => void;
  setShowLinkDialog: (show: boolean) => void;
  handleShowAddIncomeDialog: () => void;
  handleShowAddExpenseDialog: () => void;
  handleViewRelatedIncomeEntry: (linkedIncomeId: string) => void;
  
  // Filter Actions
  setSelectedPeriod: (period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom') => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setViewFilter: (filter: 'all' | 'income' | 'expense') => void;
  setGroupedView: (grouped: boolean) => void;
  setSearchTerm: (term: string | null) => void;
  
  // UI Actions
  toggleEntryExpansion: (entryId: string) => void;
  toggleAllEntriesExpansion: () => void;
  toggleGroupExpansion: (groupKey: string) => void;
  toggleEntrySelection: (entryId: string) => void;
  selectAllEntries: () => void;
  clearEntrySelection: () => void;
  
  // Invoice Actions
  handleInvoiceSelection: (invoiceIdentifier: string) => void;
  setInvoiceSearchTerm: (term: string) => void;
  handleInvoiceSearchChange: (value: string) => void;
  handleInvoiceSearchFocus: () => void;
  handleCustomReferenceSelection: (searchTerm: string) => void;
  handleInvoiceSelectionWithHide: (invoiceIdentifier: string) => void;
  handleClearSelectedInvoice: () => void;
  
  // Link Actions
  handleLinkToIncome: (expenseEntry: BookkeepingEntry) => void;
  handleConfirmLink: () => void;
  handleCancelLink: () => void;
  setSelectedIncomeForLink: (incomeId: string) => void;
  
  // Additional UI Actions
  setBulkAddType: (type: 'income' | 'expense') => void;
  
  // Missing handler functions from the component
  toggleGroupedView: () => void;
  handleShowAddDialog: () => void;
  handleShowBulkDialog: () => void;
  handleCancelEdit: () => void;
  handleFilterChange: (filters: any) => void;
  setEditingEntry: (entry: BookkeepingEntry | null) => void;
  handleCancelBulkAdd: () => void;
  toggleSelectAll: () => void;
  
  
  // Bulk form helpers
  updateBulkEntry: (index: number, field: string, value: string) => void;
  addBulkEntryRow: () => void;
  removeBulkEntryRow: (index: number) => void;
  resetBulkForm: () => void;
  confirmBulkDelete: () => void;
  
  // Entry form setters
  setNewEntry: (setter: (prev: ExtendedEntryFormData) => ExtendedEntryFormData) => void;
  setExpandedEntries: (setter: (prev: Set<string>) => Set<string>) => void;

  // Utility Functions
  formatCurrency: (amount: number, currency?: string) => string;
  getCOGSCurrency: (incomeEntry: BookkeepingEntry) => string;
}

const initialEntryFormData: ExtendedEntryFormData = {
  type: 'expense',
  category: '',
  subcategory: '',
  amount: '',
  currency: 'USD',
  description: '',
  date: getLocalDateString(),
  companyId: '',
  reference: '',
  accountId: '',
  accountType: 'bank',
  cogs: '',
  cogsPaid: '',
  selectedInvoiceData: null,
  vendorData: null,
  productData: null,
  linkedIncomeId: '',
  vendorInvoice: ''
};

const initialBulkEntryData: BulkEntryFormData = {
  description: '',
  amount: '',
  currency: 'USD',
  category: '',
  vendorInvoice: '',
  date: getLocalDateString(),
  reference: '',
  cogs: '',
  cogsCurrency: 'USD'
};

export const useBookkeepingEntriesManagement = (
  selectedCompany: number | 'all',
  companies: Company[]
): BookkeepingEntriesManagementHook => {
  // Core Data State
  const [entries, setEntries] = useState<BookkeepingEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Filter States
  const [selectedPeriod, setSelectedPeriod] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom'>('thisMonth');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [viewFilter, setViewFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [groupedView, setGroupedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  
  // UI States
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  
  // Dialog States
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showDeleteSingleDialog, setShowDeleteSingleDialog] = useState(false);
  const [showInvoiceSelect, setShowInvoiceSelect] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  
  // Form States
  const [entryFormData, setEntryFormData] = useState<ExtendedEntryFormData>(initialEntryFormData);
  const [bulkEntries, setBulkEntries] = useState<BulkEntryFormData[]>([initialBulkEntryData]);
  const [bulkAddType, setBulkAddType] = useState<'income' | 'expense'>('income');
  const [editingEntry, setEditingEntry] = useState<BookkeepingEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<BookkeepingEntry | null>(null);
  const [expenseToLink, setExpenseToLink] = useState<BookkeepingEntry | null>(null);
  const [selectedIncomeForLink, setSelectedIncomeForLink] = useState<string>('');
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | undefined>(undefined);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem('app-bookkeeping-entries');
      if (savedEntries) {
        let entries = JSON.parse(savedEntries);
        // Ensure entries is an array
        if (!Array.isArray(entries)) {
          console.error('Invalid entries format in localStorage, expected array but got:', typeof entries);
          entries = [];
        } else {
          entries = entries.map((entry: BookkeepingEntry) => {
            if (entry.type === 'income' && entry.isFromInvoice) {
              return {
                ...entry,
                cogs: entry.cogs ? BookkeepingBusinessService.roundToTwoDecimals(entry.cogs) : 0,
                cogsPaid: entry.cogsPaid ? BookkeepingBusinessService.roundToTwoDecimals(entry.cogsPaid) : 0
              };
            }
            return entry;
          }).filter((entry: BookkeepingEntry) => {
            // Remove old auto-generated COGS entries (legacy cleanup)
            if ((entry as any).type === 'cogs' && entry.isFromInvoice) {
              return false;
            }
            return true;
          });
        }
        setEntries(entries);
      }

      // Load invoices
      const savedInvoices = localStorage.getItem('app-invoices');
      if (savedInvoices) {
        setInvoices(JSON.parse(savedInvoices));
      }

      // Load products
      const savedProducts = localStorage.getItem('app-products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }

      // Load vendors
      const savedVendors = localStorage.getItem('app-vendors');
      if (savedVendors) {
        setVendors(JSON.parse(savedVendors));
      }

      // Load accounts
      const savedAccounts = BookkeepingStorageService.getAccounts();
      setAccounts(savedAccounts);

      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading bookkeeping data:', error);
      setIsLoaded(true);
    }
  }, []);

  // Save entries to localStorage
  useEffect(() => {
    if (isLoaded && entries.length > 0) {
      localStorage.setItem('app-bookkeeping-entries', JSON.stringify(entries));
    }
  }, [entries, isLoaded]);

  // Auto-expand current month when grouped view is enabled
  useEffect(() => {
    if (groupedView && isLoaded) {
      const now = new Date();
      const currentMonthYear = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      setExpandedGroups(new Set([currentMonthYear]));
    }
  }, [groupedView, isLoaded]);

  // Sync paid invoices with income entries
  useEffect(() => {
    if (!isLoaded) return;

    const syncInvoicePayments = () => {
      const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.paidDate);
      const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid');
      
      // Add entries for newly paid invoices
      paidInvoices.forEach(invoice => {
        const existingEntry = entries.find(entry => entry.invoiceId === invoice.id);
        
        if (!existingEntry) {
          const calculatedCOGS = BookkeepingBusinessService.calculateInvoiceCOGS(invoice, products);
          const autoEntry = BookkeepingBusinessService.createAutoEntryFromInvoice(invoice, calculatedCOGS);
          setEntries(prev => [...prev, autoEntry]);
        }
      });

      // Remove entries for invoices that are no longer paid
      const unpaidInvoiceIds = unpaidInvoices.map(inv => inv.id);
      setEntries(prev => prev.filter(entry => {
        return !entry.isFromInvoice || !unpaidInvoiceIds.includes(entry.invoiceId || '');
      }));
    };

    syncInvoicePayments();
  }, [invoices, products, isLoaded]);

  // Recalculate COGS for existing entries when products data is available
  useEffect(() => {
    if (!isLoaded || !products.length || !invoices.length) return;

    const recalculateCOGSForExistingEntries = () => {
      setEntries(prevEntries => {
        const updatedEntries = prevEntries.map(entry => {
          if (entry.type === 'income' && entry.isFromInvoice && entry.invoiceId && entry.cogs) {
            const invoice = invoices.find(inv => inv.id === entry.invoiceId);
            if (invoice) {
              const calculatedCOGS = BookkeepingBusinessService.calculateInvoiceCOGS(invoice, products);
              if (BookkeepingBusinessService.shouldRecalculateCOGS(entry, calculatedCOGS)) {
                return {
                  ...entry,
                  cogs: calculatedCOGS.amount,
                  updatedAt: new Date().toISOString()
                };
              }
            }
          }
          return entry;
        });

        return updatedEntries;
      });
    };

    recalculateCOGSForExistingEntries();
  }, [products, invoices, isLoaded]);

  // Set up event listeners for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-bookkeeping-entries' && e.newValue) {
        setEntries(JSON.parse(e.newValue));
      }
      if (e.key === 'app-invoices' && e.newValue) {
        setInvoices(JSON.parse(e.newValue));
      }
      if (e.key === 'app-products' && e.newValue) {
        setProducts(JSON.parse(e.newValue));
      }
      if (e.key === 'app-vendors' && e.newValue) {
        setVendors(JSON.parse(e.newValue));
      }
    };

    const handleInvoiceUpdate = () => {
      const savedInvoices = localStorage.getItem('app-invoices');
      if (savedInvoices) {
        setInvoices(JSON.parse(savedInvoices));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('invoice-updated', handleInvoiceUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('invoice-updated', handleInvoiceUpdate);
    };
  }, []);

  // Update entry form data on company selection
  useEffect(() => {
    if (selectedCompany !== 'all') {
      setEntryFormData(prev => ({
        ...prev,
        companyId: String(selectedCompany)
      }));
    }
  }, [selectedCompany]);

  // Utility Functions (moved before computed properties to avoid initialization errors)
  const formatCurrency = useCallback((amount: number, currency: string = 'USD') => {
    return BookkeepingBusinessService.formatLargeCurrency(amount, currency);
  }, []);

  // Computed filtered entries with pre-calculated values
  const filteredEntries = React.useMemo<EnhancedBookkeepingEntry[]>(() => {
    let filtered = BookkeepingBusinessService.filterEntriesByCompany(entries, selectedCompany);
    
    // Apply period filter
    if (selectedPeriod === 'custom') {
      filtered = BookkeepingBusinessService.filterEntriesByCustomDateRange(
        filtered, 
        customDateRange.start, 
        customDateRange.end
      );
    } else {
      filtered = BookkeepingBusinessService.filterEntriesByPeriod(filtered, selectedPeriod);
    }
    
    // Apply type filter
    filtered = BookkeepingBusinessService.filterEntriesByType(filtered, viewFilter);
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.reference && entry.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.vendorInvoice && entry.vendorInvoice.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Enhance entries with pre-calculated values
    return filtered.map(entry => {
      const linkedExpensesList = entry.type === 'income' 
        ? BookkeepingBusinessService.getLinkedExpenses(entries, entry.id)
        : [];
      
      const totalLinkedExpenses = entry.type === 'income'
        ? BookkeepingBusinessService.getTotalLinkedExpenses(entries, entry.id)
        : 0;
      
      const remainingAmount = entry.type === 'income'
        ? BookkeepingBusinessService.getRemainingAmount(entry, entries)
        : 0;
      
      const company = companies.find(c => c.id === entry.companyId);
      
      let linkedIncome: EnhancedBookkeepingEntry | undefined;
      if (entry.type === 'expense' && entry.linkedIncomeId) {
        const baseLinkedIncome = entries.find(e => e.id === entry.linkedIncomeId);
        if (baseLinkedIncome) {
          const linkedIncomeExpenses = BookkeepingBusinessService.getLinkedExpenses(entries, baseLinkedIncome.id);
          const linkedIncomeTotalExpenses = BookkeepingBusinessService.getTotalLinkedExpenses(entries, baseLinkedIncome.id);
          const linkedIncomeRemaining = BookkeepingBusinessService.getRemainingAmount(baseLinkedIncome, entries);
          const linkedIncomeCompany = companies.find(c => c.id === baseLinkedIncome.companyId);
          
          linkedIncome = {
            ...baseLinkedIncome,
            company: linkedIncomeCompany,
            totalLinkedExpenses: linkedIncomeTotalExpenses,
            remainingAmount: linkedIncomeRemaining,
            linkedExpensesList: linkedIncomeExpenses,
            linkedIncome: undefined
          } as EnhancedBookkeepingEntry;
        }
      }
      
      return {
        ...entry,
        company,
        totalLinkedExpenses,
        remainingAmount,
        linkedExpensesList,
        linkedIncome
      } as EnhancedBookkeepingEntry;
    });
  }, [entries, companies, selectedCompany, selectedPeriod, customDateRange, viewFilter, searchTerm]);

  // Computed grouped entries
  const groupedEntries = React.useMemo(() => {
    if (!groupedView) return {};
    return BookkeepingBusinessService.groupEntriesByMonth(filteredEntries);
  }, [filteredEntries, groupedView]);

  // Computed linked expenses map
  const linkedExpensesMap = React.useMemo(() => {
    const map = new Map<string, BookkeepingEntry[]>();
    filteredEntries
      .filter(entry => entry.type === 'income')
      .forEach(incomeEntry => {
        const linkedExpenses = BookkeepingBusinessService.getLinkedExpenses(entries, incomeEntry.id);
        map.set(incomeEntry.id, linkedExpenses);
      });
    return map;
  }, [filteredEntries, entries]);

  // Computed remaining amounts map
  const remainingAmountsMap = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredEntries
      .filter(entry => entry.type === 'income')
      .forEach(incomeEntry => {
        const remaining = BookkeepingBusinessService.getRemainingAmount(incomeEntry, entries);
        map.set(incomeEntry.id, remaining);
      });
    return map;
  }, [filteredEntries, entries]);

  // Filtered invoices for dropdown
  const filteredInvoicesForDropdown = React.useMemo(() => {
    return BookkeepingBusinessService.getFilteredInvoicesForDropdown(
      invoices, 
      entryFormData.companyId, 
      invoiceSearchTerm
    );
  }, [invoices, entryFormData.companyId, invoiceSearchTerm]);

  // Active companies
  const activeCompanies = React.useMemo(() => {
    return companies.filter(c => c.status === 'Active');
  }, [companies]);

  // Computed totals
  const totalIncome = React.useMemo(() => {
    return filteredEntries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [filteredEntries]);

  const totalExpenses = React.useMemo(() => {
    return filteredEntries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [filteredEntries]);

  const netProfit = React.useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  // Page title and description based on current filters
  const pageTitle = React.useMemo(() => {
    const companyName = selectedCompany === 'all' 
      ? 'All Companies'
      : companies.find(c => c.id === selectedCompany)?.companyName || 'Unknown Company';
    
    const periodText = selectedPeriod === 'custom' && customDateRange.start && customDateRange.end
      ? `${customDateRange.start} to ${customDateRange.end}`
      : selectedPeriod === 'thisMonth' ? 'This Month'
      : selectedPeriod === 'lastMonth' ? 'Last Month'
      : selectedPeriod === 'thisYear' ? 'This Year'
      : selectedPeriod === 'lastYear' ? 'Last Year'
      : 'All Time';
    
    const typeText = viewFilter === 'income' ? 'Income'
      : viewFilter === 'expense' ? 'Expense'
      : 'Financial';
    
    return `${typeText} Overview - ${companyName} (${periodText})`;
  }, [selectedCompany, companies, selectedPeriod, customDateRange, viewFilter]);

  const pageDescription = React.useMemo(() => {
    const entryCount = filteredEntries.length;
    const companyText = selectedCompany === 'all' ? 'all companies' : 'selected company';
    
    if (viewFilter === 'income') {
      return `Showing ${entryCount} revenue entries for ${companyText}. Total revenue: ${formatCurrency(totalIncome)}.`;
    } else if (viewFilter === 'expense') {
      return `Showing ${entryCount} expense entries for ${companyText}. Total expenses: ${formatCurrency(totalExpenses)}.`;
    } else {
      const profitText = netProfit >= 0 ? 'profit' : 'loss';
      return `Showing ${entryCount} entries for ${companyText}. Revenue: ${formatCurrency(totalIncome)}, Expenses: ${formatCurrency(totalExpenses)}, Net ${profitText}: ${formatCurrency(Math.abs(netProfit))}.`;
    }
  }, [filteredEntries.length, selectedCompany, viewFilter, totalIncome, totalExpenses, netProfit, formatCurrency]);

  // Bulk validation count
  const validBulkEntriesCount = React.useMemo(() => {
    return bulkEntries.filter(e => {
      if (bulkAddType === 'expense') {
        return e.vendorInvoice.trim() && e.amount.trim() && e.category.trim();
      } else {
        return e.reference.trim() && e.amount.trim() && e.category.trim();
      }
    }).length;
  }, [bulkEntries, bulkAddType]);

  // Form COGS summary for selected invoice (removes direct service call from JSX)
  const formCogsSummary = React.useMemo(() => {
    if (entryFormData.selectedInvoiceData && products.length > 0) {
      return BookkeepingBusinessService.calculateInvoiceCOGS(entryFormData.selectedInvoiceData, products);
    }
    return undefined;
  }, [entryFormData.selectedInvoiceData, products]);

  // Linked income map for expense entries (removes entries.find from JSX)
  const linkedIncomeMap = React.useMemo(() => {
    const map = new Map<string, BookkeepingEntry>();
    entries.forEach(entry => {
      if (entry.type === 'expense' && entry.linkedIncomeId) {
        const linkedIncome = entries.find(e => e.id === entry.linkedIncomeId);
        if (linkedIncome) {
          map.set(entry.id, linkedIncome);
        }
      }
    });
    return map;
  }, [entries]);

  // Entries to delete details (for delete confirmation dialog)
  const entriesToDeleteDetails = React.useMemo(() => {
    return Array.from(selectedEntries).map(entryId => {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return null;
      return {
        id: entry.id,
        display: entry.type === 'expense' && entry.vendorInvoice ? entry.vendorInvoice : entry.description,
        amount: entry.amount,
        currency: entry.currency,
        type: entry.type
      };
    }).filter(Boolean);
  }, [selectedEntries, entries]);

  // Available income entries for linking (for link dialog)
  const availableIncomeEntriesForLinking = React.useMemo(() => {
    if (!expenseToLink) return [];
    
    return filteredEntries.filter(entry => 
      entry.type === 'income' && 
      entry.companyId === expenseToLink.companyId &&
      entry.id !== expenseToLink.id
    ).map(entry => ({
      ...entry,
      display: entry.reference || entry.description,
      companyName: entry.company?.tradingName || 'Unknown'
    }));
  }, [expenseToLink, filteredEntries]);

  // Selected linked income for form (with enhanced properties)
  const formSelectedLinkedIncome = React.useMemo<BookkeepingEntry | undefined>(() => {
    if (!entryFormData.linkedIncomeId) return undefined;
    
    const baseLinkedIncome = entries.find(e => e.id === entryFormData.linkedIncomeId);
    if (!baseLinkedIncome) return undefined;
    
    const linkedIncomeExpenses = BookkeepingBusinessService.getLinkedExpenses(entries, baseLinkedIncome.id);
    const linkedIncomeTotalExpenses = BookkeepingBusinessService.getTotalLinkedExpenses(entries, baseLinkedIncome.id);
    const linkedIncomeRemaining = BookkeepingBusinessService.getRemainingAmount(baseLinkedIncome, entries);
    const linkedIncomeCompany = companies.find(c => c.id === baseLinkedIncome.companyId);
    
    return baseLinkedIncome;
  }, [entryFormData.linkedIncomeId, entries, companies]);

  // Entry Management Actions
  const handleCreateEntry = useCallback(() => {
    // For income entries, reference is required instead of description
    if (entryFormData.type === 'income') {
      if (!entryFormData.reference || !entryFormData.amount || !entryFormData.companyId) {
        toast.error('Please fill in all required fields (reference, amount, and company are required for income entries)');
        return;
      }
    } else {
      // For expense entries, vendor invoice, amount and company are required
      if (!entryFormData.vendorInvoice || !entryFormData.amount || !entryFormData.companyId) {
        toast.error('Please fill in all required fields (vendor invoice, amount, and company are required for expense entries)');
        return;
      }
    }

    const newEntry: BookkeepingEntry = {
      id: BookkeepingBusinessService.generateEntryId(),
      type: entryFormData.type,
      category: entryFormData.category,
      subcategory: entryFormData.subcategory,
      amount: parseFloat(entryFormData.amount),
      currency: entryFormData.currency,
      description: entryFormData.description || (entryFormData.type === 'income' ? entryFormData.reference : ''),
      date: entryFormData.date,
      companyId: parseInt(entryFormData.companyId),
      reference: entryFormData.reference,
      accountId: entryFormData.accountId,
      accountType: entryFormData.accountType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cogs: entryFormData.type === 'income' && entryFormData.cogs ? parseFloat(entryFormData.cogs) : undefined,
      cogsPaid: entryFormData.type === 'income' && entryFormData.cogsPaid ? parseFloat(entryFormData.cogsPaid) : undefined,
      linkedIncomeId: entryFormData.linkedIncomeId || undefined,
      vendorInvoice: entryFormData.type === 'expense' && entryFormData.vendorInvoice ? entryFormData.vendorInvoice : undefined
    };

    setEntries(prev => [newEntry, ...prev]);
    setShowEntryDialog(false);
    resetEntryForm();
    toast.success('Entry created successfully');
  }, [entryFormData]);

  const handleUpdateEntry = useCallback(() => {
    if (!editingEntry) return;
    
    // Same validation as create
    if (entryFormData.type === 'income') {
      if (!entryFormData.reference || !entryFormData.amount || !entryFormData.companyId) {
        toast.error('Please fill in all required fields (reference, amount, and company are required for income entries)');
        return;
      }
    } else {
      if (!entryFormData.vendorInvoice || !entryFormData.amount || !entryFormData.companyId) {
        toast.error('Please fill in all required fields (vendor invoice, amount, and company are required for expense entries)');
        return;
      }
    }

    const updatedEntry: BookkeepingEntry = {
      ...editingEntry,
      type: entryFormData.type,
      category: entryFormData.category,
      subcategory: entryFormData.subcategory,
      amount: parseFloat(entryFormData.amount),
      currency: entryFormData.currency,
      description: entryFormData.description || (entryFormData.type === 'income' ? entryFormData.reference : ''),
      date: entryFormData.date,
      companyId: parseInt(entryFormData.companyId),
      reference: entryFormData.reference,
      accountId: entryFormData.accountId,
      accountType: entryFormData.accountType,
      updatedAt: new Date().toISOString(),
      cogs: entryFormData.type === 'income' && entryFormData.cogs ? parseFloat(entryFormData.cogs) : undefined,
      cogsPaid: entryFormData.type === 'income' && entryFormData.cogsPaid ? parseFloat(entryFormData.cogsPaid) : undefined,
      linkedIncomeId: entryFormData.linkedIncomeId || undefined,
      vendorInvoice: entryFormData.type === 'expense' && entryFormData.vendorInvoice ? entryFormData.vendorInvoice : undefined
    };

    setEntries(prev => prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry));
    setShowEntryDialog(false);
    setEditingEntry(null);
    resetEntryForm();
    toast.success('Entry updated successfully');
  }, [editingEntry, entryFormData]);

  const handleEditEntry = useCallback((entry: BookkeepingEntry) => {
    setEditingEntry(entry);
    setEntryFormData({
      type: entry.type,
      category: entry.category,
      subcategory: entry.subcategory || '',
      amount: entry.amount.toString(),
      currency: entry.currency,
      description: entry.description,
      date: entry.date,
      companyId: entry.companyId.toString(),
      reference: entry.reference || '',
      accountId: entry.accountId || '',
      accountType: entry.accountType || 'bank',
      cogs: entry.cogs?.toString() || '',
      cogsPaid: entry.cogsPaid?.toString() || '',
      selectedInvoiceData: null,
      vendorData: null,
      productData: null,
      linkedIncomeId: entry.linkedIncomeId || '',
      vendorInvoice: entry.vendorInvoice || ''
    });
    setShowEntryDialog(true);
  }, []);

  const handleDeleteEntry = useCallback((entry?: BookkeepingEntry) => {
    if (entry) {
      setEntryToDelete(entry);
      setShowDeleteSingleDialog(true);
    } else if (selectedEntries.size > 0) {
      setShowDeleteConfirmDialog(true);
    }
  }, [selectedEntries]);

  const confirmSingleDelete = useCallback(() => {
    if (entryToDelete) {
      setEntries(prev => prev.filter(entry => entry.id !== entryToDelete.id));
      toast.success('Entry deleted successfully');
      setEntryToDelete(null);
      setShowDeleteSingleDialog(false);
    }
  }, [entryToDelete]);

  const confirmDeleteEntry = useCallback(() => {
    if (entryToDelete) {
      confirmSingleDelete();
    } else if (selectedEntries.size > 0) {
      setEntries(prev => prev.filter(entry => !selectedEntries.has(entry.id)));
      toast.success(`${selectedEntries.size} entries deleted successfully`);
      setSelectedEntries(new Set());
      setShowDeleteConfirmDialog(false);
    }
  }, [entryToDelete, selectedEntries, confirmSingleDelete]);

  const handleBulkCreate = useCallback(() => {
    const validation = BookkeepingBusinessService.validateBulkEntries(bulkEntries);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const newEntries = bulkEntries.map(bulkEntry => ({
      id: BookkeepingBusinessService.generateEntryId(),
      type: bulkAddType,
      category: bulkEntry.category,
      amount: parseFloat(bulkEntry.amount),
      currency: bulkEntry.currency,
      description: bulkEntry.description,
      date: bulkEntry.date,
      companyId: selectedCompany !== 'all' ? selectedCompany : parseInt(bulkEntries[0]?.companyId || '1'),
      reference: bulkEntry.reference,
      vendorInvoice: bulkAddType === 'expense' ? bulkEntry.vendorInvoice : undefined,
      cogs: bulkAddType === 'income' && bulkEntry.cogs ? parseFloat(bulkEntry.cogs) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    setEntries(prev => [...newEntries, ...prev]);
    setBulkEntries([initialBulkEntryData]);
    setShowBulkAddDialog(false);
    toast.success(`${newEntries.length} entries created successfully`);
  }, [bulkEntries, bulkAddType, selectedCompany]);

  const handleBulkDelete = useCallback(() => {
    if (selectedEntries.size === 0) {
      toast.error('No entries selected for deletion');
      return;
    }
    setShowDeleteConfirmDialog(true);
  }, [selectedEntries]);

  // Form Actions
  const updateEntryFormData = useCallback((field: string, value: any) => {
    setEntryFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetEntryForm = useCallback(() => {
    setEntryFormData({
      ...initialEntryFormData,
      companyId: selectedCompany !== 'all' ? String(selectedCompany) : ''
    });
    setShowInvoiceSelect(false);
    setInvoiceSearchTerm('');
  }, [selectedCompany]);

  const updateBulkEntries = useCallback((entries: BulkEntryFormData[]) => {
    setBulkEntries(entries);
  }, []);

  const addBulkEntry = useCallback(() => {
    setBulkEntries(prev => [...prev, initialBulkEntryData]);
  }, []);

  const removeBulkEntry = useCallback((index: number) => {
    setBulkEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  // UI Actions
  const toggleEntryExpansion = useCallback((entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  }, [expandedEntries]);

  const toggleAllEntriesExpansion = useCallback(() => {
    if (isAllExpanded) {
      setExpandedEntries(new Set());
    } else {
      setExpandedEntries(new Set(filteredEntries.map(entry => entry.id)));
    }
    setIsAllExpanded(!isAllExpanded);
  }, [isAllExpanded, filteredEntries]);

  const toggleGroupExpansion = useCallback((groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  }, [expandedGroups]);

  const toggleEntrySelection = useCallback((entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  }, [selectedEntries]);

  const selectAllEntries = useCallback(() => {
    setSelectedEntries(new Set(filteredEntries.map(entry => entry.id)));
  }, [filteredEntries]);

  const clearEntrySelection = useCallback(() => {
    setSelectedEntries(new Set());
  }, []);

  // Invoice Actions
  const handleInvoiceSelection = useCallback((invoiceIdentifier: string) => {
    if (invoiceIdentifier === "custom") {
      setShowInvoiceSelect(false);
      setEntryFormData(prev => ({ 
        ...prev, 
        reference: "",
        selectedInvoiceData: null,
        vendorData: null,
        productData: null
      }));
      return;
    }

    // Find invoice by reference format "Invoice [Number]"
    const invoiceNumber = invoiceIdentifier.replace('Invoice ', '');
    const selectedInvoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    
    if (selectedInvoice) {
      const invoiceProducts = BookkeepingBusinessService.getInvoiceProducts(selectedInvoice, products);
      const invoiceVendor = BookkeepingBusinessService.getInvoiceVendor(selectedInvoice, vendors, products);
      const calculatedCOGS = BookkeepingBusinessService.calculateInvoiceCOGS(selectedInvoice, products);
      
      const suggestedCurrency = BookkeepingBusinessService.getSuggestedCurrencyForInvoice(
        selectedInvoice,
        calculatedCOGS,
        invoiceProducts,
        invoiceVendor
      );

      setEntryFormData(prev => ({ 
        ...prev, 
        reference: invoiceIdentifier,
        currency: suggestedCurrency,
        cogs: calculatedCOGS.amount > 0 ? calculatedCOGS.amount.toString() : '',
        selectedInvoiceData: selectedInvoice,
        vendorData: invoiceVendor,
        productData: invoiceProducts
      }));
    }
  }, [invoices, products, vendors]);

  const setInvoiceSearchTermFunc = useCallback((term: string) => {
    setInvoiceSearchTerm(term);
  }, []);

  // Invoice search input handlers
  const handleInvoiceSearchChange = useCallback((value: string) => {
    if (entryFormData.selectedInvoiceData) {
      // If an invoice is selected, allow editing the reference directly
      updateEntryFormData('reference', value);
    } else {
      // Otherwise, treat as search
      setInvoiceSearchTerm(value);
      updateEntryFormData('reference', value);
    }
  }, [entryFormData.selectedInvoiceData]);

  const handleInvoiceSearchFocus = useCallback(() => {
    if (!entryFormData.selectedInvoiceData && invoiceSearchTerm === 'hidden') {
      setInvoiceSearchTerm(entryFormData.reference); // Show current reference value when focused
    } else if (!entryFormData.selectedInvoiceData) {
      setInvoiceSearchTerm(''); // Show dropdown when focused
    }
  }, [entryFormData.selectedInvoiceData, entryFormData.reference, invoiceSearchTerm]);

  const handleCustomReferenceSelection = useCallback((searchTerm: string) => {
    updateEntryFormData('reference', searchTerm);
    updateEntryFormData('selectedInvoiceData', null);
    updateEntryFormData('vendorData', null);
    updateEntryFormData('productData', null);
    setInvoiceSearchTerm('hidden');
  }, []);

  const handleInvoiceSelectionWithHide = useCallback((invoiceIdentifier: string) => {
    handleInvoiceSelection(invoiceIdentifier);
    setInvoiceSearchTerm('hidden');
  }, [handleInvoiceSelection]);

  const handleClearSelectedInvoice = useCallback(() => {
    updateEntryFormData('reference', "");
    updateEntryFormData('selectedInvoiceData', null);
    updateEntryFormData('vendorData', null);
    updateEntryFormData('productData', null);
    updateEntryFormData('currency', 'USD');
    setInvoiceSearchTerm('');
  }, []);

  // Link Actions
  const handleLinkToIncome = useCallback((expenseEntry: BookkeepingEntry) => {
    const availableIncomeEntries = BookkeepingBusinessService.getAvailableIncomeEntriesForLinking(entries, expenseEntry);

    if (availableIncomeEntries.length === 0) {
      toast.error('No income entries available to link to');
      return;
    }

    setExpenseToLink(expenseEntry);
    setSelectedIncomeForLink('');
    setShowLinkDialog(true);
  }, [entries]);

  const handleConfirmLink = useCallback(() => {
    if (!expenseToLink || !selectedIncomeForLink) {
      toast.error('Please select an income entry to link to');
      return;
    }

    const selectedIncomeEntry = entries.find(entry => entry.id === selectedIncomeForLink);
    if (!selectedIncomeEntry) {
      toast.error('Selected income entry not found');
      return;
    }

    setEntries(prev => prev.map(entry => 
      entry.id === expenseToLink.id 
        ? { ...entry, linkedIncomeId: selectedIncomeEntry.id }
        : entry
    ));

    toast.success(`Expense linked to income entry: ${selectedIncomeEntry.reference || selectedIncomeEntry.description}`);
    
    setShowLinkDialog(false);
    setExpenseToLink(null);
    setSelectedIncomeForLink('');
  }, [expenseToLink, selectedIncomeForLink, entries]);

  const handleCancelLink = useCallback(() => {
    setShowLinkDialog(false);
    setExpenseToLink(null);
    setSelectedIncomeForLink('');
  }, []);

  // Other Utility Functions

  const getCOGSCurrency = useCallback((incomeEntry: BookkeepingEntry) => {
    return BookkeepingBusinessService.getCOGSCurrency(incomeEntry, invoices, products);
  }, [invoices, products]);

  // Additional UI Actions
  const setBulkAddTypeFunc = useCallback((type: 'income' | 'expense') => {
    setBulkAddType(type);
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedEntries.size === filteredEntries.length) {
      clearEntrySelection();
    } else {
      selectAllEntries();
    }
  }, [selectedEntries.size, filteredEntries.length, clearEntrySelection, selectAllEntries]);

  // Processed grouped entries array (replaces getGroupedEntries getter)
  const processedGroupedEntries = React.useMemo(() => {
    return Object.entries(groupedEntries).map(([key, entries]) => {
      const [year, month] = key.split('-');
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[parseInt(month) - 1];
      
      // Calculate group totals
      const totalIncome = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
      
      return {
        key,
        name: `${monthName} ${year}`,
        entries,
        totalIncome,
        totalExpenses
      };
    }).sort((a, b) => b.key.localeCompare(a.key)); // Sort by date descending
  }, [groupedEntries]);

  // Bulk form helpers
  const updateBulkEntry = useCallback((index: number, field: string, value: string) => {
    setBulkEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  }, []);

  const addBulkEntryRow = useCallback(() => {
    setBulkEntries(prev => [...prev, initialBulkEntryData]);
  }, []);

  const removeBulkEntryRow = useCallback((index: number) => {
    setBulkEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  const resetBulkForm = useCallback(() => {
    setBulkEntries([initialBulkEntryData]);
  }, []);

  const confirmBulkDelete = useCallback(() => {
    confirmDeleteEntry();
  }, [confirmDeleteEntry]);

  // Entry form setters
  const setNewEntry = useCallback((setter: (prev: ExtendedEntryFormData) => ExtendedEntryFormData) => {
    setEntryFormData(setter);
  }, []);

  const setExpandedEntriesFunc = useCallback((setter: (prev: Set<string>) => Set<string>) => {
    setExpandedEntries(setter);
  }, []);

  // Dialog handler functions
  const handleShowAddIncomeDialog = useCallback(() => {
    if (selectedCompany === 'all') {
      toast.error('Please select a specific company to add entries.');
      return;
    }
    setBulkAddTypeFunc('income');
    setShowBulkAddDialog(true);
  }, [selectedCompany, setBulkAddTypeFunc]);

  const handleShowAddExpenseDialog = useCallback(() => {
    if (selectedCompany === 'all') {
      toast.error('Please select a specific company to add entries.');
      return;
    }
    setBulkAddTypeFunc('expense');
    setShowBulkAddDialog(true);
  }, [selectedCompany, setBulkAddTypeFunc]);

  // Handler for viewing related income entry (side effects managed declaratively in component)
  const handleViewRelatedIncomeEntry = useCallback((linkedIncomeId: string) => {
    // Expand the linked income entry
    setExpandedEntries(prev => new Set([...prev, linkedIncomeId]));
    
    // Set highlight state for visual feedback (scroll effect managed in component useEffect)
    setHighlightedEntryId(linkedIncomeId);
    
    // Clear highlight after 2 seconds
    setTimeout(() => {
      setHighlightedEntryId(null);
    }, 2000);
  }, []);

  // Consolidated dialog action handlers
  const handleCancelEdit = useCallback(() => {
    setShowEntryDialog(false);
    setEditingEntry(null);
    resetEntryForm();
  }, [resetEntryForm]);

  const handleCancelBulkAdd = useCallback(() => {
    setShowBulkAddDialog(false);
    resetBulkForm();
  }, [resetBulkForm]);

  // Missing handler functions
  const toggleGroupedView = useCallback(() => {
    setGroupedView(!groupedView);
  }, [groupedView]);

  const handleShowAddDialog = useCallback(() => {
    setShowEntryDialog(true);
  }, []);

  const handleShowBulkDialog = useCallback(() => {
    setShowBulkAddDialog(true);
  }, []);

  const handleFilterChange = useCallback((newFilters: any) => {
    if (newFilters.selectedPeriod) setSelectedPeriod(newFilters.selectedPeriod);
    if (newFilters.customDateRange) setCustomDateRange(newFilters.customDateRange);
    if (newFilters.viewFilter) setViewFilter(newFilters.viewFilter);
    if (newFilters.searchTerm !== undefined) setSearchTerm(newFilters.searchTerm);
  }, []);

  return {
    // Core Data
    entries,
    invoices,
    products,
    vendors,
    accounts,
    
    // Computed Data
    filteredEntries,
    groupedEntries,
    processedGroupedEntries,
    linkedExpensesMap,
    remainingAmountsMap,
    filteredInvoicesForDropdown,
    activeCompanies,
    entriesToDeleteDetails,
    availableIncomeEntriesForLinking,
    financialSummary: { income: totalIncome, cogs: 0, actualExpenses: totalExpenses, accountsPayable: 0, netProfit: netProfit },
    expenseBreakdown: [],
    
    // UI State
    isLoaded,
    selectedPeriod,
    customDateRange,
    viewFilter,
    groupedView,
    expandedGroups,
    expandedEntries,
    isAllExpanded,
    selectedEntries,
    searchTerm,
    highlightedEntryId,
    filters: {
      selectedPeriod,
      customDateRange,
      viewFilter,
      searchTerm
    },
    
    // Dialog States
    showEntryDialog,
    showBulkAddDialog,
    showDeleteConfirmDialog,
    showDeleteSingleDialog,
    showInvoiceSelect,
    showLinkDialog,
    
    // Form States
    entryFormData,
    bulkEntries,
    bulkAddType,
    editingEntry,
    entryToDelete,
    expenseToLink,
    selectedIncomeForLink,
    invoiceSearchTerm,
    
    // Computed Properties
    totalIncome,
    totalExpenses,
    netProfit,
    pageTitle,
    pageDescription,
    validBulkEntriesCount,
    formCogsSummary,
    linkedIncomeMap,
    formSelectedLinkedIncome,
    
    // Actions
    handleCreateEntry,
    handleUpdateEntry,
    handleEditEntry,
    handleDeleteEntry,
    confirmDeleteEntry,
    confirmSingleDelete,
    handleBulkCreate,
    handleBulkDelete,
    
    // Form Actions
    updateEntryFormData,
    resetEntryForm,
    updateBulkEntries,
    addBulkEntry,
    removeBulkEntry,
    
    // Dialog Actions
    setShowEntryDialog,
    setShowBulkAddDialog,
    setShowDeleteConfirmDialog,
    setShowDeleteSingleDialog,
    setShowInvoiceSelect,
    setShowLinkDialog,
    handleShowAddIncomeDialog,
    handleShowAddExpenseDialog,
    handleViewRelatedIncomeEntry,
    handleCancelEdit,
    handleCancelBulkAdd,
    toggleGroupedView,
    handleShowAddDialog,
    handleShowBulkDialog,
    handleFilterChange,
    setEditingEntry,
    
    // Filter Actions
    setSelectedPeriod,
    setCustomDateRange,
    setViewFilter,
    setGroupedView,
    setSearchTerm,
    
    // UI Actions
    toggleEntryExpansion,
    toggleAllEntriesExpansion,
    toggleGroupExpansion,
    toggleEntrySelection,
    selectAllEntries,
    clearEntrySelection,
    
    // Invoice Actions
    handleInvoiceSelection,
    setInvoiceSearchTerm: setInvoiceSearchTermFunc,
    handleInvoiceSearchChange,
    handleInvoiceSearchFocus,
    handleCustomReferenceSelection,
    handleInvoiceSelectionWithHide,
    handleClearSelectedInvoice,
    
    // Link Actions
    handleLinkToIncome,
    handleConfirmLink,
    handleCancelLink,
    setSelectedIncomeForLink,
    
    // Additional UI Actions
    setBulkAddType: setBulkAddTypeFunc,
    toggleSelectAll,
    
    
    // Bulk form helpers
    updateBulkEntry,
    addBulkEntryRow,
    removeBulkEntryRow,
    resetBulkForm,
    confirmBulkDelete,
    
    // Entry form setters
    setNewEntry,
    setExpandedEntries: setExpandedEntriesFunc,
    
    // Utility Functions
    formatCurrency,
    getCOGSCurrency
  };
};