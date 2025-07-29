import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string }
}

// POST /api/transactions/[id]/link - Link transaction to a bookkeeping entry
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { entryId } = body;

    if (!entryId) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
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

    // Check if entry exists
    const entry = await prisma.bookkeepingEntry.findUnique({
      where: { id: entryId }
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Bookkeeping entry not found' },
        { status: 404 }
      );
    }

    // Update transaction with linked entry
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        linkedEntryId: entryId,
        linkedEntryType: entry.type,
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
    console.error('POST /api/transactions/[id]/link error:', error);
    return NextResponse.json(
      { error: 'Failed to link transaction' },
      { status: 500 }
    );
  }
}