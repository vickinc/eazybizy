/**
 * Minimal company interface for list views and SSR
 * Reduces payload size by 70-80% compared to full Company type
 */
export interface CompanyListItem {
  id: number
  legalName: string
  tradingName: string | null
  status: 'Active' | 'Passive' | 'Archived'
  industry: string
  logo: string | null
  registrationNo: string | null
  email: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Minimal pagination response for SSR
 * Excludes heavy statistics that can be loaded separately
 */
export interface CompanyListResponse {
  data: CompanyListItem[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  responseTime?: number
  cached?: boolean
}

/**
 * Query parameters for company list with minimal fields
 */
export interface CompanyListParams {
  skip?: number
  take?: number
  searchTerm?: string
  statusFilter?: 'all' | 'Active' | 'Passive'
  industryFilter?: string
  sortField?: 'legalName' | 'tradingName' | 'industry' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
}

/**
 * Cursor-based pagination parameters for better scalability
 */
export interface CompanyCursorParams {
  cursor?: string
  take?: number
  searchTerm?: string
  statusFilter?: 'all' | 'Active' | 'Passive'
  industryFilter?: string
  sortField?: 'legalName' | 'tradingName' | 'industry' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
}

/**
 * Cursor pagination response for SSR
 */
export interface CompanyCursorResponse {
  data: CompanyListItem[]
  nextCursor?: string
  hasMore: boolean
  responseTime?: number
  cached?: boolean
}

/**
 * Company statistics interface (loaded separately)
 */
export interface CompanyStatistics {
  totalActive: number
  totalPassive: number
  byIndustry: Record<string, number>
  newThisMonth: number
}