import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { Prisma } from '@prisma/client'
import { CursorPaginationResponse } from '@/types/company.types'
import { companyStatisticsCache } from '@/services/cache/companyStatisticsCache'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Cursor pagination parameters
    const cursor = searchParams.get('cursor')
    const take = parseInt(searchParams.get('take') || '20')
    
    // Filter parameters
    const searchTerm = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || 'all'
    const industryFilter = searchParams.get('industry') || ''
    
    // Sort parameters
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    
    // Statistics flag - if false, skip expensive statistics computation
    const includeStats = searchParams.get('includeStats') === 'true'

    // Generate cache key for cursor pagination
    const cacheKey = CacheKeys.companies.list({
      cursor,
      take,
      search: searchTerm,
      status: statusFilter,
      industry: industryFilter,
      sortField,
      sortDirection
    })

    // Try cache first for ultra-fast response
    const cachedData = await CacheService.get<CursorPaginationResponse<any>>(cacheKey)
    if (cachedData) {
      console.log(`Cursor cache HIT - ${Date.now() - startTime}ms`)
      return NextResponse.json({
        ...cachedData,
        cached: true,
        cacheHit: true,
        responseTime: Date.now() - startTime
      })
    }

    console.log(`Cursor cache MISS - querying database`)
    const dbStartTime = Date.now()
    
    // Build where clause
    const where: Prisma.CompanyWhereInput = {}
    
    // Search filter
    if (searchTerm) {
      where.OR = [
        { legalName: { contains: searchTerm, mode: 'insensitive' } },
        { tradingName: { contains: searchTerm, mode: 'insensitive' } },
        { industry: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { registrationNo: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      where.status = statusFilter
    }
    
    // Industry filter
    if (industryFilter) {
      where.industry = industryFilter
    }
    
    // Build orderBy clause
    const orderBy: Prisma.CompanyOrderByWithRelationInput = {}
    
    switch (sortField) {
      case 'id':
        orderBy.id = sortDirection as 'asc' | 'desc'
        break
      case 'legalName':
        orderBy.legalName = sortDirection as 'asc' | 'desc'
        break
      case 'tradingName':
        orderBy.tradingName = sortDirection as 'asc' | 'desc'
        break
      case 'industry':
        orderBy.industry = sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.createdAt = sortDirection as 'asc' | 'desc'
    }
    
    // Build cursor condition
    let cursorCondition: Prisma.CompanyWhereInput | undefined
    if (cursor) {
      try {
        const cursorData = JSON.parse(cursor)
        
        if (sortField === 'id') {
          cursorCondition = {
            id: sortDirection === 'desc' 
              ? { lt: cursorData.id }
              : { gt: cursorData.id }
          }
        } else if (sortField === 'createdAt') {
          cursorCondition = {
            OR: [
              {
                createdAt: sortDirection === 'desc'
                  ? { lt: new Date(cursorData.createdAt) }
                  : { gt: new Date(cursorData.createdAt) }
              },
              {
                createdAt: new Date(cursorData.createdAt),
                id: sortDirection === 'desc'
                  ? { lt: cursorData.id }
                  : { gt: cursorData.id }
              }
            ]
          }
        } else {
          // For text fields, use composite cursor with createdAt and id for stability
          const fieldValue = cursorData[sortField]
          cursorCondition = {
            OR: [
              {
                [sortField]: sortDirection === 'desc'
                  ? { lt: fieldValue }
                  : { gt: fieldValue }
              },
              {
                [sortField]: fieldValue,
                OR: [
                  {
                    createdAt: sortDirection === 'desc'
                      ? { lt: new Date(cursorData.createdAt) }
                      : { gt: new Date(cursorData.createdAt) }
                  },
                  {
                    createdAt: new Date(cursorData.createdAt),
                    id: sortDirection === 'desc'
                      ? { lt: cursorData.id }
                      : { gt: cursorData.id }
                  }
                ]
              }
            ]
          }
        }
      } catch (error) {
        console.warn('Invalid cursor format:', cursor)
      }
    }
    
    // Combine where conditions
    const finalWhere: Prisma.CompanyWhereInput = cursorCondition 
      ? { AND: [where, cursorCondition] }
      : where
    
    // Fetch companies with minimal data for maximum performance
    const companies = await prisma.company.findMany({
      where: finalWhere,
      orderBy,
      take: take + 1, // Fetch one extra to check if there's more
      // Select only essential fields for better performance
      select: {
        id: true,
        legalName: true,
        tradingName: true,
        registrationNo: true,
        industry: true,
        status: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    
    // Check if there are more results
    const hasMore = companies.length > take
    const dataToReturn = hasMore ? companies.slice(0, take) : companies
    
    // Generate next cursor from the last item
    let nextCursor: string | undefined
    if (hasMore && dataToReturn.length > 0) {
      const lastItem = dataToReturn[dataToReturn.length - 1]
      nextCursor = JSON.stringify({
        id: lastItem.id,
        createdAt: lastItem.createdAt.toISOString(),
        [sortField]: lastItem[sortField as keyof typeof lastItem]
      })
    }
    
    // Build response with optional statistics
    const response: CursorPaginationResponse<any> & { statistics?: any } = {
      data: dataToReturn,
      pagination: {
        hasMore,
        nextCursor,
      },
    }
    
    // Only provide statistics if explicitly requested
    if (includeStats) {
      // Try to get from cache first
      const cachedStats = companyStatisticsCache.get()
      
      if (cachedStats) {
        console.log('Using cached statistics for cursor pagination')
        response.statistics = cachedStats
        // Add total count for cursor pagination when stats are requested
        response.pagination.totalCount = cachedStats.totalActive + cachedStats.totalPassive
      } else {
        console.log('Cache miss - fetching fresh statistics')
        // Fallback to fresh computation if cache is empty
        const [statusCounts, industryCounts] = await Promise.all([
          prisma.company.groupBy({
            by: ['status'],
            _count: {
              _all: true,
            },
          }),
          prisma.company.groupBy({
            by: ['industry'],
            _count: {
              _all: true,
            },
          }),
        ])
        
        // Process status statistics
        const totalActive = statusCounts.find(s => s.status === 'Active')?._count._all || 0
        const totalPassive = statusCounts.find(s => s.status === 'Passive')?._count._all || 0
        
        // Process industry statistics
        const byIndustry = industryCounts.reduce((acc, item) => {
          acc[item.industry] = item._count._all
          return acc
        }, {} as Record<string, number>)
        
        // Calculate new companies this month
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        const newThisMonth = await prisma.company.count({
          where: {
            createdAt: {
              gte: startOfMonth,
            },
          },
        })
        
        const freshStats = {
          totalActive,
          totalPassive,
          byIndustry,
          newThisMonth,
        }
        
        // Cache the fresh statistics
        companyStatisticsCache.set(freshStats)
        
        response.statistics = freshStats
        // Add total count for cursor pagination when stats are requested
        response.pagination.totalCount = totalActive + totalPassive
      }
    }

    // Cache the result for ultra-fast subsequent requests
    CacheService.set(cacheKey, response, CacheTTL.companies.list).catch(error =>
      console.error('Failed to cache cursor response:', error)
    )

    const totalTime = Date.now() - startTime
    const dbTime = Date.now() - dbStartTime
    console.log(`Cursor total response time - ${totalTime}ms (DB: ${dbTime}ms)`)

    return NextResponse.json({
      ...response,
      cached: false,
      cacheHit: false,
      responseTime: totalTime,
      dbTime
    })
  } catch (error) {
    console.error('Error fetching companies with cursor pagination:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}