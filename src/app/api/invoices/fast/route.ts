import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { ResponseCompression, generateETag, checkETag } from '@/lib/compression'
import { Prisma } from '@prisma/client'

interface InvoiceFilters {
  skip?: number
  take?: number
  search?: string
  status?: string
  company?: string
  client?: string
  dateRange?: string
  currency?: string
  sortField?: string
  sortDirection?: string
}

interface CachedInvoiceResponse {
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
    const filters: InvoiceFilters = {
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '20'),
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || 'all',
      company: searchParams.get('company') || 'all',
      client: searchParams.get('client') || '',
      dateRange: searchParams.get('dateRange') || 'all',
      currency: searchParams.get('currency') || '',
      sortField: searchParams.get('sortField') || 'createdAt',
      sortDirection: searchParams.get('sortDirection') || 'desc',
    }

    // Generate cache keys
    const cacheKeyData = CacheKeys.invoices.list(filters)
    const cacheKeyCount = `invoices:count:${JSON.stringify(filters)}`

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
      } as CachedInvoiceResponse

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
            maxAge: 180,        // 3min browser cache (invoices change frequently)
            sMaxAge: 300,       // 5min CDN cache
            staleWhileRevalidate: 180 // 3min stale-while-revalidate
          },
          etag
        }
      )
    }

    // Cache miss - query database with optimized query
    const dbStartTime = Date.now()

    // Build optimized where clause
    const where: Prisma.InvoiceWhereInput = {}
    
    // Search filter
    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { clientName: { contains: filters.search, mode: 'insensitive' } },
        { clientEmail: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    
    // Status filter
    if (filters.status !== 'all') {
      where.status = filters.status!.toUpperCase() as Prisma.EnumInvoiceStatusFilter
    }
    
    // Company filter
    if (filters.company !== 'all') {
      where.fromCompanyId = parseInt(filters.company!)
    }
    
    // Client filter
    if (filters.client) {
      where.clientId = filters.client
    }
    
    // Currency filter
    if (filters.currency) {
      where.currency = filters.currency
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      let startDate: Date
      
      switch (filters.dateRange) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          where.createdAt = { gte: startDate }
          break
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          where.createdAt = { gte: startDate, lte: endDate }
          break
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1)
          where.createdAt = { gte: startDate }
          break
        case 'lastYear':
          startDate = new Date(now.getFullYear() - 1, 0, 1)
          const endYear = new Date(now.getFullYear() - 1, 11, 31)
          where.createdAt = { gte: startDate, lte: endYear }
          break
        default:
          if (filters.dateRange !== 'all') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            where.createdAt = { gte: startDate }
          }
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {}
    
    switch (filters.sortField) {
      case 'invoiceNumber':
        orderBy.invoiceNumber = filters.sortDirection as 'asc' | 'desc'
        break
      case 'clientName':
        orderBy.clientName = filters.sortDirection as 'asc' | 'desc'
        break
      case 'totalAmount':
        orderBy.totalAmount = filters.sortDirection as 'asc' | 'desc'
        break
      case 'dueDate':
        orderBy.dueDate = filters.sortDirection as 'asc' | 'desc'
        break
      case 'issueDate':
        orderBy.issueDate = filters.sortDirection as 'asc' | 'desc'
        break
      case 'status':
        orderBy.status = filters.sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.createdAt = filters.sortDirection as 'asc' | 'desc'
    }

    // Execute optimized database queries
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy,
        skip: filters.skip,
        take: filters.take,
        // Optimized select for better performance
        select: {
          id: true,
          invoiceNumber: true,
          clientName: true,
          clientEmail: true,
          clientAddress: true,
          subtotal: true,
          currency: true,
          status: true,
          dueDate: true,
          issueDate: true,
          paidDate: true,
          createdAt: true,
          updatedAt: true,
          template: true,
          taxRate: true,
          taxAmount: true,
          totalAmount: true,
          notes: true,
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
              logo: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              industry: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ])

    const dbTime = Date.now() - dbStartTime

    // Cache the results asynchronously (don't wait for it)
    const cachePromises = [
      CacheService.set(cacheKeyData, invoices, CacheTTL.invoices.list),
      CacheService.set(cacheKeyCount, totalCount, CacheTTL.invoices.list)
    ]
    
    Promise.all(cachePromises).catch(error => 
      console.error('Failed to cache invoices data:', error)
    )

    const totalTime = Date.now() - startTime

    const responseData = {
      data: invoices,
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
    } as CachedInvoiceResponse

    // Generate ETag for fresh data
    const etag = await generateETag(responseData)

    // Return compressed response with shorter cache for fresh data
    return await ResponseCompression.createOptimizedResponse(
      responseData,
      request,
      {
        compression: { threshold: 512, level: 6 },
        cache: { 
          maxAge: 30,         // 30sec browser cache for fresh data (invoices very dynamic)
          sMaxAge: 180,       // 3min CDN cache
          staleWhileRevalidate: 120 // 2min stale-while-revalidate
        },
        etag
      }
    )

  } catch (error) {
    console.error('Error fetching invoices (fast):', error)
    const totalTime = Date.now() - startTime
    return NextResponse.json(
      { 
        error: 'Failed to fetch invoices',
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
    const pattern = searchParams.get('pattern') || 'invoices:*'
    
    const deletedCount = await CacheService.delPattern(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Invalidated ${deletedCount} invoices cache entries`,
      pattern
    })
  } catch (error) {
    console.error('Invoices cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate invoices cache' },
      { status: 500 }
    )
  }
}