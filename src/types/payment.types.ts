export interface PaymentMethod {
  id: string;
  type: 'bank' | 'wallet';
  name: string;
  companyId: number;
  accountName?: string;
  bankName?: string;
  bankAddress?: string;
  iban?: string;
  swiftCode?: string;
  accountNumber?: string;
  walletAddress?: string;
  currency: string;
  details: string;
}

export interface BankAccount {
  id: string;
  companyId: number;
  bankName: string;
  bankAddress: string;
  currency: string;
  iban: string;
  swiftCode: string;
  accountNumber?: string;
  accountName: string;
  isActive: boolean;
  createdAt: string;
  notes?: string;
}

export interface DigitalWallet {
  id: string;
  companyId: number;
  walletType: 'paypal' | 'stripe' | 'wise' | 'crypto' | 'other';
  walletName: string;
  walletAddress: string;
  currency: string;
  currencies?: string[]; // For crypto wallets that might support multiple currencies on one address
  description: string;
  blockchain?: string;
  isActive: boolean;
  createdAt: string;
  notes?: string;
}
