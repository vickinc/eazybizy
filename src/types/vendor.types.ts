export interface Vendor {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
  website: string;
  paymentTerms: number; // Payment terms in days
  currency: string;
  paymentMethod: string; // Cash, Bank, Crypto
  billingAddress: string;
  itemsServicesSold: string;
  notes: string;
  companyRegistrationNr: string;
  vatNr: string;
  vendorCountry: string;
  companyId: number; // Company this vendor belongs to
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewVendor {
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
  website: string;
  paymentTerms: string;
  currency: string;
  paymentMethod: string;
  billingAddress: string;
  itemsServicesSold: string;
  notes: string;
  companyRegistrationNr: string;
  vatNr: string;
  vendorCountry: string;
  productIds: string[]; // Selected product IDs
}

export interface FormattedVendor extends Vendor {
  // Company Information
  relatedCompanies: Array<{
    id: number;
    tradingName: string;
    logo: string;
  }>;
  
  // Product Information
  productCount: number;
  uniqueProductCount: number;
  vendorProducts: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    companyName: string;
    formattedPrice: string;
  }>;
  
  // Formatted Dates
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
  
  // Pre-constructed URLs
  websiteUrl: string;
  mailtoLink: string;
  phoneLink: string;
  
  // Display Properties
  hasMultipleCompanies: boolean;
}

export interface VendorFormData {
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
  website: string;
  paymentTerms: string;
  currency: string;
  paymentMethod: string;
  billingAddress: string;
  itemsServicesSold: string;
  notes: string;
  companyRegistrationNr: string;
  vatNr: string;
  vendorCountry: string;
  productIds: string[];
  isActive?: boolean;
}

export const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS', 'CLP',
  'PHP', 'AED', 'COP', 'SAR', 'MYR', 'RON', 'THB', 'TRY', 'BRL', 'TWD',
  'ZAR', 'KRW', 'INR', 'RUB', 'BGN', 'HRK', 'IDR', 'ISK'
];

export const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Bermuda', 'Bolivia', 'Bosnia and Herzegovina', 'Brazil', 'Bulgaria',
  'Cambodia', 'Canada', 'Cayman Islands', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cyprus', 'Czech Republic', 
  'Denmark', 'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Eritrea', 'Estonia', 'Finland', 'France', 
  'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guyana', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
  'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg',
  'Malaysia', 'Malta', 'Mexico', 'Morocco', 'Netherlands', 'Netherlands Antilles', 'New Zealand', 'Nicaragua', 'Nigeria', 'Norway', 'Oman',
  'Pakistan', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea',
  'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand', 'Trinidad and Tobago', 'Turkey', 'UAE', 'Ukraine', 'United Kingdom', 'United States',
  'Uruguay', 'Venezuela', 'Vietnam'
].sort();

export const PAYMENT_TERMS_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '15', label: '15 days' },
  { value: '30', label: '30 days' },
  { value: '45', label: '45 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: 'custom', label: 'Custom' }
];

export const PAYMENT_METHODS = [
  { value: 'Bank', label: 'Bank Transfer' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Check', label: 'Check' },
  { value: 'Crypto', label: 'Cryptocurrency' },
  { value: 'PayPal', label: 'PayPal' },
  { value: 'Stripe', label: 'Stripe' },
  { value: 'Wise', label: 'Wise' },
  { value: 'Other', label: 'Other' }
];

export interface VendorFilters {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'inactive';
  companyFilter: number | 'all';
}

export interface VendorStatistics {
  total: number;
  active: number;
  inactive: number;
  avgPaymentTerms: number;
}