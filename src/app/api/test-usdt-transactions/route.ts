import { NextRequest, NextResponse } from 'next/server';
import { EtherscanAPIService } from '@/services/integrations/etherscanAPIService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing enhanced USDT transaction fetching for ${address}`);

    // Check if Etherscan API is configured
    if (!EtherscanAPIService.isConfigured('ethereum')) {
      return NextResponse.json(
        { error: 'Etherscan API not configured' },
        { status: 503 }
      );
    }

    // Test the enhanced USDT transaction fetching
    const usdtTransactions = await EtherscanAPIService.getUSDTTransactionsWithFees(
      address,
      'ethereum',
      {
        limit: 1000 // Get more transactions for comprehensive testing
      }
    );

    console.log(`📊 Enhanced USDT transactions fetched: ${usdtTransactions.length}`);

    // Analyze the results
    const outgoingUsdtWithFees = usdtTransactions.filter(tx => 
      tx.type === 'outgoing' && tx.gasFee > 0
    );
    
    const outgoingUsdtWithoutFees = usdtTransactions.filter(tx => 
      tx.type === 'outgoing' && tx.gasFee === 0
    );

    // Check for transactions from late 2022 specifically
    const late2022Transactions = usdtTransactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate >= new Date('2022-10-01') && txDate <= new Date('2022-12-31') && tx.type === 'outgoing';
    });

    // Calculate total gas fees for late 2022 USDT transactions
    const late2022GasFees = late2022Transactions.reduce((sum, tx) => sum + tx.gasFee, 0);

    // Check for the specific target fees mentioned in the issue
    const targetFees = [0.00070922, 0.00068789, 0.00139059, 0.00090641, 0.00287672];
    const foundTargetFees = late2022Transactions.filter(tx => 
      targetFees.some(targetFee => Math.abs(tx.gasFee - targetFee) < 0.00001)
    );

    const analysis = {
      summary: {
        totalUsdtTransactions: usdtTransactions.length,
        outgoingWithFees: outgoingUsdtWithFees.length,
        outgoingWithoutFees: outgoingUsdtWithoutFees.length,
        late2022Transactions: late2022Transactions.length,
        late2022GasFees,
        foundTargetFees: foundTargetFees.length
      },
      late2022Analysis: {
        transactions: late2022Transactions.map(tx => ({
          hash: tx.hash,
          date: new Date(tx.timestamp).toLocaleDateString(),
          gasFee: tx.gasFee,
          gasUsed: tx.gasUsed,
          usdtAmount: tx.amount
        })),
        totalGasFees: late2022GasFees,
        averageGasFee: late2022Transactions.length > 0 ? late2022GasFees / late2022Transactions.length : 0
      },
      targetFeeMatches: foundTargetFees.map(tx => ({
        hash: tx.hash,
        date: new Date(tx.timestamp).toLocaleDateString(),
        gasFee: tx.gasFee,
        targetFeeMatched: targetFees.find(fee => Math.abs(tx.gasFee - fee) < 0.00001)
      })),
      sampleTransactions: usdtTransactions.slice(0, 10).map(tx => ({
        hash: tx.hash.substring(0, 10) + '...',
        date: new Date(tx.timestamp).toLocaleDateString(),
        type: tx.type,
        amount: tx.amount,
        gasFee: tx.gasFee,
        gasUsed: tx.gasUsed
      }))
    };

    return NextResponse.json({
      success: true,
      address: address.substring(0, 10) + '...',
      data: usdtTransactions,
      analysis,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Enhanced USDT transaction test error:', error);
    return NextResponse.json(
      { error: 'Failed to test enhanced USDT transactions', details: error.message },
      { status: 500 }
    );
  }
}