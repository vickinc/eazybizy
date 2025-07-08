import { Client, ClientFormData, ClientFilters } from '@/types/client.types'

export interface ClientsResponse {
  data: Client[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  statistics: {
    total: number
    totalRevenue: number
    totalPaid: number
    statusStats: Record<string, number>
  }
}

export interface ClientQueryParams extends ClientFilters {
  skip?: number
  take?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export class ClientApiService {
  private baseUrl = '/api/clients'

  async getClients(params: ClientQueryParams = {}): Promise<ClientsResponse> {
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
    if (params.companyFilter && params.companyFilter !== 'all') {
      searchParams.set('company', params.companyFilter.toString())
    }
    
    // Add sorting
    if (params.sortField) searchParams.set('sortField', params.sortField)
    if (params.sortDirection) searchParams.set('sortDirection', params.sortDirection)

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch clients')
    }
    
    return response.json()
  }

  async getClient(id: string): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Client not found')
      }
      throw new Error('Failed to fetch client')
    }
    
    return response.json()
  }

  async createClient(data: ClientFormData): Promise<Client> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create client')
    }
    
    return response.json()
  }

  async updateClient(id: string, data: Partial<ClientFormData>): Promise<Client> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Client not found')
      }
      throw new Error('Failed to update client')
    }
    
    return response.json()
  }

  async deleteClient(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Client not found')
      }
      if (response.status === 400) {
        const error = await response.json()
        throw new Error(error.error || 'Cannot delete client')
      }
      throw new Error('Failed to delete client')
    }
  }

  async bulkUpdateStatus(ids: string[], status: string): Promise<Client[]> {
    const updatePromises = ids.map(id => 
      this.updateClient(id, { status } as any)
    )
    
    return Promise.all(updatePromises)
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const deletePromises = ids.map(id => this.deleteClient(id))
    await Promise.all(deletePromises)
  }

  async searchClients(query: string, limit = 10): Promise<Client[]> {
    const params = {
      searchTerm: query,
      take: limit,
    }
    
    const response = await this.getClients(params)
    return response.data
  }
}

// Export singleton instance
export const clientApiService = new ClientApiService()