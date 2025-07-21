import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useMutation, 
  useQueryClient,
  useQuery 
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { CompanyFormData, CompanyValidationService } from '@/services/business/companyValidationService';
import { CompanyApiService } from '@/services/api/companyApiService';
import { CompanyBusinessService } from '@/services/business/companyBusinessService';
import { Company } from '@/types/company.types';
import { companiesCache } from '@/services/cache/companiesCache';

type OnboardingStep = 'company' | 'business' | 'owners' | 'review' | 'complete';

export interface CompanyOnboardingDBHook {
  // Current state
  currentStep: OnboardingStep;
  setCurrentStep: (step: OnboardingStep) => void;
  formData: CompanyFormData;
  logoPreview: string | null;
  isLoading: boolean;
  
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: 'company' | 'business' | 'owners') => void;
  canProceed: boolean;
  
  // Form handling
  updateFormData: (updates: Partial<CompanyFormData>) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeLogo: () => void;
  
  // Submission
  submitCompany: () => void;
  
  // Validation
  validateCurrentStep: () => boolean;
  getStepErrors: () => string[];
}

export function useCompanyOnboardingDB(editingCompanyId?: string | null, initialStep?: string | null): CompanyOnboardingDBHook {
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyApiService = new CompanyApiService();
  
  // Validate and set initial step
  const validSteps: OnboardingStep[] = ['company', 'business', 'owners', 'review', 'complete'];
  const defaultStep: OnboardingStep = initialStep && validSteps.includes(initialStep as OnboardingStep) 
    ? (initialStep as OnboardingStep) 
    : 'company';
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(defaultStep);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isEditing] = useState(!!editingCompanyId);
  
  // Form data state
  const [formData, setFormData] = useState<CompanyFormData>({
    legalName: '',
    tradingName: '',
    registrationNo: '',
    registrationDate: '',
    countryOfRegistration: '',
    baseCurrency: '',
    businessLicenseNr: '',
    vatNumber: '',
    industry: '',
    status: 'Active',
    email: '',
    phone: '',
    website: '',
    address: '',
    facebookUrl: '',
    instagramUrl: '',
    xUrl: '',
    youtubeUrl: '',
    whatsappNumber: '',
    telegramNumber: '',
    shareholders: [],
    representatives: [],
    mainContactPerson: undefined,
    entityType: '',
    customEntityType: '',
    fiscalYearEnd: ''
  });

  // Fetch company data if editing
  const { data: existingCompany, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', editingCompanyId],
    queryFn: () => companyApiService.getCompany(editingCompanyId!),
    enabled: !!editingCompanyId,
  });

  // Populate form data when editing
  useEffect(() => {
    if (existingCompany && isEditing) {
      // Format registration date for HTML date input (YYYY-MM-DD)
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        legalName: existingCompany.legalName,
        tradingName: existingCompany.tradingName,
        registrationNo: existingCompany.registrationNo,
        registrationDate: formatDateForInput(existingCompany.registrationDate || ''),
        countryOfRegistration: existingCompany.countryOfRegistration || '',
        baseCurrency: existingCompany.baseCurrency || '',
        businessLicenseNr: existingCompany.businessLicenseNr || '',
        vatNumber: existingCompany.vatNumber || '',
        industry: existingCompany.industry,
        status: existingCompany.status,
        email: existingCompany.email,
        phone: existingCompany.phone,
        website: existingCompany.website,
        address: existingCompany.address,
        facebookUrl: existingCompany.facebookUrl || '',
        instagramUrl: existingCompany.instagramUrl || '',
        xUrl: existingCompany.xUrl || '',
        youtubeUrl: existingCompany.youtubeUrl || '',
        whatsappNumber: existingCompany.whatsappNumber || '',
        telegramNumber: existingCompany.telegramNumber || '',
        shareholders: existingCompany.shareholders || [],
        representatives: existingCompany.representatives || [],
        mainContactPerson: undefined, // Will be set after form data is populated
        entityType: existingCompany.entityType || '',
        customEntityType: existingCompany.customEntityType || '',
        fiscalYearEnd: existingCompany.fiscalYearEnd || ''
      });

      // Reconstruct main contact person from database fields
      if (existingCompany.mainContactEmail && existingCompany.mainContactType) {
        const allPersons = [
          ...(existingCompany.representatives || []).map((r, index) => ({
            type: 'representative' as const,
            id: index,
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email,
            phoneNumber: r.phoneNumber || '',
            displayRole: r.role === 'Other' ? r.customRole || 'Other' : r.role
          })),
          ...(existingCompany.shareholders || []).map((s, index) => ({
            type: 'shareholder' as const,
            id: index,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            phoneNumber: s.phoneNumber || '',
            displayRole: `${s.ownershipPercent}% Owner`
          }))
        ];
        
        const mainContact = allPersons.find(p => 
          p.email === existingCompany.mainContactEmail && 
          p.type === existingCompany.mainContactType
        );
        
        if (mainContact) {
          setFormData(prev => ({ ...prev, mainContactPerson: mainContact }));
        }
      }

      // Handle logo preview
      if (existingCompany.logo && CompanyBusinessService.isImageLogo(existingCompany.logo)) {
        setLogoPreview(existingCompany.logo);
        // Don't set logoFile as it's a URL, not a File object
      }
    }
  }, [existingCompany, isEditing]);

  // Create/Update company mutation
  const saveCompanyMutation = useMutation({
    mutationFn: async ({ formData, logoFile }: { formData: CompanyFormData; logoFile: File | null }) => {
      // Convert logo file to base64 if provided
      let logoBase64 = '';
      if (logoFile) {
        logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(logoFile);
        });
      } else if (logoPreview && !logoFile) {
        // If we have a preview but no new file, keep the existing logo
        logoBase64 = logoPreview;
      }
      
      // Prepare company data
      const companyData = {
        ...formData,
        logo: logoBase64
      };
      
      // Create or update based on mode
      let company;
      if (isEditing && editingCompanyId) {
        company = await companyApiService.updateCompany(editingCompanyId, companyData);
      } else {
        company = await companyApiService.createCompany(companyData);
      }
      
      return company;
    },
    onSuccess: (company) => {
      
      // Invalidate ALL company-related queries with pattern matching
      queryClient.invalidateQueries({ queryKey: ['companies'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['companies-simple'] });
      queryClient.invalidateQueries({ queryKey: ['company-statistics'] });
      
      // Force refetch of companies data to ensure immediate updates
      queryClient.refetchQueries({ queryKey: ['companies'], exact: false });
      queryClient.refetchQueries({ queryKey: ['companies-simple'] });
      
      // Also invalidate company-specific cache for the current company
      if (editingCompanyId) {
        queryClient.invalidateQueries({ queryKey: ['company', editingCompanyId] });
      }
      
      // Force a fresh fetch to bypass any caching layers
      queryClient.refetchQueries({ queryKey: ['companies-simple'] }).then(() => {
        // Additional cache busting for any remaining stale data
        queryClient.invalidateQueries({ queryKey: ['companies'] });
      });
      
      // Clear in-memory cache to ensure fresh data
      companiesCache.clear();
      
      // Use cache-busted fresh fetch to bypass ALL caching layers
      setTimeout(async () => {
        try {
          // Force fresh data fetch that bypasses Redis, HTTP cache, and React Query cache
          const freshData = await companyApiService.getCompaniesFresh({ take: 1000 });
          
          // Manually update the cache with fresh data
          queryClient.setQueryData(['companies-simple'], freshData);
          
          // Remove stale queries and force refetch
          queryClient.removeQueries({ queryKey: ['companies-simple'] });
          queryClient.removeQueries({ queryKey: ['companies'] });
          
          // Force immediate refetch with fresh data
          queryClient.refetchQueries({ queryKey: ['companies-simple'] });
          queryClient.refetchQueries({ queryKey: ['companies'] });
        } catch (error) {
          console.error('Failed to fetch fresh company data:', error);
          // Fallback to regular refetch
          queryClient.refetchQueries({ queryKey: ['companies-simple'] });
          queryClient.refetchQueries({ queryKey: ['companies'] });
        }
      }, 100);
      
      
      const action = isEditing ? 'updated' : 'created';
      toast.success(`Company "${company.tradingName}" ${action} successfully!`);
      
      // When editing, redirect to companies page instead of showing welcome step
      if (isEditing) {
        router.push('/companies');
      } else {
        setCurrentStep('complete');
      }
    },
    onError: (error: Error) => {
      const action = isEditing ? 'update' : 'create';
      toast.error(error.message || `Failed to ${action} company`);
    }
  });

  // Update form data
  const updateFormData = useCallback((updates: Partial<CompanyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle logo upload
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
    
    // Store file for upload
    setLogoFile(file);
  }, []);

  // Remove logo
  const removeLogo = useCallback(() => {
    setLogoPreview(null);
    setLogoFile(null);
  }, []);

  // Validation functions
  const validateCompanyStep = () => {
    const errors: string[] = [];
    
    if (!formData.legalName.trim()) {
      errors.push('Legal name is required');
    }
    
    if (!formData.tradingName.trim()) {
      errors.push('Trading name is required');
    }
    
    if (!formData.registrationNo.trim()) {
      errors.push('Registration number is required');
    }
    
    if (!formData.registrationDate.trim()) {
      errors.push('Registration date is required');
    }
    
    if (!formData.countryOfRegistration.trim()) {
      errors.push('Country of registration is required');
    }
    
    if (!formData.baseCurrency.trim()) {
      errors.push('Base currency is required');
    }
    
    if (!formData.status) {
      errors.push('Company status is required');
    }
    
    return errors;
  };

  const validateBusinessStep = () => {
    const errors: string[] = [];
    
    // Use the public validateField method for email validation
    const emailErrors = CompanyValidationService.validateField('email', formData.email);
    errors.push(...emailErrors);
    
    // Use the public validateField method for website validation
    if (formData.website.trim()) {
      const websiteErrors = CompanyValidationService.validateField('website', formData.website);
      errors.push(...websiteErrors);
    }
    
    return errors;
  };

  const validateOwnersStep = () => {
    const errors: string[] = [];
    
    // At least one representative is required
    if (formData.representatives.length === 0) {
      errors.push('At least one company representative is required');
    }
    
    // Validate shareholder data (optional, but if provided must be complete)
    formData.shareholders.forEach((shareholder, index) => {
      if (!shareholder.firstName.trim()) {
        errors.push(`Shareholder ${index + 1}: First name is required`);
      }
      if (!shareholder.lastName.trim()) {
        errors.push(`Shareholder ${index + 1}: Last name is required`);
      }
      if (!shareholder.email.trim()) {
        errors.push(`Shareholder ${index + 1}: Email is required`);
      }
      if (!shareholder.ownershipPercent || shareholder.ownershipPercent <= 0 || shareholder.ownershipPercent > 100) {
        errors.push(`Shareholder ${index + 1}: Ownership percentage must be greater than 0 and not exceed 100%`);
      }
    });
    
    // Check total ownership doesn't exceed 100%
    if (formData.shareholders.length > 0) {
      const totalOwnership = formData.shareholders.reduce((total, s) => total + (s.ownershipPercent || 0), 0);
      if (totalOwnership > 100) {
        errors.push('Total ownership percentage cannot exceed 100%');
      }
    }
    
    // Validate representative data
    formData.representatives.forEach((rep, index) => {
      if (!rep.firstName.trim()) {
        errors.push(`Representative ${index + 1}: First name is required`);
      }
      if (!rep.lastName.trim()) {
        errors.push(`Representative ${index + 1}: Last name is required`);
      }
      if (!rep.email.trim()) {
        errors.push(`Representative ${index + 1}: Email is required`);
      }
      if (!rep.role) {
        errors.push(`Representative ${index + 1}: Role is required`);
      }
      if (rep.role === 'Other' && !rep.customRole?.trim()) {
        errors.push(`Representative ${index + 1}: Custom role is required when role is 'Other'`);
      }
    });
    
    return errors;
  };

  const validateReviewStep = () => {
    // Combine all validations for final review
    return [...validateCompanyStep(), ...validateBusinessStep(), ...validateOwnersStep()];
  };

  // Get current step validation errors
  const getStepErrors = useCallback(() => {
    switch (currentStep) {
      case 'company':
        return validateCompanyStep();
      case 'business':
        return validateBusinessStep();
      case 'owners':
        return validateOwnersStep();
      case 'review':
        return validateReviewStep();
      default:
        return [];
    }
  }, [currentStep, formData]);

  // Check if current step can proceed
  const canProceed = useMemo(() => {
    const errors = getStepErrors();
    return errors.length === 0;
  }, [getStepErrors]);

  // Navigation functions
  const nextStep = useCallback(() => {
    if (!canProceed) {
      toast.error('Please fix the errors before proceeding');
      return;
    }

    switch (currentStep) {
      case 'company':
        setCurrentStep('business');
        break;
      case 'business':
        setCurrentStep('owners');
        break;
      case 'owners':
        setCurrentStep('review');
        break;
      case 'review':
        // This will be handled by submitCompany
        break;
    }
  }, [currentStep, canProceed]);

  const prevStep = useCallback(() => {
    switch (currentStep) {
      case 'business':
        setCurrentStep('company');
        break;
      case 'owners':
        setCurrentStep('business');
        break;
      case 'review':
        setCurrentStep('owners');
        break;
    }
  }, [currentStep]);

  // Go to specific step (used for edit navigation from review)
  const goToStep = useCallback((step: 'company' | 'business' | 'owners') => {
    setCurrentStep(step);
  }, []);

  // Submit company
  const submitCompany = useCallback(async () => {
    const errors = validateReviewStep();
    if (errors.length > 0) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    try {
      await saveCompanyMutation.mutateAsync({ formData, logoFile });
    } catch {
      // Error handling is done in the mutation
    }
  }, [formData, logoFile, saveCompanyMutation]);

  // Validate current step
  const validateCurrentStep = useCallback(() => {
    const errors = getStepErrors();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return false;
    }
    return true;
  }, [getStepErrors]);

  return {
    // Current state
    currentStep,
    setCurrentStep,
    formData,
    logoPreview,
    isLoading: saveCompanyMutation.isPending || isLoadingCompany,
    
    // Navigation
    nextStep,
    prevStep,
    goToStep,
    canProceed,
    
    // Form handling
    updateFormData,
    handleLogoUpload,
    removeLogo,
    
    // Submission
    submitCompany,
    
    // Validation
    validateCurrentStep,
    getStepErrors
  };
};