import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookkeepingBusinessService } from '@/services/business/bookkeepingBusinessService'

interface RouteParams {
  params: { id: string }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { paidDate, accountId, accountType } = body

    // Validate required account information
    if (!accountId || !accountType) {
      return NextResponse.json(
        { error: 'Account ID and account type are required' },
        { status: 400 }
      )
    }

    // Validate account type
    if (!['bank', 'wallet'].includes(accountType)) {
      return NextResponse.json(
        { error: 'Account type must be either "bank" or "wallet"' },
        { status: 400 }
      )
    }

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

    // Validate that the selected account belongs to the invoice's company
    let accountExists = false;
    if (accountType === 'bank') {
      const bankAccount = await prisma.bankAccount.findFirst({
        where: {
          id: accountId,
          companyId: invoice.fromCompanyId
        }
      });
      accountExists = !!bankAccount;
    } else if (accountType === 'wallet') {
      const digitalWallet = await prisma.digitalWallet.findFirst({
        where: {
          id: accountId,
          companyId: invoice.fromCompanyId
        }
      });
      accountExists = !!digitalWallet;
    }

    if (!accountExists) {
      return NextResponse.json(
        { error: 'Selected account does not belong to the invoice company' },
        { status: 400 }
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
    const calculatedCOGS = BookkeepingBusinessService.calculateInvoiceCOGS(invoice, products);

    // Update invoice status within a transaction
    const [updatedInvoice, bookkeepingEntry, transactionRecord] = await prisma.$transaction(async (tx) => {
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
          accountId: accountId,
          accountType: accountType
        }
      })

      // Create corresponding transaction record for balance calculations
      const transaction = await tx.transaction.create({
        data: {
          companyId: invoice.fromCompanyId,
          date: paymentDate,
          paidBy: invoice.clientName,
          paidTo: invoice.company.tradingName,
          netAmount: invoice.totalAmount,
          incomingAmount: invoice.totalAmount,
          outgoingAmount: 0,
          currency: invoice.currency,
          baseCurrency: invoice.currency, // Assuming same currency for now
          baseCurrencyAmount: invoice.totalAmount,
          exchangeRate: 1.0,
          accountId: accountId,
          accountType: accountType,
          reference: invoice.invoiceNumber,
          category: 'Sales Revenue',
          description: `Invoice ${invoice.invoiceNumber} - ${invoice.clientName}`,
          linkedEntryId: entry.id,
          linkedEntryType: 'bookkeeping_entry',
          status: 'CLEARED',
          reconciliationStatus: 'UNRECONCILED',
          approvalStatus: 'APPROVED'
        }
      })

      return [updated, entry, transaction]
    })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      bookkeepingEntry: bookkeepingEntry,
      transaction: transactionRecord,
      message: `Invoice has been marked as paid, revenue entry and transaction created`
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