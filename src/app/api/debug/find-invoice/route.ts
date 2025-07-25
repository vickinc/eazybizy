import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceNumber = searchParams.get('number') || 'INV-2025-75770'
    
    // Find invoice by invoice number instead of ID
    const invoice = await prisma.invoice.findFirst({
      where: { 
        invoiceNumber: invoiceNumber 
      },
      include: { 
        items: true,
        bookkeepingEntries: true 
      }
    })
    
    if (!invoice) {
      // Let's see what invoices exist
      const recentInvoices = await prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          clientName: true,
          totalAmount: true,
          status: true,
          createdAt: true
        }
      })
      
      return NextResponse.json({
        error: 'Invoice not found',
        searchedFor: invoiceNumber,
        recentInvoices: recentInvoices,
        message: 'Here are the 5 most recent invoices'
      })
    }
    
    // Get products for this invoice
    const productIds = invoice.items
      .map(item => item.productId)
      .filter((id): id is string => id !== null)
    
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } }
    }) : []
    
    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        itemsCount: invoice.items.length,
        items: invoice.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        }))
      },
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        cost: p.cost,
        costCurrency: p.costCurrency,
        isActive: p.isActive
      })),
      bookkeepingEntries: invoice.bookkeepingEntries.map(entry => ({
        id: entry.id,
        type: entry.type,
        amount: entry.amount,
        cogs: entry.cogs,
        isFromInvoice: entry.isFromInvoice,
        createdAt: entry.createdAt
      })),
      productMatching: {
        itemProductIds: productIds,
        foundProductIds: products.map(p => p.id),
        missingProducts: productIds.filter(id => !products.some(p => p.id === id))
      }
    })

  } catch (error) {
    console.error('Error finding invoice:', error)
    return NextResponse.json(
      { 
        error: 'Failed to find invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}