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
  createdAt?: Date;
  updatedAt?: Date;
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
