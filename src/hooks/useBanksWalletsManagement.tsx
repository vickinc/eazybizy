import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { BankAccount, DigitalWallet, Company } from '@/types';
import { BanksWalletsStorageService } from '@/services/storage/banksWalletsStorageService';
import { 
  BanksWalletsBusinessService,
  NewBankAccount,
  NewDigitalWallet,
  EnhancedBankAccount,
  EnhancedDigitalWallet,
  BanksWalletsSummary,
  BanksWalletsData
} from '@/services/business/banksWalletsBusinessService';

export interface BanksWalletsManagementHook {
  // Core Data
  bankAccounts: BankAccount[];
  digitalWallets: DigitalWallet[];
  companies: Company[];
  
  // Computed Data
  enhancedBankAccounts: EnhancedBankAccount[];
  enhancedDigitalWallets: EnhancedDigitalWallet[];
  filteredBankAccounts: EnhancedBankAccount[];
  filteredDigitalWallets: EnhancedDigitalWallet[];
  summary: BanksWalletsSummary;
  pageTitle: string;
  pageDescription: string;
  banksNoDataMessage: string;
  walletsNoDataMessage: string;
  companyOptions: { value: string; label: string }[];
  
  // UI State
  isLoaded: boolean;
  searchTerm: string;
  activeTab: 'banks' | 'wallets';
  expandedBanks: Set<string>;
  expandedWallets: Set<string>;
  isAllBanksExpanded: boolean;
  isAllWalletsExpanded: boolean;
  
  // Dialog State
  showAddBankForm: boolean;
  showAddWalletForm: boolean;
  editingBank: BankAccount | null;
  editingWallet: DigitalWallet | null;
  newBankAccount: NewBankAccount;
  newDigitalWallet: NewDigitalWallet;
  
  // Event Handlers
  setSearchTerm: (term: string) => void;
  setActiveTab: (tab: 'banks' | 'wallets') => void;
  setShowAddBankForm: (show: boolean) => void;
  setShowAddWalletForm: (show: boolean) => void;
  setEditingBank: (bank: BankAccount | null) => void;
  setEditingWallet: (wallet: DigitalWallet | null) => void;
  updateNewBankAccount: (field: keyof NewBankAccount, value: string | number) => void;
  updateNewDigitalWallet: (field: keyof NewDigitalWallet, value: string | number | string[]) => void;
  
  // Expansion Handlers
  toggleBankExpansion: (bankId: string) => void;
  toggleWalletExpansion: (walletId: string) => void;
  toggleAllBanksExpansion: () => void;
  toggleAllWalletsExpansion: () => void;
  
  // CRUD Operations
  handleCreateBankAccount: () => void;
  handleCreateDigitalWallet: () => void;
  handleUpdateBankAccount: (updatedBank: BankAccount) => void;
  handleUpdateDigitalWallet: (updatedWallet: DigitalWallet) => void;
  handleDeleteBankAccount: (accountId: string) => void;
  handleDeleteDigitalWallet: (walletId: string) => void;
  handleToggleBankStatus: (accountId: string) => void;
  handleToggleWalletStatus: (walletId: string) => void;
  
  // Dialog Handlers
  handleShowAddBankForm: () => void;
  handleShowAddWalletForm: () => void;
  handleCloseAddBankForm: () => void;
  handleCloseAddWalletForm: () => void;
  handleCloseEditBankForm: () => void;
  handleCloseEditWalletForm: () => void;
  
  // Utility Functions
  getCompanyName: (companyId: number) => string;
  getCompanyById: (companyId: number) => Company | undefined;
}

