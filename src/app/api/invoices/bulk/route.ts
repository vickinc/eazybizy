import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, data } = body

    switch (operation) {
      case 'updateStatus':
        return await handleBulkStatusUpdate(data)
      case 'archive':
        return await handleBulkArchive(data)
      case 'delete':
        return await handleBulkDelete(data)
      case 'markPaid':
        return await handleBulkMarkPaid(data)
      case 'send':
        return await handleBulkSend(data)
      case 'duplicate':
        return await handleBulkDuplicate(data)
      case 'export':
        return await handleBulkExport(data)
      default:
        return NextResponse.json(
          { error: 'Invalid bulk operation' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in bulk operation:', error)
    return NextResponse.json(
      { error: 'Bulk operation failed' },
      { status: 500 }
    )
  }
}

async function handleBulkStatusUpdate(data: { 
  ids: string[]
  status: string
  updatedBy?: string
  notes?: string
}) {
  const { ids, status, updatedBy, notes } = data

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Invalid invoice IDs' },
      { status: 400 }
    )
  }

  // Validate status
  const validStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'ARCHIVED']
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status' },
      { status: 400 }
    )
  }

  // Check business rules for status transitions
  const invoices = await prisma.invoice.findMany({
    where: { id: { in: ids } },
    select: { id: true, status: true, totalAmount: true }
  })

  const invalidTransitions = []
  for (const invoice of invoices) {
    if (!isValidStatusTransition(invoice.status, status)) {
      invalidTransitions.push(invoice.id)
    }
  }

  if (invalidTransitions.length > 0) {
    return NextResponse.json(
      { error: `Invalid status transition for invoices: ${invalidTransitions.join(', ')}` },
      { status: 400 }
    )
  }

  // Update invoices
  const updateData: unknown = {
    status,
    updatedAt: new Date()
  }

  // Set paid date if marking as paid
  if (status === 'PAID') {
    updateData.paidDate = new Date()
  }

  const result = await prisma.invoice.updateMany({
    where: { id: { in: ids } },
    data: updateData
  })

  // Create audit log entries if needed
  if (notes) {
    // TODO: Implement audit logging
  }

  return NextResponse.json({
    success: true,
    updated: result.count,
    message: `Successfully updated ${result.count} invoices to ${status}`
  })
}

async function handleBulkArchive(data: { ids: string[], updatedBy?: string }) {
  const { ids, updatedBy } = data

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Invalid invoice IDs' },
      { status: 400 }
    )
  }

  const result = await prisma.invoice.updateMany({
    where: { 
      id: { in: ids },
      status: { not: 'ARCHIVED' }
    },
    data: {
      status: 'ARCHIVED',
      updatedAt: new Date()
    }
  })

  return NextResponse.json({
    success: true,
    archived: result.count,
    message: `Successfully archived ${result.count} invoices`
  })
}

async function handleBulkDelete(data: { ids: string[], hardDelete?: boolean, deletedBy?: string }) {
  const { ids, hardDelete = false, deletedBy } = data

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Invalid invoice IDs' },
      { status: 400 }
    )
  }

  // Check if any invoices are paid (business rule: can't delete paid invoices)
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      id: { in: ids },
      status: 'PAID'
    },
    select: { id: true, invoiceNumber: true }
  })

  if (paidInvoices.length > 0 && !hardDelete) {
    return NextResponse.json(
      { 
        error: `Cannot delete paid invoices: ${paidInvoices.map(i => i.invoiceNumber).join(', ')}. Use hard delete if necessary.` 
      },
      { status: 400 }
    )
  }

  let result
  if (hardDelete) {
    // Hard delete - remove from database completely
    result = await prisma.invoice.deleteMany({
      where: { id: { in: ids } }
    })
  } else {
    // Soft delete - mark as archived with deletion flag
    result = await prisma.invoice.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'ARCHIVED',
        notes: `Deleted by ${deletedBy || 'system'} on ${new Date().toISOString()}`,
        updatedAt: new Date()
      }
    })
  }

  return NextResponse.json({
    success: true,
    deleted: result.count,
    message: `Successfully ${hardDelete ? 'deleted' : 'soft deleted'} ${result.count} invoices`
  })
}

async function handleBulkMarkPaid(data: { 
  ids: string[]
  paidDate?: string
  paidAmount?: number
  notes?: string
  updatedBy?: string
}) {
  const { ids, paidDate, paidAmount, notes, updatedBy } = data

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Invalid invoice IDs' },
      { status: 400 }
    )
  }

  // Only allow marking sent invoices as paid
  const validInvoices = await prisma.invoice.findMany({
    where: {
      id: { in: ids },
      status: { in: ['SENT', 'OVERDUE'] }
    },
    select: { id: true }
  })

  const validIds = validInvoices.map(i => i.id)
  const invalidIds = ids.filter(id => !validIds.includes(id))

  if (invalidIds.length > 0) {
    return NextResponse.json(
      { error: `Cannot mark unsent invoices as paid: ${invalidIds.join(', ')}` },
      { status: 400 }
    )
  }

  const updateData: unknown = {
    status: 'PAID',
    paidDate: paidDate ? new Date(paidDate) : new Date(),
    updatedAt: new Date()
  }

  if (notes) {
    updateData.notes = notes
  }

  const result = await prisma.invoice.updateMany({
    where: { id: { in: validIds } },
    data: updateData
  })

  return NextResponse.json({
    success: true,
    updated: result.count,
    skipped: invalidIds.length,
    message: `Successfully marked ${result.count} invoices as paid`
  })
}

