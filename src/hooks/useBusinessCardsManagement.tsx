import { useState, useEffect, useCallback, useRef } from 'react';
import { BusinessCard, BusinessCardFormData, FormattedBusinessCard } from '@/types/businessCards.types';
import { Company } from '@/types';
import { BusinessCardsStorageService } from '@/services/storage/businessCardsStorageService';
import { BusinessCardsBusinessService } from '@/services/business/businessCardsBusinessService';
import { BusinessCardsValidationService } from '@/services/business/businessCardsValidationService';
import { toast } from 'sonner';

interface TemplateStyles {
  background?: string;
  color?: string;
  border?: string;
  textColor: string;
}

export interface BusinessCardsManagementHook {
  // Data
  businessCards: BusinessCard[];
  filteredBusinessCards: FormattedBusinessCard[];
  visibleCards: FormattedBusinessCard[];
  
  // UI State
  isDialogOpen: boolean;
  previewCard: FormattedBusinessCard | null;
  isPreviewOpen: boolean;
  showArchived: boolean;
  isDataLoaded: boolean;
  hoveredButton: string | null;
  
  // Form State
  formData: BusinessCardFormData;
  
  // Actions
  handleCreateCard: () => void;
  handlePreview: (card: FormattedBusinessCard) => void;
  handleDelete: (cardId: string) => void;
  handleDownloadCard: (card: FormattedBusinessCard) => Promise<void>;
  
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
  getTemplateStyles: (template: "modern" | "classic" | "minimal" | "eazy") => TemplateStyles;
}

const initialFormData: BusinessCardFormData = {
  companyId: 0,
  personName: "",
  position: "",
  qrType: "website",
  template: "modern"
};

export const useBusinessCardsManagement = (
  selectedCompany: string | number,
  companies: Company[]
): BusinessCardsManagementHook => {
  // Core Data State
  const [businessCards, setBusinessCards] = useState<BusinessCard[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const hasInitialized = useRef(false);

  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<BusinessCard | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<BusinessCardFormData>(initialFormData);

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCards = BusinessCardsStorageService.getBusinessCards();
      setBusinessCards(savedCards);
      setIsDataLoaded(true);
      hasInitialized.current = true;
    }
  }, []);

  // Save business cards to localStorage whenever cards array changes (but only after initial load)
  useEffect(() => {
    if (hasInitialized.current && isDataLoaded && businessCards.length >= 0) {
      BusinessCardsStorageService.saveBusinessCards(businessCards);
    }
  }, [businessCards, isDataLoaded]);

  // Filter business cards based on current filter settings
  const filteredBusinessCards = BusinessCardsBusinessService.filterBusinessCards(businessCards, selectedCompany);
  
  // Get visible cards based on archive status
  const visibleCards = BusinessCardsBusinessService.getVisibleCards(filteredBusinessCards, showArchived);
  
  // Format cards for display
  const formattedVisibleCards = visibleCards.map(BusinessCardsBusinessService.formatBusinessCardForDisplay);
  const formattedFilteredCards = filteredBusinessCards.map(BusinessCardsBusinessService.formatBusinessCardForDisplay);
  const formattedPreviewCard = previewCard ? BusinessCardsBusinessService.formatBusinessCardForDisplay(previewCard) : null;

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
    if (name === 'companyId') {
      updateFormField(name, parseInt(value) || 0);
    } else {
      updateFormField(name as keyof BusinessCardFormData, value);
    }
  }, [updateFormField]);

  // Dialog Management
  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

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
    const sanitizedData = BusinessCardsValidationService.sanitizeFormData(formData);
    const validation = BusinessCardsValidationService.validateBusinessCardForm(sanitizedData, companies);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Show warnings if any
    validation.warnings.forEach(warning => toast.warning(warning));

    try {
      const newCard = BusinessCardsBusinessService.createBusinessCard(sanitizedData, companies);
      setBusinessCards(prev => [newCard, ...prev]);
      
      closeDialog();
      toast.success(`Business card created for ${newCard.company.tradingName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create business card');
    }
  }, [formData, companies, closeDialog]);

  const handlePreview = useCallback((card: FormattedBusinessCard) => {
    setPreviewCard(card);
    setIsPreviewOpen(true);
  }, []);

  const handleDelete = useCallback((cardId: string) => {
    if (confirm("Are you sure you want to delete this business card?")) {
      const cardToDelete = businessCards.find(card => card.id === cardId);
      setBusinessCards(prev => prev.filter(card => card.id !== cardId));
      toast.success(`Business card deleted: ${cardToDelete?.company.tradingName || 'Unknown'}`);
    }
  }, [businessCards]);

  const handleArchive = useCallback((cardId: string) => {
    setBusinessCards(prev => prev.map(card => 
      card.id === cardId 
        ? BusinessCardsBusinessService.archiveCard(card)
        : card
    ));
    toast.success("Business card archived");
  }, []);

  const handleUnarchive = useCallback((cardId: string) => {
    setBusinessCards(prev => prev.map(card => 
      card.id === cardId 
        ? BusinessCardsBusinessService.unarchiveCard(card)
        : card
    ));
    toast.success("Business card unarchived");
  }, []);

  const handleToggleArchive = useCallback((cardId: string) => {
    const card = businessCards.find(c => c.id === cardId);
    if (card) {
      if (card.isArchived) {
        handleUnarchive(cardId);
      } else {
        handleArchive(cardId);
      }
    }
  }, [businessCards, handleArchive, handleUnarchive]);

  const handleAddToWallet = useCallback(async (card: FormattedBusinessCard) => {
    try {
      BusinessCardsBusinessService.downloadPassKit(card);
      toast.success(`Wallet pass downloaded for ${card.company.tradingName}`);
    } catch (error) {
      toast.error('Failed to create wallet pass');
      console.error('Wallet pass creation error:', error);
    }
  }, []);

  const handleDownloadCard = useCallback(async (card: FormattedBusinessCard) => {
    try {
      await BusinessCardsBusinessService.downloadBusinessCardImage(card);
      toast.success(`Business card image downloaded for ${card.company.tradingName}`);
    } catch (error) {
      toast.error('Failed to download business card image');
      console.error('Business card download error:', error);
    }
  }, []);

  // Utility Functions
  const getTemplateStyles = useCallback((template: "modern" | "classic" | "minimal" | "eazy") => {
    return BusinessCardsBusinessService.getTemplateStyles(template);
  }, []);

  return {
    // Data
    businessCards,
    filteredBusinessCards: formattedFilteredCards,
    visibleCards: formattedVisibleCards,
    
    // UI State
    isDialogOpen,
    previewCard: formattedPreviewCard,
    isPreviewOpen,
    showArchived,
    isDataLoaded,
    hoveredButton,
    
    // Form State
    formData,
    
    // Actions
    handleCreateCard,
    handlePreview,
    handleDelete,
    handleDownloadCard,
    
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
    getTemplateStyles
  };
};