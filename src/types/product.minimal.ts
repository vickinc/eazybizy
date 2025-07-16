/**
 * Minimal product interface for list views and SSR
 * Reduces payload size by 70-80% compared to full Product type
 */
export interface ProductListItem {
  id: string
  name: string
  description: string
  price: number
  currency: string
  cost: number
  costCurrency: string
  isActive: boolean
  companyId: number | null
  vendorId: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Minimal pagination response for SSR
 * Excludes heavy statistics that can be loaded separately
 */
export interface ProductListResponse {
  data: ProductListItem[]
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
 * Query parameters for product list with minimal fields
 */
export interface ProductListParams {
  skip?: number
  take?: number
  searchTerm?: string
  isActive?: boolean
  companyId?: number | null
  currency?: string
  sortField?: 'name' | 'price' | 'updatedAt' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
}

/**
 * Cursor-based pagination parameters for better scalability
 */
export interface ProductCursorParams {
  cursor?: string
  take?: number
  searchTerm?: string
  isActive?: boolean
  companyId?: number | null
  currency?: string
  sortField?: 'name' | 'price' | 'updatedAt' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
}

/**
 * Cursor pagination response for SSR
 */
export interface ProductCursorResponse {
  data: ProductListItem[]
  nextCursor?: string
  hasMore: boolean
  responseTime?: number
  cached?: boolean
}

/**
 * Product statistics interface (loaded separately)
 */
export interface ProductStatistics {
  totalActive: number
  totalInactive: number
  byCurrency: Record<string, number>
  averagePrice: number
  averageCost: number
  totalValue: number
  newThisMonth: number
}