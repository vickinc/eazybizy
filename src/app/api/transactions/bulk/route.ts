import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// POST /api/transactions/bulk - Bulk create transactions
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transactions } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid transactions data. Expected array of transactions.' },
        { status: 400 }
      );
    }

    // Validate each transaction
    const requiredFields = [
      'date', 'paidBy', 'paidTo', 'netAmount', 'incomingAmount', 'outgoingAmount',
      'currency', 'baseCurrency', 'baseCurrencyAmount', 'exchangeRate',
      'accountId', 'accountType', 'category', 'companyId'
    ];

    const errors: Array<{ index: number; error: string }> = [];
    const validTransactions: any[] = [];

    transactions.forEach((transaction, index) => {
      // Check required fields
      for (const field of requiredFields) {
        if (transaction[field] === undefined || transaction[field] === null) {
          errors.push({ 
            index, 
            error: `Missing required field: ${field}` 
          });
          return;
        }
      }

      // Validate enum values
      if (!['bank', 'wallet'].includes(transaction.accountType)) {
        errors.push({ 
          index, 
          error: 'Invalid accountType. Must be "bank" or "wallet"' 
        });
        return;
      }

      if (transaction.status && !['PENDING', 'CLEARED', 'CANCELLED'].includes(transaction.status)) {
        errors.push({ 
          index, 
          error: 'Invalid status. Must be PENDING, CLEARED, or CANCELLED' 
        });
        return;
      }

      // Process valid transaction
      validTransactions.push({
        date: new Date(transaction.date),
        paidBy: transaction.paidBy,
        paidTo: transaction.paidTo,
        netAmount: transaction.netAmount,
        incomingAmount: transaction.incomingAmount,
        outgoingAmount: transaction.outgoingAmount,
        currency: transaction.currency,
        baseCurrency: transaction.baseCurrency,
        baseCurrencyAmount: transaction.baseCurrencyAmount,
        exchangeRate: transaction.exchangeRate,
        accountId: transaction.accountId,
        accountType: transaction.accountType,
        reference: transaction.reference || null,
        category: transaction.category,
        description: transaction.description || null,
        linkedEntryId: transaction.linkedEntryId || null,
        linkedEntryType: transaction.linkedEntryType || null,
        status: transaction.status || 'PENDING',
        reconciliationStatus: transaction.reconciliationStatus || 'UNRECONCILED',
        approvalStatus: transaction.approvalStatus || 'PENDING',
        companyId: transaction.companyId,
        isDeleted: false,
      });
    });

    // Return validation errors if any
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed for some transactions',
          errors: errors.slice(0, 10), // Limit to first 10 errors
          totalErrors: errors.length
        },
        { status: 400 }
      );
    }

    // Create transactions in database
    const result = await prisma.transaction.createMany({
      data: validTransactions,
      skipDuplicates: true
    });

    // Fetch the created transactions with relations
    const createdTransactions = await prisma.transaction.findMany({
      where: {
        companyId: { in: validTransactions.map(t => t.companyId) },
        createdAt: { gte: new Date(Date.now() - 5000) } // Last 5 seconds
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
      },
      take: result.count
    });

    return NextResponse.json(createdTransactions, { status: 201 });

  } catch (error) {
    console.error('POST /api/transactions/bulk error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Referenced company, account, or entry does not exist' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create transactions in bulk' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/bulk - Bulk delete transactions
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid transaction IDs. Expected array of IDs.' },
        { status: 400 }
      );
    }

    // Perform bulk soft delete
    const result = await prisma.transaction.updateMany({
      where: {
        id: { in: ids },
        isDeleted: false
      },
      data: {
        isDeleted: true,
      }
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} transactions`
    });

  } catch (error) {
    console.error('DELETE /api/transactions/bulk error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transactions in bulk' },
      { status: 500 }
    );
  }
}