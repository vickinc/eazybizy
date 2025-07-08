import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { ResponseCompression, generateETag, checkETag } from '@/lib/compression'

interface VendorFilters {
  skip?: number
  take?: number
  search?: string
  status?: string
  company?: string
  sortField?: string
  sortDirection?: string
}

interface CachedVendorResponse {
  data: any[]
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
    const filters: VendorFilters = {
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '50'),
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || 'all',
      company: searchParams.get('company') || 'all',
      sortField: searchParams.get('sortField') || 'createdAt',
      sortDirection: searchParams.get('sortDirection') || 'desc',
    }

    // Generate cache keys
    const cacheKeyData = CacheKeys.vendors.list(filters)
    const cacheKeyCount = `vendors:count:${JSON.stringify(filters)}`

    // Try to get from cache first (L2 - Redis)
    const [cachedData, cachedCount] = await Promise.all([
      CacheService.get<any[]>(cacheKeyData),
      CacheService.get<number>(cacheKeyCount)
    ])

    if (cachedData && cachedCount !== null) {
      // Cache hit - return immediately with compression
      console.log(`Vendors cache HIT - ${Date.now() - startTime}ms`)
      
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
      } as CachedVendorResponse

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
            maxAge: 600,        // 10min browser cache (vendors change less frequently)
            sMaxAge: 1200,      // 20min CDN cache
            staleWhileRevalidate: 600 // 10min stale-while-revalidate
          },
          etag
        }
      )
    }

    // Cache miss - query database with optimized query
    console.log(`Vendors cache MISS - querying database`)
    const dbStartTime = Date.now()

    // Build optimized where clause
    const where: any = {}
    
    // Company filter
    if (filters.company !== 'all') {
      where.companyId = parseInt(filters.company!)
    }
    
    // Status filter
    if (filters.status !== 'all') {
      where.isActive = filters.status === 'active'
    }
    
    // Search filter
    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { contactPerson: { contains: filters.search, mode: 'insensitive' } },
        { contactEmail: { contains: filters.search, mode: 'insensitive' } },
        { itemsServicesSold: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[filters.sortField!] = filters.sortDirection

    // Execute optimized database queries
    const [vendors, totalCount] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        orderBy,
        // Optimized select for better performance
        select: {
          id: true,
          companyId: true,
          companyName: true,
          contactPerson: true,
          contactEmail: true,
          phone: true,
          website: true,
          paymentTerms: true,
          currency: true,
          paymentMethod: true,
          billingAddress: true,
          itemsServicesSold: true,
          notes: true,
          companyRegistrationNr: true,
          vatNr: true,
          vendorCountry: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
              logo: true
            }
          },
          products: {
            take: 5, // Limit products for performance
            select: {
              id: true,
              name: true,
              price: true,
              currency: true
            }
          }
        }
      }),
      prisma.vendor.count({ where })
    ])

    const dbTime = Date.now() - dbStartTime
    console.log(`Vendors database query completed - ${dbTime}ms`)

    // Cache the results asynchronously (don't wait for it)
    const cachePromises = [
      CacheService.set(cacheKeyData, vendors, CacheTTL.vendors.list),
      CacheService.set(cacheKeyCount, totalCount, CacheTTL.vendors.list)
    ]
    
    Promise.all(cachePromises).catch(error => 
      console.error('Failed to cache vendors data:', error)
    )

    const totalTime = Date.now() - startTime
    console.log(`Vendors total response time - ${totalTime}ms (DB: ${dbTime}ms)`)

    const responseData = {
      data: vendors,
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
    } as CachedVendorResponse

    // Generate ETag for fresh data
    const etag = generateETag(responseData)

    // Return compressed response with shorter cache for fresh data
    return await ResponseCompression.createOptimizedResponse(
      responseData,
      request,
      {
        compression: { threshold: 512, level: 6 },
        cache: { 
          maxAge: 120,        // 2min browser cache for fresh data
          sMaxAge: 600,       // 10min CDN cache
          staleWhileRevalidate: 300 // 5min stale-while-revalidate
        },
        etag
      }
    )

  } catch (error) {
    console.error('Error fetching vendors (fast):', error)
    const totalTime = Date.now() - startTime
    return NextResponse.json(
      { 
        error: 'Failed to fetch vendors',
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
    const pattern = searchParams.get('pattern') || 'vendors:*'
    
    const deletedCount = await CacheService.delPattern(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Invalidated ${deletedCount} vendors cache entries`,
      pattern
    })
  } catch (error) {
    console.error('Vendors cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate vendors cache' },
      { status: 500 }
    )
  }
}