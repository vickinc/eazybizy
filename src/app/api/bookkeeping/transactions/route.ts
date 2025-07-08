import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = parseInt(searchParams.get('take') || '20')
    
    // Filter parameters
    const companyId = searchParams.get('companyId')
    const accountId = searchParams.get('accountId')
    const accountType = searchParams.get('accountType')
    const searchTerm = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const period = searchParams.get('period')
    
    // Sort parameters
    const sortField = searchParams.get('sortField') || 'date'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    
    // Build where clause
    const where: Prisma.TransactionWhereInput = {}
    
    // Company filter (required)
    if (companyId) {
      where.companyId = parseInt(companyId)
    } else {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }
    
    // Account filter
    if (accountId) {
      where.accountId = accountId
    }
    
    // Account type filter
    if (accountType) {
      where.accountType = accountType as any
    }
    
    // Search filter
    if (searchTerm) {
      where.OR = [
        { paidBy: { contains: searchTerm, mode: 'insensitive' } },
        { paidTo: { contains: searchTerm, mode: 'insensitive' } },
        { reference: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { notes: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }
    
    // Date filters
    if (dateFrom || dateTo || period) {
      const dateFilter: any = {}
      
      if (period) {
        const now = new Date()
        switch (period) {
          case 'thisMonth':
            dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), 1)
            dateFilter.lte = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            break
          case 'lastMonth':
            dateFilter.gte = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            dateFilter.lte = new Date(now.getFullYear(), now.getMonth(), 0)
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
        if (dateFrom) dateFilter.gte = new Date(dateFrom)
        if (dateTo) dateFilter.lte = new Date(dateTo)
      }
      
      if (Object.keys(dateFilter).length > 0) {
        where.date = dateFilter
      }
    }
    
    // Build orderBy clause
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {}
    
    switch (sortField) {
      case 'amount':
        orderBy.netAmount = sortDirection as 'asc' | 'desc'
        break
      case 'paidBy':
        orderBy.paidBy = sortDirection as 'asc' | 'desc'
        break
      case 'paidTo':
        orderBy.paidTo = sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.date = sortDirection as 'asc' | 'desc'
    }
    
    // Execute queries in parallel
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
            },
          },
          companyAccount: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
              currentBalance: true,
            },
          },
          linkedEntry: {
            select: {
              id: true,
              type: true,
              category: true,
              description: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ])
    
    // Calculate statistics
    const stats = await prisma.transaction.aggregate({
      where,
      _sum: {
        netAmount: true,
        incomingAmount: true,
        outgoingAmount: true,
        baseCurrencyAmount: true,
      },
      _count: {
        _all: true,
      },
    })
    
    // Get account balances for the company
    const accountBalances = await prisma.companyAccount.findMany({
      where: { companyId: parseInt(companyId) },
      select: {
        id: true,
        name: true,
        type: true,
        currency: true,
        currentBalance: true,
      },
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
        totalTransactions: stats._count._all,
        totalNetAmount: stats._sum.netAmount || 0,
        totalIncoming: stats._sum.incomingAmount || 0,
        totalOutgoing: stats._sum.outgoingAmount || 0,
        totalBaseCurrencyAmount: stats._sum.baseCurrencyAmount || 0,
      },
      accountBalances,
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
    const body = await request.json()
    
    const {
      companyId,
      date,
      paidBy,
      paidTo,
      netAmount,
      incomingAmount,
      outgoingAmount,
      currency,
      baseCurrency,
      baseCurrencyAmount,
      accountId,
      accountType,
      reference,
      category,
      description,
      notes,
      linkedEntryId,
      linkedEntryType,
    } = body
    
    if (!companyId || !date || !paidBy || !paidTo || !netAmount || !currency || !accountId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          companyId: parseInt(companyId),
          date: new Date(date),
          paidBy,
          paidTo,
          netAmount: parseFloat(netAmount),
          incomingAmount: incomingAmount ? parseFloat(incomingAmount) : null,
          outgoingAmount: outgoingAmount ? parseFloat(outgoingAmount) : null,
          currency,
          baseCurrency: baseCurrency || currency,
          baseCurrencyAmount: parseFloat(baseCurrencyAmount || netAmount),
          accountId,
          accountType: accountType || 'BANK',
          reference,
          category,
          description,
          notes,
          linkedEntryId,
          linkedEntryType,
        },
        include: {
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
            },
          },
          account: true,
          linkedEntry: true,
        },
      })
      
      // Update account balance
      await tx.companyAccount.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            increment: incomingAmount ? parseFloat(incomingAmount) : -parseFloat(outgoingAmount || netAmount)
          },
        },
      })
      
      return transaction
    })
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}