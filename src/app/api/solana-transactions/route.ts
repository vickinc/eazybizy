import { NextRequest, NextResponse } from 'next/server';
import { SolanaTransactionService } from '@/services/business/solanaTransactionService';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Solana API GET request received');
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const currency = searchParams.get('currency');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '1000');

    console.log('📋 Solana API parameters:', { address, currency, startDate, endDate, limit });

    if (!address) {
      console.error('❌ Missing address parameter');
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    // Validate Solana address format
    if (!SolanaTransactionService.isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    // Check if Solana RPC is configured
    console.log('🔍 Checking Solana service configuration...');
    if (!SolanaTransactionService.isConfigured()) {
      console.error('❌ Solana RPC not configured');
      return NextResponse.json(
        { 
          error: 'Solana RPC not configured',
          details: 'Solana RPC connection failed. Check SOLANA_RPC_URL environment variable or use default public RPC.',
          success: false 
        },
        { status: 503 }
      );
    }
    console.log('✅ Solana service configured successfully');

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

    console.log(`🚀 Solana API: Fetching transactions for ${address.substring(0, 10)}...`);
    console.log('📋 Options:', options);
    const startTime = Date.now();

    // Fetch transactions using Solana RPC
    console.log('📞 Calling SolanaTransactionService.getTransactions...');
    const allTransactions = await SolanaTransactionService.getTransactions(address, options);
    console.log('📨 Service call completed successfully');
    
    // Filter out failed and pending transactions - only include successful ones
    const transactions = allTransactions.filter(tx => tx.status === 'success');
    const filteredCount = allTransactions.length - transactions.length;
    
    if (filteredCount > 0) {
      console.log(`🔍 Filtered out ${filteredCount} non-successful transactions`);
    }

    const endTime = Date.now();
    console.log(`✅ Solana API: Retrieved ${transactions.length} successful transactions in ${endTime - startTime}ms`);

    // Group transactions by currency
    const byCurrency = transactions.reduce((acc: any, tx) => {
      if (!acc[tx.currency]) {
        acc[tx.currency] = [];
      }
      acc[tx.currency].push(tx);
      return acc;
    }, {});

    // Calculate summary
    const summary = {
      totalTransactions: transactions.length,
      byCurrency: Object.keys(byCurrency).map(currency => ({
        currency,
        count: byCurrency[currency].length,
        totalIncoming: byCurrency[currency]
          .filter((tx: any) => tx.type === 'incoming')
          .reduce((sum: number, tx: any) => sum + tx.amount, 0),
        totalOutgoing: byCurrency[currency]
          .filter((tx: any) => tx.type === 'outgoing')
          .reduce((sum: number, tx: any) => sum + tx.amount, 0)
      }))
    };

    return NextResponse.json({
      success: true,
      address,
      transactions,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Solana API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to fetch Solana transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        success: false
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletId, address, currency, startDate, endDate, limit } = body;

    if (!walletId || !address) {
      return NextResponse.json(
        { error: 'Missing required parameters: walletId and address' },
        { status: 400 }
      );
    }

    // Validate Solana address
    if (!SolanaTransactionService.isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    // Check if service is configured
    if (!SolanaTransactionService.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'Solana RPC not configured',
          success: false 
        },
        { status: 503 }
      );
    }

    const options: any = {
      limit: limit || 1000,
      currency
    };

    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    console.log(`📥 Importing Solana transactions for wallet ${walletId}`);

    // Import transactions to database
    const result = await SolanaTransactionService.importTransactions(
      walletId,
      address,
      options
    );

    console.log(`✅ Import complete:`, result);

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Solana import error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import Solana transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}