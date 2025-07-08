import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  clientsApiService, 
  type Client, 
  type ClientFormData, 
  type ClientQueryParams,
  type ClientStatistics
} from '@/services/api/clientsApiService'
import { useDebouncedSearch } from '@/hooks/useDebounce'
import { Company } from '@/types/company.types'

// Query Keys
const CLIENTS_QUERY_KEY = 'clients'
const CLIENT_STATISTICS_QUERY_KEY = 'client-statistics'

export interface ClientsManagementHook {
  // Data
  clients: Client[]
  statistics: ClientStatistics | undefined
  
  // UI Data Lists
  availableIndustries: string[]
  availableStatuses: Array<{ value: string; label: string; color: string }>
  
  // Page Header Data
  pageTitle: string
  pageDescription: string
  
  // UI State
  isLoading: boolean
  isError: boolean
  showAddForm: boolean
  editingClient: Client | null
  expandedClients: Set<string>
  isAllExpanded: boolean
  viewMode: 'active' | 'archived'
  
  // Form State
  clientForm: ClientFormData
  
  // Search State
  searchValue: string
  debouncedSearchValue: string
  isSearching: boolean
  
  // Filters
  filterStatus: 'all' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  filterIndustry: string
  sortField: 'name' | 'email' | 'industry' | 'totalInvoiced' | 'lastInvoiceDate' | 'createdAt'
  sortDirection: 'asc' | 'desc'
  
  // Pagination
  currentPage: number
  pageSize: number
  totalClients: number
  hasMore: boolean
  
  // Actions
  setShowAddForm: (show: boolean) => void
  setEditingClient: (client: Client | null) => void
  setSearchValue: (term: string) => void
  setFilterStatus: (filter: 'all' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => void
  setFilterIndustry: (industry: string) => void
  setSortField: (field: 'name' | 'email' | 'industry' | 'totalInvoiced' | 'lastInvoiceDate' | 'createdAt') => void
  setSortDirection: (direction: 'asc' | 'desc') => void
  setViewMode: (mode: 'active' | 'archived') => void
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  
  // Form Handlers
  handleClientFormChange: (field: string, value: string | number) => void
  resetForm: () => void
  
  // Client Operations
  handleCreateClient: () => void
  handleUpdateClient: () => void
  handleDeleteClient: (id: string) => void
  bulkUpdateStatus: (ids: string[], status: string) => void
  bulkDelete: (ids: string[]) => void
  
  // Expansion Operations
  toggleClientExpansion: (clientId: string) => void
  toggleAllExpansion: () => void
  
  // Helper Functions
  getCompanyName: (companyId: number) => string
  getCompanyById: (companyId: number) => Company | undefined
  refreshClients: () => void
  refreshStatistics: () => void
}

const initialClientForm: ClientFormData = {
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
  status: 'ACTIVE',
  notes: '',
  registrationNumber: '',
  vatNumber: '',
  passportNumber: '',
  dateOfBirth: ''
}

const AVAILABLE_STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'green' },
  { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
  { value: 'SUSPENDED', label: 'Suspended', color: 'red' }
]

const AVAILABLE_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Real Estate',
  'Transportation',
  'Other'
]

