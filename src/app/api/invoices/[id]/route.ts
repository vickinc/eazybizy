import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
            address: true,
            phone: true,
            email: true,
            website: true,
            vatNumber: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            clientType: true,
            address: true,
            city: true,
            zipCode: true,
            country: true,
            phone: true,
            website: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
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
                iban: true,
                swiftCode: true,
                walletAddress: true,
                currency: true,
                details: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()
    
    const {
      invoiceNumber,
      clientName,
      clientEmail,
      clientAddress,
      clientId,
      subtotal,
      currency,
      status,
      dueDate,
      issueDate,
      paidDate,
      template,
      taxRate,
      taxAmount,
      totalAmount,
      fromCompanyId,
      notes,
      items = [],
      paymentMethodIds = [],
    } = body

    // Use transaction to update invoice, items, and payment methods
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Delete existing items and payment method associations
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      })
      
      await tx.paymentMethodInvoice.deleteMany({
        where: { invoiceId: params.id },
      })

      // Update invoice with new data
      return await tx.invoice.update({
        where: { id: params.id },
        data: {
          invoiceNumber,
          clientName,
          clientEmail,
          clientAddress,
          clientId,
          subtotal,
          currency,
          status,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          issueDate: issueDate ? new Date(issueDate) : undefined,
          paidDate: paidDate ? new Date(paidDate) : null,
          template,
          taxRate,
          taxAmount,
          totalAmount,
          fromCompanyId,
          notes,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              productName: item.productName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              currency: item.currency,
              total: item.total,
            })),
          },
          paymentMethodInvoices: {
            create: paymentMethodIds.map((paymentMethodId: string) => ({
              paymentMethodId,
            })),
          },
        },
        include: {
          company: true,
          client: true,
          items: {
            include: {
              product: true,
            },
          },
          paymentMethodInvoices: {
            include: {
              paymentMethod: true,
            },
          },
        },
      })
    })

    // Invalidate related caches after successful update
    CacheInvalidationService.invalidateOnInvoiceMutation(
      updatedInvoice.id,
      updatedInvoice.fromCompanyId,
      updatedInvoice.clientId || undefined
    ).catch(error => 
      console.error('Failed to invalidate caches after invoice update:', error)
    )

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Delete invoice (cascade will handle items and payment method associations)
    await prisma.invoice.delete({
      where: { id: params.id },
    })

    // Invalidate related caches after successful deletion
    CacheInvalidationService.invalidateOnInvoiceMutation(
      params.id,
      invoice.fromCompanyId,
      invoice.clientId || undefined
    ).catch(error => 
      console.error('Failed to invalidate caches after invoice deletion:', error)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}