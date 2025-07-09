import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, data } = body

    switch (operation) {
      case 'create':
        return await handleBulkCreate(data)
      case 'update':
        return await handleBulkUpdate(data)
      case 'delete':
        return await handleBulkDelete(data)
      case 'categorize':
        return await handleBulkCategorize(data)
      case 'reconcile':
        return await handleBulkReconcile(data)
      case 'approve':
        return await handleBulkApprove(data)
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

async function handleBulkCreate(transactions: unknown[]) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return NextResponse.json(
      { error: 'Invalid transactions data' },
      { status: 400 }
    )
  }

  // Validate each transaction
  const requiredFields = ['companyId', 'date', 'paidBy', 'paidTo', 'netAmount', 'currency', 'accountId', 'accountType']
  for (const transaction of transactions) {
    for (const field of requiredFields) {
      if (!transaction[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field} in transaction` },
          { status: 400 }
        )
      }
    }
  }

  // Process transactions for database
  const processedTransactions = transactions.map(transaction => ({
    ...transaction,
    date: new Date(transaction.date),
    netAmount: parseFloat(transaction.netAmount),
    incomingAmount: transaction.incomingAmount ? parseFloat(transaction.incomingAmount) : null,
    outgoingAmount: transaction.outgoingAmount ? parseFloat(transaction.outgoingAmount) : null,
    baseCurrencyAmount: parseFloat(transaction.baseCurrencyAmount || transaction.netAmount),
    exchangeRate: transaction.exchangeRate ? parseFloat(transaction.exchangeRate) : null,
    tags: transaction.tags || [],
    status: transaction.status || 'CLEARED',
    reconciliationStatus: transaction.reconciliationStatus || 'UNRECONCILED',
    approvalStatus: transaction.approvalStatus || 'APPROVED',
    isRecurring: transaction.isRecurring || false,
  }))

  const createdTransactions = await prisma.transaction.createMany({
    data: processedTransactions,
    skipDuplicates: true
  })

  return NextResponse.json({
    success: true,
    created: createdTransactions.count,
    message: `Successfully created ${createdTransactions.count} transactions`
  })
}

async function handleBulkUpdate(updateData: { ids: string[], updates: unknown }) {
  const { ids, updates } = updateData

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Invalid transaction IDs' },
      { status: 400 }
    )
  }

  // Prepare update data
  const processedUpdates: unknown = { ...updates }

  if (updates.date) {
    processedUpdates.date = new Date(updates.date)
  }
  if (updates.netAmount !== undefined) {
    processedUpdates.netAmount = parseFloat(updates.netAmount)
  }
  if (updates.incomingAmount !== undefined) {
    processedUpdates.incomingAmount = updates.incomingAmount ? parseFloat(updates.incomingAmount) : null
  }
  if (updates.outgoingAmount !== undefined) {
    processedUpdates.outgoingAmount = updates.outgoingAmount ? parseFloat(updates.outgoingAmount) : null
  }

  const result = await prisma.transaction.updateMany({
    where: {
      id: { in: ids },
      isDeleted: false
    },
    data: processedUpdates
  })

  return NextResponse.json({
    success: true,
    updated: result.count,
    message: `Successfully updated ${result.count} transactions`
  })
}

async function handleBulkDelete(deleteData: { ids: string[], hardDelete?: boolean, deletedBy?: string }) {
  const { ids, hardDelete = false, deletedBy } = deleteData

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: 'Invalid transaction IDs' },
      { status: 400 }
    )
  }

  let result
  if (hardDelete) {
    result = await prisma.transaction.deleteMany({
      where: { id: { in: ids } }
    })
  } else {
    result = await prisma.transaction.updateMany({
      where: {
        id: { in: ids },
        isDeleted: false
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy || 'bulk-operation'
      }
    })
  }

  return NextResponse.json({
    success: true,
    deleted: result.count,
    message: `Successfully ${hardDelete ? 'deleted' : 'soft deleted'} ${result.count} transactions`
  })
}

async function handleBulkCategorize(categorizeData: { ids: string[], category: string, subcategory?: string, updatedBy?: string }) {
  const { ids, category, subcategory, updatedBy } = categorizeData

  if (!Array.isArray(ids) || ids.length === 0 || !category) {
    return NextResponse.json(
      { error: 'Invalid data for categorization' },
      { status: 400 }
    )
  }

  const result = await prisma.transaction.updateMany({
    where: {
      id: { in: ids },
      isDeleted: false
    },
    data: {
      category,
      subcategory: subcategory || null,
      updatedBy
    }
  })

  return NextResponse.json({
    success: true,
    updated: result.count,
    message: `Successfully categorized ${result.count} transactions`
  })
}

async function handleBulkReconcile(reconcileData: { ids: string[], reconciliationStatus: string, statementDate?: string, statementReference?: string, updatedBy?: string }) {
  const { ids, reconciliationStatus, statementDate, statementReference, updatedBy } = reconcileData

  if (!Array.isArray(ids) || ids.length === 0 || !reconciliationStatus) {
    return NextResponse.json(
      { error: 'Invalid data for reconciliation' },
      { status: 400 }
    )
  }

  const updateData: unknown = {
    reconciliationStatus,
    updatedBy
  }

  if (statementDate) {
    updateData.statementDate = new Date(statementDate)
  }
  if (statementReference) {
    updateData.statementReference = statementReference
  }

  const result = await prisma.transaction.updateMany({
    where: {
      id: { in: ids },
      isDeleted: false
    },
    data: updateData
  })

  return NextResponse.json({
    success: true,
    updated: result.count,
    message: `Successfully updated reconciliation status for ${result.count} transactions`
  })
}

async function handleBulkApprove(approveData: { ids: string[], approvalStatus: string, approvedBy?: string }) {
  const { ids, approvalStatus, approvedBy } = approveData

  if (!Array.isArray(ids) || ids.length === 0 || !approvalStatus) {
    return NextResponse.json(
      { error: 'Invalid data for approval' },
      { status: 400 }
    )
  }

  const updateData: unknown = {
    approvalStatus,
    updatedBy: approvedBy
  }

  if (approvalStatus === 'APPROVED') {
    updateData.approvedBy = approvedBy
    updateData.approvedAt = new Date()
  }

  const result = await prisma.transaction.updateMany({
    where: {
      id: { in: ids },
      isDeleted: false
    },
    data: updateData
  })

  return NextResponse.json({
    success: true,
    updated: result.count,
    message: `Successfully updated approval status for ${result.count} transactions`
  })
}