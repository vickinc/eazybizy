import { NextRequest, NextResponse } from 'next/server';
import { EtherscanAPIService } from '@/services/integrations/etherscanAPIService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const currency = searchParams.get('currency');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '1000');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    // Check if BSCScan API is configured
    if (!EtherscanAPIService.isConfigured('bsc')) {
      return NextResponse.json(
        { error: 'BSCScan API not configured' },
        { status: 503 }
      );
    }

    // Parse dates if provided
    const options: any = {
      limit,
      currency: currency || undefined
    };

    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    // Fetch BSC transactions
    const transactions = await EtherscanAPIService.getTransactionHistory(
      address,
      'bsc',
      options
    );

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
      blockchain: 'bsc'
    });

  } catch (error) {
    console.error('BSC transaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BSC transactions', details: error.message },
      { status: 500 }
    );
  }
}