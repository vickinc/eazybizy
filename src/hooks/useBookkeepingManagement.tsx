import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  BookkeepingEntry, 
  CompanyAccount, 
  BookkeepingFormData, 
  AccountFormData,
  PeriodFilter,
  FinancialSummary,
  ExpenseBreakdownItem
} from '@/types/accounting';
import { Invoice } from '@/types/invoice.types';
import { Product, Company } from '@/types/core';
import { BookkeepingStorageService } from '@/services/storage';
import { BookkeepingBusinessService } from '@/services/business/bookkeepingBusinessService';
import { BookkeepingValidationService } from '@/services/business/bookkeepingValidationService';
import { getLocalDateString } from '@/utils';

export interface EnrichedBookkeepingEntry extends BookkeepingEntry {
  company?: Company;
  accountsPayable: number;
}

export interface ExpenseBreakdownWithPercentage extends ExpenseBreakdownItem {
  percentage: number;
}

export interface ExtendedFinancialSummary extends FinancialSummary {
  actualCogsPaid: number;
  projectedNetProfit: number;
  profitMargin: string;
}

export interface BookkeepingManagementHook {
  // Data
  entries: BookkeepingEntry[];
  accounts: CompanyAccount[];
  filteredEntries: BookkeepingEntry[];
  enrichedEntries: EnrichedBookkeepingEntry[];
  financialSummary: ExtendedFinancialSummary;
  expenseBreakdown: ExpenseBreakdownWithPercentage[];
  
  // Form Data
  activeCompanies: Company[];
  availableInvoices: Invoice[];
  
  // State
  isLoaded: boolean;
  selectedPeriod: PeriodFilter;
  
  // Entry Form State
  entryFormData: BookkeepingFormData;
  editingEntry: BookkeepingEntry | null;
  showEntryDialog: boolean;
  showInvoiceSelect: boolean;
  
  // Account Form State
  accountFormData: AccountFormData;
  editingAccount: CompanyAccount | null;
  showAccountDialog: boolean;
  
  // UI State
  expandedEntries: Set<string>;
  isAllExpanded: boolean;
  
  // Entry Form Actions
  handleEntryInputChange: (name: string, value: string) => void;
  handleEntrySubmit: (e: React.FormEvent) => void;
  handleEditEntry: (entry: BookkeepingEntry) => void;
  handleDeleteEntry: (id: string) => void;
  resetEntryForm: () => void;
  setShowEntryDialog: (show: boolean) => void;
  setShowInvoiceSelect: (show: boolean) => void;
  handleInvoiceReferenceChange: (value: string) => void;
  handleDialogCancel: () => void;
  
  // Account Form Actions
  handleAccountInputChange: (name: string, value: string) => void;
  handleAccountSubmit: (e: React.FormEvent) => void;
  handleEditAccount: (account: CompanyAccount) => void;
  handleDeleteAccount: (id: string) => void;
  resetAccountForm: () => void;
  setShowAccountDialog: (show: boolean) => void;
  
  // Filter Actions
  setSelectedPeriod: (period: PeriodFilter) => void;
  
  // UI Actions
  toggleEntryExpansion: (entryId: string) => void;
  toggleAllEntriesExpansion: () => void;
  
  // Utility Functions
  getCompanyAccounts: (companyId: number) => CompanyAccount[];
  formatCurrency: (amount: number | undefined | null, currency?: string) => string;
}

const initialEntryFormData: BookkeepingFormData = {
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
  chartOfAccountsId: ''
};

const initialAccountFormData: AccountFormData = {
  companyId: '',
  type: 'bank',
  name: '',
  accountNumber: '',
  currency: 'USD',
  startingBalance: ''
};

