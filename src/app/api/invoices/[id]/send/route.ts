import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    const { sendDate, emailSent = false, updatedBy, notes } = body

    // Get the invoice to validate current status
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { id: true, status: true, invoiceNumber: true, dueDate: true }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot send invoice with status: ${invoice.status}. Only DRAFT invoices can be sent.` },
        { status: 400 }
      )
    }

    // Update invoice status to SENT
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'SENT',
        updatedAt: new Date(),
        notes: notes ? `${invoice.notes || ''}\n\nSent on ${new Date().toISOString()}: ${notes}`.trim() : invoice.notes,
      },
      include: {
        company: {
          select: { id: true, tradingName: true, email: true }
        },
        client: {
          select: { id: true, name: true, email: true }
        },
        items: true,
        paymentMethodInvoices: {
          include: {
            paymentMethod: true
          }
        }
      }
    })

    // Check if invoice should be marked as overdue
    const now = new Date()
    if (new Date(updatedInvoice.dueDate) < now) {
      await prisma.invoice.update({
        where: { id },
        data: { status: 'OVERDUE' }
      })
      updatedInvoice.status = 'OVERDUE' as any
    }

    // TODO: Implement email sending if requested
    if (emailSent) {
      // Add email sending logic here
    }

    // TODO: Create audit log entry
    // await createAuditLog({
    //   entityType: 'invoice',
    //   entityId: id,
    //   action: 'send',
    //   userId: updatedBy,
    //   changes: { status: 'DRAFT -> SENT' }
    // })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: `Invoice ${invoice.invoiceNumber} has been sent successfully`
    })

  } catch (error) {
    console.error('Error sending invoice:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}