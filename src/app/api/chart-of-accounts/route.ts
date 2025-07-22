import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = parseInt(searchParams.get('take') || '20')
    
    // Filter parameters
    const searchTerm = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const category = searchParams.get('category') || ''
    const isActiveFilter = searchParams.get('isActive')
    const companyFilter = searchParams.get('company') || 'all'
    const accountType = searchParams.get('accountType') || ''
    
    // Sort parameters
    const sortField = searchParams.get('sortField') || 'code'
    const sortDirection = searchParams.get('sortDirection') || 'asc'
    
    // Build where clause
    const where: Prisma.ChartOfAccountWhereInput = {}
    
    // Search filter
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }
    
    // Type filter
    if (type && type !== 'all') {
      where.type = type
    }
    
    // Category filter
    if (category && category !== 'all') {
      where.category = category
    }
    
    // Account type filter
    if (accountType && accountType !== 'all') {
      where.accountType = accountType
    }
    
    // Active filter
    if (isActiveFilter && isActiveFilter !== 'all') {
      where.isActive = isActiveFilter === 'true'
    }
    
    // Company filter
    if (companyFilter !== 'all') {
      where.companyId = parseInt(companyFilter)
    }
    
    // Build orderBy clause
    const orderBy: Prisma.ChartOfAccountOrderByWithRelationInput = {}
    
    switch (sortField) {
      case 'name':
        orderBy.name = sortDirection as 'asc' | 'desc'
        break
      case 'type':
        orderBy.type = sortDirection as 'asc' | 'desc'
        break
      case 'category':
        orderBy.category = sortDirection as 'asc' | 'desc'
        break
      case 'balance':
        orderBy.balance = sortDirection as 'asc' | 'desc'
        break
      case 'updatedAt':
        orderBy.updatedAt = sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.code = sortDirection as 'asc' | 'desc'
    }
    
    // Execute queries in parallel
    const [accounts, totalCount] = await Promise.all([
      prisma.chartOfAccount.findMany({
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
              logo: true,
            },
          },
        },
      }),
      prisma.chartOfAccount.count({ where }),
    ])
    
    // Calculate statistics
    const stats = await prisma.chartOfAccount.aggregate({
      where,
      _count: {
        _all: true,
      },
      _avg: {
        balance: true,
      },
      _sum: {
        balance: true,
      },
    })
    
    // Calculate counts by type
    const typeCounts = await prisma.chartOfAccount.groupBy({
      by: ['type'],
      where,
      _count: {
        _all: true,
      },
    })
    
    const typeStats = typeCounts.reduce((acc, item) => {
      acc[item.type] = item._count._all
      return acc
    }, {} as Record<string, number>)
    
    // Calculate active/inactive counts
    const activeCounts = await prisma.chartOfAccount.groupBy({
      by: ['isActive'],
      where,
      _count: {
        _all: true,
      },
    })
    
    const activeStats = activeCounts.reduce((acc, item) => {
      acc[item.isActive ? 'active' : 'inactive'] = item._count._all
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      data: accounts,
      pagination: {
        total: totalCount,
        skip,
        take,
        hasMore: skip + take < totalCount,
      },
      statistics: {
        total: stats._count._all,
        averageBalance: stats._avg.balance || 0,
        totalBalance: stats._sum.balance || 0,
        typeStats,
        activeStats,
      },
    })
  } catch (error) {
    console.error('Error fetching chart of accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chart of accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['code', 'name', 'type', 'category', 'vat', 'accountType']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }
    
    // Check if code already exists
    const existingAccount = await prisma.chartOfAccount.findUnique({
      where: { code: body.code }
    })
    
    if (existingAccount) {
      return NextResponse.json(
        { error: 'Account code already exists' },
        { status: 400 }
      )
    }
    
    // Create the account
    const account = await prisma.chartOfAccount.create({
      data: {
        code: body.code,
        name: body.name,
        type: body.type,
        category: body.category,
        subcategory: body.subcategory,
        vat: body.vat,
        relatedVendor: body.relatedVendor,
        accountType: body.accountType,
        isActive: body.isActive ?? true,
        balance: body.balance ?? 0,
        classification: body.classification,
        ifrsReference: body.ifrsReference,
        companyId: body.companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
          },
        },
      },
    })
    
    // Invalidate cache
    CacheInvalidationService.invalidatePattern('chart-of-accounts')
    
    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bulkDelete = searchParams.get('bulk') === 'true'
    const companyId = searchParams.get('companyId')
    
    if (bulkDelete) {
      // Build where clause for bulk delete
      const where: any = {}
      
      // If companyId is specified, delete only that company's accounts
      // If companyId is 'null' or not specified, delete accounts with null companyId
      if (companyId === 'null' || !companyId) {
        where.companyId = null
      } else {
        where.companyId = parseInt(companyId)
      }
      
      // Delete all accounts matching the criteria
      const deleteResult = await prisma.chartOfAccount.deleteMany({
        where
      })
      
      // Invalidate cache
      CacheInvalidationService.invalidatePattern('chart-of-accounts')
      
      return NextResponse.json(
        { 
          message: `Successfully deleted ${deleteResult.count} accounts`,
          deletedCount: deleteResult.count
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: 'This endpoint only supports bulk delete. Use /api/chart-of-accounts/[id] for individual deletions.' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error bulk deleting accounts:', error)
    return NextResponse.json(
      { error: 'Failed to bulk delete accounts' },
      { status: 500 }
    )
  }
}