export const useBookkeepingManagement = (
  selectedCompany: number | 'all',
  companies: Company[]
): BookkeepingManagementHook => {
  // Core Data State
  const [entries, setEntries] = useState<BookkeepingEntry[]>([]);
  const [accounts, setAccounts] = useState<CompanyAccount[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Filter State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('thisMonth');
  
  // Entry Form State
  const [entryFormData, setEntryFormData] = useState<BookkeepingFormData>(initialEntryFormData);
  const [editingEntry, setEditingEntry] = useState<BookkeepingEntry | null>(null);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showInvoiceSelect, setShowInvoiceSelect] = useState(false);
  
  // Account Form State
  const [accountFormData, setAccountFormData] = useState<AccountFormData>(initialAccountFormData);
  const [editingAccount, setEditingAccount] = useState<CompanyAccount | null>(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  
  // UI State
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedEntries = BookkeepingStorageService.getEntries();
      const savedAccounts = BookkeepingStorageService.getAccounts();
      
      // Load invoices and products
      const savedInvoices = localStorage.getItem('app-invoices');
      const savedProducts = localStorage.getItem('app-products');
      
      if (savedInvoices) {
        setInvoices(JSON.parse(savedInvoices));
      }
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
      
      setEntries(savedEntries);
      setAccounts(savedAccounts);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoaded(true);
    }
  }, []);

  // Save data to localStorage when changed
  useEffect(() => {
    if (isLoaded && entries.length > 0) {
      BookkeepingStorageService.saveEntries(entries);
    }
  }, [entries, isLoaded]);

  useEffect(() => {
    if (isLoaded && accounts.length > 0) {
      BookkeepingStorageService.saveAccounts(accounts);
    }
  }, [accounts, isLoaded]);

  // Auto-sync with invoice payments
  useEffect(() => {
    if (!isLoaded) return;

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
  }, [invoices, products, isLoaded]);

  // Recalculate COGS for existing entries
  useEffect(() => {
    if (!isLoaded || !products.length || !invoices.length) return;

    setEntries(prevEntries => {
      return prevEntries.map(entry => {
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
    });
  }, [products, invoices, isLoaded]);

  // Filtered entries calculation
  const filteredEntries = React.useMemo(() => {
    let filtered = BookkeepingBusinessService.filterEntriesByCompany(entries, selectedCompany);
    return BookkeepingBusinessService.filterEntriesByPeriod(filtered, selectedPeriod);
  }, [entries, selectedCompany, selectedPeriod]);

  // Enriched entries with company info and calculated fields
  const enrichedEntries = React.useMemo(() => {
    return filteredEntries.slice(0, 5).map(entry => ({
      ...entry,
      company: companies.find(c => c.id === entry.companyId),
      accountsPayable: BookkeepingBusinessService.getAccountsPayable(entry)
    }));
  }, [filteredEntries, companies]);

  // Active companies for forms
  const activeCompanies = React.useMemo(() => {
    return companies.filter(c => c.status === 'Active');
  }, [companies]);

  // Available invoices for reference dropdown
  const availableInvoices = React.useMemo(() => {
    if (!entryFormData.companyId) return [];
    return invoices
      .filter(invoice => invoice.fromCompanyId === parseInt(entryFormData.companyId))
      .filter(invoice => invoice.status === 'paid' || invoice.status === 'sent');
  }, [invoices, entryFormData.companyId]);

  // Enhanced financial summary calculation
  const financialSummary = React.useMemo(() => {
    const baseSummary = BookkeepingBusinessService.calculateFinancialSummary(filteredEntries);
    
    // Calculate actual COGS paid
    const actualCogsPaid = filteredEntries
      .filter(entry => entry.type === 'income' && entry.cogsPaid)
      .reduce((sum, entry) => sum + (entry.cogsPaid || 0), 0);
    
    // Calculate projected net profit
    const projectedNetProfit = baseSummary.income - baseSummary.actualExpenses - baseSummary.accountsPayable;
    
    // Calculate profit margin
    const profitMargin = baseSummary.income > 0 
      ? `${((baseSummary.netProfit / baseSummary.income) * 100).toFixed(1)}%`
      : '0%';
    
    return {
      ...baseSummary,
      actualCogsPaid,
      projectedNetProfit,
      profitMargin
    };
  }, [filteredEntries]);

  // Expense breakdown with percentages
  const expenseBreakdown = React.useMemo(() => {
    const breakdown = BookkeepingBusinessService.getExpenseBreakdown(filteredEntries);
    const totalExpenses = financialSummary.actualExpenses;
    
    return breakdown.map(item => ({
      ...item,
      percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
    }));
  }, [filteredEntries, financialSummary.actualExpenses]);

  // Entry Form Handlers
  const handleEntryInputChange = useCallback((name: string, value: string) => {
    setEntryFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEntrySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = BookkeepingValidationService.validateEntryForm(entryFormData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    if (editingEntry) {
      const updatedEntry = BookkeepingBusinessService.updateEntryFromFormData(editingEntry, entryFormData);
      setEntries(prev => prev.map(entry => 
        entry.id === editingEntry.id ? updatedEntry : entry
      ));
      
      // Update account balance if needed
      if (entryFormData.accountId) {
        const account = accounts.find(a => a.id === entryFormData.accountId);
        if (account) {
          const updatedAccount = BookkeepingBusinessService.updateAccountBalance(
            account, 
            parseFloat(entryFormData.amount), 
            entryFormData.type
          );
          setAccounts(prev => prev.map(a => a.id === account.id ? updatedAccount : a));
        }
      }
      
      toast.success('Entry updated successfully');
    } else {
      const newEntry = BookkeepingBusinessService.createEntryFromFormData(entryFormData);
      setEntries(prev => [newEntry, ...prev]);
      
      // Update account balance if needed
      if (entryFormData.accountId) {
        const account = accounts.find(a => a.id === entryFormData.accountId);
        if (account) {
          const updatedAccount = BookkeepingBusinessService.updateAccountBalance(
            account, 
            parseFloat(entryFormData.amount), 
            entryFormData.type
          );
          setAccounts(prev => prev.map(a => a.id === account.id ? updatedAccount : a));
        }
      }
      
      toast.success('Entry added successfully');
    }

    resetEntryForm();
    setShowEntryDialog(false);
  }, [entryFormData, editingEntry, accounts]);

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
      chartOfAccountsId: entry.chartOfAccountsId || ''
    });
    setShowEntryDialog(true);
  }, []);

  const handleDeleteEntry = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
      toast.success('Entry deleted successfully');
    }
  }, []);

  const resetEntryForm = useCallback(() => {
    setEntryFormData(initialEntryFormData);
    setEditingEntry(null);
    setShowInvoiceSelect(false);
  }, []);

  const handleInvoiceReferenceChange = useCallback((value: string) => {
    if (value === "custom") {
      setShowInvoiceSelect(false);
      handleEntryInputChange('reference', '');
    } else {
      handleEntryInputChange('reference', value);
    }
  }, [handleEntryInputChange]);

  const handleDialogCancel = useCallback(() => {
    setShowEntryDialog(false);
    resetEntryForm();
  }, [resetEntryForm]);

  // Account Form Handlers
  const handleAccountInputChange = useCallback((name: string, value: string) => {
    setAccountFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAccountSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = BookkeepingValidationService.validateAccountForm(accountFormData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    if (editingAccount) {
      // Update existing account
      const updatedAccount = {
        ...editingAccount,
        name: accountFormData.name,
        accountNumber: accountFormData.accountNumber || undefined,
        updatedAt: new Date().toISOString()
      };
      
      setAccounts(prev => prev.map(account => 
        account.id === editingAccount.id ? updatedAccount : account
      ));
      toast.success('Account updated successfully');
    } else {
      // Add new account
      const newAccount = BookkeepingBusinessService.createAccountFromFormData(accountFormData);
      setAccounts(prev => [newAccount, ...prev]);
      toast.success('Account added successfully');
    }

    resetAccountForm();
    setShowAccountDialog(false);
  }, [accountFormData, editingAccount]);

  const handleEditAccount = useCallback((account: CompanyAccount) => {
    setEditingAccount(account);
    setAccountFormData({
      companyId: account.companyId.toString(),
      type: account.type,
      name: account.name,
      accountNumber: account.accountNumber || '',
      currency: account.currency,
      startingBalance: account.startingBalance.toString()
    });
    setShowAccountDialog(true);
  }, []);

  const handleDeleteAccount = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      setAccounts(prev => prev.filter(account => account.id !== id));
      toast.success('Account deleted successfully');
    }
  }, []);

  const resetAccountForm = useCallback(() => {
    setAccountFormData(initialAccountFormData);
    setEditingAccount(null);
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

  // Utility Functions
  const getCompanyAccounts = useCallback((companyId: number) => {
    return accounts.filter(account => account.companyId === companyId);
  }, [accounts]);

  const formatCurrency = useCallback((amount: number | undefined | null, currency: string = 'USD') => {
    return BookkeepingBusinessService.formatLargeCurrency(amount, currency);
  }, []);

  return {
    // Data
    entries,
    accounts,
    filteredEntries,
    enrichedEntries,
    financialSummary,
    expenseBreakdown,
    
    // Form Data
    activeCompanies,
    availableInvoices,
    
    // State
    isLoaded,
    selectedPeriod,
    
    // Entry Form State
    entryFormData,
    editingEntry,
    showEntryDialog,
    showInvoiceSelect,
    
    // Account Form State
    accountFormData,
    editingAccount,
    showAccountDialog,
    
    // UI State
    expandedEntries,
    isAllExpanded,
    
    // Entry Form Actions
    handleEntryInputChange,
    handleEntrySubmit,
    handleEditEntry,
    handleDeleteEntry,
    resetEntryForm,
    setShowEntryDialog,
    setShowInvoiceSelect,
    handleInvoiceReferenceChange,
    handleDialogCancel,
    
    // Account Form Actions
    handleAccountInputChange,
    handleAccountSubmit,
    handleEditAccount,
    handleDeleteAccount,
    resetAccountForm,
    setShowAccountDialog,
    
    // Filter Actions
    setSelectedPeriod,
    
    // UI Actions
    toggleEntryExpansion,
    toggleAllEntriesExpansion,
    
    // Utility Functions
    getCompanyAccounts,
    formatCurrency
  };
};