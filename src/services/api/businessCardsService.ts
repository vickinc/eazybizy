import { BusinessCard } from '@/types/businessCards.types';

// API Response Types
export interface BusinessCardResponse {
  id: string;
  companyId: number;
  personName: string;
  position: string;
  personEmail: string;
  personPhone: string;
  qrType: string;
  qrValue: string;
  template: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  company: {
    id: number;
    legalName: string;
    tradingName: string;
    email: string;
    website: string;
    phone: string;
    logo: string;
  };
}

export interface BusinessCardsPaginatedResponse {
  businessCards: BusinessCardResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BusinessCardsCursorResponse {
  businessCards: BusinessCardResponse[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
    count: number;
  };
}

export interface BusinessCardsStatisticsResponse {
  totalCards: number;
  activeCards: number;
  archivedCards: number;
  recentCards: number;
  cardsByTemplate: Array<{ template: string; count: number }>;
  cardsByQRType: Array<{ qrType: string; count: number }>;
  topCompanies: Array<{ companyId: number; companyName: string; count: number }>;
  lastUpdated: string;
}

export interface BusinessCardFilters {
  companyId?: string;
  isArchived?: boolean;
  template?: string;
  search?: string;
}

export interface BusinessCardCreateRequest {
  companyId: number;
  personName?: string;
  position?: string;
  personEmail?: string;
  personPhone?: string;
  qrType?: string;
  template?: string;
}

export interface BusinessCardUpdateRequest {
  personName?: string;
  position?: string;
  personEmail?: string;
  personPhone?: string;
  qrType?: string;
  template?: string;
  isArchived?: boolean;
}

export class BusinessCardsService {
  private baseUrl = '/api/business-cards';

  // Transform API response to client format
  private transformBusinessCardResponse(card: BusinessCardResponse): BusinessCard {
    return {
      id: card.id,
      companyId: card.companyId,
      company: card.company,
      personName: card.personName,
      position: card.position,
      personEmail: card.personEmail,
      personPhone: card.personPhone,
      qrType: card.qrType.toLowerCase() as BusinessCard['qrType'],
      qrValue: card.qrValue,
      template: card.template.toLowerCase() as BusinessCard['template'],
      isArchived: card.isArchived,
      createdAt: new Date(card.createdAt)
    };
  }

  // Business Cards API
  async getBusinessCards(
    page: number = 1,
    limit: number = 50,
    filters: BusinessCardFilters = {}
  ): Promise<{ businessCards: BusinessCard[]; pagination: BusinessCardsPaginatedResponse['pagination'] }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch business cards: ${response.statusText}`);
    }

    const data: BusinessCardsPaginatedResponse = await response.json();
    return {
      businessCards: data.businessCards.map(card => this.transformBusinessCardResponse(card)),
      pagination: data.pagination
    };
  }

  async getBusinessCardsWithCursor(
    cursor?: string,
    limit: number = 20,
    sortDirection: 'asc' | 'desc' = 'desc',
    filters: BusinessCardFilters = {}
  ): Promise<{ businessCards: BusinessCard[]; pagination: BusinessCardsCursorResponse['pagination'] }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sortDirection,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    if (cursor) {
      params.set('cursor', cursor);
    }

    const response = await fetch(`${this.baseUrl}/cursor?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch business cards with cursor: ${response.statusText}`);
    }

    const data: BusinessCardsCursorResponse = await response.json();
    return {
      businessCards: data.businessCards.map(card => this.transformBusinessCardResponse(card)),
      pagination: data.pagination
    };
  }

  async getBusinessCard(id: string): Promise<BusinessCard> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch business card: ${response.statusText}`);
    }

    const card: BusinessCardResponse = await response.json();
    return this.transformBusinessCardResponse(card);
  }

  async createBusinessCard(cardData: BusinessCardCreateRequest): Promise<BusinessCard> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create business card: ${response.statusText}`);
    }

    const card: BusinessCardResponse = await response.json();
    return this.transformBusinessCardResponse(card);
  }

  async updateBusinessCard(id: string, cardData: BusinessCardUpdateRequest): Promise<BusinessCard> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update business card: ${response.statusText}`);
    }

    const card: BusinessCardResponse = await response.json();
    return this.transformBusinessCardResponse(card);
  }

  async deleteBusinessCard(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete business card: ${response.statusText}`);
    }
  }

  async archiveBusinessCard(id: string): Promise<BusinessCard> {
    return this.updateBusinessCard(id, { isArchived: true });
  }

  async unarchiveBusinessCard(id: string): Promise<BusinessCard> {
    return this.updateBusinessCard(id, { isArchived: false });
  }

  // Business Cards Statistics
  async getStatistics(companyId?: string): Promise<BusinessCardsStatisticsResponse> {
    const params = new URLSearchParams();
    if (companyId && companyId !== 'all') {
      params.set('companyId', companyId);
    }

    const response = await fetch(`${this.baseUrl}/statistics?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }

    return response.json();
  }
}