export interface Company {
  id: number;
  legalName: string;
  tradingName: string;
  registrationNo: string;
  registrationDate: string; // Required field - ISO date string
  countryOfRegistration: string; // Required field - country name
  baseCurrency: string; // Required field - base currency for financial reporting
  businessLicenseNr?: string; // Optional field
  vatNumber?: string;
  industry: string;
  entityType?: string; // Entity type (LTD, LLC, Corporation, etc.)
  customEntityType?: string; // Custom entity type when 'Other' is selected
  fiscalYearEnd?: string; // Fiscal year end (MM-DD format, e.g., "12-31")
  address: string;
  phone: string;
  email: string;
  website: string;
  status: string; // Consider using a more specific type e.g. 'Active' | 'Inactive'
  logo: string;
  // Social Media URLs (optional)
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  youtubeUrl?: string;
  // Messenger contact numbers (optional)
  whatsappNumber?: string;
  telegramNumber?: string;
  // Main contact person
  mainContactEmail?: string;
  mainContactType?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Ownership and representatives
  shareholders?: Shareholder[];
  representatives?: Representative[];
}

export interface Shareholder {
  id?: number;
  companyId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // ISO date string for form handling
  nationality: string;
  countryOfResidence: string;
  email: string;
  phoneNumber: string;
  ownershipPercent: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RepresentativeRole = 
  | 'Chief Executive Officer'
  | 'Chief Financial Officer'
  | 'Chief Operating Officer'
  | 'Board of Directors'
  | 'President'
  | 'Managing Director'
  | 'Public Relations Officer'
  | 'Company Secretary'
  | 'Vice President'
  | 'Other';

export interface Representative {
  id?: number;
  companyId?: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // ISO date string for form handling
  nationality: string;
  countryOfResidence: string;
  email: string;
  phoneNumber: string;
  role: RepresentativeRole;
  customRole?: string; // Required when role is 'Other'
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ContactPerson {
  type: 'shareholder' | 'representative';
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  displayRole?: string; // For representatives: their role, for shareholders: ownership %
}

// Cursor pagination types
export interface CursorPaginationParams {
  cursor?: string;
  take?: number;
  sortField?: 'id' | 'createdAt' | 'legalName' | 'tradingName' | 'industry';
  sortDirection?: 'asc' | 'desc';
}

export interface CursorPaginationResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    totalCount?: number;
  };
}

// Legacy offset pagination (keeping for backward compatibility)
export interface OffsetPaginationParams {
  skip?: number;
  take?: number;
  sortField?: 'id' | 'createdAt' | 'legalName' | 'tradingName' | 'industry';
  sortDirection?: 'asc' | 'desc';
}

export interface OffsetPaginationResponse<T> {
  data: T[];
  pagination: {
    skip: number;
    take: number;
    total: number;
    hasMore: boolean;
  };
}
