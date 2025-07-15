import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { ResponseCompression, generateETag, checkETag } from '@/lib/compression'
import { Prisma } from '@prisma/client'

interface BankAccountFilters {
  skip?: number
  take?: number
  search?: string
  company?: string
  currency?: string
  sortField?: string
  sortDirection?: string
}

interface CachedBankAccountResponse {
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
    const filters: BankAccountFilters = {
      skip: parseInt(searchParams.get('skip') || '0'),
      take: parseInt(searchParams.get('take') || '20'),
      search: searchParams.get('search') || '',
      company: searchParams.get('company') || 'all',
      currency: searchParams.get('currency') || '',
      sortField: searchParams.get('sortField') || 'createdAt',
      sortDirection: searchParams.get('sortDirection') || 'desc',
    }

    // Generate cache keys
    const cacheKeyData = CacheKeys.bankAccounts.list(filters)
    const cacheKeyCount = `bankAccounts:count:${JSON.stringify(filters)}`

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
      } as CachedBankAccountResponse

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
            maxAge: 900,        // 15min browser cache (bank accounts change infrequently)
            sMaxAge: 1800,      // 30min CDN cache
            staleWhileRevalidate: 900 // 15min stale-while-revalidate
          },
          etag
        }
      )
    }

    // Cache miss - query database with optimized query
    const dbStartTime = Date.now()

    // Build optimized where clause
    const where: Prisma.BankAccountWhereInput = {
      isActive: true
    }
    
    // Search filter
    if (filters.search) {
      where.OR = [
        { bankName: { contains: filters.search, mode: 'insensitive' } },
        { accountName: { contains: filters.search, mode: 'insensitive' } },
        { accountNumber: { contains: filters.search, mode: 'insensitive' } },
        { iban: { contains: filters.search, mode: 'insensitive' } },
        { swiftCode: { contains: filters.search, mode: 'insensitive' } },
        { currency: { contains: filters.search, mode: 'insensitive' } },
      ]
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
    const orderBy: Prisma.BankAccountOrderByWithRelationInput = {}
    
    switch (filters.sortField) {
      case 'bankName':
        orderBy.bankName = filters.sortDirection as 'asc' | 'desc'
        break
      case 'accountName':
        orderBy.accountName = filters.sortDirection as 'asc' | 'desc'
        break
      case 'currency':
        orderBy.currency = filters.sortDirection as 'asc' | 'desc'
        break
      case 'accountNumber':
        orderBy.accountNumber = filters.sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.createdAt = filters.sortDirection as 'asc' | 'desc'
    }

    // Execute optimized database queries
    const [bankAccounts, totalCount] = await Promise.all([
      prisma.bankAccount.findMany({
        where,
        orderBy,
        skip: filters.skip,
        take: filters.take,
        // Optimized select for better performance
        select: {
          id: true,
          bankName: true,
          bankAddress: true,
          currency: true,
          iban: true,
          swiftCode: true,
          accountNumber: true,
          accountName: true,
          notes: true,
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
        },
      }),
      prisma.bankAccount.count({ where }),
    ])

    const dbTime = Date.now() - dbStartTime

    // Cache the results asynchronously (don't wait for it)
    const cachePromises = [
      CacheService.set(cacheKeyData, bankAccounts, CacheTTL.bankAccounts.list),
      CacheService.set(cacheKeyCount, totalCount, CacheTTL.bankAccounts.list)
    ]
    
    Promise.all(cachePromises).catch(error => 
      console.error('Failed to cache bank accounts data:', error)
    )

    const totalTime = Date.now() - startTime

    const responseData = {
      data: bankAccounts,
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
    } as CachedBankAccountResponse

    // Generate ETag for fresh data
    const etag = await generateETag(responseData)

    // Return compressed response with longer cache for relatively stable data
    return await ResponseCompression.createOptimizedResponse(
      responseData,
      request,
      {
        compression: { threshold: 512, level: 6 },
        cache: { 
          maxAge: 300,         // 5min browser cache for fresh data
          sMaxAge: 900,        // 15min CDN cache
          staleWhileRevalidate: 600 // 10min stale-while-revalidate
        },
        etag
      }
    )

  } catch (error) {
    console.error('Error fetching bank accounts (fast):', error)
    const totalTime = Date.now() - startTime
    return NextResponse.json(
      { 
        error: 'Failed to fetch bank accounts',
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
    const pattern = searchParams.get('pattern') || 'bankAccounts:*'
    
    const deletedCount = await CacheService.delPattern(pattern)
    
    return NextResponse.json({
      success: true,
      message: `Invalidated ${deletedCount} bank accounts cache entries`,
      pattern
    })
  } catch (error) {
    console.error('Bank Accounts cache invalidation error:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate bank accounts cache' },
      { status: 500 }
    )
  }
}