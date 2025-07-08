export interface Client {
  id: string;
  companyId?: number;
  clientType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  name: string;
  contactPersonName?: string;
  contactPersonPosition?: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  industry: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED';
  notes: string;
  createdAt: string;
  lastInvoiceDate?: string;
  totalInvoiced: number;
  totalPaid: number;
  registrationNumber?: string;
  vatNumber?: string;
  passportNumber?: string;
  dateOfBirth?: string;
}

export interface NewClient {
  companyId: number | '';
  clientType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  name: string;
  contactPersonName: string;
  contactPersonPosition: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  industry: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED';
  notes: string;
  registrationNumber: string;
  vatNumber: string;
  passportNumber: string;
  dateOfBirth: string;
}

export interface FormattedClient extends Client {
  // Company Information
  companyInfo?: {
    id: number;
    tradingName: string;
    legalName: string;
    logo: string;
  };
  
  // Pre-formatted display data
  formattedAddress: string;
  formattedTotalInvoiced: string;
  formattedTotalPaid: string;
  formattedCreatedAt: string;
  formattedLastInvoiceDate?: string;
  
  // Pre-constructed links
  emailLink: string;
  phoneLink: string;
  websiteUrl: string;
  
  // Status configuration
  statusConfig: {
    value: string;
    label: string;
    color: string;
  };
}

export interface ClientFormData {
  companyId: number | '';
  clientType: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  name: string;
  contactPersonName: string;
  contactPersonPosition: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  industry: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED';
  notes: string;
  registrationNumber: string;
  vatNumber: string;
  passportNumber: string;
  dateOfBirth: string;
}

export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Consulting',
  'Legal',
  'Marketing',
  'Construction',
  'Transportation',
  'Other'
];

export const CLIENT_STATUSES = [
  { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'LEAD', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
  { value: 'ARCHIVED', label: 'Archived', color: 'bg-red-100 text-red-800' }
];

export interface ClientFilters {
  searchTerm: string;
  statusFilter: 'all' | 'ACTIVE' | 'INACTIVE' | 'LEAD' | 'ARCHIVED';
  industryFilter: string;
  companyFilter: number | 'all';
}

export interface ClientStatistics {
  total: number;
  active: number;
  leads: number;
  archived: number;
  totalRevenue: number;
}