import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface TransactionQueryParams {
  companyId?: string
  skip?: string
  take?: string
  accountId?: string
  accountType?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  period?: string
  category?: string
  subcategory?: string
  status?: string
  reconciliationStatus?: string
  currency?: string
  sortField?: string
  sortDirection?: string
  includeDeleted?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params: TransactionQueryParams = Object.fromEntries(searchParams.entries())

    const companyId = params.companyId ? parseInt(params.companyId) : undefined
    const skip = parseInt(params.skip || '0')
    const take = Math.min(parseInt(params.take || '20'), 100)
    const includeDeleted = params.includeDeleted === 'true'

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Build where clause
    const where: Prisma.TransactionWhereInput = {
      companyId,
      isDeleted: includeDeleted ? undefined : false,
    }

    // Account filtering
    if (params.accountId) {
      where.accountId = params.accountId
    }
    if (params.accountType) {
      where.accountType = params.accountType as any
    }

    // Status filtering
    if (params.status) {
      where.status = params.status as any
    }
    if (params.reconciliationStatus) {
      where.reconciliationStatus = params.reconciliationStatus as any
    }

    // Category filtering
    if (params.category) {
      where.category = params.category
    }
    if (params.subcategory) {
      where.subcategory = params.subcategory
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

    // Text search across multiple fields
    if (params.search) {
      const searchTerms = params.search.trim().split(/\s+/)
      where.OR = searchTerms.flatMap(term => [
        { paidBy: { contains: term, mode: 'insensitive' } },
        { paidTo: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { notes: { contains: term, mode: 'insensitive' } },
        { reference: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { subcategory: { contains: term, mode: 'insensitive' } },
      ])
    }

    // Sorting
    const sortField = params.sortField || 'date'
    const sortDirection = params.sortDirection === 'asc' ? 'asc' : 'desc'
    
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {}
    if (sortField === 'amount') {
      orderBy.netAmount = sortDirection
    } else if (sortField === 'account') {
      orderBy.account = { name: sortDirection }
    } else {
      orderBy[sortField as keyof Prisma.TransactionOrderByWithRelationInput] = sortDirection
    }

    // Execute queries in parallel
    const [transactions, totalCount, stats] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          company: {
            select: { id: true, tradingName: true, legalName: true }
          },
          companyAccount: {
            select: { id: true, name: true, type: true, currency: true }
          },
          bankAccount: {
            select: { id: true, accountName: true, bankName: true, currency: true }
          },
          digitalWallet: {
            select: { id: true, walletName: true, walletType: true, currency: true }
          },
          linkedEntry: {
            select: { id: true, type: true, category: true, description: true }
          },
          attachments: {
            select: { id: true, fileName: true, fileSize: true, mimeType: true }
          },
          _count: {
            select: { childTransactions: true }
          }
        }
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where,
        _sum: {
          netAmount: true,
          incomingAmount: true,
          outgoingAmount: true,
        },
        _count: true,
      })
    ])

    // Calculate additional statistics
    const currencyBreakdown = await prisma.transaction.groupBy({
      by: ['currency'],
      where,
      _sum: {
        netAmount: true,
        incomingAmount: true,
        outgoingAmount: true,
      },
      _count: true,
    })

    const accountBreakdown = await prisma.transaction.groupBy({
      by: ['accountId', 'accountType'],
      where,
      _sum: {
        netAmount: true,
        incomingAmount: true,
        outgoingAmount: true,
      },
      _count: true,
    })

    return NextResponse.json({
      data: transactions,
      pagination: {
        total: totalCount,
        skip,
        take,
        hasMore: skip + take < totalCount,
      },
      statistics: {
        totalTransactions: stats._count,
        totalNetAmount: stats._sum.netAmount || 0,
        totalIncoming: stats._sum.incomingAmount || 0,
        totalOutgoing: stats._sum.outgoingAmount || 0,
        currencyBreakdown,
        accountBreakdown,
      }
    })

  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    const requiredFields = ['companyId', 'date', 'paidBy', 'paidTo', 'netAmount', 'currency', 'accountId', 'accountType']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        date: new Date(data.date),
        netAmount: parseFloat(data.netAmount),
        incomingAmount: data.incomingAmount ? parseFloat(data.incomingAmount) : null,
        outgoingAmount: data.outgoingAmount ? parseFloat(data.outgoingAmount) : null,
        baseCurrencyAmount: parseFloat(data.baseCurrencyAmount || data.netAmount),
        exchangeRate: data.exchangeRate ? parseFloat(data.exchangeRate) : null,
        tags: data.tags || [],
        status: data.status || 'CLEARED',
        reconciliationStatus: data.reconciliationStatus || 'UNRECONCILED',
        approvalStatus: data.approvalStatus || 'APPROVED',
        isRecurring: data.isRecurring || false,
        createdBy: data.createdBy,
      },
      include: {
        company: {
          select: { id: true, tradingName: true, legalName: true }
        },
        companyAccount: {
          select: { id: true, name: true, type: true, currency: true }
        },
        linkedEntry: {
          select: { id: true, type: true, category: true, description: true }
        }
      }
    })

    return NextResponse.json(transaction, { status: 201 })

  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}