import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  Client, 
  FormattedClient, 
  ClientFormData, 
  ClientFilters,
  ClientStatistics,
  INDUSTRIES,
  CLIENT_STATUSES
} from '@/types/client.types';
import { Company } from '@/types/company.types';
import { ClientStorageService } from '@/services/storage/clientStorageService';
import { ClientBusinessService } from '@/services/business/clientBusinessService';
import { ClientValidationService } from '@/services/validation/clientValidationService';

export interface ClientsManagementHook {
  // Data
  clients: Client[];
  filteredClients: FormattedClient[];
  statistics: ClientStatistics;
  
  // UI Data Lists
  availableIndustries: string[];
  availableStatuses: Array<{ value: string; label: string; color: string }>;
  
  // Page Header Data
  pageTitle: string;
  pageDescription: string;
  
  // UI State
  isLoaded: boolean;
  showAddForm: boolean;
  editingClient: Client | null;
  expandedClients: Set<string>;
  isAllExpanded: boolean;
  viewMode: 'active' | 'archived';
  exchangeRates: { [key: string]: number };
  
  // Form State
  clientForm: ClientFormData;
  
  // Filters
  searchTerm: string;
  filterStatus: 'all' | 'active' | 'inactive' | 'lead' | 'archived';
  filterIndustry: string;
  
  // Actions
  setShowAddForm: (show: boolean) => void;
  setEditingClient: (client: Client | null) => void;
  setSearchTerm: (term: string) => void;
  setFilterStatus: (filter: 'all' | 'active' | 'inactive' | 'lead' | 'archived') => void;
  setFilterIndustry: (industry: string) => void;
  setViewMode: (mode: 'active' | 'archived') => void;
  
  // Form Handlers
  handleClientFormChange: (field: string, value: string | number) => void;
  resetForm: () => void;
  
  // Client Operations
  handleCreateClient: () => void;
  handleUpdateClient: () => void;
  handleDeleteClient: (id: string) => void;
  handleArchiveClient: (id: string) => void;
  handleRestoreClient: (id: string) => void;
  updateAllClientStatuses: () => void;
  
  // Expansion Operations
  toggleClientExpansion: (clientId: string) => void;
  toggleAllExpansion: () => void;
  
  // Helper Functions
  getCompanyName: (companyId: number) => string;
  getCompanyById: (companyId: number) => Company | undefined;
}

const initialClientForm: ClientFormData = {
  companyId: '',
  clientType: 'Individual',
  name: '',
  contactPersonName: '',
  contactPersonPosition: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  city: '',
  zipCode: '',
  country: '',
  industry: '',
  status: 'lead',
  notes: '',
  registrationNumber: '',
  vatNumber: '',
  passportNumber: '',
  dateOfBirth: ''
};

