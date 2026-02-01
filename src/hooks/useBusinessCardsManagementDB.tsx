import { useState, useCallback, useMemo } from 'react';
import { 
  useQuery, 
  useInfiniteQuery,
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { BusinessCard, BusinessCardFormData, PersonOption } from '@/types/businessCards.types';
import { BusinessCardsBusinessService } from '@/services/business/businessCardsBusinessService';
import { Company } from '@/types';
import { 
  BusinessCardsService,
  BusinessCardCreateRequest,
  BusinessCardUpdateRequest
} from '@/services/api/businessCardsService';
import { toast } from 'sonner';

export interface BusinessCardsManagementDBHook {
  // Data
  businessCards: BusinessCard[];
  statistics?: {
    totalCards: number;
    activeCards: number;
    archivedCards: number;
    recentCards: number;
    cardsByTemplate: Array<{ template: string; count: number }>;
    cardsByQRType: Array<{ qrType: string; count: number }>;
    topCompanies: Array<{ companyId: number; companyName: string; count: number }>;
    lastUpdated: string;
  };
  
  // UI State
  isDialogOpen: boolean;
  previewCard: BusinessCard | null;
  isPreviewOpen: boolean;
  showArchived: boolean;
  hoveredButton: string | null;
  
  // Form State
  formData: BusinessCardFormData;
  
  // Person Options
  personOptions: PersonOption[];
  
  // Company Info
  selectedCompanyName: string;
  canAddCard: boolean;
  hasRepresentativesOrShareholders: boolean;
  
  // Loading & Error States
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isMutating: boolean;
  
  // Infinite Scrolling
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  
  // Actions
  handleCreateCard: () => void;
  handleShareCard: (card: BusinessCard) => void;
  handlePreview: (card: BusinessCard) => void;
  handleDelete: (cardId: string) => void;
  handleDownloadCard: (card: BusinessCard) => Promise<void>;
  handleArchive: (cardId: string) => void;
  handleUnarchive: (cardId: string) => void;
  
  // Dialog Management
  openDialog: () => void;
  closeDialog: () => void;
  closePreview: () => void;
  toggleArchiveView: () => void;
  
  // Form Actions
  updateFormField: (field: keyof BusinessCardFormData, value: string | number) => void;
  resetForm: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  
  // Utility Functions
  setHoveredButton: (buttonId: string | null) => void;
  getTemplateStyles: (template: "modern" | "classic" | "minimal" | "eazy" | "bizy") => any;
  
  // Data Refresh
  refetch: () => void;
}

const initialFormData: BusinessCardFormData = {
  personId: "",
  personType: "representative",
  qrType: "website",
  template: "eazy"
};

export function useBusinessCardsManagementDB(
  selectedCompany: string | number = 'all',
  companies: Company[] = []
): BusinessCardsManagementDBHook {
  const queryClient = useQueryClient();
  const businessCardsService = new BusinessCardsService();
  
  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<BusinessCard | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<BusinessCardFormData>(initialFormData);
  
  // Query Keys
  const businessCardsQueryKey = ['business-cards', selectedCompany, { isArchived: showArchived }];
  const statisticsQueryKey = ['business-cards', 'statistics', selectedCompany];
  
  // Business Cards Infinite Query
  const { 
    data: businessCardsData, 
    isLoading, 
    isError, 
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch: refetchBusinessCards
  } = useInfiniteQuery({
    queryKey: businessCardsQueryKey,
    queryFn: ({ pageParam }) => businessCardsService.getBusinessCardsWithCursor(
      pageParam,
      20, // Load 20 cards per page
      'desc',
      {
        companyId: selectedCompany !== 'all' ? selectedCompany.toString() : undefined,
        isArchived: showArchived
      }
    ),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.nextCursor : undefined;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Statistics Query
  const { data: statistics } = useQuery({
    queryKey: statisticsQueryKey,
    queryFn: () => businessCardsService.getStatistics(selectedCompany !== 'all' ? selectedCompany.toString() : undefined),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Extract business cards from infinite query pages (already formatted by service)
  const businessCards = useMemo(() => {
    return businessCardsData?.pages.flatMap(page => page.businessCards) || [];
  }, [businessCardsData?.pages]);
  
  // Create Business Card Mutation
  const createBusinessCardMutation = useMutation({
    mutationFn: (cardData: BusinessCardCreateRequest) => businessCardsService.createBusinessCard(cardData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessCardsQueryKey });
      queryClient.invalidateQueries({ queryKey: statisticsQueryKey });
      closeDialog();
      toast.success('Business card created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create business card: ${error.message}`);
    }
  });
  
  // Update Business Card Mutation
  const updateBusinessCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BusinessCardUpdateRequest }) => 
      businessCardsService.updateBusinessCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessCardsQueryKey });
      queryClient.invalidateQueries({ queryKey: statisticsQueryKey });
      toast.success('Business card updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update business card: ${error.message}`);
    }
  });
  
  // Delete Business Card Mutation
  const deleteBusinessCardMutation = useMutation({
    mutationFn: (id: string) => businessCardsService.deleteBusinessCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessCardsQueryKey });
      queryClient.invalidateQueries({ queryKey: statisticsQueryKey });
      toast.success('Business card deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete business card: ${error.message}`);
    }
  });
  
  // Archive/Unarchive Business Card Mutation
  const archiveBusinessCardMutation = useMutation({
    mutationFn: ({ id, archive }: { id: string; archive: boolean }) => 
      archive ? businessCardsService.archiveBusinessCard(id) : businessCardsService.unarchiveBusinessCard(id),
    onSuccess: (_, { archive }) => {
      queryClient.invalidateQueries({ queryKey: businessCardsQueryKey });
      queryClient.invalidateQueries({ queryKey: statisticsQueryKey });
      toast.success(`Business card ${archive ? 'archived' : 'unarchived'} successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update business card: ${error.message}`);
    }
  });
  
  // Company logic and person options (must be defined before form actions)
  const canAddCard = selectedCompany !== 'all' && selectedCompany !== null;
  const selectedCompanyName = useMemo(() => {
    if (selectedCompany === 'all' || !selectedCompany) return '';
    const company = companies.find(c => c.id === selectedCompany);
    return company?.tradingName || '';
  }, [selectedCompany, companies]);
  
  const hasRepresentativesOrShareholders = useMemo(() => {
    if (selectedCompany === 'all' || !selectedCompany) return true;
    const company = companies.find(c => c.id === selectedCompany);
    if (!company) return false;
    const hasReps = company.representatives && company.representatives.length > 0;
    const hasShareholders = company.shareholders && company.shareholders.length > 0;
    return hasReps || hasShareholders;
  }, [selectedCompany, companies]);

  // Generate person options from selected company's representatives and shareholders
  const personOptions = useMemo(() => {
    if (selectedCompany === 'all' || !selectedCompany) return [];
    const company = companies.find(c => c.id === selectedCompany);
    if (!company) return [];

    const options: PersonOption[] = [];

    // Add representatives
    if (company.representatives) {
      company.representatives.forEach((rep, index) => {
        const displayRole = rep.role === 'Other' ? rep.customRole || 'Other' : rep.role;
        options.push({
          id: `rep-${index}`,
          type: 'representative',
          firstName: rep.firstName,
          lastName: rep.lastName,
          email: rep.email,
          phoneNumber: rep.phoneNumber || '',
          role: displayRole
        });
      });
    }

    // Add shareholders
    if (company.shareholders) {
      company.shareholders.forEach((shareholder, index) => {
        options.push({
          id: `share-${index}`,
          type: 'shareholder',
          firstName: shareholder.firstName,
          lastName: shareholder.lastName,
          email: shareholder.email,
          phoneNumber: shareholder.phoneNumber || '',
          role: 'Shareholder'
        });
      });
    }

    return options;
  }, [selectedCompany, companies]);

  // Form Actions
  const updateFormField = useCallback((field: keyof BusinessCardFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormField(name as keyof BusinessCardFormData, value);
  }, [updateFormField]);
  
  const handleSelectChange = useCallback((name: string, value: string) => {
    if (name === 'personId') {
      // When person is selected, also set the person type
      const selectedPerson = personOptions.find(p => p.id === value);
      if (selectedPerson) {
        updateFormField('personId', value);
        updateFormField('personType', selectedPerson.type);
      }
    } else {
      updateFormField(name as keyof BusinessCardFormData, value);
    }
  }, [updateFormField, personOptions]);
  
  // Dialog Management
  const openDialog = useCallback(() => {
    // Smart default QR type based on company website availability
    const selectedCompanyObj = companies.find(c => c.id === selectedCompany);
    const defaultQRType = selectedCompanyObj?.website ? "website" : "email";
    
    setFormData(prev => ({
      ...prev,
      qrType: defaultQRType
    }));
    
    setIsDialogOpen(true);
  }, [selectedCompany, companies]);
  
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    resetForm();
  }, [resetForm]);
  
  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewCard(null);
  }, []);
  
  const toggleArchiveView = useCallback(() => {
    setShowArchived(prev => !prev);
  }, []);
  
  // CRUD Operations
  const handleCreateCard = useCallback(() => {
    // Basic validation
    if (!formData.personId) {
      toast.error('Please select a person');
      return;
    }

    if (selectedCompany === 'all' || !selectedCompany) {
      toast.error('Please select a company');
      return;
    }
    
    const company = companies.find(c => c.id === selectedCompany);
    if (!company) {
      toast.error('Selected company not found');
      return;
    }

    // Find the selected person
    const selectedPerson = personOptions.find(p => p.id === formData.personId);
    if (!selectedPerson) {
      toast.error('Selected person not found');
      return;
    }

    const personName = `${selectedPerson.firstName} ${selectedPerson.lastName}`;
    const position = selectedPerson.role;
    
    const cardData: BusinessCardCreateRequest = {
      companyId: typeof selectedCompany === 'number' ? selectedCompany : parseInt(selectedCompany.toString()),
      personName,
      position,
      personEmail: selectedPerson.email,
      personPhone: selectedPerson.phoneNumber,
      qrType: formData.qrType,
      template: formData.template
    };
    
    createBusinessCardMutation.mutate(cardData);
  }, [formData, selectedCompany, companies, personOptions, createBusinessCardMutation]);
  
  const handleShareCard = useCallback(async (card: BusinessCard) => {
    try {
      toast.info('Generating business card image...');
      
      // Generate the business card image blob
      const blob = await BusinessCardsBusinessService.generateBusinessCardImageBlob(card);
      
      // Try native file sharing first (this works for AirDrop, etc.)
      if (navigator.share) {
        const file = new File([blob], `${card.company.tradingName.replace(/[^a-zA-Z0-9]/g, '-')}-business-card.png`, { type: 'image/png' });
        const shareData = {
          text: "",
          files: [file]
        };

        // Check if sharing with files is supported
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast.success('Business card image shared successfully');
          return;
        }
      }

      // Fallback: copy image to clipboard (good for messaging apps)
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        toast.success('Business card image copied to clipboard! You can now paste it in any app.');
        return;
      } catch (clipboardError) {
        console.log('Clipboard image write failed, trying download...', clipboardError);
      }

      // Final fallback: trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${card.company.tradingName.replace(/[^a-zA-Z0-9]/g, '-')}-business-card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Business card image downloaded! You can now share it manually from your downloads.');

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share error:', error);
        // Ultimate fallback: copy text to clipboard
        try {
          const shareText = `${card.personName} - ${card.company.tradingName}\n\nContact: ${card.personEmail || card.company.email}\nWebsite: ${card.company.website}`;
          await navigator.clipboard.writeText(shareText);
          toast.success('Business card details copied to clipboard (image generation failed)');
        } catch (clipboardError) {
          toast.error('Failed to share business card');
        }
      }
    }
  }, []);
  
  const handlePreview = useCallback((card: BusinessCard) => {
    setPreviewCard(card);
    setIsPreviewOpen(true);
  }, []);
  
  const handleDelete = useCallback((cardId: string) => {
    if (confirm("Are you sure you want to delete this business card?")) {
      deleteBusinessCardMutation.mutate(cardId);
    }
  }, [deleteBusinessCardMutation]);

  const handleDownloadCard = useCallback(async (card: BusinessCard) => {
    try {
      await BusinessCardsBusinessService.downloadBusinessCardImage(card);
      toast.success(`Business card image downloaded for ${card.company.tradingName}`);
    } catch (error) {
      toast.error('Failed to download business card image');
      console.error('Business card download error:', error);
    }
  }, []);
  
  const handleArchive = useCallback((cardId: string) => {
    archiveBusinessCardMutation.mutate({ id: cardId, archive: true });
  }, [archiveBusinessCardMutation]);
  
  const handleUnarchive = useCallback((cardId: string) => {
    archiveBusinessCardMutation.mutate({ id: cardId, archive: false });
  }, [archiveBusinessCardMutation]);
  
  // Utility Functions
  const getTemplateStyles = useCallback((template: "modern" | "classic" | "minimal" | "eazy" | "bizy") => {
    // Template styles - same as original implementation
    const styles = {
      modern: {
        background: '#667eea',
        textColor: 'white'
      },
      classic: {
        background: '#f8f9fa',
        color: '#212529',
        border: '2px solid #dee2e6',
        textColor: 'black'
      },
      minimal: {
        background: 'white',
        color: '#333',
        border: '1px solid #e0e0e0',
        textColor: 'black'
      },
      eazy: {
        background: '#d9f99d',
        color: '#365314',
        border: '1px solid #a3e635',
        textColor: '#365314'
      },
      bizy: {
        background: '#ffcc66',
        backgroundColor: '#ffcc66',
        textColor: 'black'
      }
    };
    
    return styles[template] || styles.modern;
  }, []);
  
  const refetch = useCallback(() => {
    refetchBusinessCards();
  }, [refetchBusinessCards]);
  
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  return {
    // Data
    businessCards,
    statistics,
    
    // UI State
    isDialogOpen,
    previewCard,
    isPreviewOpen,
    showArchived,
    hoveredButton,
    
    // Form State
    formData,
    
    // Person Options
    personOptions,
    
    // Company Info
    selectedCompanyName,
    canAddCard,
    hasRepresentativesOrShareholders,
    
    // Loading & Error States
    isLoading,
    isError,
    error,
    isMutating: createBusinessCardMutation.isPending || 
               updateBusinessCardMutation.isPending || 
               deleteBusinessCardMutation.isPending || 
               archiveBusinessCardMutation.isPending,
    
    // Infinite Scrolling
    hasMore: hasNextPage || false,
    isLoadingMore: isFetchingNextPage,
    loadMore,
    
    // Actions
    handleCreateCard,
    handleShareCard,
    handlePreview,
    handleDelete,
    handleDownloadCard,
    handleArchive,
    handleUnarchive,
    
    // Dialog Management
    openDialog,
    closeDialog,
    closePreview,
    toggleArchiveView,
    
    // Form Actions
    updateFormField,
    resetForm,
    handleInputChange,
    handleSelectChange,
    
    // Utility Functions
    setHoveredButton,
    getTemplateStyles,
    
    // Data Refresh
    refetch
  };
}