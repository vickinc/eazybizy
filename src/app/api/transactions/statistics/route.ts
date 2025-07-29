import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { TransactionSSRService } from '@/services/database/transactionSSRService';

// GET /api/transactions/statistics - Get comprehensive transaction statistics
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    // Use SSR service for statistics calculation
    const statistics = await TransactionSSRService.getTransactionStatistics(
      companyId === 'all' ? 'all' : companyId ? parseInt(companyId) : undefined
    );

    return NextResponse.json(statistics);

  } catch (error) {
    console.error('GET /api/transactions/statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction statistics' },
      { status: 500 }
    );
  }
}