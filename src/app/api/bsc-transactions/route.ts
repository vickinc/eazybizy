import { NextRequest, NextResponse } from 'next/server';
import { BscTransactionService } from '@/services/business/bscTransactionService';

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

    // Check if BSC API is configured
    if (!BscTransactionService.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'BSC API not configured',
          details: 'BSC requires either BSCSCAN_API_KEY (preferred) or BSC_API_KEY. Get API keys from https://bscscan.com/apis',
          success: false 
        },
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

    console.log(`🚀 BSC API: Fetching transactions for ${address.substring(0, 10)}... with optimized performance`);
    const startTime = Date.now();

    // Use new optimized BSC transaction service
    const allTransactions = await BscTransactionService.getTransactions(address, options);
    
    // Filter out failed and pending transactions - only include successful ones
    const transactions = allTransactions.filter(tx => tx.status === 'success');
    const filteredCount = allTransactions.length - transactions.length;
    
    if (filteredCount > 0) {
      console.log(`🔍 Filtered out ${filteredCount} non-successful BSC transactions`);
    }

    const endTime = Date.now();
    console.log(`✅ BSC API: Completed in ${endTime - startTime}ms (${transactions.length} successful transactions)`);

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length,
      blockchain: 'bsc',
      performanceMs: endTime - startTime
    });

  } catch (error) {
    console.error('❌ BSC transaction API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch BSC transactions', 
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}