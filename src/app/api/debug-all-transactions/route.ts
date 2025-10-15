import { NextRequest, NextResponse } from 'next/server';
import { EtherscanAPIService } from '@/services/integrations/etherscanAPIService';

export async function GET(request: NextRequest) {
  try {
    const address = '0x725B4E2a44629Cf3467c5299790967C3e29d2757';
    
    console.log('🧪 Testing getAllTransactions method...');
    
    // Call getAllTransactions which is what the main API uses
    const allTransactions = await EtherscanAPIService.getAllTransactions(address, 'ethereum', {
      limit: 2000
    });
    
    console.log(`📊 getAllTransactions returned ${allTransactions.length} transactions`);
    
    // Check for internal transactions
    const internalTxs = allTransactions.filter(tx => tx.isInternal === true);
    console.log(`📊 Internal transactions: ${internalTxs.length}`);
    
    // Check for our specific hashes
    const targetHashes = [
      '0x65775048660b3c3d0c92c09d27e8f6ec5d49fa4887efa273cd1798f518115c4f',
      '0x2fc04baaa16828cb540306fc8ac544cf2345a31baf2e6a2b46010f3abf0ecc7c'
    ];
    
    const foundTargets = allTransactions.filter(tx => 
      targetHashes.some(hash => tx.hash.toLowerCase() === hash.toLowerCase())
    );
    
    console.log(`🎯 Found ${foundTargets.length} target transactions`);
    
    return NextResponse.json({
      success: true,
      totalTransactions: allTransactions.length,
      internalTransactions: internalTxs.length,
      targetTransactionsFound: foundTargets.length,
      foundTargets: foundTargets.map(tx => ({
        hash: tx.hash,
        amount: tx.amount,
        type: tx.type,
        isInternal: tx.isInternal,
        timestamp: new Date(tx.timestamp).toISOString()
      })),
      sampleInternals: internalTxs.slice(0, 5).map(tx => ({
        hash: tx.hash.substring(0, 20) + '...',
        amount: tx.amount,
        type: tx.type,
        isInternal: tx.isInternal,
        currency: tx.currency,
        tokenType: tx.tokenType
      })),
      // Check transactions from July 28, 2023
      july28Transactions: allTransactions.filter(tx => {
        const timestamp = tx.timestamp;
        return timestamp > 1690550000000 && timestamp < 1690570000000;
      }).map(tx => ({
        hash: tx.hash.substring(0, 20) + '...',
        amount: tx.amount,
        type: tx.type,
        isInternal: tx.isInternal,
        timestamp: new Date(tx.timestamp).toISOString()
      }))
    });
    
  } catch (error) {
    console.error('❌ Debug all transactions error:', error);
    return NextResponse.json({
      error: 'Failed to debug all transactions',
      details: error.message
    }, { status: 500 });
  }
}