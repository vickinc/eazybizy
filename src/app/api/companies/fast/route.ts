import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { ResponseCompression, generateETag, checkETag } from '@/lib/compression'
import { Prisma } from '@prisma/client'

interface CompanyFilters {
  search?: string
  status?: string  
  industry?: string
  sortField?: string
  sortDirection?: string
}

interface CachedCompanyResponse {
  data: unknown[]
  pagination: {
    total: number
    skip: number
    take: number
    hasMore: boolean
  }
  cached: boolean
  cacheHit: boolean
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Check if this is a cache-busting request (after mutation)
    const bustCache = searchParams.get('bustCache') === 'true'
    
    // Parse parameters
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = parseInt(searchParams.get('take') || '20')
    const filters: CompanyFilters = {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'all',
      industry: searchParams.get('industry') || '',
      sortField: searchParams.get('sortField') || 'createdAt',
      sortDirection: searchParams.get('sortDirection') || 'desc',
    }

    // Generate cache keys
    const cacheKeyData = CacheKeys.companies.list({ ...filters, skip, take })
    const cacheKeyCount = CacheKeys.companies.count(filters)

    // Try to get from cache first (L2 - Redis) - unless cache busting
    let cachedData, cachedCount
    if (!bustCache) {
      [cachedData, cachedCount] = await Promise.all([
        CacheService.get<any[]>(cacheKeyData),
        CacheService.get<number>(cacheKeyCount)
      ])
    }

    if (cachedData && cachedCount !== null && !bustCache) {
      // Cache hit - return immediately with compression
      
      const responseData = {
        data: cachedData,
        pagination: {
          total: cachedCount,
          skip,
          take,
          hasMore: skip + take < cachedCount,
        },
        cached: true,
        cacheHit: true,
        responseTime: Date.now() - startTime
      } as CachedCompanyResponse

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
            maxAge: 1,          // 1 second browser cache for immediate updates
            sMaxAge: 2,         // 2 seconds CDN cache for immediate updates
            staleWhileRevalidate: 1 // 1 second stale-while-revalidate for immediate updates
          },
          etag
        }
      )
    }

    // Cache miss - query database with optimized query
    
    // Build optimized where clause
    const where: Prisma.CompanyWhereInput = {}
    
    if (filters.search) {
      // SQLite doesn't support mode 'insensitive' - using contains only
      where.OR = [
        { legalName: { contains: filters.search } },
        { tradingName: { contains: filters.search } },
        { industry: { contains: filters.search } },
        { email: { contains: filters.search } },
        { registrationNo: { contains: filters.search } },
      ]
    }
    
    if (filters.status !== 'all') {
      where.status = filters.status
    }
    
    if (filters.industry) {
      where.industry = filters.industry
    }

    // Build orderBy clause
    const orderBy: Prisma.CompanyOrderByWithRelationInput = {}
    switch (filters.sortField) {
      case 'legalName':
        orderBy.legalName = filters.sortDirection as 'asc' | 'desc'
        break
      case 'tradingName':
        orderBy.tradingName = filters.sortDirection as 'asc' | 'desc'
        break
      case 'industry':
        orderBy.industry = filters.sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.createdAt = filters.sortDirection as 'asc' | 'desc'
    }

    // Execute optimized database queries
    const dbStartTime = Date.now()
    const [companies, totalCount] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy,
        skip,
        take,
        // Select all fields needed by the UI components
        select: {
          id: true,
          legalName: true,
          tradingName: true,
          registrationNo: true,
          registrationDate: true,
          countryOfRegistration: true,
          baseCurrency: true,
          businessLicenseNr: true,
          vatNumber: true,
          industry: true,
          status: true,
          email: true,
          phone: true,
          address: true,
          website: true,
          logo: true,
          facebookUrl: true,
          instagramUrl: true,
          xUrl: true,
          youtubeUrl: true,
          whatsappNumber: true,
          telegramNumber: true,
          mainContactEmail: true,
          mainContactType: true,
          createdAt: true,
          updatedAt: true,
          // Include representatives and shareholders for UI components
          representatives: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              role: true,
              customRole: true,
            }
          },
          shareholders: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              ownershipPercent: true,
            }
          },
        }
      }),
      prisma.company.count({ where }),
    ])
    
    const dbTime = Date.now() - dbStartTime

    // Cache the results asynchronously (don't wait for it)
    const cachePromises = [
      CacheService.set(cacheKeyData, companies, CacheTTL.companies.list),
      CacheService.set(cacheKeyCount, totalCount, CacheTTL.companies.count)
    ]
    
    // Don't await cache operations to keep response fast
    Promise.all(cachePromises).catch(error => 
      console.error('Failed to cache companies data:', error)
    )

    const totalTime = Date.now() - startTime

    const responseData = {
      data: companies,
      pagination: {
        total: totalCount,
        skip,
        take,
        hasMore: skip + take < totalCount,
      },
      cached: false,
      cacheHit: false,
      responseTime: totalTime,
      dbTime
    } as CachedCompanyResponse

    // Generate ETag for fresh data
    const etag = generateETag(responseData)

    // Return compressed response with different cache settings based on cache busting
    const cacheSettings = bustCache ? {
      // No cache for busted requests - force fresh data
      maxAge: 0,
      sMaxAge: 0,
      staleWhileRevalidate: 0,
      noCache: true
    } : {
      // Very short cache for regular requests to ensure immediate updates
      maxAge: 1,          // 1 second browser cache for immediate updates
      sMaxAge: 2,         // 2 seconds CDN cache for immediate updates
      staleWhileRevalidate: 1 // 1 second stale-while-revalidate for immediate updates
    }
    
    return await ResponseCompression.createOptimizedResponse(
      responseData,
      request,
      {
        compression: { threshold: 512, level: 6 },
        cache: cacheSettings,
        etag: bustCache ? undefined : etag // No ETag for busted cache
      }
    )

  } catch (error) {
    console.error('Error fetching companies (fast):', error)
    const totalTime = Date.now() - startTime
    return NextResponse.json(
      { 
        error: 'Failed to fetch companies',
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
    const pattern = searchParams.get('pattern') || 'companies:*'
    
    const deletedCount = await CacheService.delPattern(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Invalidated ${deletedCount} cache entries`,
      pattern
    })
  } catch (error) {
    console.error('Cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}