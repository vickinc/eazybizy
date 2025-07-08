import { useState, useCallback, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Company } from '@/types/company.types'
import { CompanyFormData } from '@/services/business/companyValidationService'
import { 
  companyApiService,
  CompanyQueryParams 
} from '@/services/api'
import { CompanyBusinessService } from '@/services/business/companyBusinessService'

const COMPANIES_QUERY_KEY = 'companies'

export interface CompanyManagementHook {
  // Data with loading states
  companies: Company[]
  isCompaniesLoading: boolean
  isCompaniesError: boolean
  companiesError: Error | null
  
  // Formatted data
  formattedCompanies: Company[]
  activeCompanies: Company[]
  passiveCompanies: Company[]
  availableIndustries: string[]
  
  // Pagination
  pagination: {
    skip: number
    take: number
    total: number
    hasMore: boolean
  }
  
  // Statistics
  statistics: {
    totalActive: number
    totalPassive: number
    byIndustry: Record<string, number>
    newThisMonth: number
  } | undefined
  
  // UI State
  isDialogOpen: boolean
  editingCompany: Company | null
  copiedFields: { [key: string]: boolean }
  selectedCompanies: string[]
  
  // Form State
  formData: CompanyFormData
  logoFile: string | null
  logoPreview: string | null
  
  // Filters
  filters: {
    searchTerm: string
    statusFilter: 'all' | 'Active' | 'Passive'
    industryFilter: string
  }
  
  // Sorting
  sortField: 'legalName' | 'tradingName' | 'industry' | 'createdAt'
  sortDirection: 'asc' | 'desc'
  
  // Actions
  setIsDialogOpen: (open: boolean) => void
  setEditingCompany: (company: Company | null) => void
  setSelectedCompanies: (companies: string[]) => void
  updateFilters: (newFilters: Partial<CompanyManagementHook['filters']>) => void
  setSorting: (field: CompanyManagementHook['sortField'], direction?: CompanyManagementHook['sortDirection']) => void
  
  // Pagination
  loadMore: () => void
  resetPagination: () => void
  
  // Form Handlers
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleStatusChange: (value: string) => void
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeLogo: () => void
  resetForm: () => void
  
  // CRUD Operations
  createCompany: () => Promise<void>
  updateCompany: () => Promise<void>
  deleteCompany: (id: string) => Promise<void>
  
  // Form Management
  handleSubmit: (e: React.FormEvent) => void
  handleEdit: (company: Company) => void
  handleDelete: (id: number) => void
  handleAddNew: () => void
  
  // Utility Actions
  copyToClipboard: (text: string, fieldName: string, companyId: number) => Promise<void>
  handleWebsiteClick: (website: string, e: React.MouseEvent) => void
  
  // Dialog Management
  closeDialog: () => void
  
  // Bulk Operations
  bulkUpdateStatus: (status: 'Active' | 'Passive') => Promise<void>
  bulkDelete: () => Promise<void>
}

const initialFormData: CompanyFormData = {
  legalName: "",
  tradingName: "",
  registrationNo: "",
  registrationDate: "",
  countryOfRegistration: "",
  baseCurrency: "",
  businessLicenseNr: "",
  vatNumber: "",
  industry: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  status: "Active",
  facebookUrl: "",
  instagramUrl: "",
  xUrl: "",
  youtubeUrl: "",
  whatsappNumber: "",
  telegramNumber: ""
}

const initialFilters = {
  searchTerm: '',
  statusFilter: 'all' as 'all' | 'Active' | 'Passive',
  industryFilter: '',
}

