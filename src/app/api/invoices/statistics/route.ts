import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface StatisticsQueryParams {
  companyId?: string
  period?: string
  dateFrom?: string
  dateTo?: string
  currency?: string
  clientId?: string
  status?: string
  groupBy?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params: StatisticsQueryParams = Object.fromEntries(searchParams.entries())

    const companyId = params.companyId ? parseInt(params.companyId) : undefined

    // Build base where clause
    const where: Prisma.InvoiceWhereInput = {}

    if (companyId) {
      where.fromCompanyId = companyId
    }

    // Client filtering
    if (params.clientId) {
      where.clientId = params.clientId
    }

    // Status filtering
    if (params.status && params.status !== 'all') {
      where.status = params.status.toUpperCase() as any
    }

    // Currency filtering
    if (params.currency) {
      where.currency = params.currency
    }

    // Date filtering
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
            dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'lastMonth':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
            dateFilter.gte = lastMonth
            dateFilter.lte = endOfLastMonth
            break
          case 'thisQuarter':
            const currentQuarter = Math.floor(now.getMonth() / 3)
            dateFilter.gte = new Date(now.getFullYear(), currentQuarter * 3, 1)
            break
          case 'thisYear':
            dateFilter.gte = new Date(now.getFullYear(), 0, 1)
            break
          case 'lastYear':
            dateFilter.gte = new Date(now.getFullYear() - 1, 0, 1)
            dateFilter.lte = new Date(now.getFullYear() - 1, 11, 31)
            break
        }
      } else {
        if (params.dateFrom) {
          dateFilter.gte = new Date(params.dateFrom)
        }
        if (params.dateTo) {
          dateFilter.lte = new Date(params.dateTo)
        }
      }

      if (Object.keys(dateFilter).length > 0) {
        where.issueDate = dateFilter
      }
    }

    // Execute parallel queries for comprehensive statistics
    const [
      overallStats,
      statusBreakdown,
      currencyBreakdown,
      clientBreakdown,
      monthlyTrends,
      overdueAnalysis,
      paymentAnalysis,
      averageStats
    ] = await Promise.all([
      // Overall aggregation
      prisma.invoice.aggregate({
        where,
        _sum: {
          totalAmount: true,
          subtotal: true,
          taxAmount: true,
        },
        _avg: {
          totalAmount: true,
        },
        _count: true,
        _max: {
          totalAmount: true,
          issueDate: true,
        },
        _min: {
          totalAmount: true,
          issueDate: true,
        }
      }),

      // Status breakdown
      prisma.invoice.groupBy({
        by: ['status'],
        where,
        _sum: {
          totalAmount: true,
        },
        _count: true,
        _avg: {
          totalAmount: true,
        }
      }),

      // Currency breakdown
      prisma.invoice.groupBy({
        by: ['currency'],
        where,
        _sum: {
          totalAmount: true,
          subtotal: true,
          taxAmount: true,
        },
        _count: true,
        orderBy: {
          _count: {
            currency: 'desc'
          }
        }
      }),

      // Client breakdown (top 10)
      prisma.invoice.groupBy({
        by: ['clientId', 'clientName'],
        where: {
          ...where,
          clientId: { not: null }
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
        orderBy: {
          _sum: {
            totalAmount: 'desc'
          }
        },
        take: 10
      }),

      // Monthly trends (last 12 months) - SQLite compatible
      prisma.$queryRaw`
        SELECT 
          DATE(issueDate, 'start of month') as month,
          status,
          COUNT(*) as invoice_count,
          SUM(totalAmount) as total_amount,
          AVG(totalAmount) as avg_amount,
          SUM(CASE WHEN status = 'PAID' THEN totalAmount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN status = 'OVERDUE' THEN totalAmount ELSE 0 END) as overdue_amount
        FROM invoices 
        WHERE issueDate >= DATE('now', '-12 months')
          ${companyId ? Prisma.sql`AND fromCompanyId = ${companyId}` : Prisma.empty}
          ${params.currency ? Prisma.sql`AND currency = ${params.currency}` : Prisma.empty}
        GROUP BY DATE(issueDate, 'start of month'), status
        ORDER BY month DESC, status
      `,

      // Overdue analysis
      prisma.invoice.aggregate({
        where: {
          ...where,
          status: 'OVERDUE'
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
        _avg: {
          totalAmount: true,
        }
      }),

      // Payment analysis (paid invoices) - SQLite compatible
      prisma.$queryRaw`
        SELECT 
          AVG(JULIANDAY(paidDate) - JULIANDAY(issueDate)) as avg_payment_days,
          MIN(JULIANDAY(paidDate) - JULIANDAY(issueDate)) as fastest_payment_days,
          MAX(JULIANDAY(paidDate) - JULIANDAY(issueDate)) as slowest_payment_days,
          COUNT(*) as paid_count
        FROM invoices 
        WHERE status = 'PAID' 
          AND paidDate IS NOT NULL 
          AND issueDate IS NOT NULL
          ${companyId ? Prisma.sql`AND fromCompanyId = ${companyId}` : Prisma.empty}
      `,

      // Calculate additional average statistics - SQLite compatible
      prisma.$queryRaw`
        SELECT 
          AVG(JULIANDAY(dueDate) - JULIANDAY(issueDate)) as avg_payment_terms,
          COUNT(DISTINCT clientId) as unique_clients,
          COUNT(DISTINCT currency) as currencies_used
        FROM invoices 
        WHERE 1=1
          ${companyId ? Prisma.sql`AND fromCompanyId = ${companyId}` : Prisma.empty}
      `
    ])

    // Calculate derived metrics - convert BigInt to Number
    const totalInvoices = Number(overallStats._count)
    const totalValue = Number(overallStats._sum.totalAmount || 0)
    const averageInvoiceValue = Number(overallStats._avg.totalAmount || 0)

    // Status percentages - convert BigInt to Number
    const statusStats = statusBreakdown.reduce((acc, status) => {
      acc[status.status.toLowerCase()] = {
        count: Number(status._count),
        value: Number(status._sum.totalAmount || 0),
        avgValue: Number(status._avg.totalAmount || 0),
        percentage: totalInvoices > 0 ? (Number(status._count) / totalInvoices) * 100 : 0
      }
      return acc
    }, {} as Record<string, any>)

    // Payment performance metrics - convert BigInt to Number
    const paymentMetrics = Array.isArray(paymentAnalysis) && paymentAnalysis[0] ? {
      avg_payment_days: Number(paymentAnalysis[0].avg_payment_days || 0),
      fastest_payment_days: Number(paymentAnalysis[0].fastest_payment_days || 0),
      slowest_payment_days: Number(paymentAnalysis[0].slowest_payment_days || 0),
      paid_count: Number(paymentAnalysis[0].paid_count || 0)
    } : {
      avg_payment_days: 0,
      fastest_payment_days: 0,
      slowest_payment_days: 0,
      paid_count: 0
    }

    const additionalMetrics = Array.isArray(averageStats) && averageStats[0] ? {
      avg_payment_terms: Number(averageStats[0].avg_payment_terms || 30),
      unique_clients: Number(averageStats[0].unique_clients || 0),
      currencies_used: Number(averageStats[0].currencies_used || 1)
    } : {
      avg_payment_terms: 30,
      unique_clients: 0,
      currencies_used: 1
    }

    // Collection rate calculation - convert BigInt to Number
    const paidValue = statusStats.paid?.value || 0
    const overdueValue = Number(overdueAnalysis._sum.totalAmount || 0)
    const collectionRate = totalValue > 0 ? (paidValue / (paidValue + overdueValue)) * 100 : 0

    return NextResponse.json({
      summary: {
        totalInvoices,
        totalValue,
        averageInvoiceValue,
        largestInvoice: Number(overallStats._max.totalAmount || 0),
        smallestInvoice: Number(overallStats._min.totalAmount || 0),
        totalTax: Number(overallStats._sum.taxAmount || 0),
        totalSubtotal: Number(overallStats._sum.subtotal || 0),
        uniqueClients: additionalMetrics.unique_clients,
        currenciesUsed: additionalMetrics.currencies_used,
        collectionRate,
        averagePaymentTerms: additionalMetrics.avg_payment_terms,
      },
      
      statusBreakdown: statusStats,
      
      currencyBreakdown,
      
      clientBreakdown: clientBreakdown.map(client => ({
        clientId: client.clientId,
        clientName: client.clientName,
        totalValue: Number(client._sum.totalAmount || 0),
        invoiceCount: Number(client._count),
        averageValue: Number(client._sum.totalAmount || 0) / Number(client._count)
      })),
      
      overdueAnalysis: {
        count: Number(overdueAnalysis._count),
        totalValue: Number(overdueAnalysis._sum.totalAmount || 0),
        averageValue: Number(overdueAnalysis._avg.totalAmount || 0),
        percentage: totalInvoices > 0 ? (Number(overdueAnalysis._count) / totalInvoices) * 100 : 0
      },
      
      paymentAnalysis: {
        averagePaymentDays: paymentMetrics.avg_payment_days || 0,
        fastestPaymentDays: paymentMetrics.fastest_payment_days || 0,
        slowestPaymentDays: paymentMetrics.slowest_payment_days || 0,
        paidInvoicesCount: paymentMetrics.paid_count || 0
      },
      
      trends: {
        monthly: monthlyTrends
      },
      
      insights: {
        mostValuableClient: clientBreakdown[0]?.clientName || null,
        primaryCurrency: currencyBreakdown[0]?.currency || null,
        healthScore: calculateHealthScore(statusStats, collectionRate, overdueAnalysis._count, totalInvoices),
        recommendations: generateRecommendations(statusStats, collectionRate, paymentMetrics)
      }
    })

  } catch (error) {
    console.error('Error fetching invoice statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice statistics' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateWhereClause(where: any): string {
  // This would need to be implemented based on the where clause structure
  // For now, returning a simple clause
  return '1=1'
}

function calculateHealthScore(statusStats: any, collectionRate: number, overdueCount: number, totalInvoices: number): number {
  const paidPercentage = statusStats.paid?.percentage || 0
  const overduePercentage = overdueCount > 0 ? (overdueCount / totalInvoices) * 100 : 0
  
  let score = 100
  score -= overduePercentage * 2 // Heavy penalty for overdue invoices
  score += (paidPercentage - 50) * 0.5 // Bonus for high paid percentage
  score += (collectionRate - 80) * 0.3 // Bonus for good collection rate
  
  return Math.max(0, Math.min(100, score))
}

function generateRecommendations(statusStats: any, collectionRate: number, paymentMetrics: any): string[] {
  const recommendations = []
  
  if (collectionRate < 80) {
    recommendations.push('Improve collection processes - collection rate is below 80%')
  }
  
  if (statusStats.overdue?.percentage > 15) {
    recommendations.push('Reduce overdue invoices - currently over 15% of total invoices')
  }
  
  if (paymentMetrics.avg_payment_days > 45) {
    recommendations.push('Consider offering early payment discounts - average payment time is over 45 days')
  }
  
  if (statusStats.draft?.percentage > 20) {
    recommendations.push('Send more draft invoices - over 20% are still in draft status')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Invoice management is performing well - maintain current practices')
  }
  
  return recommendations
}