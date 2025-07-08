import { useState, useEffect, useMemo } from 'react';
import { Client } from '@/types/client.types';
import { Product } from '@/types/products.types';
import { BankAccount, DigitalWallet, PaymentMethod } from '@/types';
import { ClientStorageService } from '@/services/storage/clientStorageService';
import { ProductStorageService } from '@/services/storage/productStorageService';
import { CompanyDataStorageService } from '@/services/storage/companyDataStorageService';
import { PaymentMethodService } from '@/services/business/paymentMethodService';

export interface SupportingDataHook {
  // Data
  clients: Client[];
  products: Product[];
  bankAccounts: BankAccount[];
  digitalWallets: DigitalWallet[];
  paymentMethods: PaymentMethod[];
  
  // State
  isLoaded: boolean;
}

export function useSupportingData(): SupportingDataHook {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [digitalWallets, setDigitalWallets] = useState<DigitalWallet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all supporting data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Load all supporting data using existing storage services
        const loadedClients = ClientStorageService.getClients();
        const loadedProducts = ProductStorageService.getProducts();
        const loadedBankAccounts = CompanyDataStorageService.getBankAccounts();
        const loadedDigitalWallets = CompanyDataStorageService.getDigitalWallets();

        setClients(loadedClients);
        setProducts(loadedProducts);
        setBankAccounts(loadedBankAccounts);
        setDigitalWallets(loadedDigitalWallets);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading supporting data:', error);
        setIsLoaded(true); // Set to true even on error to prevent infinite loading
      }
    }
  }, []);

  // Listen for data updates from other parts of the application
  useEffect(() => {
    const handleClientsUpdate = () => {
      setClients(ClientStorageService.getClients());
    };

    const handleProductsUpdate = () => {
      setProducts(ProductStorageService.getProducts());
    };

    const handleBankAccountsUpdate = () => {
      setBankAccounts(CompanyDataStorageService.getBankAccounts());
    };

    const handleDigitalWalletsUpdate = () => {
      setDigitalWallets(CompanyDataStorageService.getDigitalWallets());
    };

    // Listen for updates
    window.addEventListener('clientsUpdated', handleClientsUpdate);
    window.addEventListener('productsUpdated', handleProductsUpdate);
    window.addEventListener('bankAccountsUpdated', handleBankAccountsUpdate);
    window.addEventListener('digitalWalletsUpdated', handleDigitalWalletsUpdate);

    return () => {
      window.removeEventListener('clientsUpdated', handleClientsUpdate);
      window.removeEventListener('productsUpdated', handleProductsUpdate);
      window.removeEventListener('bankAccountsUpdated', handleBankAccountsUpdate);
      window.removeEventListener('digitalWalletsUpdated', handleDigitalWalletsUpdate);
    };
  }, []);

  // Generate payment methods from bank accounts and digital wallets
  const paymentMethods = useMemo(() => {
    return PaymentMethodService.generatePaymentMethods(bankAccounts, digitalWallets);
  }, [bankAccounts, digitalWallets]);

  return {
    clients,
    products,
    bankAccounts,
    digitalWallets,
    paymentMethods,
    isLoaded
  };
}