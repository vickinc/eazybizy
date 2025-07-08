export interface SalesStatisticsParams {
  companyId?: number | 'all'
  period?: 'today' | 'week' | 'thisMonth' | 'lastMonth' | 'last6Months' | 'thisYear' | 'lastYear' | 'custom'
  dateFrom?: string
  dateTo?: string
}

export interface MonthlyRevenueTrend {
  month: string
  revenue: number
  monthName: string
}

export interface InvoiceStatusBreakdown {
  status: string
  count: number
  totalValue: number
  percentage: number
}

export interface TopClient {
  id: string
  name: string
  email: string
  totalInvoiced: number
  totalPaid: number
  status: string
  paymentRate: number
}

export interface RecentInvoice {
  id: string
  invoiceNumber: string
  clientName: string
  totalAmount: number
  currency: string
  status: string
  issueDate: string
  dueDate: string
  paidDate?: string
}

export interface SalesStatistics {
  summary: {
    totalRevenue: number
    activeClients: number
    totalClients: number
    activeProducts: number
    totalProducts: number
    pendingInvoices: number
    totalInvoices: number
    averageInvoiceValue: number
    conversionRate: number
    period: string
    dateRange?: {
      start: string
      end: string
    }
  }
  invoiceStatusBreakdown: InvoiceStatusBreakdown[]
  monthlyRevenueTrend: MonthlyRevenueTrend[]
  topClients: TopClient[]
  recentInvoices: RecentInvoice[]
  insights: {
    healthScore: number
    recommendations: string[]
  }
}

export class SalesApiService {
  private baseUrl = '/api/sales'

  async getStatistics(params?: SalesStatisticsParams): Promise<SalesStatistics> {
    const queryParams = new URLSearchParams()

    if (params?.companyId && params.companyId !== 'all') {
      queryParams.append('companyId', params.companyId.toString())
    }
    if (params?.period) {
      queryParams.append('period', params.period)
    }
    if (params?.dateFrom) {
      queryParams.append('dateFrom', params.dateFrom)
    }
    if (params?.dateTo) {
      queryParams.append('dateTo', params.dateTo)
    }

    const response = await fetch(`${this.baseUrl}/statistics?${queryParams}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch sales statistics: ${response.status}`)
    }
    return response.json()
  }

  // Convenience methods for specific periods
  async getTodayStatistics(companyId?: number): Promise<SalesStatistics> {
    return this.getStatistics({
      companyId: companyId || 'all',
      period: 'today'
    })
  }

  async getThisWeekStatistics(companyId?: number): Promise<SalesStatistics> {
    return this.getStatistics({
      companyId: companyId || 'all',
      period: 'week'
    })
  }

  async getThisMonthStatistics(companyId?: number): Promise<SalesStatistics> {
    return this.getStatistics({
      companyId: companyId || 'all',
      period: 'thisMonth'
    })
  }

  async getLastMonthStatistics(companyId?: number): Promise<SalesStatistics> {
    return this.getStatistics({
      companyId: companyId || 'all',
      period: 'lastMonth'
    })
  }

  async getThisYearStatistics(companyId?: number): Promise<SalesStatistics> {
    return this.getStatistics({
      companyId: companyId || 'all',
      period: 'thisYear'
    })
  }

  async getLastYearStatistics(companyId?: number): Promise<SalesStatistics> {
    return this.getStatistics({
      companyId: companyId || 'all',
      period: 'lastYear'
    })
  }

  async getCustomPeriodStatistics(
    companyId: number | 'all',
    dateFrom: string,
    dateTo: string
  ): Promise<SalesStatistics> {
    return this.getStatistics({
      companyId,
      period: 'custom',
      dateFrom,
      dateTo
    })
  }

  // Revenue trend analysis
  async getRevenueTrend(companyId?: number, months: number = 12): Promise<MonthlyRevenueTrend[]> {
    const stats = await this.getStatistics({
      companyId: companyId || 'all'
    })
    return stats.monthlyRevenueTrend.slice(-months)
  }

  // Top performers
  async getTopClients(companyId?: number, limit: number = 5): Promise<TopClient[]> {
    const stats = await this.getStatistics({
      companyId: companyId || 'all'
    })
    return stats.topClients.slice(0, limit)
  }

  // Recent activity
  async getRecentInvoices(companyId?: number, limit: number = 10): Promise<RecentInvoice[]> {
    const stats = await this.getStatistics({
      companyId: companyId || 'all'
    })
    return stats.recentInvoices.slice(0, limit)
  }

  // Performance metrics
  async getPerformanceMetrics(companyId?: number): Promise<{
    healthScore: number
    recommendations: string[]
    conversionRate: number
    averageInvoiceValue: number
  }> {
    const stats = await this.getStatistics({
      companyId: companyId || 'all'
    })
    
    return {
      healthScore: stats.insights.healthScore,
      recommendations: stats.insights.recommendations,
      conversionRate: stats.summary.conversionRate,
      averageInvoiceValue: stats.summary.averageInvoiceValue
    }
  }

  // Invoice analytics
  async getInvoiceAnalytics(companyId?: number): Promise<{
    statusBreakdown: InvoiceStatusBreakdown[]
    totalInvoices: number
    pendingInvoices: number
    averageValue: number
  }> {
    const stats = await this.getStatistics({
      companyId: companyId || 'all'
    })
    
    return {
      statusBreakdown: stats.invoiceStatusBreakdown,
      totalInvoices: stats.summary.totalInvoices,
      pendingInvoices: stats.summary.pendingInvoices,
      averageValue: stats.summary.averageInvoiceValue
    }
  }
}

export const salesApiService = new SalesApiService()