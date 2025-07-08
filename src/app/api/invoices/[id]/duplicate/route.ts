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
      newIssueDate, 
      newDueDate, 
      newClientId,
      adjustInvoiceNumber = true,
      copyNotes = false,
      updatedBy 
    } = body

    // Get the original invoice with all related data
    const originalInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        client: true,
        items: true,
        paymentMethodInvoices: {
          include: {
            paymentMethod: true
          }
        }
      }
    })

    if (!originalInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Generate new invoice number
    let newInvoiceNumber = originalInvoice.invoiceNumber
    if (adjustInvoiceNumber) {
      newInvoiceNumber = await generateInvoiceNumber(originalInvoice.fromCompanyId)
    }

    // Get client details if different client specified
    let clientData = {
      clientId: originalInvoice.clientId,
      clientName: originalInvoice.clientName,
      clientEmail: originalInvoice.clientEmail,
      clientAddress: originalInvoice.clientAddress
    }

    if (newClientId && newClientId !== originalInvoice.clientId) {
      const newClient = await prisma.client.findUnique({
        where: { id: newClientId }
      })

      if (newClient) {
        clientData = {
          clientId: newClient.id,
          clientName: newClient.name,
          clientEmail: newClient.email,
          clientAddress: newClient.address
        }
      }
    }

    // Set dates
    const issueDate = newIssueDate ? new Date(newIssueDate) : new Date()
    const dueDate = newDueDate ? new Date(newDueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from issue date

    // Create the duplicated invoice
    const duplicatedInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: newInvoiceNumber,
        clientName: clientData.clientName,
        clientEmail: clientData.clientEmail,
        clientAddress: clientData.clientAddress,
        clientId: clientData.clientId,
        subtotal: originalInvoice.subtotal,
        currency: originalInvoice.currency,
        status: 'DRAFT', // Always start as draft
        dueDate: dueDate,
        issueDate: issueDate,
        template: originalInvoice.template,
        taxRate: originalInvoice.taxRate,
        taxAmount: originalInvoice.taxAmount,
        totalAmount: originalInvoice.totalAmount,
        fromCompanyId: originalInvoice.fromCompanyId,
        notes: copyNotes ? 
          `${originalInvoice.notes || ''}\n\nDuplicated from ${originalInvoice.invoiceNumber} on ${new Date().toISOString()}`.trim() :
          `Duplicated from ${originalInvoice.invoiceNumber}`,
        
        // Create invoice items
        items: {
          create: originalInvoice.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
            total: item.total
          }))
        },

        // Create payment method associations
        paymentMethodInvoices: {
          create: originalInvoice.paymentMethodInvoices.map(pm => ({
            paymentMethodId: pm.paymentMethodId
          }))
        }
      },
      include: {
        company: {
          select: { id: true, tradingName: true, legalName: true }
        },
        client: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, currency: true }
            }
          }
        },
        paymentMethodInvoices: {
          include: {
            paymentMethod: {
              select: { id: true, name: true, type: true }
            }
          }
        }
      }
    })

    // TODO: Create audit log entry
    // await createAuditLog({
    //   entityType: 'invoice',
    //   entityId: originalInvoice.id,
    //   action: 'duplicate',
    //   userId: updatedBy,
    //   changes: { duplicatedTo: duplicatedInvoice.id }
    // })

    return NextResponse.json({
      success: true,
      originalInvoice: {
        id: originalInvoice.id,
        invoiceNumber: originalInvoice.invoiceNumber
      },
      duplicatedInvoice,
      message: `Invoice ${originalInvoice.invoiceNumber} has been duplicated as ${newInvoiceNumber}`
    })

  } catch (error) {
    console.error('Error duplicating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate invoice' },
      { status: 500 }
    )
  }
}

// Helper function to generate unique invoice number
async function generateInvoiceNumber(companyId: number): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  
  // Find the highest number for this year and company
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      fromCompanyId: companyId,
      invoiceNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      invoiceNumber: 'desc'
    }
  })

  let nextNumber = 1
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''))
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1
    }
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}