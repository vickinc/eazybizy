import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { Company } from '@/types/company.types'
import { CompanyFormData } from '@/services/business/companyValidationService'
import { CompanyBusinessService } from '@/services/business/companyBusinessService'
import { companyApiService } from '@/services/api'
import { useCompanyUIState } from './useCompanyUIState'

export interface CompanyFormHook {
  // Form State
  formData: CompanyFormData
  logoFile: string | null
  logoPreview: string | null
  
  // UI State (from centralized state)
  uiState: ReturnType<typeof useCompanyUIState>
  
  // Form Actions
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleStatusChange: (value: string) => void
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeLogo: () => void
  resetForm: () => void
  
  // Company Management Actions
  handleEdit: (company: Company) => void
  handleAddNew: () => void
  
  // Form Validation & Submission
  validateForm: () => boolean
  getFormDataWithLogo: () => CompanyFormData & { logo?: string }
  
  // Utility Actions
  copyToClipboard: (text: string, fieldName: string, companyId: number) => Promise<void>
  handleWebsiteClick: (website: string, e: React.MouseEvent) => void
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

export function useCompanyForm(): CompanyFormHook {
  // Centralized UI State
  const uiState = useCompanyUIState()
  
  // Form State (local to this hook)
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData)
  const [logoFile, setLogoFile] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  // Form handlers with dirty tracking
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    uiState.setFormDirty(true)
  }, [uiState])
  
  const handleStatusChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, status: value }))
    uiState.setFormDirty(true)
  }, [uiState])
  
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
    uiState.closeDialog()
    uiState.clearValidationErrors()
  }, [uiState])
  
  // Company Management Actions
  const handleEdit = useCallback((company: Company) => {
    uiState.openDialog(company)
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
  }, [uiState])
  
  const handleAddNew = useCallback(() => {
    uiState.openDialog()
    setFormData(initialFormData)
    setLogoFile(null)
    setLogoPreview(null)
  }, [uiState])
  
  // Form Validation & Submission
  const validateForm = useCallback((): boolean => {
    uiState.clearValidationErrors()
    
    if (!formData.legalName) {
      uiState.setValidationError('legalName', 'Please enter a legal name')
      toast.error('Please enter a legal name')
      return false
    }
    if (!formData.tradingName) {
      uiState.setValidationError('tradingName', 'Please enter a trading name')
      toast.error('Please enter a trading name')
      return false
    }
    if (!formData.email) {
      uiState.setValidationError('email', 'Please enter an email')
      toast.error('Please enter an email')
      return false
    }
    return true
  }, [formData, uiState])
  
  const getFormDataWithLogo = useCallback((): CompanyFormData & { logo?: string } => {
    return {
      ...formData,
      logo: CompanyBusinessService.validateAndFixLogo(logoFile || '', formData.tradingName),
    }
  }, [formData, logoFile])
  
  // Utility functions
  const copyToClipboard = useCallback(async (text: string, fieldName: string, companyId: number) => {
    try {
      await navigator.clipboard.writeText(text)
      const fieldKey = `${companyId}-${fieldName}`
      uiState.setCopiedField(fieldKey, true)
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        uiState.setCopiedField(fieldKey, false)
      }, 2000)
      
    } catch (err) {
      console.error(`Failed to copy ${fieldName}:`, err)
      toast.error(`Failed to copy ${fieldName}`)
    }
  }, [uiState])
  
  const handleWebsiteClick = useCallback((website: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const url = CompanyBusinessService.getFullWebsiteUrl(website)
    window.open(url, '_blank')
  }, [])
  
  return {
    // Form State
    formData,
    logoFile,
    logoPreview,
    
    // UI State (centralized)
    uiState,
    
    // Form Actions
    handleInputChange,
    handleStatusChange,
    handleLogoUpload,
    removeLogo,
    resetForm,
    
    // Company Management Actions
    handleEdit,
    handleAddNew,
    
    // Form Validation & Submission
    validateForm,
    getFormDataWithLogo,
    
    // Utility Actions
    copyToClipboard,
    handleWebsiteClick,
  }
}