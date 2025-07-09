import { Invoice, InvoiceFormData, InvoiceFilters } from '@/types/invoice.types'

export interface InvoicesResponse {
  data: Invoice[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    total: number
    totalValue: number
    statusStats: Record<string, { count: number; value: number }>
  }
}

export interface InvoiceQueryParams extends InvoiceFilters {
  skip?: number
  take?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export class InvoiceApiService {
  private baseUrl = '/api/invoices'

  async getInvoices(params: InvoiceQueryParams = {}): Promise<InvoicesResponse> {
    const searchParams = new URLSearchParams()
    
    // Add pagination
    if (params.skip !== undefined) searchParams.set('skip', params.skip.toString())
    if (params.take !== undefined) searchParams.set('take', params.take.toString())
    
    // Add filters
    if (params.searchTerm) searchParams.set('search', params.searchTerm)
    if (params.statusFilter && params.statusFilter !== 'all') {
      searchParams.set('status', params.statusFilter)
    }
    if (params.companyFilter && params.companyFilter !== 'all') {
      searchParams.set('company', params.companyFilter.toString())
    }
    if (params.clientFilter) searchParams.set('client', params.clientFilter)
    if (params.dateRangeFilter && params.dateRangeFilter !== 'all') {
      searchParams.set('dateRange', params.dateRangeFilter)
    }
    if (params.currencyFilter) searchParams.set('currency', params.currencyFilter)
    
    // Add sorting
    if (params.sortField) searchParams.set('sortField', params.sortField)
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch invoices')
    }
    
    return response.json()
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Invoice not found')
      }
      throw new Error('Failed to fetch invoice')
    }
    
    return response.json()
  }

  async createInvoice(data: InvoiceFormData & { 
    items: unknown[]
    subtotal: number
    taxAmount: number
    totalAmount: number
  }): Promise<Invoice> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create invoice')
    }
    
    return response.json()
  }

  async updateInvoice(id: string, data: Partial<InvoiceFormData & { 
    items: unknown[]
    subtotal: number
    taxAmount: number
    totalAmount: number
  }>): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Invoice not found')
      }
      throw new Error('Failed to update invoice')
    }
    
    return response.json()
  }

  async deleteInvoice(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Invoice not found')
      }
      throw new Error('Failed to delete invoice')
    }
  }

  async bulkUpdateStatus(ids: string[], status: string): Promise<Invoice[]> {
    const updatePromises = ids.map(id => 
      this.updateInvoice(id, { status } as any)
    )
    
    return Promise.all(updatePromises)
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const deletePromises = ids.map(id => this.deleteInvoice(id))
    await Promise.all(deletePromises)
  }
}

// Export singleton instance
export const invoiceApiService = new InvoiceApiService()