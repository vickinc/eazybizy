import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'
import { TaxApplicability } from '@/types/taxTreatment.types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = parseInt(searchParams.get('take') || '20')
    
    // Filter parameters
    const searchTerm = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const isActiveFilter = searchParams.get('isActive')
    const applicability = searchParams.get('applicability') || ''
    const companyFilter = searchParams.get('company') || 'all'
    const minRate = parseFloat(searchParams.get('minRate') || '0')
    const maxRate = parseFloat(searchParams.get('maxRate') || '100')
    
    // Sort parameters
    const sortField = searchParams.get('sortField') || 'code'
    const sortDirection = searchParams.get('sortDirection') || 'asc'
    
    // Build where clause
    const where: Prisma.TaxTreatmentWhereInput = {}
    
    // Search filter
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }
    
    // Category filter
    if (category && category !== 'all') {
      where.category = category
    }
    
    // Applicability filter (search in JSON array)
    if (applicability && applicability !== 'all') {
      where.applicability = {
        contains: applicability
      }
    }
    
    // Active filter
    if (isActiveFilter && isActiveFilter !== 'all') {
      where.isActive = isActiveFilter === 'true'
    }
    
    // Company filter
    if (companyFilter !== 'all') {
      where.companyId = parseInt(companyFilter)
    }
    
    // Rate range filter
    if (minRate > 0 || maxRate < 100) {
      where.rate = {
        gte: minRate,
        lte: maxRate
      }
    }
    
    // Build orderBy clause
    const orderBy: Prisma.TaxTreatmentOrderByWithRelationInput = {}
    
    switch (sortField) {
      case 'name':
        orderBy.name = sortDirection as 'asc' | 'desc'
        break
      case 'rate':
        orderBy.rate = sortDirection as 'asc' | 'desc'
        break
      case 'category':
        orderBy.category = sortDirection as 'asc' | 'desc'
        break
      case 'updatedAt':
        orderBy.updatedAt = sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.code = sortDirection as 'asc' | 'desc'
    }
    
    // Execute queries in parallel
    const [treatments, totalCount] = await Promise.all([
      prisma.taxTreatment.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
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
      prisma.taxTreatment.count({ where }),
    ])
    
    // Transform applicability from JSON string back to array
    const transformedTreatments = treatments.map(treatment => ({
      ...treatment,
      applicability: JSON.parse(treatment.applicability) as TaxApplicability[]
    }))
    
    // Calculate statistics
    const stats = await prisma.taxTreatment.aggregate({
      where,
      _count: {
        _all: true,
      },
      _avg: {
        rate: true,
      },
    })
    
    // Calculate counts by category
    const categoryCounts = await prisma.taxTreatment.groupBy({
      by: ['category'],
      where,
      _count: {
        _all: true,
      },
    })
    
    const categoryStats = categoryCounts.reduce((acc, item) => {
      acc[item.category] = item._count._all
      return acc
    }, {} as Record<string, number>)
    
    // Calculate active/inactive counts
    const activeCounts = await prisma.taxTreatment.groupBy({
      by: ['isActive'],
      where,
      _count: {
        _all: true,
      },
    })
    
    const activeStats = activeCounts.reduce((acc, item) => {
      acc[item.isActive ? 'active' : 'inactive'] = item._count._all
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      data: transformedTreatments,
      pagination: {
        total: totalCount,
        skip,
        take,
        hasMore: skip + take < totalCount,
      },
      statistics: {
        total: stats._count._all,
        averageRate: stats._avg.rate || 0,
        categoryStats,
        activeStats,
      },
    })
  } catch (error) {
    console.error('Error fetching tax treatments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax treatments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['code', 'name', 'description', 'rate', 'category', 'applicability']
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }
    
    // Check if code already exists
    const existingTreatment = await prisma.taxTreatment.findUnique({
      where: { code: body.code }
    })
    
    if (existingTreatment) {
      return NextResponse.json(
        { error: 'Tax treatment code already exists' },
        { status: 400 }
      )
    }
    
    // Validate rate is between 0 and 100
    if (body.rate < 0 || body.rate > 100) {
      return NextResponse.json(
        { error: 'Tax rate must be between 0 and 100' },
        { status: 400 }
      )
    }
    
    // Create the treatment
    const treatment = await prisma.taxTreatment.create({
      data: {
        code: body.code,
        name: body.name,
        description: body.description,
        rate: parseFloat(body.rate),
        category: body.category,
        applicability: JSON.stringify(body.applicability),
        isActive: body.isActive ?? true,
        isDefault: body.isDefault ?? false,
        companyId: body.companyId,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
          },
        },
      },
    })
    
    // Transform applicability back to array for response
    const transformedTreatment = {
      ...treatment,
      applicability: JSON.parse(treatment.applicability) as TaxApplicability[]
    }
    
    // Invalidate cache
    CacheInvalidationService.invalidatePattern('tax-treatments')
    
    return NextResponse.json(transformedTreatment, { status: 201 })
  } catch (error) {
    console.error('Error creating tax treatment:', error)
    return NextResponse.json(
      { error: 'Failed to create tax treatment' },
      { status: 500 }
    )
  }
}