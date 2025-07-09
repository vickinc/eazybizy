import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { ResponseCompression, generateETag, checkETag } from '@/lib/compression'

interface BusinessCardsFilters {
  page?: number
  limit?: number
  companyId?: string
  isArchived?: string
  template?: string
  search?: string
}

interface CachedBusinessCardsResponse {
  businessCards: unknown[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
  cached: boolean
  cacheHit: boolean
  responseTime?: number
  dbTime?: number
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse parameters
    const filters: BusinessCardsFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      companyId: searchParams.get('companyId') || undefined,
      isArchived: searchParams.get('isArchived') || undefined,
      template: searchParams.get('template') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const skip = (filters.page! - 1) * filters.limit!

    // Generate cache keys
    const cacheKeyData = CacheKeys.businessCards.list({ ...filters, skip })
    const cacheKeyCount = `business-cards:count:${JSON.stringify(filters)}`

    // Try to get from cache first (L2 - Redis)
    const [cachedData, cachedCount] = await Promise.all([
      CacheService.get<any[]>(cacheKeyData),
      CacheService.get<number>(cacheKeyCount)
    ])

    if (cachedData && cachedCount !== null) {
      // Cache hit - return immediately with compression
      
      const responseData = {
        businessCards: cachedData,
        pagination: {
          page: filters.page!,
          limit: filters.limit!,
          total: cachedCount,
          pages: Math.ceil(cachedCount / filters.limit!),
          hasNext: skip + filters.limit! < cachedCount,
          hasPrev: filters.page! > 1
        },
        cached: true,
        cacheHit: true,
        responseTime: Date.now() - startTime
      } as CachedBusinessCardsResponse

      // Generate ETag for cache validation
      const etag = generateETag(responseData)
      
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

    // Build where clause
    const where: unknown = {}
    
    if (filters.companyId && filters.companyId !== 'all') {
      where.companyId = parseInt(filters.companyId)
    }
    
    if (filters.isArchived !== null && filters.isArchived !== undefined) {
      where.isArchived = filters.isArchived === 'true'
    }
    
    if (filters.template && filters.template !== 'all') {
      where.template = filters.template.toUpperCase()
    }
    
    if (filters.search) {
      where.OR = [
        { personName: { contains: filters.search, mode: 'insensitive' } },
        { position: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Execute optimized database queries
    const [businessCards, totalCount] = await Promise.all([
      prisma.businessCard.findMany({
        where,
        // Optimized select for better performance
        select: {
          id: true,
          companyId: true,
          personName: true,
          position: true,
          qrType: true,
          qrValue: true,
          template: true,
          isArchived: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              legalName: true,
              tradingName: true,
              email: true,
              website: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ],
        skip,
        take: filters.limit
      }),
      prisma.businessCard.count({ where })
    ])

    const dbTime = Date.now() - dbStartTime

    // Process business cards data
    const processedBusinessCards = businessCards.map(card => ({
      ...card,
      qrValue: card.qrType === 'WEBSITE' ? card.company.website : card.company.email
    }))

    // Cache the results asynchronously (don't wait for it)
    const cachePromises = [
      CacheService.set(cacheKeyData, processedBusinessCards, CacheTTL.businessCards.list),
      CacheService.set(cacheKeyCount, totalCount, CacheTTL.businessCards.list)
    ]
    
    Promise.all(cachePromises).catch(error => 
      console.error('Failed to cache business cards data:', error)
    )

    const totalTime = Date.now() - startTime

    const responseData = {
      businessCards: processedBusinessCards,
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total: totalCount,
        pages: Math.ceil(totalCount / filters.limit!),
        hasNext: skip + filters.limit! < totalCount,
        hasPrev: filters.page! > 1
      },
      cached: false,
      cacheHit: false,
      responseTime: totalTime,
      dbTime
    } as CachedBusinessCardsResponse

    // Generate ETag for fresh data
    const etag = generateETag(responseData)

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
    console.error('Error fetching business cards (fast):', error)
    const totalTime = Date.now() - startTime
    return NextResponse.json(
      { 
        error: 'Failed to fetch business cards',
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
    const pattern = searchParams.get('pattern') || 'business-cards:*'
    
    const deletedCount = await CacheService.delPattern(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Invalidated ${deletedCount} business cards cache entries`,
      pattern
    })
  } catch (error) {
    console.error('Business Cards cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate business cards cache' },
      { status: 500 }
    )
  }
}