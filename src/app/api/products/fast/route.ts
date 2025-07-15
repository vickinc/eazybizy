import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { ResponseCompression, generateETag, checkETag } from '@/lib/compression'
import { Prisma } from '@prisma/client'

interface ProductFilters {
  skip?: number
  take?: number
  search?: string
  isActive?: string
  company?: string
  currency?: string
  sortField?: string
  sortDirection?: string
}

interface CachedProductResponse {
  data: unknown[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  cached: boolean
  cacheHit: boolean
  responseTime?: number
  dbTime?: number
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    
    // Parse parameters
    const filters: ProductFilters = {
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '20'),
      search: searchParams.get('search') || '',
      isActive: searchParams.get('isActive') || '',
      company: searchParams.get('company') || 'all',
      currency: searchParams.get('currency') || '',
      sortField: searchParams.get('sortField') || 'createdAt',
      sortDirection: searchParams.get('sortDirection') || 'desc',
    }

    // Generate cache keys
    const cacheKeyData = CacheKeys.products.list(filters)
    const cacheKeyCount = `products:count:${JSON.stringify(filters)}`

    // Try to get from cache first (L2 - Redis)
    const [cachedData, cachedCount] = await Promise.all([
      CacheService.get<any[]>(cacheKeyData),
      CacheService.get<number>(cacheKeyCount)
    ])

    if (cachedData && cachedCount !== null) {
      // Cache hit - return immediately with compression
      
      const responseData = {
        data: cachedData,
        pagination: {
          total: cachedCount,
          skip: filters.skip!,
          take: filters.take!,
          hasMore: filters.skip! + filters.take! < cachedCount,
        },
        cached: true,
        cacheHit: true,
        responseTime: Date.now() - startTime
      } as CachedProductResponse

      // Generate ETag for cache validation
      const etag = await generateETag(responseData)
      
      // Check if client has matching ETag (304 Not Modified)
      if (checkETag(request, etag)) {
        return new NextResponse(null, { status: 304 })
      }

      // Return compressed response with optimized caching
      return await ResponseCompression.createOptimizedResponse(
        responseData,
        request,
        {
          compression: { threshold: 512, level: 6 },
          cache: { 
            maxAge: 300,        // 5min browser cache
            sMaxAge: 600,       // 10min CDN cache
            staleWhileRevalidate: 300 // 5min stale-while-revalidate
          },
          etag
        }
      )
    }

    // Cache miss - query database with optimized query
    const dbStartTime = Date.now()

    // Build optimized where clause
    const where: Prisma.ProductWhereInput = {}
    
    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    
    // Active filter
    if (filters.isActive !== null && filters.isActive !== '') {
      where.isActive = filters.isActive === 'true'
    }
    
    // Company filter
    if (filters.company !== 'all') {
      where.companyId = parseInt(filters.company!)
    }
    
    // Currency filter
    if (filters.currency) {
      where.currency = filters.currency
    }

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {}
    
    switch (filters.sortField) {
      case 'name':
        orderBy.name = filters.sortDirection as 'asc' | 'desc'
        break
      case 'price':
        orderBy.price = filters.sortDirection as 'asc' | 'desc'
        break
      case 'cost':
        orderBy.cost = filters.sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.createdAt = filters.sortDirection as 'asc' | 'desc'
    }

    // Execute optimized database queries (remove expensive statistics for fast endpoint)
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: filters.skip,
        take: filters.take,
        // Optimized select for better performance
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          cost: true,
          costCurrency: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
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

    const dbTime = Date.now() - dbStartTime

    // Cache the results asynchronously (don't wait for it)
    const cachePromises = [
      CacheService.set(cacheKeyData, products, CacheTTL.products.list),
      CacheService.set(cacheKeyCount, totalCount, CacheTTL.products.list)
    ]
    
    Promise.all(cachePromises).catch(error => 
      console.error('Failed to cache products data:', error)
    )

    const totalTime = Date.now() - startTime

    const responseData = {
      data: products,
      pagination: {
        total: totalCount,
        skip: filters.skip!,
        take: filters.take!,
        hasMore: filters.skip! + filters.take! < totalCount,
      },
      cached: false,
      cacheHit: false,
      responseTime: totalTime,
      dbTime
    } as CachedProductResponse

    // Generate ETag for fresh data
    const etag = await generateETag(responseData)

    // Return compressed response with shorter cache for fresh data
    return await ResponseCompression.createOptimizedResponse(
      responseData,
      request,
      {
        compression: { threshold: 512, level: 6 },
        cache: { 
          maxAge: 60,         // 1min browser cache for fresh data
          sMaxAge: 300,       // 5min CDN cache
          staleWhileRevalidate: 180 // 3min stale-while-revalidate
        },
        etag
      }
    )

  } catch (error) {
    console.error('Error fetching products (fast):', error)
    const totalTime = Date.now() - startTime
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        responseTime: totalTime 
      },
      { status: 500 }
    )
  }
}

// Cache invalidation endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pattern = searchParams.get('pattern') || 'products:*'
    
    const deletedCount = await CacheService.delPattern(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Invalidated ${deletedCount} products cache entries`,
      pattern
    })
  } catch (error) {
    console.error('Products cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate products cache' },
      { status: 500 }
    )
  }
}