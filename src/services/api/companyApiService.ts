import { 
  Company, 
  CursorPaginationParams, 
  CursorPaginationResponse,
  OffsetPaginationParams,
  OffsetPaginationResponse 
} from '@/types/company.types'
import { CompanyFormData } from '@/services/business/companyValidationService'

export interface CompanyQueryParams {
  skip?: number
  take?: number
  searchTerm?: string
  statusFilter?: 'all' | 'Active' | 'Passive'
  industryFilter?: string
  sortField?: 'legalName' | 'tradingName' | 'industry' | 'createdAt'
  sortDirection?: 'asc' | 'desc'
}

export interface CompaniesResponse {
  data: Company[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    totalActive: number
    totalPassive: number
    byIndustry: Record<string, number>
    newThisMonth: number
  }
}

// Cursor pagination query params
export interface CompanyCursorQueryParams extends CursorPaginationParams {
  searchTerm?: string
  statusFilter?: 'all' | 'Active' | 'Passive'
  industryFilter?: string
  includeStats?: boolean
}

// Cursor pagination response with optional statistics
export interface CompanyCursorResponse extends CursorPaginationResponse<Company> {
  statistics?: {
    totalActive: number
    totalPassive: number
    byIndustry: Record<string, number>
    newThisMonth: number
  }
}

export class CompanyApiService {
  private baseUrl = '/api/companies'

  // Cursor-based pagination (recommended for large datasets)
  async getCompaniesCursor(params: CompanyCursorQueryParams = {}): Promise<CompanyCursorResponse> {
    const searchParams = new URLSearchParams()
    
    // Add cursor pagination
    if (params.cursor) searchParams.set('cursor', params.cursor)
    if (params.take !== undefined) searchParams.set('take', params.take.toString())
    
    // Add filters
    if (params.searchTerm) searchParams.set('search', params.searchTerm)
    if (params.statusFilter && params.statusFilter !== 'all') {
      searchParams.set('status', params.statusFilter)
    }
    if (params.industryFilter) searchParams.set('industry', params.industryFilter)
    
    // Add sorting
    if (params.sortField) searchParams.set('sortField', params.sortField)
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)
    
    // Statistics flag (only include when needed to reduce load)
    if (params.includeStats) searchParams.set('includeStats', 'true')

    const response = await fetch(`${this.baseUrl}/cursor?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch companies')
    }
    
    return response.json()
  }

  // Legacy offset-based pagination (deprecated for large datasets)
  async getCompanies(params: CompanyQueryParams & { bustCache?: boolean } = {}): Promise<CompaniesResponse> {
    const searchParams = new URLSearchParams()
    
    // Add pagination
    if (params.skip !== undefined) searchParams.set('skip', params.skip.toString())
    if (params.take !== undefined) searchParams.set('take', params.take.toString())
    
    // Add filters
    if (params.searchTerm) searchParams.set('search', params.searchTerm)
    if (params.statusFilter && params.statusFilter !== 'all') {
      searchParams.set('status', params.statusFilter)
    }
    if (params.industryFilter) searchParams.set('industry', params.industryFilter)
    
    // Add sorting
    if (params.sortField) searchParams.set('sortField', params.sortField)
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)
    
    // Add cache busting
    if (params.bustCache) searchParams.set('bustCache', 'true')

    const response = await fetch(`${this.baseUrl}/fast?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch companies')
    }
    
    return response.json()
  }

  // Cache-busted version for post-mutation refreshes
  async getCompaniesFresh(params: CompanyQueryParams = {}): Promise<CompaniesResponse> {
    return this.getCompanies({ ...params, bustCache: true })
  }

  async getCompany(id: string): Promise<Company> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Company not found')
      }
      throw new Error('Failed to fetch company')
    }
    
    return response.json()
  }

  async createCompany(data: CompanyFormData & { 
    logo?: string
  }): Promise<Company> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to create company')
    }

    return response.json()
  }

  async updateCompany(id: string, data: Partial<CompanyFormData> & { 
    logo?: string
  }): Promise<Company> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to update company')
    }

    return response.json()
  }

  async deleteCompany(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to delete company')
    }
  }

  async uploadLogo(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('logo', file)

    const response = await fetch(`${this.baseUrl}/upload-logo`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to upload logo')
    }

    const result = await response.json()
    return result.logoUrl
  }

  async getStatistics(): Promise<CompaniesResponse['statistics']> {
    const response = await fetch(`${this.baseUrl}/statistics`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch company statistics')
    }
    
    return response.json()
  }

  async bulkUpdateStatus(ids: string[], status: 'Active' | 'Passive'): Promise<Company[]> {
    const response = await fetch(`${this.baseUrl}/bulk-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids, status }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to update company statuses')
    }

    const result = await response.json()
    return result.updated || result
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/bulk-delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to delete companies')
    }
  }

  // Lazy loading for individual company counts (replaces expensive _count includes)
  async getCompanyCounts(id: string): Promise<{
    clients: number;
    invoices: number;
    products: number;
  }> {
    const response = await fetch(`${this.baseUrl}/${id}/counts`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Company not found')
      }
      throw new Error('Failed to fetch company counts')
    }
    
    const result = await response.json()
    return result.counts
  }

  // Batch fetch counts for multiple companies
  async getBatchCompanyCounts(ids: string[]): Promise<Record<string, {
    clients: number;
    invoices: number;
    products: number;
  }>> {
    // For now, fetch individually - could be optimized with a batch endpoint
    const results = await Promise.allSettled(
      ids.map(async (id) => {
        try {
          const counts = await this.getCompanyCounts(id)
          return { id, counts }
        } catch (error) {
          console.warn(`Failed to fetch counts for company ${id}:`, error)
          return { id, counts: { clients: 0, invoices: 0, products: 0 } }
        }
      })
    )

    return results.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        acc[result.value.id] = result.value.counts
      }
      return acc
    }, {} as Record<string, { clients: number; invoices: number; products: number }>)
  }
}

// Export singleton instance
export const companyApiService = new CompanyApiService()