import { NextRequest, NextResponse } from 'next/server';
import { EtherscanAPIService } from '@/services/integrations/etherscanAPIService';

export async function GET(request: NextRequest) {
  try {
    const address = '0x725B4E2a44629Cf3467c5299790967C3e29d2757';
    
    console.log('🧪 Testing direct internal transactions API call...');
    
    if (!EtherscanAPIService.isConfigured('ethereum')) {
      return NextResponse.json({
        error: 'Etherscan API not configured',
        configured: false
      });
    }
    
    console.log('✅ Etherscan API is configured');
    
    // Test direct internal transactions call
    const internalTransactions = await EtherscanAPIService.getInternalTransactions(address, 'ethereum', {
      offset: 100
    });
    
    console.log(`📊 Internal transactions result:`, {
      count: internalTransactions.length,
      hasTargetTransactions: internalTransactions.some(tx => 
        tx.hash.includes('65775048') || tx.hash.includes('2fc04baaa')
      )
    });
    
    const targetTransactions = internalTransactions.filter(tx => 
      tx.hash.includes('65775048') || tx.hash.includes('2fc04baaa')
    );
    
    if (targetTransactions.length > 0) {
      console.log('🎯 Found target internal transactions:', targetTransactions.map(tx => ({
        hash: tx.hash.substring(0, 12) + '...',
        amount: tx.amount,
        type: tx.type,
        isInternal: tx.isInternal,
        timestamp: new Date(tx.timestamp).toISOString()
      })));
    }
    
    return NextResponse.json({
      success: true,
      configured: true,
      internalTransactionsCount: internalTransactions.length,
      targetTransactionsFound: targetTransactions.length,
      targetTransactions: targetTransactions.map(tx => ({
        hash: tx.hash,
        amount: tx.amount,
        type: tx.type,
        isInternal: tx.isInternal,
        tokenType: tx.tokenType,
        currency: tx.currency,
        timestamp: new Date(tx.timestamp).toISOString()
      })),
      allInternalTransactions: internalTransactions.slice(0, 5).map(tx => ({
        hash: tx.hash.substring(0, 12) + '...',
        amount: tx.amount,
        type: tx.type,
        isInternal: tx.isInternal
      }))
    });
    
  } catch (error) {
    console.error('❌ Test internal transactions error:', error);
    return NextResponse.json({
      error: 'Failed to test internal transactions',
      details: error.message
    }, { status: 500 });
  }
}