import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string }
}

// POST /api/transactions/[id]/unlink - Unlink transaction from a bookkeeping entry
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

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

    // Update transaction to remove linked entry
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        linkedEntryId: null,
        linkedEntryType: null,
      },
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
        }
      }
    });

    return NextResponse.json(transaction);

  } catch (error) {
    console.error('POST /api/transactions/[id]/unlink error:', error);
    return NextResponse.json(
      { error: 'Failed to unlink transaction' },
      { status: 500 }
    );
  }
}