export function useClientsManagement(
  globalSelectedCompany: number | 'all',
  companies: Company[]
): ClientsManagementHook {
  const queryClient = useQueryClient()
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [isAllExpanded, setIsAllExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active')
  
  // Form State
  const [clientForm, setClientForm] = useState<ClientFormData>(initialClientForm)
  
  // Search State
  const { searchValue, debouncedSearchValue, isSearching, setSearchValue } = useDebouncedSearch('', 300)
  
  // Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('all')
  const [filterIndustry, setFilterIndustry] = useState<string>('all')
  const [sortField, setSortField] = useState<'name' | 'email' | 'industry' | 'totalInvoiced' | 'lastInvoiceDate' | 'createdAt'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Build query parameters
  const queryParams = useMemo((): ClientQueryParams => {
    return {
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      search: debouncedSearchValue || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
      industry: filterIndustry !== 'all' ? filterIndustry : undefined,
      company: globalSelectedCompany !== 'all' ? globalSelectedCompany.toString() : undefined,
      sortField,
      sortDirection
    }
  }, [currentPage, pageSize, debouncedSearchValue, filterStatus, filterIndustry, globalSelectedCompany, sortField, sortDirection])
  
  // Fetch clients with TanStack Query
  const { 
    data: clientsResponse, 
    isLoading, 
    isError,
    refetch: refreshClients
  } = useQuery({
    queryKey: [CLIENTS_QUERY_KEY, queryParams],
    queryFn: () => clientsApiService.getClients(queryParams),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
  
  // Fetch statistics
  const {
    data: statistics,
    refetch: refreshStatistics
  } = useQuery({
    queryKey: [CLIENT_STATISTICS_QUERY_KEY, globalSelectedCompany],
    queryFn: () => clientsApiService.getStatistics({
      companyId: globalSelectedCompany !== 'all' ? globalSelectedCompany : undefined
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
  
  // Extract data from response
  const clients = clientsResponse?.data || []
  const totalClients = clientsResponse?.pagination.total || 0
  const hasMore = clientsResponse?.pagination.hasMore || false
  
  // Filter clients by view mode
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (viewMode === 'active') {
        return client.status !== 'SUSPENDED'
      } else {
        return client.status === 'SUSPENDED'
      }
    })
  }, [clients, viewMode])
  
  // Create Client Mutation
  const createClientMutation = useMutation({
    mutationFn: (data: ClientFormData) => clientsApiService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CLIENT_STATISTICS_QUERY_KEY] })
      resetForm()
      toast.success('Client created successfully')
    },
    onError: (error) => {
      console.error('Error creating client:', error)
      toast.error('Failed to create client')
    }
  })
  
  // Update Client Mutation
  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientFormData> }) => 
      clientsApiService.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CLIENT_STATISTICS_QUERY_KEY] })
      resetForm()
      toast.success('Client updated successfully')
    },
    onError: (error) => {
      console.error('Error updating client:', error)
      toast.error('Failed to update client')
    }
  })
  
  // Delete Client Mutation
  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => clientsApiService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CLIENT_STATISTICS_QUERY_KEY] })
      toast.success('Client deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
  })
  
  // Bulk Update Status Mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) => 
      clientsApiService.bulkUpdateStatus(ids, status),
    onSuccess: (_, { ids, status }) => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CLIENT_STATISTICS_QUERY_KEY] })
      toast.success(`Updated ${ids.length} client(s) to ${status.toLowerCase()}`)
    },
    onError: (error) => {
      console.error('Error bulk updating client status:', error)
      toast.error('Failed to update client status')
    }
  })
  
  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => clientsApiService.bulkDelete(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CLIENT_STATISTICS_QUERY_KEY] })
      toast.success(`Deleted ${ids.length} client(s)`)
    },
    onError: (error) => {
      console.error('Error bulk deleting clients:', error)
      toast.error('Failed to delete clients')
    }
  })
  
  // Calculate page header data
  const pageHeaderData = useMemo(() => {
    if (globalSelectedCompany === 'all') {
      return {
        title: 'Clients',
        description: 'Manage your client relationships and information'
      }
    }
    
    const company = companies.find(c => c.id === globalSelectedCompany)
    if (company) {
      return {
        title: `${company.tradingName} - Clients`,
        description: `Managing clients for ${company.tradingName}`
      }
    }
    
    return {
      title: 'Clients',
      description: 'Manage your client relationships and information'
    }
  }, [globalSelectedCompany, companies])
  
  // Form Handlers
  const handleClientFormChange = useCallback((field: string, value: string | number) => {
    setClientForm(prev => ({ ...prev, [field]: value }))
  }, [])
  
  const resetForm = useCallback(() => {
    setClientForm(initialClientForm)
    setEditingClient(null)
    setShowAddForm(false)
  }, [])
  
  // Client Operations
  const handleCreateClient = useCallback(() => {
    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    
    const formData = {
      ...clientForm,
      companyId: globalSelectedCompany !== 'all' ? globalSelectedCompany : undefined
    }
    
    createClientMutation.mutate(formData)
  }, [clientForm, globalSelectedCompany, createClientMutation])
  
  const handleUpdateClient = useCallback(() => {
    if (!editingClient) return
    
    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    
    updateClientMutation.mutate({
      id: editingClient.id,
      data: clientForm
    })
  }, [editingClient, clientForm, updateClientMutation])
  
  const handleDeleteClient = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      deleteClientMutation.mutate(id)
    }
  }, [deleteClientMutation])
  
  const bulkUpdateStatus = useCallback((ids: string[], status: string) => {
    if (ids.length === 0) {
      toast.error('No clients selected')
      return
    }
    
    bulkUpdateStatusMutation.mutate({ ids, status })
  }, [bulkUpdateStatusMutation])
  
  const bulkDelete = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      toast.error('No clients selected')
      return
    }
    
    if (confirm(`Are you sure you want to delete ${ids.length} client(s)? This action cannot be undone.`)) {
      bulkDeleteMutation.mutate(ids)
    }
  }, [bulkDeleteMutation])
  
  // Edit operation
  const handleEdit = useCallback((client: Client) => {
    setEditingClient(client)
    setClientForm({
      companyId: client.companyId,
      clientType: client.clientType as 'Individual' | 'Legal Entity',
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
    })
    setShowAddForm(true)
  }, [])
  
  // Expansion Operations
  const toggleClientExpansion = useCallback((clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }, [])
  
  const toggleAllExpansion = useCallback(() => {
    if (isAllExpanded) {
      setExpandedClients(new Set())
      setIsAllExpanded(false)
    } else {
      const allClientIds = new Set(filteredClients.map(c => c.id))
      setExpandedClients(allClientIds)
      setIsAllExpanded(true)
    }
  }, [isAllExpanded, filteredClients])
  
  // Helper Functions
  const getCompanyName = useCallback((companyId: number) => {
    const company = companies.find(c => c.id === companyId)
    return company?.tradingName || company?.legalName || 'Unknown Company'
  }, [companies])
  
  const getCompanyById = useCallback((companyId: number) => {
    return companies.find(c => c.id === companyId)
  }, [companies])
  
  // Auto-update page when filters change
  const resetPagination = useCallback(() => {
    setCurrentPage(1)
  }, [])
  
  // Reset pagination when filters change
  useMemo(() => {
    resetPagination()
  }, [debouncedSearchValue, filterStatus, filterIndustry, globalSelectedCompany, resetPagination])
  
  return {
    // Data
    clients: filteredClients,
    statistics,
    
    // UI Data Lists
    availableIndustries: AVAILABLE_INDUSTRIES,
    availableStatuses: AVAILABLE_STATUSES,
    
    // Page Header Data
    pageTitle: pageHeaderData.title,
    pageDescription: pageHeaderData.description,
    
    // UI State
    isLoading: isLoading || createClientMutation.isPending || updateClientMutation.isPending,
    isError,
    showAddForm,
    editingClient,
    expandedClients,
    isAllExpanded,
    viewMode,
    
    // Form State
    clientForm,
    
    // Search State
    searchValue,
    debouncedSearchValue,
    isSearching,
    
    // Filters
    filterStatus,
    filterIndustry,
    sortField,
    sortDirection,
    
    // Pagination
    currentPage,
    pageSize,
    totalClients,
    hasMore,
    
    // Actions
    setShowAddForm,
    setEditingClient: handleEdit,
    setSearchValue,
    setFilterStatus,
    setFilterIndustry,
    setSortField,
    setSortDirection,
    setViewMode,
    setCurrentPage,
    setPageSize,
    
    // Form Handlers
    handleClientFormChange,
    resetForm,
    
    // Client Operations
    handleCreateClient,
    handleUpdateClient,
    handleDeleteClient,
    bulkUpdateStatus,
    bulkDelete,
    
    // Expansion Operations
    toggleClientExpansion,
    toggleAllExpansion,
    
    // Helper Functions
    getCompanyName,
    getCompanyById,
    refreshClients,
    refreshStatistics
  }
}