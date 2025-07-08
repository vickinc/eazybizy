import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { invalidateCompanyStatistics } from '@/services/cache/companyStatisticsCache'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body
    
    // Validate input
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Company IDs array is required and cannot be empty' },
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
    
    // Check related data for each company separately for better performance
    const companiesWithCounts = await Promise.all(
      existingCompanies.map(async (company) => {
        const [clientsCount, invoicesCount, productsCount] = await Promise.all([
          prisma.client.count({ where: { companyId: company.id } }),
          prisma.invoice.count({ where: { fromCompanyId: company.id } }),
          prisma.product.count({ where: { companyId: company.id } })
        ])
        
        return {
          ...company,
          _count: {
            clients: clientsCount,
            invoices: invoicesCount,
            products: productsCount
          }
        }
      })
    )
    
    // Check which companies have related data and cannot be deleted
    const companiesWithRelatedData = companiesWithCounts.filter(company => 
      company._count.clients > 0 ||
      company._count.invoices > 0 ||
      company._count.products > 0
    )
    
    const safeToDeleteIds = companiesWithCounts
      .filter(company => 
        company._count.clients === 0 &&
        company._count.invoices === 0 &&
        company._count.products === 0
      )
      .map(c => c.id)
    
    let deleteResult = { count: 0 }
    
    // Only delete companies that are safe to delete
    if (safeToDeleteIds.length > 0) {
      deleteResult = await prisma.company.deleteMany({
        where: {
          id: {
            in: safeToDeleteIds,
          },
        },
      })
      
      // Invalidate statistics cache after bulk delete
      await invalidateCompanyStatistics()
    }
    
    return NextResponse.json({
      message: deleteResult.count > 0 
        ? `Successfully deleted ${deleteResult.count} company(ies)` 
        : 'No companies were deleted',
      summary: {
        totalRequested: numericIds.length,
        successfullyDeleted: deleteResult.count,
        notFound: notFoundIds.length,
        blockedByRelatedData: companiesWithRelatedData.length,
      },
      notFound: notFoundIds.length > 0 ? notFoundIds : undefined,
      blockedCompanies: companiesWithRelatedData.length > 0 ? companiesWithRelatedData.map(c => ({
        id: c.id,
        name: c.legalName,
        tradingName: c.tradingName,
        relatedData: {
          clients: c._count.clients,
          invoices: c._count.invoices,
          products: c._count.products,
        },
        reason: 'Cannot delete company with existing clients, invoices, or products',
      })) : undefined,
    })
  } catch (error) {
    console.error('Error bulk deleting companies:', error)
    
    if (error instanceof Error && error.message.includes('Invalid ID')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to bulk delete companies' },
      { status: 500 }
    )
  }
}