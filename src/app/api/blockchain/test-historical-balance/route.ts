import { NextRequest, NextResponse } from 'next/server'
import { TronGridService } from '@/services/integrations/tronGridService'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Server-side authentication check
    const { user, error } = await authenticateRequest()
    
    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('address')
    const blockchain = searchParams.get('blockchain') || 'tron'
    const currency = searchParams.get('currency') || 'TRX'
    const asOfDateParam = searchParams.get('asOfDate') // Format: YYYY-MM-DD

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      )
    }

    if (!asOfDateParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: asOfDate (format: YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const asOfDate = new Date(asOfDateParam)
    if (isNaN(asOfDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid asOfDate format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Test the getBlockchainHistoricalBalance function directly
    const historicalBalance = await getBlockchainHistoricalBalanceAPI(
      walletAddress,
      blockchain,
      currency,
      asOfDate
    )

    return NextResponse.json({
      success: true,
      testParams: {
        walletAddress,
        blockchain,
        currency,
        asOfDate: asOfDate.toISOString()
      },
      result: historicalBalance,
      message: historicalBalance 
        ? `Successfully calculated historical balance: ${historicalBalance.netAmount} ${currency}`
        : 'No historical balance data available (blockchain may not be supported or no transactions found)'
    })

  } catch (error) {
    console.error('❌ Error in historical balance test API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test historical balance fetching', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Copy of the getBlockchainHistoricalBalanceAPI function for testing (with forward calculation)
async function getBlockchainHistoricalBalanceAPI(
  walletAddress: string,
  blockchain: string,
  currency: string,
  asOfDate: Date
): Promise<{ netAmount: number; totalIncoming: number; totalOutgoing: number } | null> {
  try {
    const blockchainLower = blockchain.toLowerCase();
    
    console.log('🚀 TEST API: Fetching blockchain historical balance (forward calculation):', {
      walletAddress,
      blockchain: blockchainLower,
      currency,
      asOfDate: asOfDate.toISOString(),
      asOfDateTimestamp: asOfDate.getTime()
    });

    let allTransactions = [];

    // Get ALL transactions for this wallet (we'll filter by date manually)
    switch (blockchainLower) {
      case 'tron':
        if (currency.toUpperCase() === 'TRX') {
          console.log('📡 TEST API: Fetching TRX transaction history...');
          allTransactions = await TronGridService.getTransactionHistory(walletAddress, {
            limit: 5000 // Get a large number to ensure we have all historical data
          });
        } else {
          console.log(`📡 TEST API: Fetching ${currency} token transaction history...`);
          // TRC-20 tokens (USDT, USDC, etc.)
          allTransactions = await TronGridService.getTRC20TransactionHistory(walletAddress, currency, {
            limit: 5000
          });
        }
        break;
        
      case 'ethereum':
      case 'binance-smart-chain':
        console.warn(`TEST API: Historical balance fetching not yet implemented for ${blockchain}`);
        return null;
        
      default:
        console.warn(`TEST API: Unsupported blockchain for historical balance: ${blockchain}`);
        return null;
    }

    console.log(`📦 TEST API: Retrieved ${allTransactions.length} total transactions`);

    if (allTransactions.length === 0) {
      console.log('📭 TEST API: No blockchain transactions found');
      return { netAmount: 0, totalIncoming: 0, totalOutgoing: 0 };
    }

    // Filter transactions to only include those UP TO the historical date
    const historicalTransactions = allTransactions.filter(tx => {
      const txTimestamp = tx.timestamp;
      const asOfTimestamp = asOfDate.getTime();
      return txTimestamp <= asOfTimestamp;
    });

    console.log(`📊 TEST API: Processing ${historicalTransactions.length} transactions up to ${asOfDate.toISOString()}`);
    
    // Log some sample transactions for debugging
    if (historicalTransactions.length > 0) {
      console.log('🔍 TEST API: Sample transactions:', historicalTransactions.slice(0, 3).map(tx => ({
        hash: tx.hash.substring(0, 10) + '...',
        timestamp: new Date(tx.timestamp).toISOString(),
        amount: tx.amount,
        currency: tx.currency,
        type: tx.type,
        status: tx.status
      })));
    }

    // Calculate balance from historical transactions
    let totalIncoming = 0;
    let totalOutgoing = 0;
    let successfulTxCount = 0;
    let failedTxCount = 0;

    for (const tx of historicalTransactions) {
      if (tx.status !== 'success') {
        failedTxCount++;
        continue; // Only count successful transactions
      }
      
      successfulTxCount++;
      const amount = tx.amount || 0;
      
      console.log(`💰 TEST API: Processing tx: ${tx.hash.substring(0, 10)}... | ${tx.type} | ${amount} ${currency}`);
      
      if (tx.type === 'incoming') {
        totalIncoming += amount;
      } else if (tx.type === 'outgoing') {
        totalOutgoing += amount;
      } else {
        console.warn(`⚠️ TEST API: Unknown transaction type: ${tx.type}`);
      }
    }

    const netAmount = totalIncoming - totalOutgoing;

    console.log('✅ TEST API: Historical balance calculation complete:', {
      currency,
      asOfDate: asOfDate.toISOString(),
      totalTransactions: allTransactions.length,
      historicalTransactions: historicalTransactions.length,
      successfulTransactions: successfulTxCount,
      failedTransactions: failedTxCount,
      totalIncoming,
      totalOutgoing,
      netAmount
    });

    return {
      netAmount,
      totalIncoming,
      totalOutgoing
    };

  } catch (error) {
    console.error('❌ TEST API: Error fetching blockchain historical balance:', error);
    return null;
  }
}