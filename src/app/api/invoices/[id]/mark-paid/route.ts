import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookkeepingBusinessService } from '@/services/business/bookkeepingBusinessService'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    const { paidDate } = body

    // Use the exact same pattern as the working PUT endpoint
    const paymentDate = paidDate ? new Date(paidDate) : new Date()
    
    // First, check if a revenue entry already exists for this invoice
    const existingEntry = await prisma.bookkeepingEntry.findFirst({
      where: {
        invoiceId: id,
        isFromInvoice: true
      }
    })

    if (existingEntry) {
      // If entry already exists, just update the invoice status
      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: { 
          status: 'PAID',
          paidDate: paymentDate
        },
      })

      return NextResponse.json({
        success: true,
        invoice: updatedInvoice,
        message: `Invoice has been marked as paid`
      })
    }

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
    const calculatedCOGS = BookkeepingBusinessService.calculateInvoiceCOGS(invoice as any, products as any);

    // Update invoice status within a transaction
    const [updatedInvoice, bookkeepingEntry] = await prisma.$transaction(async (tx) => {
      // Update invoice status
      const updated = await tx.invoice.update({
        where: { id },
        data: { 
          status: 'PAID',
          paidDate: paymentDate
        },
      })

      // Create revenue entry
      const entry = await tx.bookkeepingEntry.create({
        data: {
          type: 'revenue',
          category: 'Sales Revenue',
          amount: invoice.totalAmount,
          currency: invoice.currency,
          description: `Invoice ${invoice.invoiceNumber} - ${invoice.clientName}`,
          date: paymentDate,
          companyId: invoice.fromCompanyId,
          reference: invoice.invoiceNumber,
          isFromInvoice: true,
          invoiceId: invoice.id,
          cogs: calculatedCOGS.amount,
          cogsPaid: 0,
          accountType: 'bank' // Default to bank, can be enhanced later
        }
      })

      return [updated, entry]
    })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      bookkeepingEntry: bookkeepingEntry,
      message: `Invoice has been marked as paid and revenue entry created`
    })

  } catch (error) {
    console.error('Error marking invoice as paid:', error)
    return NextResponse.json(
      { 
        error: 'Failed to mark invoice as paid',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}