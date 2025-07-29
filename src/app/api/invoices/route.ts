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
          paymentSources: true,
        },
      }),
      prisma.invoice.count({ where }),
    ])
    
    // Resolve payment method names with priority: BookkeepingEntry > PaymentSources > PaymentMethodInvoices
    const invoicesWithResolvedPaymentMethods = await Promise.all(
      invoices.map(async (invoice) => {
        const paymentMethodNames = []
        
        // For PAID invoices, check BookkeepingEntry records first (most accurate)
        if (invoice.status === 'PAID') {
          try {
            const bookkeepingEntries = await prisma.bookkeepingEntry.findMany({
              where: {
                invoiceId: invoice.id,
                isFromInvoice: true
              },
              select: {
                accountType: true,
                accountId: true
              }
            })
            
            for (const entry of bookkeepingEntries) {
              if (entry.accountId) {
                let name = ''
                
                if (entry.accountType === 'bank') {
                  const bankAccount = await prisma.bankAccount.findUnique({
                    where: { id: entry.accountId },
                    select: { bankName: true, currency: true }
                  })
                  if (bankAccount) {
                    name = `${bankAccount.bankName} (${bankAccount.currency})`
                  }
                } else if (entry.accountType === 'wallet') {
                  const digitalWallet = await prisma.digitalWallet.findUnique({
                    where: { id: entry.accountId },
                    select: { currency: true }
                  })
                  if (digitalWallet) {
                    name = `CRYPTO (${digitalWallet.currency})`
                  }
                }
                
                if (name && !paymentMethodNames.includes(name)) {
                  paymentMethodNames.push(name)
                }
              }
            }
          } catch (error) {
            console.error(`Error resolving BookkeepingEntry payment methods for invoice ${invoice.id}:`, error)
          }
        }
        
        // If no payment methods found from BookkeepingEntry, process polymorphic payment sources
        if (paymentMethodNames.length === 0 && invoice.paymentSources && invoice.paymentSources.length > 0) {
          for (const source of invoice.paymentSources) {
            try {
              let name = ''
              
              if (source.sourceType === 'BANK_ACCOUNT') {
                const bankAccount = await prisma.bankAccount.findUnique({
                  where: { id: source.sourceId },
                  select: { bankName: true, accountName: true, currency: true }
                })
                if (bankAccount) {
                  name = `${bankAccount.bankName} (${bankAccount.currency})`
                }
              } else if (source.sourceType === 'DIGITAL_WALLET') {
                const digitalWallet = await prisma.digitalWallet.findUnique({
                  where: { id: source.sourceId },
                  select: { walletType: true, walletName: true, currency: true }
                })
                if (digitalWallet) {
                  name = `CRYPTO (${digitalWallet.currency})`
                }
              } else if (source.sourceType === 'PAYMENT_METHOD') {
                const paymentMethod = await prisma.paymentMethod.findUnique({
                  where: { id: source.sourceId },
                  select: { name: true, currency: true }
                })
                if (paymentMethod) {
                  name = `${paymentMethod.name} (${paymentMethod.currency})`
                }
              }
              
              if (name && !paymentMethodNames.includes(name)) {
                paymentMethodNames.push(name)
              }
            } catch (error) {
              console.error(`Error resolving payment source ${source.sourceType}:${source.sourceId}`, error)
            }
          }
        }
        
        // Final fallback to old payment method invoices
        if (paymentMethodNames.length === 0 && invoice.paymentMethodInvoices) {
          for (const pmi of invoice.paymentMethodInvoices) {
            if (pmi.paymentMethod) {
              const name = `${pmi.paymentMethod.name} (${pmi.paymentMethod.currency})`
              if (!paymentMethodNames.includes(name)) {
                paymentMethodNames.push(name)
              }
            }
          }
        }
        
        return {
          ...invoice,
          paymentMethodNames
        }
      })
    )
    
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
      data: invoicesWithResolvedPaymentMethods,
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
    const calculatedSubtotal = subtotal || items.reduce((sum: number, item: unknown) => sum + (item.total || 0), 0)
    const calculatedTaxAmount = taxAmount || (calculatedSubtotal * (taxRate || 0) / 100)
    const calculatedTotalAmount = totalAmount || (calculatedSubtotal + calculatedTaxAmount)

    
    
    // Process payment sources for polymorphic relationship
    const paymentSources = (paymentMethodIds || []).map(sourceId => {
      // Determine source type based on ID format or explicit type
      let sourceType = 'PAYMENT_METHOD' // default
      let actualId = sourceId
      
      if (sourceId.startsWith('bank_')) {
        sourceType = 'BANK_ACCOUNT'
        actualId = sourceId.replace(/^bank_/, '')
      } else if (sourceId.startsWith('wallet_')) {
        sourceType = 'DIGITAL_WALLET'
        actualId = sourceId.replace(/^wallet_/, '')
      }
      
      return {
        sourceType,
        sourceId: actualId,
      }
    })

    // Create invoice first
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
      },
    })

    // Create items separately if they exist
    if (items && items.length > 0) {
      try {
        await prisma.invoiceItem.createMany({
          data: items.map((item: any) => ({
            invoiceId: invoice.id,
            productId: item.productId || null,
            productName: item.productName || '',
            description: item.description || '',
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            currency: item.currency || currency,
            total: Number(item.total) || (Number(item.quantity) * Number(item.unitPrice)),
          })),
        })
      } catch (error) {
        console.error('Error creating invoice items:', error)
        throw error
      }
    }

    // Create payment sources separately if they exist
    if (paymentSources && paymentSources.length > 0) {
      // Create polymorphic payment sources
      await prisma.invoicePaymentSource.createMany({
        data: paymentSources.map((source: any) => ({
          invoiceId: invoice.id,
          sourceType: source.sourceType,
          sourceId: source.sourceId,
        })),
      })

      // Create legacy payment method invoices for backward compatibility
      const paymentMethodSources = paymentSources.filter((source: any) => source.sourceType === 'PAYMENT_METHOD')
      if (paymentMethodSources.length > 0) {
        await prisma.paymentMethodInvoice.createMany({
          data: paymentMethodSources.map((source: any) => ({
            invoiceId: invoice.id,
            paymentMethodId: source.sourceId,
          })),
        })
      }
    }

    // Fetch the complete invoice with relations
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        company: true,
        client: true,
        items: true,
        paymentMethodInvoices: {
          include: {
            paymentMethod: true,
          },
        },
        paymentSources: true,
      },
    })
    
    // Invalidate related caches after successful creation
    if (completeInvoice) {
      CacheInvalidationService.invalidateOnInvoiceMutation(
        completeInvoice.id,
        completeInvoice.fromCompanyId,
        completeInvoice.clientId || undefined
      ).catch(error => 
        console.error('Failed to invalidate caches after invoice creation:', error)
      )
    }
    
    return NextResponse.json(completeInvoice, { status: 201 })
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