export function useClientsManagement(
  globalSelectedCompany: number | 'all',
  companies: Company[]
): ClientsManagementHook {
  // Core Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({});
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  
  // Form State
  const [clientForm, setClientForm] = useState<ClientFormData>(initialClientForm);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'lead' | 'archived'>('all');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');

  // Load initial data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setClients(ClientStorageService.getClients());
      setExchangeRates(ClientBusinessService.getExchangeRates());
      setIsLoaded(true);
    }
  }, []);

  // Listen for currency rate updates
  useEffect(() => {
    const handleCurrencyRatesUpdate = () => {
      setExchangeRates(ClientBusinessService.getExchangeRates());
      // Force recalculation of client totals with new rates
      setTimeout(() => {
        const savedInvoices = localStorage.getItem('app-invoices');
        if (savedInvoices && clients.length > 0) {
          setClients(prev => [...prev]);
        }
      }, 100);
    };

    window.addEventListener('currencyRatesUpdated', handleCurrencyRatesUpdate);
    return () => {
      window.removeEventListener('currencyRatesUpdated', handleCurrencyRatesUpdate);
    };
  }, [clients.length]);

  // Calculate client totals from invoices when data loads and when storage changes
  useEffect(() => {
    const updateClientTotals = () => {
      const savedInvoices = localStorage.getItem('app-invoices');
      if (savedInvoices && clients.length > 0) {
        try {
          const invoices = JSON.parse(savedInvoices);
          const updatedClients = ClientBusinessService.updateClientTotalsFromInvoices(
            clients, 
            invoices, 
            exchangeRates
          );
          
          // Only update if there are actual changes
          const hasChanges = updatedClients.some((updatedClient, index) => {
            const originalClient = clients[index];
            return originalClient && (
              originalClient.status !== updatedClient.status ||
              originalClient.totalInvoiced !== updatedClient.totalInvoiced ||
              originalClient.totalPaid !== updatedClient.totalPaid ||
              originalClient.lastInvoiceDate !== updatedClient.lastInvoiceDate
            );
          });
          
          if (hasChanges) {
            setClients(updatedClients);
            ClientStorageService.updateClientTotals(updatedClients);
          }
        } catch (error) {
          console.error('Error calculating client totals:', error);
        }
      }
    };

    // Update when component mounts and clients are loaded
    if (isLoaded && clients.length > 0) {
      updateClientTotals();
      
      // Listen for localStorage changes (when invoices are created/updated)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'app-invoices') {
          updateClientTotals();
        }
      };
      
      // Also listen for custom events (for same-tab updates)
      const handleInvoiceUpdate = () => {
        updateClientTotals();
      };
      
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('invoicesUpdated', handleInvoiceUpdate);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('invoicesUpdated', handleInvoiceUpdate);
      };
    }
  }, [isLoaded, clients.length, exchangeRates]);

  // UI Data Lists
  const availableIndustries = useMemo(() => INDUSTRIES, []);
  const availableStatuses = useMemo(() => CLIENT_STATUSES, []);

  // Filter clients based on current filters and view mode
  const filteredClients = useMemo(() => {
    const filters: ClientFilters = {
      searchTerm,
      statusFilter: filterStatus,
      industryFilter: filterIndustry,
      companyFilter: globalSelectedCompany
    };

    const filtered = ClientBusinessService.filterClients(clients, filters);
    
    // Apply view mode filter
    const viewFiltered = filtered.filter(client => {
      if (viewMode === 'active') {
        return client.status !== 'archived';
      } else {
        return client.status === 'archived';
      }
    });

    // Format clients for display
    return viewFiltered.map(client => 
      ClientBusinessService.formatClientForDisplay(client, companies)
    );
  }, [clients, companies, searchTerm, filterStatus, filterIndustry, globalSelectedCompany, viewMode]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const allClients = ClientBusinessService.filterClients(clients, {
      searchTerm: '',
      statusFilter: 'all',
      industryFilter: 'all',
      companyFilter: globalSelectedCompany
    });
    return ClientBusinessService.calculateStatistics(allClients);
  }, [clients, globalSelectedCompany]);

  // Calculate page header data
  const pageHeaderData = useMemo(() => {
    if (globalSelectedCompany === 'all') {
      return {
        title: 'Clients',
        description: 'Manage your client relationships and information'
      };
    }
    
    const company = companies.find(c => c.id === globalSelectedCompany);
    if (company) {
      return {
        title: `${company.tradingName} - Clients`,
        description: `Managing clients for ${company.tradingName}`
      };
    }
    
    return {
      title: 'Clients',
      description: 'Manage your client relationships and information'
    };
  }, [globalSelectedCompany, companies]);

  // Update isAllExpanded based on individual expansions
  useEffect(() => {
    if (filteredClients.length > 0) {
      const allExpanded = filteredClients.every(client => expandedClients.has(client.id));
      setIsAllExpanded(allExpanded);
    }
  }, [expandedClients, filteredClients]);

  // Form Handlers
  const handleClientFormChange = useCallback((field: string, value: string | number) => {
    setClientForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setClientForm(initialClientForm);
    setEditingClient(null);
    setShowAddForm(false);
  }, []);

  // Client Operations
  const handleCreateClient = useCallback(() => {
    const validation = ClientValidationService.validateForCreation(clientForm, clients);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const client = ClientBusinessService.createClient(clientForm);
    const updatedClients = ClientStorageService.addClient(client);
    setClients(updatedClients);
    
    resetForm();
    toast.success('Client created successfully');
  }, [clientForm, clients, resetForm]);

  const handleUpdateClient = useCallback(() => {
    if (!editingClient) return;

    const validation = ClientValidationService.validateForUpdate(clientForm, clients, editingClient.id);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const updatedClient = ClientBusinessService.updateClient(editingClient, clientForm);
    const updatedClients = ClientStorageService.updateClient(updatedClient);
    setClients(updatedClients);
    
    resetForm();
    toast.success('Client updated successfully');
  }, [editingClient, clientForm, clients, resetForm]);

  const handleDeleteClient = useCallback((id: string) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    
    if (client.status !== 'archived') {
      toast.error('Clients can only be deleted from archive. Please archive the client first.');
      return;
    }
    
    if (confirm('Are you sure you want to permanently delete this client? This action cannot be undone.')) {
      const updatedClients = ClientStorageService.deleteClient(id);
      setClients(updatedClients);
      toast.success('Client deleted successfully');
    }
  }, [clients]);

  const handleArchiveClient = useCallback((id: string) => {
    const updatedClients = ClientStorageService.archiveClient(id);
    setClients(updatedClients);
    toast.success('Client archived successfully');
  }, []);

  const handleRestoreClient = useCallback((id: string) => {
    const updatedClients = ClientStorageService.restoreClient(id);
    setClients(updatedClients);
    toast.success('Client restored successfully');
  }, []);

  const updateAllClientStatuses = useCallback(() => {
    const savedInvoices = localStorage.getItem('app-invoices');
    if (!savedInvoices) {
      toast.info('No invoices found for status update');
      return;
    }

    try {
      const invoices = JSON.parse(savedInvoices);
      const { updatedClients, updatedCount } = ClientBusinessService.updateAllClientStatuses(clients, invoices);

      if (updatedCount > 0) {
        setClients(updatedClients);
        ClientStorageService.updateClientTotals(updatedClients);
        toast.success(`Updated ${updatedCount} client(s) status based on payment history`);
      } else {
        toast.info('No clients needed status updates based on payment history');
      }
    } catch (error) {
      console.error('Error updating client statuses:', error);
      toast.error('Error updating client statuses');
    }
  }, [clients]);

  // Edit operation
  const handleEdit = useCallback((client: Client) => {
    setEditingClient(client);
    setClientForm({
      companyId: client.companyId || '',
      clientType: client.clientType,
      name: client.name || '',
      contactPersonName: client.contactPersonName || '',
      contactPersonPosition: client.contactPersonPosition || '',
      email: client.email || '',
      phone: client.phone || '',
      website: client.website || '',
      address: client.address || '',
      city: client.city || '',
      zipCode: client.zipCode || '',
      country: client.country || '',
      industry: client.industry || '',
      status: client.status,
      notes: client.notes || '',
      registrationNumber: client.registrationNumber || '',
      vatNumber: client.vatNumber || '',
      passportNumber: client.passportNumber || '',
      dateOfBirth: client.dateOfBirth || ''
    });
    setShowAddForm(true);
  }, []);

  // Expansion Operations
  const toggleClientExpansion = useCallback((clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  }, []);

  const toggleAllExpansion = useCallback(() => {
    if (isAllExpanded) {
      setExpandedClients(new Set());
      setIsAllExpanded(false);
    } else {
      const allClientIds = new Set(filteredClients.map(c => c.id));
      setExpandedClients(allClientIds);
      setIsAllExpanded(true);
    }
  }, [isAllExpanded, filteredClients]);

  // Helper Functions
  const getCompanyName = useCallback((companyId: number) => {
    return ClientBusinessService.getCompanyName(companyId, companies);
  }, [companies]);

  const getCompanyById = useCallback((companyId: number) => {
    return companies.find(c => c.id === companyId);
  }, [companies]);

  return {
    // Data
    clients,
    filteredClients,
    statistics,
    
    // UI Data Lists
    availableIndustries,
    availableStatuses,
    
    // Page Header Data
    pageTitle: pageHeaderData.title,
    pageDescription: pageHeaderData.description,
    
    // UI State
    isLoaded,
    showAddForm,
    editingClient,
    expandedClients,
    isAllExpanded,
    viewMode,
    exchangeRates,
    
    // Form State
    clientForm,
    
    // Filters
    searchTerm,
    filterStatus,
    filterIndustry,
    
    // Actions
    setShowAddForm,
    setEditingClient: handleEdit,
    setSearchTerm,
    setFilterStatus,
    setFilterIndustry,
    setViewMode,
    
    // Form Handlers
    handleClientFormChange,
    resetForm,
    
    // Client Operations
    handleCreateClient,
    handleUpdateClient,
    handleDeleteClient,
    handleArchiveClient,
    handleRestoreClient,
    updateAllClientStatuses,
    
    // Expansion Operations
    toggleClientExpansion,
    toggleAllExpansion,
    
    // Helper Functions
    getCompanyName,
    getCompanyById
  };
}