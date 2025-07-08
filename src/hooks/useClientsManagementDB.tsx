import { useState, useCallback, useMemo } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { Company } from '@/types/company.types';
import { 
  ClientsApiService,
  Client,
  ClientFormData as ApiClientFormData,
  ClientQueryParams,
  ClientStatistics
} from '@/services/api/clientsApiService';
import { 
  CLIENT_STATUSES,
  INDUSTRIES,
  FormattedClient
} from '@/types/client.types';

// Create service instance
const clientsApiService = new ClientsApiService();

export interface ClientsManagementDBHook {
  // Data
  clients: Client[];
  filteredClients: FormattedClient[];
  statistics: ClientStatistics | null;
  
  // UI Data Lists
  availableIndustries: string[];
  availableStatuses: Array<{ value: string; label: string; color: string }>;
  
  // Page Header Data
  pageTitle: string;
  pageDescription: string;
  
  // Company Info
  selectedCompanyName: string;
  canAddClient: boolean;
  
  // UI State
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  showAddForm: boolean;
  editingClient: FormattedClient | null;
  expandedClients: Set<string>;
  isAllExpanded: boolean;
  viewMode: 'active' | 'archived';
  
  // Form State
  clientForm: ApiClientFormData;
  
  // Filters
  searchTerm: string;
  filterStatus: 'all' | 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED';
  filterIndustry: string;
  