async function handleBulkSend(data: { 
  ids: string[]
  sendDate?: string
  updatedBy?: string
}) {
  const { ids, sendDate, updatedBy } = data

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Invalid invoice IDs' },
      { status: 400 }
    )
  }

  // Only allow sending draft invoices
  const validInvoices = await prisma.invoice.findMany({
    where: {
      id: { in: ids },
      status: 'DRAFT'
    },
    select: { id: true }
  })

  const validIds = validInvoices.map(i => i.id)
  const invalidIds = ids.filter(id => !validIds.includes(id))

  const result = await prisma.invoice.updateMany({
    where: { id: { in: validIds } },
    data: {
      status: 'SENT',
      updatedAt: new Date()
    }
  })

  return NextResponse.json({
    success: true,
    sent: result.count,
    skipped: invalidIds.length,
    message: `Successfully sent ${result.count} invoices`
  })
}

async function handleBulkDuplicate(data: { 
  ids: string[]
  updatedBy?: string
  newIssueDate?: string
  newDueDate?: string
}) {
  const { ids, updatedBy, newIssueDate, newDueDate } = data

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Invalid invoice IDs' },
      { status: 400 }
    )
  }

  // Get original invoices with all related data
  const originalInvoices = await prisma.invoice.findMany({
    where: { id: { in: ids } },
    include: {
      items: true,
      paymentMethodInvoices: {
        include: { paymentMethod: true }
      }
    }
  })

  const duplicatedInvoices = []

  for (const original of originalInvoices) {
    // Generate new invoice number
    const newInvoiceNumber = await generateInvoiceNumber(original.fromCompanyId)
    
    const duplicated = await prisma.invoice.create({
      data: {
        invoiceNumber: newInvoiceNumber,
        clientName: original.clientName,
        clientEmail: original.clientEmail,
        clientAddress: original.clientAddress,
        clientId: original.clientId,
        subtotal: original.subtotal,
        currency: original.currency,
        status: 'DRAFT',
        dueDate: newDueDate ? new Date(newDueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        issueDate: newIssueDate ? new Date(newIssueDate) : new Date(),
        template: original.template,
        taxRate: original.taxRate,
        taxAmount: original.taxAmount,
        totalAmount: original.totalAmount,
        fromCompanyId: original.fromCompanyId,
        notes: `Duplicated from ${original.invoiceNumber}`,
        items: {
          create: original.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
            total: item.total
          }))
        },
        paymentMethodInvoices: {
          create: original.paymentMethodInvoices.map(pm => ({
            paymentMethodId: pm.paymentMethodId
          }))
        }
      },
      include: {
        items: true,
        paymentMethodInvoices: true
      }
    })

    duplicatedInvoices.push(duplicated)
  }

  return NextResponse.json({
    success: true,
    duplicated: duplicatedInvoices.length,
    invoices: duplicatedInvoices,
    message: `Successfully duplicated ${duplicatedInvoices.length} invoices`
  })
}

async function handleBulkExport(data: { 
  ids: string[]
  format: 'json' | 'csv' | 'pdf'
  includeItems?: boolean
}) {
  const { ids, format, includeItems = true } = data

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Invalid invoice IDs' },
      { status: 400 }
    )
  }

  const invoices = await prisma.invoice.findMany({
    where: { id: { in: ids } },
    include: {
      company: true,
      client: true,
      items: includeItems,
      paymentMethodInvoices: {
        include: { paymentMethod: true }
      }
    }
  })

  // TODO: Implement actual export logic based on format
  return NextResponse.json({
    success: true,
    exported: invoices.length,
    format,
    data: invoices, // For now, return raw data
    message: `Successfully exported ${invoices.length} invoices as ${format.toUpperCase()}`
  })
}

// Helper functions
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const transitions: Record<string, string[]> = {
    'DRAFT': ['SENT', 'ARCHIVED'],
    'SENT': ['PAID', 'OVERDUE', 'ARCHIVED'],
    'PAID': ['ARCHIVED'],
    'OVERDUE': ['PAID', 'ARCHIVED'],
    'ARCHIVED': [] // Cannot transition from archived
  }

  return transitions[currentStatus]?.includes(newStatus) || false
}

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
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}