import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { ResponseCompression, generateETag, checkETag } from '@/lib/compression'

interface NotesFilters {
  page?: number
  limit?: number
  eventId?: string
  companyId?: string
  priority?: string
  isCompleted?: string
  isStandalone?: string
  search?: string
}

interface CachedNotesResponse {
  notes: any[]
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
    const filters: NotesFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 100),
      eventId: searchParams.get('eventId') || undefined,
      companyId: searchParams.get('companyId') || undefined,
      priority: searchParams.get('priority') || undefined,
      isCompleted: searchParams.get('isCompleted') || undefined,
      isStandalone: searchParams.get('isStandalone') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const skip = (filters.page! - 1) * filters.limit!

    // Generate cache keys
    const cacheKeyData = CacheKeys.notes.list({ ...filters, skip })
    const cacheKeyCount = `notes:count:${JSON.stringify(filters)}`

    // Try to get from cache first (L2 - Redis)
    const [cachedData, cachedCount] = await Promise.all([
      CacheService.get<any[]>(cacheKeyData),
      CacheService.get<number>(cacheKeyCount)
    ])

    if (cachedData && cachedCount !== null) {
      // Cache hit - return immediately with compression
      console.log(`Notes cache HIT - ${Date.now() - startTime}ms`)
      
      const responseData = {
        notes: cachedData,
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
      } as CachedNotesResponse

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
    console.log(`Notes cache MISS - querying database`)
    const dbStartTime = Date.now()

    // Build where clause
    const where: any = {}
    
    if (filters.eventId) {
      where.eventId = filters.eventId
    }
    
    if (filters.companyId && filters.companyId !== 'all') {
      where.companyId = parseInt(filters.companyId)
    }
    
    if (filters.priority && filters.priority !== 'all') {
      where.priority = filters.priority.toUpperCase()
    }
    
    if (filters.isCompleted !== null && filters.isCompleted !== undefined) {
      where.isCompleted = filters.isCompleted === 'true'
    }
    
    if (filters.isStandalone !== null && filters.isStandalone !== undefined) {
      where.isStandalone = filters.isStandalone === 'true'
    }
    
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Execute optimized database queries
    const [notes, totalCount] = await Promise.all([
      prisma.note.findMany({
        where,
        // Optimized select for better performance
        select: {
          id: true,
          title: true,
          content: true,
          eventId: true,
          companyId: true,
          tags: true,
          priority: true,
          isCompleted: true,
          isStandalone: true,
          createdAt: true,
          updatedAt: true,
          event: {
            select: {
              id: true,
              title: true,
              date: true,
              time: true
            }
          },
          company: {
            select: {
              id: true,
              legalName: true,
              tradingName: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: filters.limit
      }),
      prisma.note.count({ where })
    ])

    const dbTime = Date.now() - dbStartTime
    console.log(`Notes database query completed - ${dbTime}ms`)

    // Process notes data
    const processedNotes = notes.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    }))

    // Cache the results asynchronously (don't wait for it)
    const cachePromises = [
      CacheService.set(cacheKeyData, processedNotes, CacheTTL.notes.list),
      CacheService.set(cacheKeyCount, totalCount, CacheTTL.notes.list)
    ]
    
    Promise.all(cachePromises).catch(error => 
      console.error('Failed to cache notes data:', error)
    )

    const totalTime = Date.now() - startTime
    console.log(`Notes total response time - ${totalTime}ms (DB: ${dbTime}ms)`)

    const responseData = {
      notes: processedNotes,
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
    } as CachedNotesResponse

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
    console.error('Error fetching notes (fast):', error)
    const totalTime = Date.now() - startTime
    return NextResponse.json(
      { 
        error: 'Failed to fetch notes',
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
    const pattern = searchParams.get('pattern') || 'notes:*'
    
    const deletedCount = await CacheService.delPattern(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Invalidated ${deletedCount} notes cache entries`,
      pattern
    })
  } catch (error) {
    console.error('Notes cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate notes cache' },
      { status: 500 }
    )
  }
}