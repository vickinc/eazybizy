import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { TransactionSSRService } from '@/services/database/transactionSSRService';

// GET /api/transactions/cursor - Cursor-based pagination for better performance
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const params = {
      cursor: searchParams.get('cursor') || undefined,
      take: parseInt(searchParams.get('take') || '20'),
      searchTerm: searchParams.get('searchTerm') || '',
      status: (searchParams.get('status') as any) || 'all',
      reconciliationStatus: (searchParams.get('reconciliationStatus') as any) || 'all',
      approvalStatus: (searchParams.get('approvalStatus') as any) || 'all',
      accountId: searchParams.get('accountId') || undefined,
      accountType: (searchParams.get('accountType') as any) || 'all',
      currency: searchParams.get('currency') || undefined,
      companyId: searchParams.get('companyId') ? parseInt(searchParams.get('companyId')!) : undefined,
      dateRange: (searchParams.get('dateRange') as any) || 'all',
      customDateRange: searchParams.get('dateFrom') && searchParams.get('dateTo') ? {
        start: new Date(searchParams.get('dateFrom')!),
        end: new Date(searchParams.get('dateTo')!)
      } : undefined,
      sortField: (searchParams.get('sortField') as any) || 'date',
      sortDirection: (searchParams.get('sortDirection') as any) || 'desc',
    };

    // Use SSR service for cursor-based pagination
    const result = await TransactionSSRService.getTransactionsForSSRCursor(params);

    // Transform to API response format
    const response = {
      data: result.data,
      cursor: result.nextCursor,
      hasMore: result.hasMore,
      statistics: {
        total: 0, // Not available in cursor pagination
        totalIncoming: result.data.reduce((sum, tx) => sum + tx.incomingAmount, 0),
        totalOutgoing: result.data.reduce((sum, tx) => sum + tx.outgoingAmount, 0),
        netAmount: result.data.reduce((sum, tx) => sum + tx.netAmount, 0),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET /api/transactions/cursor error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions with cursor pagination' },
      { status: 500 }
    );
  }
}