import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface StatisticsQueryParams {
  companyId?: string
  period?: string
  dateFrom?: string
  dateTo?: string
  accountId?: string
  accountType?: string
  currency?: string
  groupBy?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params: StatisticsQueryParams = Object.fromEntries(searchParams.entries())

    const companyId = params.companyId ? parseInt(params.companyId) : undefined

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Build base where clause
    const where: Prisma.TransactionWhereInput = {
      companyId,
      isDeleted: false,
    }

    // Account filtering
    if (params.accountId) {
      where.accountId = params.accountId
    }
    if (params.accountType) {
      where.accountType = params.accountType as any
    }
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
        where.date = dateFilter
      }
    }

    // Execute parallel queries for comprehensive statistics
    const [
      overallStats,
      currencyBreakdown,
      accountBreakdown,
      categoryBreakdown,
      statusBreakdown,
      monthlyTrends,
      reconciliationStats,
      topTransactions
    ] = await Promise.all([
      // Overall aggregation
      prisma.transaction.aggregate({
        where,
        _sum: {
          netAmount: true,
          incomingAmount: true,
          outgoingAmount: true,
        },
        _avg: {
          netAmount: true,
        },
        _count: true,
      }),

      // Currency breakdown
      prisma.transaction.groupBy({
        by: ['currency'],
        where,
        _sum: {
          netAmount: true,
          incomingAmount: true,
          outgoingAmount: true,
        },
        _count: true,
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      }),

      // Account breakdown
      prisma.transaction.groupBy({
        by: ['accountId', 'accountType'],
        where,
        _sum: {
          netAmount: true,
          incomingAmount: true,
          outgoingAmount: true,
        },
        _count: true,
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      }),

      // Category breakdown
      prisma.transaction.groupBy({
        by: ['category'],
        where: {
          ...where,
          category: { not: null }
        },
        _sum: {
          netAmount: true,
          incomingAmount: true,
          outgoingAmount: true,
        },
        _count: true,
        orderBy: {
          _sum: {
            netAmount: 'desc'
          }
        },
        take: 10
      }),

      // Status breakdown
      prisma.transaction.groupBy({
        by: ['status'],
        where,
        _sum: {
          netAmount: true,
        },
        _count: true,
      }),

      // Monthly trends (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', date) as month,
          COUNT(*)::int as transaction_count,
          SUM(net_amount)::float as total_net_amount,
          SUM(CASE WHEN incoming_amount IS NOT NULL THEN incoming_amount ELSE 0 END)::float as total_incoming,
          SUM(CASE WHEN outgoing_amount IS NOT NULL THEN outgoing_amount ELSE 0 END)::float as total_outgoing,
          AVG(net_amount)::float as avg_transaction_amount
        FROM transactions 
        WHERE company_id = ${companyId} 
          AND is_deleted = false 
          AND date >= NOW() - INTERVAL '12 months'
          ${params.accountId ? Prisma.sql`AND account_id = ${params.accountId}` : Prisma.empty}
          ${params.currency ? Prisma.sql`AND currency = ${params.currency}` : Prisma.empty}
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month DESC
      `,

      // Reconciliation statistics
      prisma.transaction.groupBy({
        by: ['reconciliationStatus'],
        where,
        _sum: {
          netAmount: true,
        },
        _count: true,
      }),

      // Top transactions by amount
      prisma.transaction.findMany({
        where,
        orderBy: {
          netAmount: 'desc'
        },
        take: 5,
        select: {
          id: true,
          date: true,
          paidBy: true,
          paidTo: true,
          netAmount: true,
          currency: true,
          category: true,
          description: true
        }
      })
    ])

    // Get account details for account breakdown
    const accountIds = accountBreakdown.map(item => item.accountId)
    const accountDetails = await prisma.companyAccount.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true, type: true, currency: true }
    })

    // Enhance account breakdown with names
    const enhancedAccountBreakdown = accountBreakdown.map(item => {
      const account = accountDetails.find(acc => acc.id === item.accountId)
      return {
        ...item,
        accountName: account?.name || 'Unknown Account',
        accountCurrency: account?.currency
      }
    })

    return NextResponse.json({
      summary: {
        totalTransactions: overallStats._count,
        totalNetAmount: overallStats._sum.netAmount || 0,
        totalIncoming: overallStats._sum.incomingAmount || 0,
        totalOutgoing: overallStats._sum.outgoingAmount || 0,
        averageTransactionAmount: overallStats._avg.netAmount || 0,
        netCashFlow: (overallStats._sum.incomingAmount || 0) - Math.abs(overallStats._sum.outgoingAmount || 0),
      },
      breakdowns: {
        byCurrency: currencyBreakdown,
        byAccount: enhancedAccountBreakdown,
        byCategory: categoryBreakdown,
        byStatus: statusBreakdown,
        byReconciliationStatus: reconciliationStats,
      },
      trends: {
        monthly: monthlyTrends,
      },
      insights: {
        topTransactions,
        mostUsedCurrency: currencyBreakdown[0]?.currency || null,
        mostActiveAccount: enhancedAccountBreakdown[0]?.accountName || null,
        reconciliationRate: reconciliationStats.find(s => s.reconciliationStatus === 'RECONCILED')?._count || 0,
        pendingApprovals: statusBreakdown.find(s => s.status === 'PENDING')?._count || 0,
      }
    })

  } catch (error) {
    console.error('Error fetching transaction statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction statistics' },
      { status: 500 }
    )
  }
}