import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookkeepingBusinessService } from '@/services/business/bookkeepingBusinessService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'mock'
    
    if (mode === 'real') {
      // Test with real invoice data
      const invoiceNumber = searchParams.get('invoice') || 'INV-COGS-1753395074885'
      
      // Find invoice by number first
      const invoiceByNumber = await prisma.invoice.findFirst({
        where: { invoiceNumber: invoiceNumber },
        include: { items: true }
      })
      
      if (!invoiceByNumber) {
        return NextResponse.json({ error: `Invoice ${invoiceNumber} not found` }, { status: 404 })
      }
      
      const invoiceId = invoiceByNumber.id
      
      // Fetch the actual invoice
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true }
      })
      
      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }
      
      // Fetch products for this invoice
      const productIds = invoice.items
        .map(item => item.productId)
        .filter((id): id is string => id !== null)
      
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      })
      
      // Calculate COGS
      const calculatedCOGS = BookkeepingBusinessService.calculateInvoiceCOGS(invoice as any, products as any)
      
      return NextResponse.json({
        success: true,
        mode: 'real',
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          itemsCount: invoice.items.length,
          items: invoice.items.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity
          }))
        },
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          cost: p.cost,
          costCurrency: p.costCurrency
        })),
        calculatedCOGS: calculatedCOGS,
        message: 'Check console for detailed logs'
      })
    } else {
      // Mock test mode (existing code)
      const mockInvoice = {
        id: 'test-invoice',
        invoiceNumber: 'TEST-001',
        items: [
          {
            id: 'test-item',
            productId: 'cmdhskp7f000039k2hoyr6test',
            productName: 'SVG',
            quantity: 1,
            unitPrice: 1000,
            total: 1000
          }
        ]
      }

      const mockProducts = [
        {
          id: 'cmdhskp7f000039k2hoyr6test',
          name: 'SVG',
          cost: 500,
          costCurrency: 'USD',
          isActive: true
        }
      ]

      const calculatedCOGS = BookkeepingBusinessService.calculateInvoiceCOGS(mockInvoice as any, mockProducts as any)

      return NextResponse.json({
        success: true,
        mode: 'mock',
        mockInvoice: {
          id: mockInvoice.id,
          itemsCount: mockInvoice.items.length
        },
        mockProducts: mockProducts.map(p => ({
          id: p.id,
          name: p.name,
          cost: p.cost
        })),
        calculatedCOGS: calculatedCOGS,
        message: 'Check console for detailed logs'
      })
    }

  } catch (error) {
    console.error('Error in test COGS:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test COGS calculation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}