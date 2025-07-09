import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        company: {
          select: { id: true, tradingName: true, legalName: true }
        },
        companyAccount: {
          select: { id: true, name: true, type: true, currency: true }
        },
        bankAccount: {
          select: { id: true, accountName: true, bankName: true, currency: true, iban: true }
        },
        digitalWallet: {
          select: { id: true, walletName: true, walletType: true, currency: true, walletAddress: true }
        },
        linkedEntry: {
          select: { id: true, type: true, category: true, description: true, amount: true }
        },
        parentTransaction: {
          select: { id: true, reference: true, description: true, netAmount: true, date: true }
        },
        childTransactions: {
          select: { id: true, reference: true, description: true, netAmount: true, date: true },
          where: { isDeleted: false }
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            uploadedBy: true,
            createdAt: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)

  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const data = await request.json()

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: unknown = {
      ...data,
      updatedBy: data.updatedBy,
    }

    // Handle date conversion if provided
    if (data.date) {
      updateData.date = new Date(data.date)
    }

    // Handle numeric conversions
    if (data.netAmount !== undefined) {
      updateData.netAmount = parseFloat(data.netAmount)
    }
    if (data.incomingAmount !== undefined) {
      updateData.incomingAmount = data.incomingAmount ? parseFloat(data.incomingAmount) : null
    }
    if (data.outgoingAmount !== undefined) {
      updateData.outgoingAmount = data.outgoingAmount ? parseFloat(data.outgoingAmount) : null
    }
    if (data.baseCurrencyAmount !== undefined) {
      updateData.baseCurrencyAmount = parseFloat(data.baseCurrencyAmount)
    }
    if (data.exchangeRate !== undefined) {
      updateData.exchangeRate = data.exchangeRate ? parseFloat(data.exchangeRate) : null
    }

    // Handle approval workflow
    if (data.approvalStatus === 'APPROVED' && !existingTransaction.approvedAt) {
      updateData.approvedAt = new Date()
      updateData.approvedBy = data.updatedBy || data.approvedBy
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: { id: true, tradingName: true, legalName: true }
        },
        companyAccount: {
          select: { id: true, name: true, type: true, currency: true }
        },
        linkedEntry: {
          select: { id: true, type: true, category: true, description: true }
        },
        attachments: {
          select: { id: true, fileName: true, fileSize: true, mimeType: true }
        }
      }
    })

    return NextResponse.json(transaction)

  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'
    const deletedBy = searchParams.get('deletedBy')

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        childTransactions: { where: { isDeleted: false } }
      }
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if transaction has child transactions
    if (existingTransaction.childTransactions.length > 0 && !hardDelete) {
      return NextResponse.json(
        { error: 'Cannot delete transaction with child transactions. Use hard delete or delete children first.' },
        { status: 400 }
      )
    }

    if (hardDelete) {
      // Hard delete - remove from database completely
      await prisma.transaction.delete({
        where: { id }
      })
    } else {
      // Soft delete - mark as deleted
      await prisma.transaction.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy || 'unknown'
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}