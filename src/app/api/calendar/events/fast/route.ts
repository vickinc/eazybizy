import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { ResponseCompression, generateETag, checkETag } from '@/lib/compression'
import { AnniversaryEventService } from '@/services/business/anniversaryEventService'

interface CalendarFilters {
  page?: number
  limit?: number
  companyId?: string
  type?: string
  priority?: string
  search?: string
  // New comprehensive filters
  date?: string // Specific date (YYYY-MM-DD)
  dateRange?: 'today' | 'week' | 'month' | 'upcoming'
  dateFrom?: string
  dateTo?: string
  sortBy?: 'date' | 'createdAt' | 'priority' | 'title' | 'time'
  sortOrder?: 'asc' | 'desc'
  isAutoGenerated?: boolean
}

interface CachedCalendarResponse {
  events: unknown[]
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
    // Trigger anniversary rollover check (non-blocking, runs in background)
    // This ensures that new anniversary events are generated when old ones pass
    AnniversaryEventService.checkAndGenerateNextAnniversaries().catch(error => {
      console.warn('Anniversary rollover check failed during fast calendar fetch:', error);
    });

    const searchParams = request.nextUrl.searchParams
    
    // Parse parameters
    const filters: CalendarFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '50'), 5000), // Increased limit to 5000 for large datasets
      companyId: searchParams.get('companyId') || undefined,
      type: searchParams.get('type') || undefined,
      priority: searchParams.get('priority') || undefined,
      search: searchParams.get('search') || undefined,
      // New comprehensive filters
      date: searchParams.get('date') || undefined,
      dateRange: searchParams.get('dateRange') as 'today' | 'week' | 'month' | 'upcoming' || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') as 'date' | 'createdAt' | 'priority' | 'title' | 'time' || 'date',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc',
      isAutoGenerated: searchParams.get('isAutoGenerated') ? searchParams.get('isAutoGenerated') === 'true' : undefined,
    }

    const skip = (filters.page! - 1) * filters.limit!

    // Generate cache keys
    const cacheKeyData = CacheKeys.calendar.events({ ...filters, skip })
    const cacheKeyCount = `calendar:count:${JSON.stringify(filters)}`

    // Try to get from cache first (L2 - Redis)
    const [cachedData, cachedCount] = await Promise.all([
      CacheService.get<any[]>(cacheKeyData),
      CacheService.get<number>(cacheKeyCount)
    ])

    if (cachedData && cachedCount !== null) {
      // Cache hit - return immediately with compression
      
      const responseData = {
        events: cachedData,
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
      } as CachedCalendarResponse

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

    // Build where clause
    const where: any = {}
    
    // Handle company filtering
    let companyFilter: any = null
    if (filters.companyId && filters.companyId !== 'all') {
      const companyIdInt = parseInt(filters.companyId)
      const company = await prisma.company.findUnique({
        where: { id: companyIdInt },
        select: { tradingName: true, legalName: true }
      })
      
      if (company) {
        companyFilter = {
          OR: [
            { companyId: companyIdInt },
            { company: { in: [company.tradingName, company.legalName] } }
          ]
        }
      } else {
        companyFilter = { companyId: companyIdInt }
      }
    }
    
    if (filters.type && filters.type !== 'all') {
      where.type = filters.type.toUpperCase()
    }
    
    if (filters.priority && filters.priority !== 'all') {
      where.priority = filters.priority.toUpperCase()
    }

    // Handle auto-generated filtering
    if (filters.isAutoGenerated !== undefined) {
      where.isAutoGenerated = filters.isAutoGenerated
    }

    // Handle date filtering
    let dateFilter: any = null
    if (filters.date) {
      // Specific date (YYYY-MM-DD)
      const targetDate = new Date(filters.date)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      dateFilter = {
        date: {
          gte: targetDate,
          lt: nextDay
        }
      }
    } else if (filters.dateRange) {
      const now = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          
          dateFilter = {
            date: {
              gte: today,
              lt: tomorrow
            }
          }
          break
          
        case 'week':
          const startOfWeek = new Date(now)
          const dayOfWeek = now.getDay()
          startOfWeek.setDate(now.getDate() - dayOfWeek)
          startOfWeek.setHours(0, 0, 0, 0)
          
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 7)
          
          dateFilter = {
            date: {
              gte: startOfWeek,
              lt: endOfWeek
            }
          }
          break
          
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          
          dateFilter = {
            date: {
              gte: startOfMonth,
              lt: endOfMonth
            }
          }
          break
          
        case 'upcoming':
          dateFilter = {
            date: {
              gte: now
            }
          }
          break
      }
    } else if (filters.dateFrom || filters.dateTo) {
      // Date range filtering
      const dateRangeFilter: any = {}
      
      if (filters.dateFrom) {
        dateRangeFilter.gte = new Date(filters.dateFrom)
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo)
        toDate.setDate(toDate.getDate() + 1) // Include the entire day
        dateRangeFilter.lt = toDate
      }
      
      if (Object.keys(dateRangeFilter).length > 0) {
        dateFilter = { date: dateRangeFilter }
      }
    }
    
    // Handle search filtering
    let searchFilter: any = null
    if (filters.search) {
      searchFilter = {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { company: { contains: filters.search, mode: 'insensitive' } }
        ]
      }
    }
    
    // Combine all filters
    const allFilters = []
    
    if (companyFilter) {
      allFilters.push(companyFilter)
    }
    
    if (searchFilter) {
      allFilters.push(searchFilter)
    }
    
    if (dateFilter) {
      allFilters.push(dateFilter)
    }
    
    if (allFilters.length > 1) {
      where.AND = allFilters
    } else if (allFilters.length === 1) {
      Object.assign(where, allFilters[0])
    }

    // Execute optimized database queries
    const [events, totalCount] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        // Optimized select for better performance
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
          time: true,
          type: true,
          priority: true,
          company: true,
          participants: true,
          companyId: true,
          isAutoGenerated: true,
          syncStatus: true,
          googleCalendarId: true,
          googleEventId: true,
          createdAt: true,
          updatedAt: true,
          notes: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              content: true,
              createdAt: true
            }
          },
          companyRecord: {
            select: {
              id: true,
              legalName: true,
              tradingName: true
            }
          }
        },
        orderBy: (() => {
          const sortOrder = filters.sortOrder || 'desc'
          
          switch (filters.sortBy) {
            case 'createdAt':
              return [{ createdAt: sortOrder }, { date: 'desc' }]
            case 'priority':
              return [{ priority: sortOrder }, { date: 'desc' }]
            case 'title':
              return [{ title: sortOrder }, { date: 'desc' }]
            case 'time':
              return [{ time: sortOrder }, { date: 'desc' }]
            case 'date':
            default:
              return [{ date: sortOrder }, { createdAt: 'desc' }]
          }
        })(),
        skip,
        take: filters.limit
      }),
      prisma.calendarEvent.count({ where })
    ])

    const dbTime = Date.now() - dbStartTime

    // Process events data
    const processedEvents = events.map(event => ({
      ...event,
      participants: event.participants ? JSON.parse(event.participants) : []
    }))

    // Cache the results asynchronously (don't wait for it)
    const cachePromises = [
      CacheService.set(cacheKeyData, processedEvents, CacheTTL.calendar.events),
      CacheService.set(cacheKeyCount, totalCount, CacheTTL.calendar.events)
    ]
    
    Promise.all(cachePromises).catch(error => 
      console.error('Failed to cache calendar data:', error)
    )

    const totalTime = Date.now() - startTime

    const responseData = {
      events: processedEvents,
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
    } as CachedCalendarResponse

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
    console.error('Error fetching calendar events (fast):', error)
    const totalTime = Date.now() - startTime
    return NextResponse.json(
      { 
        error: 'Failed to fetch calendar events',
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
    const pattern = searchParams.get('pattern') || 'calendar:*'
    
    const deletedCount = await CacheService.delPattern(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Invalidated ${deletedCount} calendar cache entries`,
      pattern
    })
  } catch (error) {
    console.error('Calendar cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate calendar cache' },
      { status: 500 }
    )
  }
}