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
    const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | null
    const category = searchParams.get('category')
    const searchTerm = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const period = searchParams.get('period')
    const accountId = searchParams.get('accountId')
    
    // Sort parameters
    const sortField = searchParams.get('sortField') || 'date'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    
    // Build where clause
    const where: Prisma.BookkeepingEntryWhereInput = {}
    
    // Company filter (required)
    if (companyId) {
      where.companyId = parseInt(companyId)
    } else {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }
    
    // Type filter
    if (type) {
      where.type = type
    }
    
    // Category filter
    if (category) {
      where.category = category
    }
    
    // Account filter
    if (accountId) {
      where.accountId = accountId
    }
    
    // Search filter
    if (searchTerm) {
      where.OR = [
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { reference: { contains: searchTerm, mode: 'insensitive' } },
        { notes: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
        { subcategory: { contains: searchTerm, mode: 'insensitive' } },
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
    const orderBy: Prisma.BookkeepingEntryOrderByWithRelationInput = {}
    
    switch (sortField) {
      case 'amount':
        orderBy.amount = sortDirection as 'asc' | 'desc'
        break
      case 'category':
        orderBy.category = sortDirection as 'asc' | 'desc'
        break
      case 'description':
        orderBy.description = sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.date = sortDirection as 'asc' | 'desc'
    }
    
    // Execute queries in parallel
    const [entries, totalCount] = await Promise.all([
      prisma.bookkeepingEntry.findMany({
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
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
            },
          },
          transaction: true,
        },
      }),
      prisma.bookkeepingEntry.count({ where }),
    ])
    
    // Calculate statistics
    const stats = await prisma.bookkeepingEntry.aggregate({
      where,
      _sum: {
        amount: true,
        cogs: true,
        cogsPaid: true,
      },
    })
    
    // Calculate income and expense totals
    const [incomeStats, expenseStats] = await Promise.all([
      prisma.bookkeepingEntry.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.bookkeepingEntry.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true, cogs: true, cogsPaid: true },
        _count: { _all: true },
      }),
    ])
    
    // Get category breakdown
    const categoryBreakdown = await prisma.bookkeepingEntry.groupBy({
      by: ['category', 'type'],
      where,
      _sum: { amount: true },
      _count: { _all: true },
    })
    
    return NextResponse.json({
      data: entries,
      pagination: {
        total: totalCount,
        skip,
        take,
        hasMore: skip + take < totalCount,
      },
      statistics: {
        totalIncome: incomeStats._sum.amount || 0,
        totalExpenses: expenseStats._sum.amount || 0,
        totalCogs: expenseStats._sum.cogs || 0,
        totalCogsPaid: expenseStats._sum.cogsPaid || 0,
        netProfit: (incomeStats._sum.amount || 0) - (expenseStats._sum.amount || 0),
        incomeCount: incomeStats._count._all,
        expenseCount: expenseStats._count._all,
        categoryBreakdown,
      },
    })
  } catch (error) {
    console.error('Error fetching bookkeeping entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookkeeping entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      companyId,
      type,
      category,
      subcategory,
      description,
      amount,
      currency,
      date,
      reference,
      notes,
      accountId,
      accountType,
      cogs = 0,
      cogsPaid = 0,
    } = body
    
    if (!companyId || !type || !category || !description || !amount || !currency || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Create the bookkeeping entry
    const entry = await prisma.bookkeepingEntry.create({
      data: {
        companyId: parseInt(companyId),
        type,
        category,
        subcategory,
        description,
        amount: parseFloat(amount),
        currency,
        date: new Date(date),
        reference,
        notes,
        accountId,
        accountType,
        cogs: parseFloat(cogs),
        cogsPaid: parseFloat(cogsPaid),
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
      },
    })
    
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating bookkeeping entry:', error)
    return NextResponse.json(
      { error: 'Failed to create bookkeeping entry' },
      { status: 500 }
    )
  }
}