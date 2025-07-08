import { Product } from '@/types/product.types'

export interface ProductsResponse {
  data: Product[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    total: number
    averagePrice: number
    averageCost: number
    totalValue: number
    activeStats: Record<string, number>
  }
}

export interface ProductQueryParams {
  skip?: number
  take?: number
  search?: string
  isActive?: boolean
  company?: number | 'all'
  currency?: string
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export interface ProductFormData {
  name: string
  description: string
  price: number
  currency: string
  cost?: number
  costCurrency: string
  vendorId?: string | null
  isActive?: boolean
  companyId?: number
}

export class ProductApiService {
  private baseUrl = '/api/products'

  async getProducts(params: ProductQueryParams = {}): Promise<ProductsResponse> {
    const searchParams = new URLSearchParams()
    
    // Add pagination
    if (params.skip !== undefined) searchParams.set('skip', params.skip.toString())
    if (params.take !== undefined) searchParams.set('take', params.take.toString())
    
    // Add filters
    if (params.search) searchParams.set('search', params.search)
    if (params.isActive !== undefined) searchParams.set('isActive', params.isActive.toString())
    if (params.company && params.company !== 'all') {
      searchParams.set('company', params.company.toString())
    }
    if (params.currency) searchParams.set('currency', params.currency)
    
    // Add sorting
    if (params.sortField) searchParams.set('sortField', params.sortField)
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }
    
    return response.json()
  }

  async getProduct(id: string): Promise<Product> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Product not found')
      }
      throw new Error('Failed to fetch product')
    }
    
    return response.json()
  }

  async createProduct(data: ProductFormData): Promise<Product> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create product')
    }
    
    return response.json()
  }

  async updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Product not found')
      }
      throw new Error('Failed to update product')
    }
    
    return response.json()
  }

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Product not found')
      }
      if (response.status === 400) {
        const errorData = await response.json()
        // Create a comprehensive error object that includes all details
        const error = new Error(errorData.error || 'Cannot delete product')
        // Add additional properties to the error object
        Object.assign(error, {
          details: errorData.details,
          suggestion: errorData.suggestion,
          invoiceItemsCount: errorData.invoiceItemsCount
        })
        throw error
      }
      throw new Error('Failed to delete product')
    }
  }

  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<Product[]> {
    const updatePromises = ids.map(id => 
      this.updateProduct(id, { isActive })
    )
    
    return Promise.all(updatePromises)
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const deletePromises = ids.map(id => this.deleteProduct(id))
    await Promise.all(deletePromises)
  }

  async searchProducts(query: string, limit = 10): Promise<Product[]> {
    const params = {
      search: query,
      take: limit,
    }
    
    const response = await this.getProducts(params)
    return response.data
  }

  async getActiveProducts(companyId?: number): Promise<Product[]> {
    const params = {
      isActive: true,
      company: companyId || 'all',
      take: 1000, // Get all active products
    }
    
    const response = await this.getProducts(params)
    return response.data
  }
}

// Export singleton instance
export const productApiService = new ProductApiService()