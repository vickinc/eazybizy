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
    const isActiveFilter = searchParams.get('isActive')
    const companyFilter = searchParams.get('company') || 'all'
    const currencyFilter = searchParams.get('currency') || ''
    
    // Sort parameters
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    
    // Build where clause
    const where: Prisma.ProductWhereInput = {}
    
    // Search filter
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }
    
    // Active filter
    if (isActiveFilter !== null && isActiveFilter !== '') {
      where.isActive = isActiveFilter === 'true'
    }
    
    // Company filter
    if (companyFilter !== 'all') {
      where.companyId = parseInt(companyFilter)
    }
    
    // Currency filter
    if (currencyFilter) {
      where.currency = currencyFilter
    }
    
    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {}
    
    switch (sortField) {
      case 'name':
        orderBy.name = sortDirection as 'asc' | 'desc'
        break
      case 'price':
        orderBy.price = sortDirection as 'asc' | 'desc'
        break
      case 'cost':
        orderBy.cost = sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.createdAt = sortDirection as 'asc' | 'desc'
    }
    
    // Execute queries in parallel
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
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
          vendor: {
            select: {
              id: true,
              companyName: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              invoiceItems: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ])
    
    // Calculate statistics
    const stats = await prisma.product.aggregate({
      where,
      _count: {
        _all: true,
      },
      _avg: {
        price: true,
        cost: true,
      },
      _sum: {
        price: true,
        cost: true,
      },
    })
    
    // Calculate active/inactive counts
    const activeCounts = await prisma.product.groupBy({
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
      data: products,
      pagination: {
        total: totalCount,
        skip,
        take,
        hasMore: skip + take < totalCount,
      },
      statistics: {
        total: stats._count._all,
        averagePrice: stats._avg.price || 0,
        averageCost: stats._avg.cost || 0,
        totalValue: stats._sum.price || 0,
        activeStats,
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      description,
      price,
      currency,
      cost = 0,
      costCurrency,
      isActive = true,
      companyId,
      vendorId,
    } = body
    
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        currency,
        cost,
        costCurrency,
        isActive,
        companyId: companyId || null,
        vendorId: vendorId || null,
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
        vendor: {
          select: {
            id: true,
            companyName: true,
            isActive: true,
          },
        },
      },
    })
    
    // Invalidate related caches after successful creation
    CacheInvalidationService.invalidateOnProductMutation(
      product.id,
      product.companyId || undefined
    ).catch(error => 
      console.error('Failed to invalidate caches after product creation:', error)
    )
    
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}