export const useBanksWalletsManagement = (
  selectedCompany: number | 'all',
  companies: Company[]
): BanksWalletsManagementHook => {
  // Core Data State
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [digitalWallets, setDigitalWallets] = useState<DigitalWallet[]>([]);
  
  // UI State
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'banks' | 'wallets'>('banks');
  const [expandedBanks, setExpandedBanks] = useState<Set<string>>(new Set());
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());
  const [isAllBanksExpanded, setIsAllBanksExpanded] = useState(false);
  const [isAllWalletsExpanded, setIsAllWalletsExpanded] = useState(false);
  
  // Dialog State
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [showAddWalletForm, setShowAddWalletForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [editingWallet, setEditingWallet] = useState<DigitalWallet | null>(null);
  const [newBankAccount, setNewBankAccount] = useState<NewBankAccount>(
    BanksWalletsBusinessService.getInitialNewBankAccount()
  );
  const [newDigitalWallet, setNewDigitalWallet] = useState<NewDigitalWallet>(
    BanksWalletsBusinessService.getInitialNewDigitalWallet()
  );

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await BanksWalletsStorageService.loadAllBanksWalletsData();
        
        setBankAccounts(data.bankAccounts);
        setDigitalWallets(data.digitalWallets);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading banks and wallets data:', error);
        toast.error('Failed to load banks and wallets data');
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (isLoaded) {
      BanksWalletsStorageService.saveBankAccounts(bankAccounts);
    }
  }, [bankAccounts, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      BanksWalletsStorageService.saveDigitalWallets(digitalWallets);
    }
  }, [digitalWallets, isLoaded]);

  // Computed data using business service
  const processedData = useMemo((): BanksWalletsData => {
    return BanksWalletsBusinessService.processAccountsData(
      bankAccounts,
      digitalWallets,
      companies,
      selectedCompany,
      searchTerm
    );
  }, [bankAccounts, digitalWallets, companies, selectedCompany, searchTerm]);

  // Extract computed values
  const {
    enhancedBankAccounts,
    enhancedDigitalWallets,
    filteredBankAccounts,
    filteredDigitalWallets,
    summary
  } = processedData;

  // Page title and description
  const pageTitle = useMemo(() => {
    return BanksWalletsBusinessService.generatePageTitle(selectedCompany, companies);
  }, [selectedCompany, companies]);

  const pageDescription = useMemo(() => {
    return BanksWalletsBusinessService.generatePageDescription(selectedCompany, companies);
  }, [selectedCompany, companies]);

  // No data messages
  const banksNoDataMessage = useMemo(() => {
    if (searchTerm || selectedCompany !== 'all') {
      return 'No bank accounts match your filters';
    }
    return 'No bank accounts yet. Add your first bank account!';
  }, [searchTerm, selectedCompany]);

  const walletsNoDataMessage = useMemo(() => {
    if (searchTerm || selectedCompany !== 'all') {
      return 'No digital wallets match your filters';
    }
    return 'No digital wallets yet. Add your first wallet!';
  }, [searchTerm, selectedCompany]);

  // Company options for dialogs
  const companyOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    
    // Active companies first
    companies
      .filter(company => company.status === 'Active')
      .forEach(company => {
        options.push({
          value: company.id.toString(),
          label: `${company.tradingName} (Active)`
        });
      });
    
    // Passive companies after
    companies
      .filter(company => company.status === 'Passive')
      .forEach(company => {
        options.push({
          value: company.id.toString(),
          label: `${company.tradingName} (Passive)`
        });
      });
    
    return options;
  }, [companies]);

  // Update expansion states based on filtered data
  useEffect(() => {
    if (filteredBankAccounts.length > 0) {
      const allExpanded = filteredBankAccounts.every(bank => expandedBanks.has(bank.id));
      setIsAllBanksExpanded(allExpanded);
    }
  }, [expandedBanks, filteredBankAccounts]);

  useEffect(() => {
    if (filteredDigitalWallets.length > 0) {
      const allExpanded = filteredDigitalWallets.every(wallet => expandedWallets.has(wallet.id));
      setIsAllWalletsExpanded(allExpanded);
    }
  }, [expandedWallets, filteredDigitalWallets]);

  // Form update handlers
  const updateNewBankAccount = useCallback((field: keyof NewBankAccount, value: string | number) => {
    setNewBankAccount(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-populate account name when company is selected
      if (field === 'companyId' && typeof value === 'number') {
        const selectedCompany = companies.find(c => c.id === value);
        if (selectedCompany) {
          updated.accountName = selectedCompany.legalName;
        }
      }
      
      return updated;
    });
  }, [companies]);

  const updateNewDigitalWallet = useCallback((field: keyof NewDigitalWallet, value: string | number | string[]) => {
    setNewDigitalWallet(prev => ({ ...prev, [field]: value }));
  }, []);

  // Expansion handlers
  const toggleBankExpansion = useCallback((bankId: string) => {
    setExpandedBanks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bankId)) {
        newSet.delete(bankId);
      } else {
        newSet.add(bankId);
      }
      return newSet;
    });
  }, []);

  const toggleWalletExpansion = useCallback((walletId: string) => {
    setExpandedWallets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  }, []);

  const toggleAllBanksExpansion = useCallback(() => {
    if (isAllBanksExpanded) {
      setExpandedBanks(new Set());
      setIsAllBanksExpanded(false);
    } else {
      setExpandedBanks(new Set(filteredBankAccounts.map(bank => bank.id)));
      setIsAllBanksExpanded(true);
    }
  }, [isAllBanksExpanded, filteredBankAccounts]);

  const toggleAllWalletsExpansion = useCallback(() => {
    if (isAllWalletsExpanded) {
      setExpandedWallets(new Set());
      setIsAllWalletsExpanded(false);
    } else {
      setExpandedWallets(new Set(filteredDigitalWallets.map(wallet => wallet.id)));
      setIsAllWalletsExpanded(true);
    }
  }, [isAllWalletsExpanded, filteredDigitalWallets]);

  // CRUD operation handlers
  const handleCreateBankAccount = useCallback(() => {
    const validation = BanksWalletsBusinessService.validateBankAccount(newBankAccount);
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const bankAccount = BanksWalletsBusinessService.createBankAccount(newBankAccount);
    setBankAccounts(prev => [bankAccount, ...prev]);
    setNewBankAccount(BanksWalletsBusinessService.getInitialNewBankAccount());
    setShowAddBankForm(false);
    toast.success('Bank account created successfully');
  }, [newBankAccount]);

  const handleCreateDigitalWallet = useCallback(() => {
    const validation = BanksWalletsBusinessService.validateDigitalWallet(newDigitalWallet);
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const wallet = BanksWalletsBusinessService.createDigitalWallet(newDigitalWallet);
    setDigitalWallets(prev => [wallet, ...prev]);
    setNewDigitalWallet(BanksWalletsBusinessService.getInitialNewDigitalWallet());
    setShowAddWalletForm(false);
    toast.success('Digital wallet created successfully');
  }, [newDigitalWallet]);

  const handleUpdateBankAccount = useCallback((updatedBank: BankAccount) => {
    const validation = BanksWalletsBusinessService.validateBankAccount({
      companyId: updatedBank.companyId,
      bankName: updatedBank.bankName,
      bankAddress: updatedBank.bankAddress,
      currency: updatedBank.currency,
      iban: updatedBank.iban,
      swiftCode: updatedBank.swiftCode,
      accountNumber: updatedBank.accountNumber || '',
      accountName: updatedBank.accountName,
      notes: updatedBank.notes || ''
    });
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    setBankAccounts(prev => 
      BanksWalletsBusinessService.updateBankAccount(prev, updatedBank)
    );
    setEditingBank(null);
    toast.success('Bank account updated successfully');
  }, []);

  const handleUpdateDigitalWallet = useCallback((updatedWallet: DigitalWallet) => {
    const validation = BanksWalletsBusinessService.validateDigitalWallet({
      companyId: updatedWallet.companyId,
      walletType: updatedWallet.walletType,
      walletName: updatedWallet.walletName,
      walletAddress: updatedWallet.walletAddress,
      currency: updatedWallet.currency,
      currencies: updatedWallet.currencies || [],
      description: updatedWallet.description,
      blockchain: updatedWallet.blockchain || '',
      notes: updatedWallet.notes || ''
    });
    
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    setDigitalWallets(prev => 
      BanksWalletsBusinessService.updateDigitalWallet(prev, updatedWallet)
    );
    setEditingWallet(null);
    toast.success('Digital wallet updated successfully');
  }, []);

  const handleDeleteBankAccount = useCallback((accountId: string) => {
    setBankAccounts(prev => 
      BanksWalletsBusinessService.deleteBankAccount(prev, accountId)
    );
    toast.success('Bank account deleted successfully');
  }, []);

  const handleDeleteDigitalWallet = useCallback((walletId: string) => {
    setDigitalWallets(prev => 
      BanksWalletsBusinessService.deleteDigitalWallet(prev, walletId)
    );
    toast.success('Digital wallet deleted successfully');
  }, []);

  const handleToggleBankStatus = useCallback((accountId: string) => {
    setBankAccounts(prev => 
      BanksWalletsBusinessService.toggleBankAccountStatus(prev, accountId)
    );
  }, []);

  const handleToggleWalletStatus = useCallback((walletId: string) => {
    setDigitalWallets(prev => 
      BanksWalletsBusinessService.toggleDigitalWalletStatus(prev, walletId)
    );
  }, []);

  // Dialog handlers
  const handleShowAddBankForm = useCallback(() => {
    if (selectedCompany !== 'all') {
      setNewBankAccount(prev => ({ 
        ...BanksWalletsBusinessService.getInitialNewBankAccount(),
        companyId: selectedCompany as number 
      }));
    }
    setShowAddBankForm(true);
  }, [selectedCompany]);

  const handleShowAddWalletForm = useCallback(() => {
    if (selectedCompany !== 'all') {
      setNewDigitalWallet(prev => ({ 
        ...BanksWalletsBusinessService.getInitialNewDigitalWallet(),
        companyId: selectedCompany as number 
      }));
    }
    setShowAddWalletForm(true);
  }, [selectedCompany]);

  const handleCloseAddBankForm = useCallback(() => {
    setShowAddBankForm(false);
    setNewBankAccount(BanksWalletsBusinessService.getInitialNewBankAccount());
  }, []);

  const handleCloseAddWalletForm = useCallback(() => {
    setShowAddWalletForm(false);
    setNewDigitalWallet(BanksWalletsBusinessService.getInitialNewDigitalWallet());
  }, []);

  const handleCloseEditBankForm = useCallback(() => {
    setEditingBank(null);
  }, []);

  const handleCloseEditWalletForm = useCallback(() => {
    setEditingWallet(null);
  }, []);

  // Utility functions
  const getCompanyName = useCallback((companyId: number): string => {
    return BanksWalletsBusinessService.getCompanyName(companyId, companies);
  }, [companies]);

  const getCompanyById = useCallback((companyId: number): Company | undefined => {
    return BanksWalletsBusinessService.getCompanyById(companyId, companies);
  }, [companies]);

  return {
    // Core Data
    bankAccounts,
    digitalWallets,
    companies,
    
    // Computed Data
    enhancedBankAccounts,
    enhancedDigitalWallets,
    filteredBankAccounts,
    filteredDigitalWallets,
    summary,
    pageTitle,
    pageDescription,
    banksNoDataMessage,
    walletsNoDataMessage,
    companyOptions,
    
    // UI State
    isLoaded,
    searchTerm,
    activeTab,
    expandedBanks,
    expandedWallets,
    isAllBanksExpanded,
    isAllWalletsExpanded,
    
    // Dialog State
    showAddBankForm,
    showAddWalletForm,
    editingBank,
    editingWallet,
    newBankAccount,
    newDigitalWallet,
    
    // Event Handlers
    setSearchTerm,
    setActiveTab,
    setShowAddBankForm,
    setShowAddWalletForm,
    setEditingBank,
    setEditingWallet,
    updateNewBankAccount,
    updateNewDigitalWallet,
    
    // Expansion Handlers
    toggleBankExpansion,
    toggleWalletExpansion,
    toggleAllBanksExpansion,
    toggleAllWalletsExpansion,
    
    // CRUD Operations
    handleCreateBankAccount,
    handleCreateDigitalWallet,
    handleUpdateBankAccount,
    handleUpdateDigitalWallet,
    handleDeleteBankAccount,
    handleDeleteDigitalWallet,
    handleToggleBankStatus,
    handleToggleWalletStatus,
    
    // Dialog Handlers
    handleShowAddBankForm,
    handleShowAddWalletForm,
    handleCloseAddBankForm,
    handleCloseAddWalletForm,
    handleCloseEditBankForm,
    handleCloseEditWalletForm,
    
    // Utility Functions
    getCompanyName,
    getCompanyById
  };
};