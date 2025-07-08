import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const companyId = parseInt(params.id)
    
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: 'Invalid company ID' },
        { status: 400 }
      )
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Fetch counts in parallel
    const [clientsCount, invoicesCount, productsCount] = await Promise.all([
      prisma.client.count({
        where: { companyId }
      }),
      prisma.invoice.count({
        where: { fromCompanyId: companyId }
      }),
      prisma.product.count({
        where: { companyId }
      })
    ])

    return NextResponse.json({
      companyId,
      counts: {
        clients: clientsCount,
        invoices: invoicesCount,
        products: productsCount,
      }
    })
  } catch (error) {
    console.error('Error fetching company counts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company counts' },
      { status: 500 }
    )
  }
}