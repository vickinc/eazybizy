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

type OnboardingStep = 'company' | 'business' | 'review' | 'complete';

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
  goToStep: (step: 'company' | 'business') => void;
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

export function useCompanyOnboardingDB(editingCompanyId?: string | null): CompanyOnboardingDBHook {
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyApiService = new CompanyApiService();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('company');
  
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
    telegramNumber: ''
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
        telegramNumber: existingCompany.telegramNumber || ''
      });

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
      
      // Force refetch of companies data
      queryClient.refetchQueries({ queryKey: ['companies'], exact: false });
      queryClient.refetchQueries({ queryKey: ['companies-simple'] });
      
      
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

  const validateReviewStep = () => {
    // Combine all validations for final review
    return [...validateCompanyStep(), ...validateBusinessStep()];
  };

  // Get current step validation errors
  const getStepErrors = useCallback(() => {
    switch (currentStep) {
      case 'company':
        return validateCompanyStep();
      case 'business':
        return validateBusinessStep();
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
      case 'review':
        setCurrentStep('business');
        break;
    }
  }, [currentStep]);

  // Go to specific step (used for edit navigation from review)
  const goToStep = useCallback((step: 'company' | 'business') => {
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