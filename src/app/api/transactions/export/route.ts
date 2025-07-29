import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/transactions/export - Export transactions to CSV or Excel
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    
    // Parse query parameters (same as main transactions endpoint)
    const params = {
      searchTerm: searchParams.get('searchTerm') || '',
      status: (searchParams.get('status') as any) || 'all',
      reconciliationStatus: (searchParams.get('reconciliationStatus') as any) || 'all',
      approvalStatus: (searchParams.get('approvalStatus') as any) || 'all',
      accountId: searchParams.get('accountId') || undefined,
      accountType: (searchParams.get('accountType') as any) || 'all',
      currency: searchParams.get('currency') || undefined,
      companyId: searchParams.get('companyId') || undefined,
      dateRange: (searchParams.get('dateRange') as any) || 'all',
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    };

    // Build where clause (same logic as main endpoint)
    const where: Prisma.TransactionWhereInput = {
      isDeleted: false
    };

    if (params.searchTerm) {
      where.OR = [
        { paidBy: { contains: params.searchTerm, mode: 'insensitive' } },
        { paidTo: { contains: params.searchTerm, mode: 'insensitive' } },
        { reference: { contains: params.searchTerm, mode: 'insensitive' } },
        { description: { contains: params.searchTerm, mode: 'insensitive' } },
        { category: { contains: params.searchTerm, mode: 'insensitive' } },
        { currency: { contains: params.searchTerm } },
      ];
    }

    if (params.status && params.status !== 'all') {
      where.status = params.status.toUpperCase() as any;
    }

    if (params.reconciliationStatus && params.reconciliationStatus !== 'all') {
      where.reconciliationStatus = params.reconciliationStatus.toUpperCase() as any;
    }

    if (params.approvalStatus && params.approvalStatus !== 'all') {
      where.approvalStatus = params.approvalStatus.toUpperCase() as any;
    }

    if (params.accountId && params.accountId !== 'all') {
      where.accountId = params.accountId;
    }

    if (params.accountType && params.accountType !== 'all') {
      where.accountType = params.accountType;
    }

    if (params.currency && params.currency !== 'all') {
      where.currency = params.currency;
    }

    if (params.companyId && params.companyId !== 'all') {
      where.companyId = parseInt(params.companyId);
    }

    // Date range filtering
    if (params.dateRange && params.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (params.dateRange) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'lastYear':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31);
          break;
        default:
          startDate = new Date(0);
      }

      where.date = {
        gte: startDate,
        lte: endDate
      };
    } else if (params.dateFrom && params.dateTo) {
      where.date = {
        gte: new Date(params.dateFrom),
        lte: new Date(params.dateTo)
      };
    }

    // Fetch transactions for export (no pagination limit)
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
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

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'ID',
        'Date',
        'Paid By',
        'Paid To',
        'Net Amount',
        'Incoming Amount',
        'Outgoing Amount',
        'Currency',
        'Base Currency',
        'Base Currency Amount',
        'Exchange Rate',
        'Account ID',
        'Account Type',
        'Linked Entry ID',
        'Reference',
        'Category',
        'Description',
        'Status',
        'Reconciliation Status',
        'Approval Status',
        'Company',
        'Created At',
        'Updated At'
      ];

      const csvRows = transactions.map(tx => [
        tx.id,
        tx.date.toISOString().split('T')[0],
        tx.paidBy,
        tx.paidTo,
        tx.netAmount,
        tx.incomingAmount,
        tx.outgoingAmount,
        tx.currency,
        tx.baseCurrency,
        tx.baseCurrencyAmount,
        tx.exchangeRate,
        tx.accountId,
        tx.accountType,
        tx.linkedEntryId || '',
        tx.reference || '',
        tx.category,
        tx.description || '',
        tx.status,
        tx.reconciliationStatus,
        tx.approvalStatus,
        tx.company?.tradingName || '',
        tx.createdAt.toISOString(),
        tx.updatedAt.toISOString()
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else {
      // For Excel format, return JSON with instructions
      return NextResponse.json({
        error: 'Excel export not implemented yet. Please use CSV format.',
        suggestion: 'Use format=csv parameter'
      }, { status: 501 });
    }

  } catch (error) {
    console.error('GET /api/transactions/export error:', error);
    return NextResponse.json(
      { error: 'Failed to export transactions' },
      { status: 500 }
    );
  }
}