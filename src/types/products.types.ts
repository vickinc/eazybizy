
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  cost: number;
  costCurrency: string;
  vendorId: string | null; // vendor ID or 'N/A' for no vendor
  companyId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  website: string;
  paymentTerms: number;
  currency: string;
  paymentMethod: string;
  billingAddress: string;
  itemsServicesSold: string;
  notes: string;
  companyRegistrationNr: string;
  vatNr: string;
  vendorCountry: string;
  companyId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewProduct {
  name: string;
  description: string;
  price: string;
  currency: string;
  cost: string;
  costCurrency: string;
  vendorId: string;
}

export interface FormattedProduct extends Product {
  // Company Information
  companyName: string;
  companyLogo: string;
  companyTradingName: string;
  
  // Vendor Information
  vendorName?: string;
  
  // Calculated Fields
  marginPercentage: number;
  marginColor: string;
  
  // Formatted Dates
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  currency: string;
  cost: string;
  costCurrency: string;
  vendorId: string;
}

export const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS', 'CLP',
  'PHP', 'AED', 'COP', 'SAR', 'MYR', 'RON', 'THB', 'TRY', 'BRL', 'TWD',
  'ZAR', 'KRW', 'INR', 'RUB', 'BGN', 'HRK', 'IDR', 'ISK'
];

