import { NextRequest, NextResponse } from 'next/server';
import { EtherscanAPIService } from '@/services/integrations/etherscanAPIService';

export async function GET(request: NextRequest) {
  try {
    const address = '0x725B4E2a44629Cf3467c5299790967C3e29d2757';
    
    console.log('🧪 Testing getTransactionHistory method...');
    
    // This is what the main API calls
    const transactions = await EtherscanAPIService.getTransactionHistory(
      address,
      'ethereum',
      { limit: 2000 }  // No currency filter
    );
    
    console.log(`📊 getTransactionHistory returned ${transactions.length} transactions`);
    
    // Check for internal transactions
    const internalTxs = transactions.filter(tx => tx.isInternal === true);
    
    // Check for our specific hashes
    const targetHashes = [
      '0x65775048660b3c3d0c92c09d27e8f6ec5d49fa4887efa273cd1798f518115c4f',
      '0x2fc04baaa16828cb540306fc8ac544cf2345a31baf2e6a2b46010f3abf0ecc7c'
    ];
    
    const foundTargets = transactions.filter(tx => 
      targetHashes.some(hash => tx.hash.toLowerCase() === hash.toLowerCase())
    );
    
    return NextResponse.json({
      success: true,
      totalTransactions: transactions.length,
      internalTransactions: internalTxs.length,
      targetTransactionsFound: foundTargets.length,
      foundTargets: foundTargets.map(tx => ({
        hash: tx.hash,
        amount: tx.amount,
        type: tx.type,
        currency: tx.currency,
        isInternal: tx.isInternal,
        timestamp: new Date(tx.timestamp).toISOString()
      })),
      // Group by currency to see what we have
      transactionsByCurrency: Object.entries(
        transactions.reduce((acc, tx) => {
          acc[tx.currency] = (acc[tx.currency] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
    });
    
  } catch (error) {
    console.error('❌ Test transaction history error:', error);
    return NextResponse.json({
      error: 'Failed to test transaction history',
      details: error.message
    }, { status: 500 });
  }
}