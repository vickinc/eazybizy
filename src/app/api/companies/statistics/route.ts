import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { companyStatisticsCache } from '@/services/cache/companyStatisticsCache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('force') === 'true'
    const lightweight = searchParams.get('lightweight') === 'true'
    
    // Check cache first unless force refresh is requested
    if (!forceRefresh && !lightweight) {
      const cachedStats = companyStatisticsCache.get()
      if (cachedStats) {
        return NextResponse.json({
          overview: {
            total: cachedStats.totalActive + cachedStats.totalPassive,
            totalActive: cachedStats.totalActive,
            totalPassive: cachedStats.totalPassive,
            newThisMonth: cachedStats.newThisMonth,
          },
          byStatus: {
            active: cachedStats.totalActive,
            passive: cachedStats.totalPassive,
          },
          byIndustry: cachedStats.byIndustry,
          cached: true,
          cacheInfo: companyStatisticsCache.getInfo()
        })
      }
    }

    // Prevent duplicate expensive queries
    if (companyStatisticsCache.isCurrentlyRefreshing() && !forceRefresh) {
      return NextResponse.json(
        { error: 'Statistics are being refreshed, please try again shortly' },
        { status: 429 }
      )
    }

    
    if (!lightweight) {
      companyStatisticsCache.markAsRefreshing()
    }
    // Get all companies for basic statistics
    const [statusCounts, industryCounts, totalCompanies] = await Promise.all([
      // Count by status
      prisma.company.groupBy({
        by: ['status'],
        _count: {
          _all: true,
        },
      }),
      
      // Count by industry
      prisma.company.groupBy({
        by: ['industry'],
        _count: {
          _all: true,
        },
      }),
      
      // Total count
      prisma.company.count(),
    ])
    
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
    
    // Calculate new companies last month for comparison
    const startOfLastMonth = new Date(startOfMonth)
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1)
    
    const newLastMonth = await prisma.company.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lt: startOfMonth,
        },
      },
    })
    
    // Process status statistics
    const totalActive = statusCounts.find(s => s.status === 'Active')?._count._all || 0
    const totalPassive = statusCounts.find(s => s.status === 'Passive')?._count._all || 0
    
    // Process industry statistics
    const byIndustry = industryCounts.reduce((acc, item) => {
      acc[item.industry] = item._count._all
      return acc
    }, {} as Record<string, number>)
    
    // Calculate growth rate
    const growthRate = newLastMonth > 0 
      ? ((newThisMonth - newLastMonth) / newLastMonth) * 100 
      : newThisMonth > 0 ? 100 : 0
    
    // Get top industries (sorted by count, descending)
    const topIndustries = Object.entries(byIndustry)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([industry, count]) => ({ industry, count }))
    
    // Get recent companies (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentCompanies = await prisma.company.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        id: true,
        legalName: true,
        tradingName: true,
        industry: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })
    
    // Company size distribution (by number of clients)
    const companiesWithClientCounts = await prisma.company.findMany({
      select: {
        id: true,
        _count: {
          select: {
            clients: true,
          },
        },
      },
    })
    
    const sizeDistribution = {
      small: companiesWithClientCounts.filter(c => c._count.clients <= 10).length,
      medium: companiesWithClientCounts.filter(c => c._count.clients > 10 && c._count.clients <= 50).length,
      large: companiesWithClientCounts.filter(c => c._count.clients > 50).length,
    }

    // Cache the basic statistics for cursor pagination
    if (!lightweight) {
      const basicStats = {
        totalActive,
        totalPassive,
        byIndustry,
        newThisMonth,
      }
      companyStatisticsCache.set(basicStats)
    }

    return NextResponse.json({
      overview: {
        total: totalCompanies,
        totalActive,
        totalPassive,
        newThisMonth,
        newLastMonth,
        growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimal places
      },
      byStatus: {
        active: totalActive,
        passive: totalPassive,
      },
      byIndustry,
      topIndustries,
      sizeDistribution,
      recentCompanies,
      trends: {
        monthlyGrowth: {
          current: newThisMonth,
          previous: newLastMonth,
          change: newThisMonth - newLastMonth,
          changePercent: growthRate,
        },
      },
      cached: false,
      cacheInfo: companyStatisticsCache.getInfo()
    })
  } catch (error) {
    console.error('Error fetching company statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company statistics' },
      { status: 500 }
    )
  }
}