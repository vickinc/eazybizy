import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    const { 
      paidDate, 
      paidAmount, 
      paymentMethod, 
      transactionReference, 
      notes, 
      updatedBy,
      createTransaction = false 
    } = body

    // Get the invoice to validate current status
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        client: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    if (!['SENT', 'OVERDUE'].includes(invoice.status)) {
      return NextResponse.json(
        { error: `Cannot mark invoice as paid with status: ${invoice.status}. Only SENT or OVERDUE invoices can be marked as paid.` },
        { status: 400 }
      )
    }

    // Validate paid amount
    const amountPaid = paidAmount || invoice.totalAmount
    if (amountPaid > invoice.totalAmount) {
      return NextResponse.json(
        { error: 'Paid amount cannot exceed invoice total' },
        { status: 400 }
      )
    }

    const paymentDate = paidDate ? new Date(paidDate) : new Date()

    // Update invoice status to PAID
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: paymentDate,
        updatedAt: new Date(),
        notes: notes ? 
          `${invoice.notes || ''}\n\nPaid on ${paymentDate.toISOString()}: ${notes}`.trim() : 
          `${invoice.notes || ''}\n\nPaid on ${paymentDate.toISOString()}`.trim(),
      },
      include: {
        company: {
          select: { id: true, tradingName: true }
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

    // Create transaction record if requested
    let transaction = null
    if (createTransaction) {
      try {
        transaction = await prisma.transaction.create({
          data: {
            companyId: invoice.fromCompanyId,
            date: paymentDate,
            paidBy: invoice.client?.name || invoice.clientName,
            paidTo: invoice.company.tradingName,
            netAmount: amountPaid,
            incomingAmount: amountPaid,
            currency: invoice.currency,
            baseCurrency: invoice.currency,
            baseCurrencyAmount: amountPaid,
            accountId: paymentMethod || '', // This should be a valid account ID
            accountType: 'BANK', // Default, should be determined from paymentMethod
            reference: invoice.invoiceNumber,
            category: 'Invoice Payment',
            description: `Payment for invoice ${invoice.invoiceNumber}`,
            notes: transactionReference ? `Transaction ref: ${transactionReference}` : undefined,
            status: 'CLEARED',
            reconciliationStatus: 'RECONCILED',
            approvalStatus: 'APPROVED',
            createdBy: updatedBy,
          }
        })
      } catch (transactionError) {
        console.warn('Failed to create transaction:', transactionError)
        // Don't fail the whole operation if transaction creation fails
      }
    }

    // TODO: Create audit log entry
    // await createAuditLog({
    //   entityType: 'invoice',
    //   entityId: id,
    //   action: 'mark_paid',
    //   userId: updatedBy,
    //   changes: { 
    //     status: `${invoice.status} -> PAID`,
    //     paidDate: paymentDate,
    //     paidAmount: amountPaid
    //   }
    // })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      transaction,
      message: `Invoice ${invoice.invoiceNumber} has been marked as paid`
    })

  } catch (error) {
    console.error('Error marking invoice as paid:', error)
    return NextResponse.json(
      { error: 'Failed to mark invoice as paid' },
      { status: 500 }
    )
  }
}