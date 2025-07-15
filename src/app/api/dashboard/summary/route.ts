import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheService, CacheKeys, CacheTTL } from '@/lib/redis'
import { LightResponseUtils } from '@/lib/compression'
import { CompanyAnniversaryService } from '@/services/business/companyAnniversaryService'

interface DashboardSummary {
  stats: {
    totalCompanies: number
    activeCompaniesCount: number
    passiveCompaniesCount: number
    upcomingEventsCount: number
    activeNotesCount: number
    activeBusinessCardsCount: number
    archivedBusinessCardsCount: number
  }
  recentActiveCompanies: Array<{
    id: number
    legalName: string
    tradingName: string
    logo: string
    status: string
    createdAt: Date
  }>
  nextUpcomingEvents: Array<{
    id: string
    title: string
    date: Date
    time: string
    type: string
    priority: string
    company: string
    companyId: number
    isSystemGenerated?: boolean
  }>
  activeNotes: Array<{
    id: string
    title: string
    content: string
    priority: string
    isCompleted: boolean
    createdAt: Date
    companyId: number
  }>
  cached: boolean
  responseTime: number
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check cache first
    const cacheKey = 'dashboard:summary:v1'
    const cachedData = await CacheService.get<DashboardSummary>(cacheKey)
    
    if (cachedData) {
      return LightResponseUtils.json({
        ...cachedData,
        cached: true,
        responseTime: Date.now() - startTime
      })
    }

    // Fetch all data in parallel with optimized queries
    const [
      companiesStats,
      recentActiveCompanies,
      nextUpcomingEvents,
      activeNotes,
      businessCardsStats,
      allActiveCompanies
    ] = await Promise.all([
      // Company stats
      prisma.company.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { status: { in: ['Active', 'Passive'] } }
      }),
      
      // Recent active companies (last 3, essential fields only)
      prisma.company.findMany({
        where: { status: 'Active' },
        select: {
          id: true,
          legalName: true,
          tradingName: true,
          logo: true,
          status: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 3
      }),
      
      // Next upcoming events (next 3, essential fields only)
      prisma.calendarEvent.findMany({
        where: {
          date: { 
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        },
        select: {
          id: true,
          title: true,
          date: true,
          time: true,
          type: true,
          priority: true,
          company: true,
          companyId: true
        },
        orderBy: [
          { date: 'asc' },
          { time: 'asc' }
        ],
        take: 3
      }),
      
      // Active notes (last 2, essential fields only)
      prisma.note.findMany({
        where: { isCompleted: false },
        select: {
          id: true,
          title: true,
          content: true,
          priority: true,
          isCompleted: true,
          createdAt: true,
          companyId: true
        },
        orderBy: { createdAt: 'desc' },
        take: 2
      }),
      
      // Business cards stats
      prisma.businessCard.groupBy({
        by: ['isArchived'],
        _count: { id: true }
      }),
      
      // All active companies for anniversary events
      prisma.company.findMany({
        where: { status: 'Active' },
        select: {
          id: true,
          tradingName: true,
          registrationDate: true,
          status: true
        }
      })
    ])

    // Process stats
    const totalCompanies = companiesStats.reduce((sum, stat) => sum + stat._count.id, 0)
    const activeCompaniesCount = companiesStats.find(s => s.status === 'Active')?._count.id || 0
    const passiveCompaniesCount = companiesStats.find(s => s.status === 'Passive')?._count.id || 0
    
    const activeBusinessCardsCount = businessCardsStats.find(s => !s.isArchived)?._count.id || 0
    const archivedBusinessCardsCount = businessCardsStats.find(s => s.isArchived)?._count.id || 0

    // Get upcoming events count for next 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    
    const upcomingEventsCount = await prisma.calendarEvent.count({
      where: {
        date: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        }
      }
    })

    const activeNotesCount = await prisma.note.count({
      where: { isCompleted: false }
    })

    // Generate anniversary events for next 30 days
    const anniversaryEvents = CompanyAnniversaryService.generateAnniversaryEventsForCompanies(
      allActiveCompanies,
      new Date(),
      thirtyDaysFromNow
    )

    // Combine database events with anniversary events
    const combinedEvents = [
      ...nextUpcomingEvents.map(event => ({
        ...event,
        isSystemGenerated: false,
        company: event.company || ''
      })),
      ...anniversaryEvents.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        type: event.type,
        priority: event.priority,
        company: event.companyName,
        companyId: event.companyId,
        isSystemGenerated: true
      }))
    ]

    // Sort by date and take top 3
    const sortedEvents = combinedEvents
      .sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        if (dateA.getTime() === dateB.getTime()) {
          return a.time.localeCompare(b.time)
        }
        return dateA.getTime() - dateB.getTime()
      })
      .slice(0, 3)

    const dashboardData: DashboardSummary = {
      stats: {
        totalCompanies,
        activeCompaniesCount,
        passiveCompaniesCount,
        upcomingEventsCount,
        activeNotesCount,
        activeBusinessCardsCount,
        archivedBusinessCardsCount
      },
      recentActiveCompanies,
      nextUpcomingEvents: sortedEvents,
      activeNotes,
      cached: false,
      responseTime: Date.now() - startTime
    }

    // Cache the results for 5 minutes
    await CacheService.set(cacheKey, dashboardData, 300)

    return LightResponseUtils.json(dashboardData)

  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    const totalTime = Date.now() - startTime
    return LightResponseUtils.json(
      { 
        error: 'Failed to fetch dashboard summary',
        responseTime: totalTime 
      },
      { status: 500 }
    )
  }
}