import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface RouteParams {
  params: { id: string }
}

// GET /api/transactions/[id] - Fetch a single transaction by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const transaction = await prisma.transaction.findUnique({
      where: { 
        id,
        isDeleted: false // Only fetch non-deleted transactions
      },
      include: {
        company: {
          select: { id: true, tradingName: true, legalName: true }
        },
        linkedEntry: {
          select: { 
            id: true, 
            type: true, 
            category: true, 
            description: true, 
            amount: true,
            currency: true
          }
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);

  } catch (error) {
    console.error('GET /api/transactions/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// PATCH /api/transactions/[id] - Update an existing transaction
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if transaction exists and is not deleted
    const existingTransaction = await prisma.transaction.findUnique({
      where: { 
        id,
        isDeleted: false
      }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Validate enum values if provided
    if (body.accountType && !['bank', 'wallet'].includes(body.accountType)) {
      return NextResponse.json(
        { error: 'Invalid accountType. Must be "bank" or "wallet"' },
        { status: 400 }
      );
    }

    if (body.status && !['PENDING', 'CLEARED', 'CANCELLED'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, CLEARED, or CANCELLED' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Handle string fields
    if (body.paidBy !== undefined) updateData.paidBy = body.paidBy;
    if (body.paidTo !== undefined) updateData.paidTo = body.paidTo;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.baseCurrency !== undefined) updateData.baseCurrency = body.baseCurrency;
    if (body.accountId !== undefined) updateData.accountId = body.accountId;
    if (body.accountType !== undefined) updateData.accountType = body.accountType;
    if (body.reference !== undefined) updateData.reference = body.reference;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.linkedEntryId !== undefined) updateData.linkedEntryId = body.linkedEntryId;
    if (body.linkedEntryType !== undefined) updateData.linkedEntryType = body.linkedEntryType;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.reconciliationStatus !== undefined) updateData.reconciliationStatus = body.reconciliationStatus;
    if (body.approvalStatus !== undefined) updateData.approvalStatus = body.approvalStatus;

    // Handle date conversion if provided
    if (body.date !== undefined) {
      updateData.date = new Date(body.date);
    }

    // Handle numeric conversions
    if (body.netAmount !== undefined) {
      updateData.netAmount = body.netAmount;
    }
    if (body.incomingAmount !== undefined) {
      updateData.incomingAmount = body.incomingAmount;
    }
    if (body.outgoingAmount !== undefined) {
      updateData.outgoingAmount = body.outgoingAmount;
    }
    if (body.baseCurrencyAmount !== undefined) {
      updateData.baseCurrencyAmount = body.baseCurrencyAmount;
    }
    if (body.exchangeRate !== undefined) {
      updateData.exchangeRate = body.exchangeRate;
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
          }
        },
        bankAccount: {
          select: {
            id: true,
            bankName: true,
            accountName: true,
            currency: true,
          }
        },
        digitalWallet: {
          select: {
            id: true,
            walletName: true,
            walletType: true,
            currency: true,
          }
        },
        linkedEntry: {
          select: {
            id: true,
            type: true,
            category: true,
            amount: true,
            currency: true,
            description: true,
          }
        }
      }
    });

    return NextResponse.json(transaction);

  } catch (error) {
    console.error('PATCH /api/transactions/[id] error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A transaction with this data already exists' },
          { status: 409 }
        );
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Referenced company, account, or entry does not exist' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[id] - Delete a transaction (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if transaction exists and is not already deleted
    const existingTransaction = await prisma.transaction.findUnique({
      where: { 
        id,
        isDeleted: false
      }
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Perform soft delete
    await prisma.transaction.update({
      where: { id },
      data: {
        isDeleted: true,
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('DELETE /api/transactions/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}