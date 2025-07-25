import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookkeepingBusinessService } from '@/services/business/bookkeepingBusinessService'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    // Fetch the complete invoice with items and company info
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        company: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Fetch products for COGS calculation
    const productIds = invoice.items
      .map(item => item.productId)
      .filter((id): id is string => id !== null)
    
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: {
        id: { in: productIds }
      }
    }) : []

    // Calculate COGS
    const calculatedCOGS = BookkeepingBusinessService.calculateInvoiceCOGS(invoice as any, products as any)

    // Manual calculation for comparison
    let manualCOGS = 0
    const itemBreakdown = invoice.items.map(item => {
      const product = products.find(p => p.id === item.productId)
      if (product) {
        const itemCOGS = product.cost * item.quantity
        manualCOGS += itemCOGS
        return {
          itemId: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          productCost: product.cost,
          itemCOGS: itemCOGS,
          productFound: true
        }
      } else {
        return {
          itemId: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          productCost: 0,
          itemCOGS: 0,
          productFound: false
        }
      }
    })

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        itemsCount: invoice.items.length
      },
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        cost: p.cost,
        costCurrency: p.costCurrency,
        isActive: p.isActive
      })),
      cogsCalculation: {
        serviceResult: calculatedCOGS,
        manualTotal: manualCOGS,
        itemBreakdown: itemBreakdown
      }
    })

  } catch (error) {
    console.error('Error debugging invoice COGS:', error)
    return NextResponse.json(
      { 
        error: 'Failed to debug invoice COGS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}