  // Actions
  setShowAddForm: (show: boolean) => void;
  setEditingClient: (client: FormattedClient | null) => void;
  setSearchTerm: (term: string) => void;
  setFilterStatus: (filter: 'all' | 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED') => void;
  setFilterIndustry: (industry: string) => void;
  setViewMode: (mode: 'active' | 'archived') => void;
  
  // Form Handlers
  handleClientFormChange: (field: string, value: string | number) => void;
  resetForm: () => void;
  
  // Client Operations
  handleCreateClient: () => Promise<void>;
  handleUpdateClient: () => Promise<void>;
  handleDeleteClient: (id: string) => Promise<void>;
  handleDuplicateClient: (id: string) => Promise<void>;
  handleArchiveClient: (id: string) => Promise<void>;
  handleRestoreClient: (id: string) => Promise<void>;
  
  // Expansion Operations
  toggleClientExpansion: (clientId: string) => void;
  toggleAllExpansion: () => void;
  
  // Helper Functions
  getCompanyName: (companyId: number) => string;
  getCompanyById: (companyId: number) => Company | undefined;
  refetch: () => void;
}

const initialClientForm: ApiClientFormData = {
  companyId: undefined,
  clientType: 'INDIVIDUAL',
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
  status: 'ACTIVE',
  notes: '',
  registrationNumber: '',
  vatNumber: '',
  passportNumber: '',
  dateOfBirth: ''
};

export function useClientsManagementDB(
  globalSelectedCompany: number | 'all',
  companies: Company[]
): ClientsManagementDBHook {
  const queryClient = useQueryClient();
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<FormattedClient | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  
  // Form State
  const [clientForm, setClientForm] = useState<ApiClientFormData>(initialClientForm);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED'>('all');
  const [filterIndustry, setFilterIndustry] = useState('');

  // Query parameters for API calls
  const queryParams = useMemo((): ClientQueryParams => {
    const params: ClientQueryParams = {
      take: 1000, // Load all clients for now
      search: searchTerm || undefined,
      status: filterStatus === 'all' ? 'all' : filterStatus,
      industry: filterIndustry || undefined,
      company: globalSelectedCompany === 'all' ? 'all' : globalSelectedCompany.toString(),
      sortField: 'createdAt',
      sortDirection: 'desc'
    };
    return params;
  }, [searchTerm, filterStatus, filterIndustry, globalSelectedCompany]);

  // Fetch clients with React Query
  const {
    data: clientsResponse,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['clients', queryParams],
    queryFn: () => clientsApiService.getClients(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ['clients-statistics', globalSelectedCompany],
    queryFn: () => clientsApiService.getStatistics({
      companyId: globalSelectedCompany === 'all' ? undefined : globalSelectedCompany
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Extract clients from response
  const clients = useMemo(() => clientsResponse?.data || [], [clientsResponse]);

  // Transform clients to formatted clients
  const formattedClients = useMemo(() => {
    return clients.map((client): FormattedClient => {
      // Find status config
      const statusConfig = CLIENT_STATUSES.find(s => s.value === client.status) || {
        value: client.status,
        label: client.status,
        color: 'bg-gray-100 text-gray-800'
      };

      // Format company info
      const companyInfo = client.company ? {
        id: client.company.id,
        tradingName: client.company.tradingName,
        legalName: client.company.legalName,
        logo: client.company.logo || client.company.tradingName.charAt(0)
      } : undefined;

      // Format dates
      const formattedCreatedAt = new Date(client.createdAt).toLocaleDateString();
      const formattedLastInvoiceDate = client.lastInvoiceDate 
        ? new Date(client.lastInvoiceDate).toLocaleDateString() 
        : undefined;

      // Format address
      const addressParts = [client.address, client.city, client.zipCode, client.country].filter(Boolean);
      const formattedAddress = addressParts.join(', ');

      // Format currency amounts
      const formattedTotalInvoiced = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(client.totalInvoiced);

      const formattedTotalPaid = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(client.totalPaid);

      // Create links
      const emailLink = `mailto:${client.email}`;
      const phoneLink = client.phone ? `tel:${client.phone}` : '';
      const websiteUrl = client.website ? (
        client.website.startsWith('http') ? client.website : `https://${client.website}`
      ) : '';

      return {
        ...client,
        companyInfo,
        formattedAddress,
        formattedTotalInvoiced,
        formattedTotalPaid,
        formattedCreatedAt,
        formattedLastInvoiceDate,
        emailLink,
        phoneLink,
        websiteUrl,
        statusConfig
      };
    });
  }, [clients]);

  // Filter clients based on view mode
  const filteredClients = useMemo(() => {
    if (viewMode === 'active') {
      return formattedClients.filter(client => client.status !== 'INACTIVE' && client.status !== 'ARCHIVED');
    } else {
      return formattedClients.filter(client => client.status === 'INACTIVE' || client.status === 'ARCHIVED');
    }
  }, [formattedClients, viewMode]);

  // UI Data Lists
  const availableIndustries = useMemo(() => INDUSTRIES, []);
  const availableStatuses = useMemo(() => CLIENT_STATUSES, []);

  // Page Header Data
  const pageTitle = useMemo(() => {
    if (globalSelectedCompany === 'all') {
      return 'All Clients';
    }
    const company = companies.find(c => c.id === globalSelectedCompany);
    return company ? `${company.tradingName} - Clients` : 'Clients';
  }, [globalSelectedCompany, companies]);

  const pageDescription = useMemo(() => {
    return globalSelectedCompany === 'all' 
      ? 'Manage client relationships across all companies'
      : 'Manage client relationships for the selected company';
  }, [globalSelectedCompany]);

  // Company Info
  const selectedCompanyName = useMemo(() => {
    if (globalSelectedCompany === 'all') return 'All Companies';
    const company = companies.find(c => c.id === globalSelectedCompany);
    return company ? company.tradingName : 'Unknown Company';
  }, [globalSelectedCompany, companies]);

  const canAddClient = globalSelectedCompany !== 'all' && globalSelectedCompany !== null;

  // Update isAllExpanded based on individual expansions
  const updateAllExpanded = useCallback(() => {
    if (filteredClients.length > 0) {
      const allExpanded = filteredClients.every(client => expandedClients.has(client.id));
      setIsAllExpanded(allExpanded);
    }
  }, [expandedClients, filteredClients]);

  // Create Client Mutation
  const createClientMutation = useMutation({
    mutationFn: (data: ApiClientFormData) => clientsApiService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-statistics'] });
      resetForm();
      toast.success('Client created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create client: ${error.message}`);
    },
  });

  // Update Client Mutation
  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApiClientFormData> }) => 
      clientsApiService.updateClient(id, data),
    onSuccess: async () => {
      // Force refetch both clients and statistics
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['clients-statistics'] })
      ]);
      resetForm();
      toast.success('Client updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  // Delete Client Mutation
  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => clientsApiService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-statistics'] });
      toast.success('Client deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });

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
  const handleCreateClient = useCallback(async () => {
    if (globalSelectedCompany === 'all') {
      toast.error('Please select a specific company to add clients');
      return;
    }

    const formData = {
      ...clientForm,
      companyId: Number(globalSelectedCompany)
    };

    console.log('Creating client with data:', formData);
    console.log('Global selected company:', globalSelectedCompany);

    await createClientMutation.mutateAsync(formData);
  }, [clientForm, globalSelectedCompany, createClientMutation]);

  const handleUpdateClient = useCallback(async () => {
    if (!editingClient) return;

    await updateClientMutation.mutateAsync({
      id: editingClient.id,
      data: clientForm
    });
  }, [editingClient, clientForm, updateClientMutation]);

  const handleDeleteClient = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      await deleteClientMutation.mutateAsync(id);
    }
  }, [deleteClientMutation]);

  const handleDuplicateClient = useCallback(async (id: string) => {
    try {
      const clientToDuplicate = clients.find(c => c.id === id);
      if (!clientToDuplicate) {
        toast.error('Client not found');
        return;
      }

      // Create a new client based on the existing one
      const duplicatedClient: ApiClientFormData = {
        companyId: clientToDuplicate.companyId,
        clientType: clientToDuplicate.clientType,
        name: `${clientToDuplicate.name} (Copy)`,
        contactPersonName: clientToDuplicate.contactPersonName || '',
        contactPersonPosition: clientToDuplicate.contactPersonPosition || '',
        email: clientToDuplicate.email,
        phone: clientToDuplicate.phone || '',
        website: clientToDuplicate.website || '',
        address: clientToDuplicate.address || '',
        city: clientToDuplicate.city || '',
        zipCode: clientToDuplicate.zipCode || '',
        country: clientToDuplicate.country || '',
        industry: clientToDuplicate.industry || '',
        status: 'LEAD', // Set new duplicates as leads
        notes: clientToDuplicate.notes || '',
        registrationNumber: clientToDuplicate.registrationNumber || '',
        vatNumber: clientToDuplicate.vatNumber || '',
        passportNumber: clientToDuplicate.passportNumber || '',
        dateOfBirth: clientToDuplicate.dateOfBirth || ''
      };

      await createClientMutation.mutateAsync(duplicatedClient);
      toast.success('Client duplicated successfully');
    } catch (error) {
      console.error('Error duplicating client:', error);
      toast.error('Failed to duplicate client');
    }
  }, [clients, createClientMutation]);

  const handleArchiveClient = useCallback(async (id: string) => {
    await updateClientMutation.mutateAsync({
      id,
      data: { status: 'ARCHIVED' }
    });
  }, [updateClientMutation]);

  const handleRestoreClient = useCallback(async (id: string) => {
    await updateClientMutation.mutateAsync({
      id,
      data: { status: 'ACTIVE' }
    });
  }, [updateClientMutation]);

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
    const company = companies.find(c => c.id === companyId);
    return company ? company.tradingName : 'Unknown Company';
  }, [companies]);

  const getCompanyById = useCallback((companyId: number) => {
    return companies.find(c => c.id === companyId);
  }, [companies]);

  // Handle edit client
  const handleEditClient = useCallback((client: FormattedClient) => {
    setEditingClient(client);
    setClientForm({
      companyId: client.companyId,
      clientType: client.clientType as 'INDIVIDUAL' | 'LEGAL_ENTITY',
      name: client.name,
      contactPersonName: client.contactPersonName || '',
      contactPersonPosition: client.contactPersonPosition || '',
      email: client.email,
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

  // Update setEditingClient to also populate form
  const setEditingClientWrapper = useCallback((client: FormattedClient | null) => {
    if (client) {
      handleEditClient(client);
    } else {
      setEditingClient(null);
    }
  }, [handleEditClient]);

  return {
    // Data
    clients,
    filteredClients,
    statistics: statistics || null,
    
    // UI Data Lists
    availableIndustries,
    availableStatuses,
    
    // Page Header Data
    pageTitle,
    pageDescription,
    
    // Company Info
    selectedCompanyName,
    canAddClient,
    
    // UI State
    isLoading,
    isError,
    error: error as Error | null,
    showAddForm,
    editingClient,
    expandedClients,
    isAllExpanded,
    viewMode,
    
    // Form State
    clientForm,
    
    // Filters
    searchTerm,
    filterStatus,
    filterIndustry,
    
    // Actions
    setShowAddForm,
    setEditingClient: setEditingClientWrapper,
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
    handleDuplicateClient,
    handleArchiveClient,
    handleRestoreClient,
    
    // Expansion Operations
    toggleClientExpansion,
    toggleAllExpansion,
    
    // Helper Functions
    getCompanyName,
    getCompanyById,
    refetch
  };
}