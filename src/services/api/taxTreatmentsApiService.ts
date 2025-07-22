import { TaxTreatment, TaxTreatmentFormData, TaxCategory, TaxApplicability } from '@/types/taxTreatment.types'

export interface TaxTreatmentsResponse {
  data: TaxTreatment[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    total: number
    averageRate: number
    categoryStats: Record<string, number>
    activeStats: Record<string, number>
  }
}

export interface TaxTreatmentsQueryParams {
  skip?: number
  take?: number
  search?: string
  category?: TaxCategory | string
  isActive?: boolean | string
  applicability?: TaxApplicability | string
  company?: number | 'all'
  minRate?: number
  maxRate?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export class TaxTreatmentsApiService {
  private baseUrl = '/api/tax-treatments'

  async getTaxTreatments(params: TaxTreatmentsQueryParams = {}): Promise<TaxTreatmentsResponse> {
    const searchParams = new URLSearchParams()
    
    // Add pagination
    if (params.skip !== undefined) searchParams.set('skip', params.skip.toString())
    if (params.take !== undefined) searchParams.set('take', params.take.toString())
    
    // Add filters
    if (params.search) searchParams.set('search', params.search)
    if (params.category && params.category !== 'all') searchParams.set('category', params.category)
    if (params.isActive !== undefined && params.isActive !== 'all') {
      searchParams.set('isActive', params.isActive.toString())
    }
    if (params.applicability && params.applicability !== 'all') {
      searchParams.set('applicability', params.applicability)
    }
    if (params.company && params.company !== 'all') {
      searchParams.set('company', params.company.toString())
    }
    if (params.minRate !== undefined) searchParams.set('minRate', params.minRate.toString())
    if (params.maxRate !== undefined) searchParams.set('maxRate', params.maxRate.toString())
    
    // Add sorting
    if (params.sortField) searchParams.set('sortField', params.sortField)
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch tax treatments')
    }
    
    return response.json()
  }

  async getTaxTreatment(id: string): Promise<TaxTreatment> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Tax treatment not found')
      }
      throw new Error('Failed to fetch tax treatment')
    }
    
    return response.json()
  }

  async createTaxTreatment(data: TaxTreatmentFormData & { companyId?: number; isDefault?: boolean }): Promise<TaxTreatment> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        rate: parseFloat(data.rate), // Convert string rate to number
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to create tax treatment')
    }
    
    return response.json()
  }

  async updateTaxTreatment(id: string, data: Partial<TaxTreatmentFormData>): Promise<TaxTreatment> {
    const updateData = { ...data }
    if (updateData.rate) {
      updateData.rate = parseFloat(updateData.rate as string).toString() // Ensure it's a string for the API
    }

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to update tax treatment')
    }
    
    return response.json()
  }

  async deleteTaxTreatment(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to delete tax treatment')
    }
  }

  // Utility method for bulk operations (optional)
  async bulkCreateTaxTreatments(treatments: (TaxTreatmentFormData & { companyId?: number; isDefault?: boolean })[]): Promise<TaxTreatment[]> {
    const promises = treatments.map(treatment => this.createTaxTreatment(treatment))
    return Promise.all(promises)
  }

  // Utility method to get treatments by category
  async getTreatmentsByCategory(category: TaxCategory, companyId?: number): Promise<TaxTreatment[]> {
    const params: TaxTreatmentsQueryParams = {
      category,
      take: 1000, // Large number to get all treatments of this category
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getTaxTreatments(params)
    return response.data
  }

  // Utility method to get treatments by applicability
  async getTreatmentsByApplicability(applicability: TaxApplicability, companyId?: number): Promise<TaxTreatment[]> {
    const params: TaxTreatmentsQueryParams = {
      applicability,
      take: 1000, // Large number to get all treatments with this applicability
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getTaxTreatments(params)
    return response.data
  }

  // Utility method to search treatments
  async searchTreatments(searchTerm: string, companyId?: number): Promise<TaxTreatment[]> {
    const params: TaxTreatmentsQueryParams = {
      search: searchTerm,
      take: 100, // Reasonable limit for search results
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getTaxTreatments(params)
    return response.data
  }

  // Utility method to check if treatment code is unique
  async isTreatmentCodeUnique(code: string, excludeId?: string): Promise<boolean> {
    try {
      const response = await this.getTaxTreatments({ search: code, take: 1 })
      const exactMatch = response.data.find(treatment => 
        treatment.code === code && treatment.id !== excludeId
      )
      return !exactMatch
    } catch (error) {
      console.error('Error checking treatment code uniqueness:', error)
      return false
    }
  }

  // Utility method to get active treatments only
  async getActiveTreatments(companyId?: number): Promise<TaxTreatment[]> {
    const params: TaxTreatmentsQueryParams = {
      isActive: true,
      take: 1000, // Large number to get all active treatments
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getTaxTreatments(params)
    return response.data
  }

  // Utility method to get default treatments
  async getDefaultTreatments(): Promise<TaxTreatment[]> {
    const response = await this.getTaxTreatments({ take: 1000 })
    return response.data.filter(treatment => treatment.isDefault)
  }

  // Utility method to get treatments by rate range
  async getTreatmentsByRateRange(minRate: number, maxRate: number, companyId?: number): Promise<TaxTreatment[]> {
    const params: TaxTreatmentsQueryParams = {
      minRate,
      maxRate,
      take: 1000, // Large number to get all treatments in this range
    }
    
    if (companyId) {
      params.company = companyId
    }
    
    const response = await this.getTaxTreatments(params)
    return response.data
  }
}