export function useCompanyManagement(): CompanyManagementHook {
  const queryClient = useQueryClient()
  
  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [copiedFields, setCopiedFields] = useState<{ [key: string]: boolean }>({})
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData)
  const [logoFile, setLogoFile] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  // Filters and Pagination
  const [filters, setFilters] = useState(initialFilters)
  const [sortField, setSortField] = useState<'legalName' | 'tradingName' | 'industry' | 'createdAt'>('legalName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [pagination, setPagination] = useState({ skip: 0, take: 20 })
  const [accumulatedCompanies, setAccumulatedCompanies] = useState<Company[]>([])
  
  // Build query parameters
  const queryParams: CompanyQueryParams = useMemo(() => ({
    ...filters,
    ...pagination,
    sortField,
    sortDirection,
  }), [filters, pagination, sortField, sortDirection])
  
  // Companies Query
  const {
    data: companiesResponse,
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
    error: companiesError,
  } = useQuery({
    queryKey: [COMPANIES_QUERY_KEY, queryParams],
    queryFn: () => companyApiService.getCompanies(queryParams),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
  
  // Extract data from responses
  const statistics = companiesResponse?.statistics
  const paginationData = companiesResponse?.pagination || { skip: 0, take: 20, total: 0, hasMore: false }
  
  // Update accumulated companies when new data arrives
  useEffect(() => {
    if (!companiesResponse) return
    
    const newCompanies = companiesResponse.data || []
    
    if (pagination.skip === 0) {
      // Reset accumulated data when starting fresh (filters changed)
      setAccumulatedCompanies(newCompanies)
    } else if (newCompanies.length > 0) {
      // Append new companies to existing ones for pagination
      setAccumulatedCompanies(prev => {
        const companyMap = new Map(prev.map(comp => [comp.id, comp]))
        newCompanies.forEach(comp => companyMap.set(comp.id, comp))
        return Array.from(companyMap.values())
      })
    }
  }, [companiesResponse, pagination.skip])
  
  // Use accumulated companies instead of current page
  const companies = accumulatedCompanies
  
  // Compute derived data using business services
  const availableIndustries = useMemo(() => {
    return [...new Set(companies.map(comp => comp.industry))].sort()
  }, [companies])
  
  // Format companies for display
  const formattedCompanies = useMemo(() => {
    return CompanyBusinessService.formatCompaniesForDisplay(companies)
  }, [companies])
  
  const activeCompanies = useMemo(() => {
    return CompanyBusinessService.filterCompaniesByStatus(formattedCompanies, 'Active')
  }, [formattedCompanies])
  
  const passiveCompanies = useMemo(() => {
    return CompanyBusinessService.filterCompaniesByStatus(formattedCompanies, 'Passive')
  }, [formattedCompanies])
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CompanyFormData & { logo?: string }) => companyApiService.createCompany(data),
    onSuccess: () => {
      // Invalidate both the management queries and the simple companies query used by dropdowns
      queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['companies-simple'] })
      
      // Force refetch of companies data
      queryClient.refetchQueries({ queryKey: ['companies-simple'] })
      
      toast.success('Company created successfully')
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(`Failed to create company: ${error.message}`)
      resetForm()
    },
  })
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CompanyFormData> & { logo?: string } }) => 
      companyApiService.updateCompany(id, data),
    onSuccess: () => {
      // Invalidate both the management queries and the simple companies query used by dropdowns
      queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['companies-simple'] })
      
      // Force refetch of companies data
      queryClient.refetchQueries({ queryKey: ['companies-simple'] })
      
      toast.success('Company updated successfully')
      setEditingCompany(null)
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(`Failed to update company: ${error.message}`)
      resetForm()
    },
  })
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => companyApiService.deleteCompany(id),
    onSuccess: () => {
      // Invalidate both the management queries and the simple companies query used by dropdowns
      queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['companies-simple'] })
      
      // Force refetch of companies data
      queryClient.refetchQueries({ queryKey: ['companies-simple'] })
      
      toast.success('Company deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete company: ${error.message}`)
    },
  })
  
  // Action handlers
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination({ skip: 0, take: 20 }) // Reset pagination when filters change
    setAccumulatedCompanies([]) // Clear accumulated data
  }, [])
  
  const setSorting = useCallback((field: typeof sortField, direction?: typeof sortDirection) => {
    setSortField(prevField => {
      const newDirection = direction || (prevField === field && sortDirection === 'desc' ? 'asc' : 'desc')
      setSortDirection(newDirection)
      return field
    })
    setPagination({ skip: 0, take: 20 }) // Reset pagination when sorting changes
    setAccumulatedCompanies([]) // Clear accumulated data
  }, [sortDirection])
  
  const loadMore = useCallback(() => {
    setPagination(prev => {
      // Only increment if there's more data available
      const currentHasMore = companiesResponse?.pagination?.hasMore || false
      if (currentHasMore) {
        return { ...prev, skip: prev.skip + prev.take }
      }
      return prev
    })
  }, [companiesResponse?.pagination?.hasMore])
  
  const resetPagination = useCallback(() => {
    setPagination({ skip: 0, take: 20 })
    setAccumulatedCompanies([])
  }, [])
  
  // Form handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])
  
  const handleStatusChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, status: value }))
  }, [])
  
  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const logoUrl = await companyApiService.uploadLogo(file)
        setLogoFile(logoUrl)
        setLogoPreview(logoUrl)
      } catch (error) {
        toast.error('Failed to upload logo')
      }
    }
  }, [])
  
  const removeLogo = useCallback(() => {
    setLogoFile(null)
    setLogoPreview(null)
  }, [])
  
  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setLogoFile(null)
    setLogoPreview(null)
    setEditingCompany(null)
    setIsDialogOpen(false)
  }, [])
  
  // CRUD Operations
  const createCompany = useCallback(async () => {
    // Basic validation
    if (!formData.legalName) {
      toast.error('Please enter a legal name')
      return
    }
    if (!formData.tradingName) {
      toast.error('Please enter a trading name')
      return
    }
    if (!formData.email) {
      toast.error('Please enter an email')
      return
    }
    
    const companyData = {
      ...formData,
      logo: CompanyBusinessService.validateAndFixLogo(logoFile || '', formData.tradingName),
    }
    
    createMutation.mutate(companyData)
  }, [formData, logoFile, createMutation])
  
  const updateCompany = useCallback(async () => {
    if (!editingCompany) return
    
    // Basic validation
    if (!formData.legalName) {
      toast.error('Please enter a legal name')
      return
    }
    if (!formData.tradingName) {
      toast.error('Please enter a trading name')
      return
    }
    if (!formData.email) {
      toast.error('Please enter an email')
      return
    }
    
    const companyData = {
      ...formData,
      logo: CompanyBusinessService.validateAndFixLogo(logoFile || '', formData.tradingName),
    }
    
    updateMutation.mutate({ id: editingCompany.id.toString(), data: companyData })
  }, [editingCompany, formData, logoFile, updateMutation])
  
  const deleteCompany = useCallback(async (id: string) => {
    deleteMutation.mutate(id)
  }, [deleteMutation])
  
  // Form management actions (compatibility layer)
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (editingCompany) {
      updateCompany()
    } else {
      createCompany()
    }
  }, [editingCompany, updateCompany, createCompany])
  
  const handleEdit = useCallback((company: Company) => {
    setEditingCompany(company)
    setFormData({
      legalName: company.legalName,
      tradingName: company.tradingName,
      registrationNo: company.registrationNo,
      registrationDate: company.registrationDate ? new Date(company.registrationDate).toISOString().split('T')[0] : "",
      countryOfRegistration: company.countryOfRegistration || "",
      baseCurrency: company.baseCurrency || "",
      businessLicenseNr: company.businessLicenseNr || "",
      vatNumber: company.vatNumber || "",
      industry: company.industry,
      address: company.address,
      phone: company.phone,
      email: company.email,
      website: company.website,
      status: company.status,
      facebookUrl: company.facebookUrl || "",
      instagramUrl: company.instagramUrl || "",
      xUrl: company.xUrl || "",
      youtubeUrl: company.youtubeUrl || "",
      whatsappNumber: company.whatsappNumber || "",
      telegramNumber: company.telegramNumber || ""
    })
    
    // Set logo states based on whether it's an image URL or initials
    const isImageLogo = CompanyBusinessService.isImageLogo(company.logo)
    setLogoFile(isImageLogo ? company.logo : null)
    setLogoPreview(isImageLogo ? company.logo : null)
    
    setIsDialogOpen(true)
  }, [])
  
  const handleDelete = useCallback((id: number) => {
    if (confirm("Are you sure you want to delete this company?")) {
      deleteCompany(id.toString())
    }
  }, [deleteCompany])
  
  const handleAddNew = useCallback(() => {
    setEditingCompany(null)
    setFormData(initialFormData)
    setLogoFile(null)
    setLogoPreview(null)
    setIsDialogOpen(true)
  }, [])
  
  // Utility functions
  const copyToClipboard = useCallback(async (text: string, fieldName: string, companyId: number) => {
    try {
      await navigator.clipboard.writeText(text)
      const fieldKey = `${companyId}-${fieldName}`
      setCopiedFields(prev => ({ ...prev, [fieldKey]: true }))
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedFields(prev => ({ ...prev, [fieldKey]: false }))
      }, 2000)
      
      console.log(`${fieldName} copied to clipboard`)
    } catch (err) {
      console.error(`Failed to copy ${fieldName}:`, err)
      toast.error(`Failed to copy ${fieldName}`)
    }
  }, [])
  
  const handleWebsiteClick = useCallback((website: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const url = CompanyBusinessService.getFullWebsiteUrl(website)
    window.open(url, '_blank')
  }, [])
  
  const closeDialog = useCallback(() => {
    resetForm()
  }, [resetForm])
  
  // Bulk operations
  const bulkUpdateStatus = useCallback(async (status: 'Active' | 'Passive') => {
    if (selectedCompanies.length === 0) {
      toast.error('No companies selected')
      return
    }
    try {
      await companyApiService.bulkUpdateStatus(selectedCompanies, status)
      queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] })
      setSelectedCompanies([])
      toast.success(`Updated ${selectedCompanies.length} company status(es)`)
    } catch (error) {
      toast.error('Failed to update company statuses')
    }
  }, [selectedCompanies, queryClient])
  
  const bulkDelete = useCallback(async () => {
    if (selectedCompanies.length === 0) {
      toast.error('No companies selected')
      return
    }
    if (confirm(`Are you sure you want to delete ${selectedCompanies.length} company(ies)?`)) {
      try {
        await companyApiService.bulkDelete(selectedCompanies)
        queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] })
        setSelectedCompanies([])
        toast.success(`Deleted ${selectedCompanies.length} company(ies)`)
      } catch (error) {
        toast.error('Failed to delete companies')
      }
    }
  }, [selectedCompanies, queryClient])
  
  return {
    // Data with loading states
    companies,
    isCompaniesLoading,
    isCompaniesError,
    companiesError: companiesError as Error | null,
    
    // Formatted data
    formattedCompanies,
    activeCompanies,
    passiveCompanies,
    availableIndustries,
    
    // Pagination
    pagination: paginationData,
    
    // Statistics
    statistics,
    
    // UI State
    isDialogOpen,
    editingCompany,
    copiedFields,
    selectedCompanies,
    
    // Form State
    formData,
    logoFile,
    logoPreview,
    
    // Filters
    filters,
    
    // Sorting
    sortField,
    sortDirection,
    
    // Actions
    setIsDialogOpen,
    setEditingCompany,
    setSelectedCompanies,
    updateFilters,
    setSorting,
    
    // Pagination
    loadMore,
    resetPagination,
    
    // Form Handlers
    handleInputChange,
    handleStatusChange,
    handleLogoUpload,
    removeLogo,
    resetForm,
    
    // CRUD Operations
    createCompany,
    updateCompany,
    deleteCompany,
    
    // Form Management
    handleSubmit,
    handleEdit,
    handleDelete,
    handleAddNew,
    
    // Utility Actions
    copyToClipboard,
    handleWebsiteClick,
    
    // Dialog Management
    closeDialog,
    
    // Bulk Operations
    bulkUpdateStatus,
    bulkDelete,
  }
}