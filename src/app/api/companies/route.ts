import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CompanyBusinessService } from '@/services/business/companyBusinessService'
import { invalidateCompanyStatistics } from '@/services/cache/companyStatisticsCache'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'
import { AnniversaryEventService } from '@/services/business/anniversaryEventService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const skip = parseInt(searchParams.get('skip') || '0')
    const takeParam = searchParams.get('take')
    const take = takeParam ? parseInt(takeParam) : 20
    
    // Filter parameters
    const searchTerm = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || 'all'
    const industryFilter = searchParams.get('industry') || ''
    
    // Sort parameters
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    
    // Build where clause
    const where: Prisma.CompanyWhereInput = {}
    
    // Search filter
    if (searchTerm) {
      // SQLite doesn't support mode 'insensitive' - using contains only
      where.OR = [
        { legalName: { contains: searchTerm } },
        { tradingName: { contains: searchTerm } },
        { industry: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { registrationNo: { contains: searchTerm } },
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
      case 'legalName':
        orderBy.legalName = sortDirection as 'asc' | 'desc'
        break
      case 'tradingName':
        orderBy.tradingName = sortDirection as 'asc' | 'desc'
        break
      case 'industry':
        orderBy.industry = sortDirection as 'asc' | 'desc'
        break
      case 'updatedAt':
        orderBy.updatedAt = sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.createdAt = sortDirection as 'asc' | 'desc'
    }
    
    // Execute only essential queries in parallel for fast response
    // If take is very high (9999+), fetch all companies without pagination
    const shouldPaginate = take < 9999
    
    const [companies, totalCount] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy,
        ...(shouldPaginate ? { skip, take } : {}),
      }),
      prisma.company.count({ where }),
    ])

    return NextResponse.json({
      data: companies,
      pagination: {
        total: totalCount,
        skip: shouldPaginate ? skip : 0,
        take: shouldPaginate ? take : companies.length,
        hasMore: shouldPaginate ? skip + take < totalCount : false,
      },
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      legalName,
      tradingName,
      registrationNo,
      registrationDate,
      countryOfRegistration,
      baseCurrency,
      businessLicenseNr,
      vatNumber,
      industry,
      address,
      phone,
      email,
      website,
      status = 'Active',
      logo = '',
      facebookUrl,
      instagramUrl,
      xUrl,
      youtubeUrl,
      whatsappNumber,
      telegramNumber,
      shareholders = [],
      representatives = [],
      mainContactPerson,
    } = body
    
    // Validate required fields
    if (!legalName || !tradingName || !registrationNo || !registrationDate || !countryOfRegistration || !baseCurrency) {
      return NextResponse.json(
        { error: 'Legal name, trading name, registration number, registration date, country of registration, and base currency are required' },
        { status: 400 }
      )
    }
    
    // Check if registration number already exists
    const existingCompany = await prisma.company.findUnique({
      where: { registrationNo },
    })
    
    if (existingCompany) {
      return NextResponse.json(
        { error: 'A company with this registration number already exists' },
        { status: 409 }
      )
    }
    
    // Validate and fix logo before creation
    const validatedLogo = CompanyBusinessService.validateAndFixLogo(logo, tradingName);

    // Create company (simplified without transaction for now)
    const company = await prisma.company.create({
      data: {
        legalName,
        tradingName,
        registrationNo,
        registrationDate: new Date(registrationDate),
        countryOfRegistration,
        baseCurrency,
        businessLicenseNr,
        vatNumber,
        industry,
        address,
        phone,
        email,
        website,
        status,
        logo: validatedLogo,
        facebookUrl,
        instagramUrl,
        xUrl,
        youtubeUrl,
        whatsappNumber,
        telegramNumber,
        mainContactEmail: mainContactPerson?.email,
        mainContactType: mainContactPerson?.type,
      },
    });

    if (!company) {
      throw new Error('Failed to create company');
    }
    
    // Generate anniversary events for the new company
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 2); // Generate events for next 2 years
      
      await AnniversaryEventService.generateAndStoreAnniversaryEvents(
        company.id,
        startDate,
        endDate,
        undefined // userId - let the service handle auth
      );
      
      console.log(`Generated anniversary events for new company: ${company.tradingName} (ID: ${company.id})`);
    } catch (anniversaryError) {
      // Don't fail company creation if anniversary generation fails
      console.warn(`Failed to generate anniversary events for company ${company.id}:`, anniversaryError);
    }
    
    // Invalidate statistics cache after creating a company
    await invalidateCompanyStatistics()
    
    // Smart cache invalidation for all related caches
    await CacheInvalidationService.invalidateOnCompanyMutation(company.id)
    
    // Invalidate calendar cache so anniversary events appear immediately
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendar/events/fast?pattern=calendar:*`, {
        method: 'DELETE'
      });
      if (response.ok) {
        console.log('Calendar cache invalidated successfully');
      }
    } catch (cacheError) {
      console.warn('Failed to invalidate calendar cache:', cacheError);
    }
    
    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error)
    
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A company with this registration number already exists' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    )
  }
}