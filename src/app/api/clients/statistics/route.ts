import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface StatisticsQueryParams {
  companyId?: string
  period?: string
  dateFrom?: string
  dateTo?: string
  status?: string
  industry?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params: StatisticsQueryParams = Object.fromEntries(searchParams.entries())

    const companyId = params.companyId ? parseInt(params.companyId) : undefined

    // Build base where clause
    const where: Prisma.ClientWhereInput = {}

    if (companyId) {
      where.companyId = companyId
    }

    // Status filtering
    if (params.status && params.status !== 'all') {
      where.status = params.status.toUpperCase() as any
    }

    // Industry filtering
    if (params.industry) {
      where.industry = params.industry
    }

    // Date filtering for client creation
    if (params.dateFrom || params.dateTo || params.period) {
      const dateFilter: Prisma.DateTimeFilter = {}

      if (params.period) {
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        switch (params.period) {
          case 'today':
            dateFilter.gte = startOfToday
            break
          case 'thisWeek':
            const startOfWeek = new Date(startOfToday)
            startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
            dateFilter.gte = startOfWeek
            break
          case 'thisMonth':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            dateFilter.gte = startOfMonth
            break
          case 'thisYear':
            const startOfYear = new Date(now.getFullYear(), 0, 1)
            dateFilter.gte = startOfYear
            break
          case 'lastMonth':
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
            dateFilter.gte = lastMonthStart
            dateFilter.lte = lastMonthEnd
            break
          case 'last3Months':
            const last3MonthsStart = new Date(now.getFullYear(), now.getMonth() - 3, 1)
            dateFilter.gte = last3MonthsStart
            break
          case 'last6Months':
            const last6MonthsStart = new Date(now.getFullYear(), now.getMonth() - 6, 1)
            dateFilter.gte = last6MonthsStart
            break
          case 'lastYear':
            const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
            const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)
            dateFilter.gte = lastYearStart
            dateFilter.lte = lastYearEnd
            break
        }
      }

      if (params.dateFrom) {
        dateFilter.gte = new Date(params.dateFrom)
      }

      if (params.dateTo) {
        dateFilter.lte = new Date(params.dateTo)
      }

      if (Object.keys(dateFilter).length > 0) {
        where.createdAt = dateFilter
      }
    }

    // Execute basic statistics queries that work with SQLite
    const [
      overallStats,
      statusBreakdown,
      industryBreakdown,
      topClients,
      recentClients
    ] = await Promise.all([
      // Overall client statistics
      prisma.client.aggregate({
        where,
        _count: true,
        _sum: {
          totalInvoiced: true,
          totalPaid: true,
        },
        _avg: {
          totalInvoiced: true,
        },
        _max: {
          totalInvoiced: true,
        },
        _min: {
          totalInvoiced: true,
        }
      }),

      // Status breakdown
      prisma.client.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: {
          totalInvoiced: true,
          totalPaid: true,
        },
        _avg: {
          totalInvoiced: true,
        }
      }),

      // Industry breakdown
      prisma.client.groupBy({
        by: ['industry'],
        where,
        _count: true,
        _sum: {
          totalInvoiced: true,
          totalPaid: true,
        },
        orderBy: {
          _count: {
            industry: 'desc'
          }
        },
        take: 10
      }),

      // Top clients by revenue
      prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          industry: true,
          totalInvoiced: true,
          totalPaid: true,
          lastInvoiceDate: true,
          _count: {
            select: {
              invoices: true
            }
          }
        },
        orderBy: {
          totalInvoiced: 'desc'
        },
        take: 10
      }),

      // Recent clients
      prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          industry: true,
          createdAt: true,
          status: true,
          totalInvoiced: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ])

    // Calculate derived metrics
    const totalClients = overallStats._count
    const totalRevenue = overallStats._sum.totalInvoiced || 0
    const totalPaid = overallStats._sum.totalPaid || 0
    const averageClientValue = overallStats._avg.totalInvoiced || 0

    // Status percentages
    const statusStats = statusBreakdown.reduce((acc, status) => {
      acc[status.status.toLowerCase()] = {
        count: status._count,
        totalInvoiced: status._sum.totalInvoiced || 0,
        totalPaid: status._sum.totalPaid || 0,
        avgInvoiced: status._avg.totalInvoiced || 0,
        percentage: totalClients > 0 ? (status._count / totalClients) * 100 : 0
      }
      return acc
    }, {} as Record<string, any>)

    // Calculate collection rate
    const collectionRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0

    return NextResponse.json({
      summary: {
        totalClients,
        totalRevenue,
        totalPaid,
        averageClientValue,
        largestClient: overallStats._max.totalInvoiced || 0,
        smallestClient: overallStats._min.totalInvoiced || 0,
        collectionRate,
        clientsWithInvoices: 0, // Simplified for now
        averageInvoiceValue: 0, // Simplified for now
        payingClients: 0, // Simplified for now
        averagePaymentDays: 0, // Simplified for now
      },
      
      statusBreakdown: statusStats,
      
      industryBreakdown: industryBreakdown.map(industry => ({
        industry: industry.industry,
        count: industry._count,
        totalInvoiced: industry._sum.totalInvoiced || 0,
        totalPaid: industry._sum.totalPaid || 0,
        percentage: totalClients > 0 ? (industry._count / totalClients) * 100 : 0
      })),

      invoiceAnalysis: {
        totalInvoices: 0, // Simplified for now
        averageInvoiceValue: 0, // Simplified for now
        totalPaid: totalPaid,
        totalOverdue: 0, // Simplified for now
        totalPending: 0, // Simplified for now
        paidPercentage: totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0
      },

      paymentAnalysis: {
        averagePaymentDays: 0, // Simplified for now
        fastestPaymentDays: 0, // Simplified for now
        slowestPaymentDays: 0, // Simplified for now
        payingClientsCount: 0 // Simplified for now
      },

      topClients: topClients.map(client => ({
        id: client.id,
        name: client.name,
        industry: client.industry,
        totalInvoiced: client.totalInvoiced,
        totalPaid: client.totalPaid,
        lastInvoiceDate: client.lastInvoiceDate,
        paymentRate: client.totalInvoiced > 0 ? (client.totalPaid / client.totalInvoiced) * 100 : 0,
        _count: client._count
      })),

      recentClients: recentClients.map(client => ({
        id: client.id,
        name: client.name,
        industry: client.industry,
        createdAt: client.createdAt.toISOString(),
        status: client.status,
        totalInvoiced: client.totalInvoiced
      })),

      trends: {
        monthly: [] // Simplified for now
      },

      insights: {
        topIndustry: industryBreakdown.length > 0 ? industryBreakdown[0].industry : null,
        mostValuableClient: topClients.length > 0 ? topClients[0].name : null,
        healthScore: Math.min(100, Math.max(0, collectionRate)),
        recommendations: []
      }
    })
  } catch (error) {
    console.error('Error fetching client statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client statistics' },
      { status: 500 }
    )
  }
}