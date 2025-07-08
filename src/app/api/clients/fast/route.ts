import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { ResponseCompression, generateETag, checkETag } from '@/lib/compression'
import { Prisma } from '@prisma/client'

interface ClientFilters {
  skip?: number
  take?: number
  search?: string
  status?: string
  industry?: string
  company?: string
  sortField?: string
  sortDirection?: string
}

interface CachedClientResponse {
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
    const filters: ClientFilters = {
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '20'),
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'all',
      industry: searchParams.get('industry') || '',
      company: searchParams.get('company') || 'all',
      sortField: searchParams.get('sortField') || 'createdAt',
      sortDirection: searchParams.get('sortDirection') || 'desc',
    }

    // Generate cache keys
    const cacheKeyData = CacheKeys.clients.list(filters)
    const cacheKeyCount = `clients:count:${JSON.stringify(filters)}`

    // Try to get from cache first (L2 - Redis)
    const [cachedData, cachedCount] = await Promise.all([
      CacheService.get<any[]>(cacheKeyData),
      CacheService.get<number>(cacheKeyCount)
    ])

    if (cachedData && cachedCount !== null) {
      // Cache hit - return immediately with compression
      console.log(`Clients cache HIT - ${Date.now() - startTime}ms`)
      
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
      } as CachedClientResponse

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
    console.log(`Clients cache MISS - querying database`)
    const dbStartTime = Date.now()

    // Build optimized where clause
    const where: Prisma.ClientWhereInput = {}
    
    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { contactPersonName: { contains: filters.search, mode: 'insensitive' } },
        { industry: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { country: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    
    // Status filter
    if (filters.status !== 'all') {
      where.status = filters.status!.toUpperCase() as Prisma.EnumClientStatusFilter
    }
    
    // Industry filter
    if (filters.industry) {
      where.industry = filters.industry
    }
    
    // Company filter
    if (filters.company !== 'all') {
      where.companyId = parseInt(filters.company!)
    }

    // Build orderBy clause
    const orderBy: Prisma.ClientOrderByWithRelationInput = {}
    
    switch (filters.sortField) {
      case 'name':
        orderBy.name = filters.sortDirection as 'asc' | 'desc'
        break
      case 'email':
        orderBy.email = filters.sortDirection as 'asc' | 'desc'
        break
      case 'industry':
        orderBy.industry = filters.sortDirection as 'asc' | 'desc'
        break
      case 'totalInvoiced':
        orderBy.totalInvoiced = filters.sortDirection as 'asc' | 'desc'
        break
      case 'lastInvoiceDate':
        orderBy.lastInvoiceDate = filters.sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.createdAt = filters.sortDirection as 'asc' | 'desc'
    }

    // Execute optimized database queries
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy,
        skip: filters.skip,
        take: filters.take,
        // Optimized select for better performance
        select: {
          id: true,
          clientType: true,
          name: true,
          contactPersonName: true,
          contactPersonPosition: true,
          email: true,
          phone: true,
          website: true,
          address: true,
          city: true,
          zipCode: true,
          country: true,
          industry: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          lastInvoiceDate: true,
          totalInvoiced: true,
          totalPaid: true,
          registrationNumber: true,
          vatNumber: true,
          passportNumber: true,
          dateOfBirth: true,
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
              logo: true,
            },
          },
          _count: {
            select: {
              invoices: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ])

    const dbTime = Date.now() - dbStartTime
    console.log(`Clients database query completed - ${dbTime}ms`)

    // Cache the results asynchronously (don't wait for it)
    const cachePromises = [
      CacheService.set(cacheKeyData, clients, CacheTTL.clients.list),
      CacheService.set(cacheKeyCount, totalCount, CacheTTL.clients.list)
    ]
    
    Promise.all(cachePromises).catch(error => 
      console.error('Failed to cache clients data:', error)
    )

    const totalTime = Date.now() - startTime
    console.log(`Clients total response time - ${totalTime}ms (DB: ${dbTime}ms)`)

    const responseData = {
      data: clients,
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
    } as CachedClientResponse

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
    console.error('Error fetching clients (fast):', error)
    const totalTime = Date.now() - startTime
    return NextResponse.json(
      { 
        error: 'Failed to fetch clients',
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
    const pattern = searchParams.get('pattern') || 'clients:*'
    
    const deletedCount = await CacheService.delPattern(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Invalidated ${deletedCount} clients cache entries`,
      pattern
    })
  } catch (error) {
    console.error('Clients cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate clients cache' },
      { status: 500 }
    )
  }
}