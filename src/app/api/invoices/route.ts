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
    const companyFilter = searchParams.get('company') || 'all'
    const clientFilter = searchParams.get('client') || ''
    const dateRangeFilter = searchParams.get('dateRange') || 'all'
    const currencyFilter = searchParams.get('currency') || ''
    
    // Sort parameters
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    
    // Build where clause
    const where: Prisma.InvoiceWhereInput = {}
    
    // Search filter
    if (searchTerm) {
      where.OR = [
        { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
        { clientName: { contains: searchTerm, mode: 'insensitive' } },
        { clientEmail: { contains: searchTerm, mode: 'insensitive' } },
        { notes: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      where.status = statusFilter.toUpperCase() as Prisma.EnumInvoiceStatusFilter
    }
    
    // Company filter
    if (companyFilter !== 'all') {
      where.fromCompanyId = parseInt(companyFilter)
    }
    
    // Client filter
    if (clientFilter) {
      where.clientId = clientFilter
    }
    
    // Currency filter
    if (currencyFilter) {
      where.currency = currencyFilter
    }
    
    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date()
      let startDate: Date
      
      switch (dateRangeFilter) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          where.createdAt = { gte: startDate, lte: endDate }
          break
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1)
          where.createdAt = { gte: startDate }
          break
        case 'lastYear':
          startDate = new Date(now.getFullYear() - 1, 0, 1)
          const endYear = new Date(now.getFullYear() - 1, 11, 31)
          where.createdAt = { gte: startDate, lte: endYear }
          break
        default:
          if (dateRangeFilter === 'thisMonth') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            where.createdAt = { gte: startDate }
          }
      }
    }
    
    // Build orderBy clause
    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {}
    
    switch (sortField) {
      case 'invoiceNumber':
        orderBy.invoiceNumber = sortDirection as 'asc' | 'desc'
        break
      case 'client':
        orderBy.clientName = sortDirection as 'asc' | 'desc'
        break
      case 'amount':
        orderBy.totalAmount = sortDirection as 'asc' | 'desc'
        break
      case 'dueDate':
        orderBy.dueDate = sortDirection as 'asc' | 'desc'
        break
      case 'company':
        orderBy.company = { tradingName: sortDirection as 'asc' | 'desc' }
        break
      case 'sentDate':
        orderBy.updatedAt = sortDirection as 'asc' | 'desc' // Use updatedAt as approximation for sent date
        break
      case 'paidDate':
        orderBy.paidDate = sortDirection as 'asc' | 'desc'
        break
      case 'currency':
        orderBy.currency = sortDirection as 'asc' | 'desc'
        break
      case 'paymentMethod':
        // Payment methods are complex, fallback to created date for now
        orderBy.createdAt = sortDirection as 'asc' | 'desc'
        break
      default:
        orderBy.createdAt = sortDirection as 'asc' | 'desc'
    }
    
    // Execute queries in parallel
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
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
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              clientType: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  currency: true,
                },
              },
            },
          },
          paymentMethodInvoices: {
            include: {
              paymentMethod: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  accountName: true,
                  bankName: true,
                  bankAddress: true,
                  iban: true,
                  swiftCode: true,
                  accountNumber: true,
                  walletAddress: true,
                  currency: true,
                  details: true,
                },
              },
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ])
    
    // Calculate statistics
    const stats = await prisma.invoice.aggregate({
      where,
      _count: {
        _all: true,
      },
      _sum: {
        totalAmount: true,
      },
    })
    
    // Calculate status counts
    const statusCounts = await prisma.invoice.groupBy({
      by: ['status'],
      where,
      _count: {
        _all: true,
      },
      _sum: {
        totalAmount: true,
      },
    })
    
    const statusStats = statusCounts.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = {
        count: item._count._all,
        value: item._sum.totalAmount || 0,
      }
      return acc
    }, {} as Record<string, { count: number; value: number }>)
    
    return NextResponse.json({
      data: invoices,
      pagination: {
        total: totalCount,
        skip,
        take,
        hasMore: skip + take < totalCount,
      },
      statistics: {
        total: stats._count._all,
        totalValue: stats._sum.totalAmount || 0,
        statusStats,
      },
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      invoiceNumber,
      clientName,
      clientEmail,
      clientAddress,
      clientId,
      subtotal = 0,
      currency = 'USD',
      status = 'DRAFT',
      dueDate,
      issueDate,
      template = 'professional',
      taxRate = 0,
      taxAmount = 0,
      totalAmount = 0,
      fromCompanyId,
      notes = '',
      items = [],
      paymentMethodIds = [],
    } = body

    // Calculate totals if not provided
    const calculatedSubtotal = subtotal || items.reduce((sum: number, item: any) => sum + (item.total || 0), 0)
    const calculatedTaxAmount = taxAmount || (calculatedSubtotal * (taxRate || 0) / 100)
    const calculatedTotalAmount = totalAmount || (calculatedSubtotal + calculatedTaxAmount)

    
    
    // Create invoice with items and payment methods
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName,
        clientEmail,
        clientAddress: clientAddress || '',
        clientId: clientId || null,
        subtotal: calculatedSubtotal,
        currency,
        status,
        dueDate: new Date(dueDate),
        issueDate: new Date(issueDate),
        template,
        taxRate: Number(taxRate) || 0,
        taxAmount: calculatedTaxAmount,
        totalAmount: calculatedTotalAmount,
        fromCompanyId: Number(fromCompanyId),
        notes: notes || '',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            productName: item.productName || '',
            description: item.description || '',
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            currency: item.currency || currency,
            total: Number(item.total) || (Number(item.quantity) * Number(item.unitPrice)),
          })),
        },
        paymentMethodInvoices: {
          create: (paymentMethodIds || []).map((paymentMethodId: string) => ({
            paymentMethodId,
          })),
        },
      },
      include: {
        company: true,
        client: true,
        items: true,
        paymentMethodInvoices: {
          include: {
            paymentMethod: true,
          },
        },
      },
    })
    
    // Invalidate related caches after successful creation
    CacheInvalidationService.invalidateOnInvoiceMutation(
      invoice.id,
      invoice.fromCompanyId,
      invoice.clientId || undefined
    ).catch(error => 
      console.error('Failed to invalidate caches after invoice creation:', error)
    )
    
    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}