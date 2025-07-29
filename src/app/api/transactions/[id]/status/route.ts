import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string }
}

// PATCH /api/transactions/[id]/status - Update transaction status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, reconciliationStatus, approvalStatus } = body;

    // Validate status values
    if (status && !['PENDING', 'CLEARED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, CLEARED, or CANCELLED' },
        { status: 400 }
      );
    }

    if (reconciliationStatus && !['UNRECONCILED', 'RECONCILED', 'AUTO_RECONCILED'].includes(reconciliationStatus)) {
      return NextResponse.json(
        { error: 'Invalid reconciliation status. Must be UNRECONCILED, RECONCILED, or AUTO_RECONCILED' },
        { status: 400 }
      );
    }

    if (approvalStatus && !['PENDING', 'APPROVED', 'REJECTED'].includes(approvalStatus)) {
      return NextResponse.json(
        { error: 'Invalid approval status. Must be PENDING, APPROVED, or REJECTED' },
        { status: 400 }
      );
    }

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

    // Prepare update data
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (reconciliationStatus !== undefined) updateData.reconciliationStatus = reconciliationStatus;
    if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus;

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
    console.error('PATCH /api/transactions/[id]/status error:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction status' },
      { status: 500 }
    );
  }
}