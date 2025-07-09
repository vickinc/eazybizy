import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { invalidateCompanyStatistics } from '@/services/cache/companyStatisticsCache'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, status } = body
    
    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Company IDs array is required and cannot be empty' },
        { status: 400 }
      )
    }
    
    if (!status || !['Active', 'Passive'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "Active" or "Passive"' },
        { status: 400 }
      )
    }
    
    // Convert string IDs to numbers
    const numericIds = ids.map(id => {
      const numId = parseInt(id.toString())
      if (isNaN(numId)) {
        throw new Error(`Invalid ID: ${id}`)
      }
      return numId
    })
    
    // Check which companies exist
    const existingCompanies = await prisma.company.findMany({
      where: {
        id: {
          in: numericIds,
        },
      },
      select: {
        id: true,
        legalName: true,
        tradingName: true,
        status: true,
      },
    })
    
    if (existingCompanies.length === 0) {
      return NextResponse.json(
        { error: 'No valid companies found for the provided IDs' },
        { status: 404 }
      )
    }
    
    const existingIds = existingCompanies.map(c => c.id)
    const notFoundIds = numericIds.filter(id => !existingIds.includes(id))
    
    // Update the companies
    const updateResult = await prisma.company.updateMany({
      where: {
        id: {
          in: existingIds,
        },
      },
      data: {
        status,
      },
    })
    
    // Fetch the updated companies to return them
    const updatedCompanies = await prisma.company.findMany({
      where: {
        id: {
          in: existingIds,
        },
      },
      // Removed expensive _count include for better performance
    })
    
    // Invalidate statistics cache after bulk status update
    await invalidateCompanyStatistics()
    
    // Invalidate all company-related caches for immediate UI updates
    await CacheInvalidationService.invalidateOnCompanyMutation()
    
    return NextResponse.json({
      message: `Successfully updated ${updateResult.count} company status(es) to ${status}`,
      updated: updatedCompanies,
      notFound: notFoundIds.length > 0 ? notFoundIds : undefined,
      summary: {
        totalRequested: numericIds.length,
        successfullyUpdated: updateResult.count,
        notFound: notFoundIds.length,
      },
    })
  } catch (error) {
    console.error('Error bulk updating company statuses:', error)
    
    if (error instanceof Error && error.message.includes('Invalid ID')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to bulk update company statuses' },
      { status: 500 }
    )
  }
}