import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = parseInt(searchParams.get('take') || '20')
    
    // Filter parameters
    const searchTerm = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || 'all'
    const industryFilter = searchParams.get('industry') || ''
    const companyFilter = searchParams.get('company') || 'all'
    
    // Sort parameters
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    
    // Build where clause
    const where: Prisma.ClientWhereInput = {}
    
    // Search filter
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { contactPersonName: { contains: searchTerm, mode: 'insensitive' } },
        { industry: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } },
        { country: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      where.status = statusFilter.toUpperCase() as Prisma.EnumClientStatusFilter
    }
    
    // Industry filter
    if (industryFilter) {
      where.industry = industryFilter
    }
    
    // Company filter
    if (companyFilter !== 'all') {
      where.companyId = parseInt(companyFilter)
    }
    
    // Build orderBy clause
    const orderBy: Prisma.ClientOrderByWithRelationInput = {}
    
    switch (sortField) {
      case 'name':
        orderBy.name = sortDirection as 'asc' | 'desc'
        break
      case 'email':
        orderBy.email = sortDirection as 'asc' | 'desc'
        break
      case 'industry':
        orderBy.industry = sortDirection as 'asc' | 'desc'
        break
      case 'totalInvoiced':
        orderBy.totalInvoiced = sortDirection as 'asc' | 'desc'
        break
      case 'lastInvoiceDate':
        orderBy.lastInvoiceDate = sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.createdAt = sortDirection as 'asc' | 'desc'
    }
    
    // Execute queries in parallel
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
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
          _count: {
            select: {
              invoices: true,
            },
          },
          invoices: {
            select: {
              id: true,
              totalAmount: true,
              currency: true,
              status: true,
              issueDate: true,
              dueDate: true,
              paidDate: true,
            },
            orderBy: {
              issueDate: 'desc'
            },
            take: 5, // Latest 5 invoices for quick overview
          },
        },
      }),
      prisma.client.count({ where }),
    ])
    
    // Calculate statistics
    const stats = await prisma.client.aggregate({
      where,
      _count: {
        _all: true,
      },
      _sum: {
        totalInvoiced: true,
        totalPaid: true,
      },
    })
    
    // Calculate status counts
    const statusCounts = await prisma.client.groupBy({
      by: ['status'],
      where,
      _count: {
        _all: true,
      },
    })
    
    const statusStats = statusCounts.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count._all
      return acc
    }, {} as Record<string, number>)
    
    // Enhance clients with calculated invoice totals
    const enhancedClients = clients.map(client => {
      const invoiceStats = client.invoices.reduce(
        (acc, invoice) => {
          acc.totalInvoiced += invoice.totalAmount
          acc.totalPaid += invoice.status === 'PAID' ? invoice.totalAmount : 0
          acc.totalOverdue += invoice.status === 'OVERDUE' ? invoice.totalAmount : 0
          acc.totalPending += ['DRAFT', 'SENT'].includes(invoice.status) ? invoice.totalAmount : 0
          
          // Count by status
          acc.statusCounts[invoice.status.toLowerCase()] = (acc.statusCounts[invoice.status.toLowerCase()] || 0) + 1
          
          // Track latest invoice date
          if (!acc.lastInvoiceDate || new Date(invoice.issueDate) > new Date(acc.lastInvoiceDate)) {
            acc.lastInvoiceDate = invoice.issueDate
          }
          
          // Track payment performance
          if (invoice.status === 'PAID' && invoice.paidDate) {
            const paymentDays = Math.ceil(
              (new Date(invoice.paidDate).getTime() - new Date(invoice.issueDate).getTime()) / (1000 * 60 * 60 * 24)
            )
            acc.paymentDays.push(paymentDays)
          }
          
          return acc
        },
        {
          totalInvoiced: 0,
          totalPaid: 0,
          totalOverdue: 0,
          totalPending: 0,
          statusCounts: {} as Record<string, number>,
          lastInvoiceDate: null as string | null,
          paymentDays: [] as number[],
        }
      )
      
      // Calculate average payment days
      const avgPaymentDays = invoiceStats.paymentDays.length > 0
        ? invoiceStats.paymentDays.reduce((sum, days) => sum + days, 0) / invoiceStats.paymentDays.length
        : null
      
      return {
        ...client,
        calculatedStats: {
          totalInvoices: client._count.invoices,
          totalInvoiced: invoiceStats.totalInvoiced,
          totalPaid: invoiceStats.totalPaid,
          totalOverdue: invoiceStats.totalOverdue,
          totalPending: invoiceStats.totalPending,
          lastInvoiceDate: invoiceStats.lastInvoiceDate,
          averagePaymentDays: avgPaymentDays,
          statusBreakdown: invoiceStats.statusCounts,
          paymentRate: invoiceStats.totalInvoiced > 0 ? (invoiceStats.totalPaid / invoiceStats.totalInvoiced) * 100 : 0,
        },
      }
    })

    return NextResponse.json({
      data: enhancedClients,
      pagination: {
        total: totalCount,
        skip,
        take,
        hasMore: skip + take < totalCount,
      },
      statistics: {
        total: stats._count._all,
        totalRevenue: stats._sum.totalInvoiced || 0,
        totalPaid: stats._sum.totalPaid || 0,
        statusStats,
      },
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received client creation request:', body)
    
    const {
      companyId,
      clientType,
      name,
      contactPersonName,
      contactPersonPosition,
      email,
      phone,
      website = '',
      address,
      city,
      zipCode,
      country,
      industry,
      status = 'ACTIVE',
      notes = '',
      registrationNumber,
      vatNumber,
      passportNumber,
      dateOfBirth,
    } = body
    
    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required fields' },
        { status: 400 }
      )
    }
    
    // Additional validation for Legal Entity
    if (clientType === 'LEGAL_ENTITY' && !contactPersonName) {
      return NextResponse.json(
        { error: 'Contact person name is required for legal entities' },
        { status: 400 }
      )
    }
    
    // Additional validation for Individual
    if (clientType === 'INDIVIDUAL' && !passportNumber) {
      return NextResponse.json(
        { error: 'Passport number is required for individuals' },
        { status: 400 }
      )
    }
    
    // Additional validation for Legal Entity registration
    if (clientType === 'LEGAL_ENTITY' && !registrationNumber) {
      return NextResponse.json(
        { error: 'Registration number is required for legal entities' },
        { status: 400 }
      )
    }
    
    const client = await prisma.client.create({
      data: {
        companyId: companyId || null,
        clientType,
        name,
        contactPersonName,
        contactPersonPosition,
        email,
        phone: phone || '',
        website,
        address: address || '',
        city: city || '',
        zipCode: zipCode || '',
        country: country || '',
        industry: industry || '',
        status,
        notes,
        registrationNumber,
        vatNumber,
        passportNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
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
    
    // Invalidate related caches after successful creation
    CacheInvalidationService.invalidateOnClientMutation(
      client.id,
      client.companyId || undefined
    ).catch(error => 
      console.error('Failed to invalidate caches after client creation:', error)
    )
    
    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    
    // Provide more specific error messages for common issues
    let errorMessage = 'Failed to create client'
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        errorMessage = 'A client with this email already exists'
      } else if (error.message.includes('Required field')) {
        errorMessage = 'Missing required field'
      } else {
        errorMessage = `Failed to create client: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}