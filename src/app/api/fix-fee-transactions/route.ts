import { NextRequest, NextResponse } from 'next/server';
import { BlockchainTransactionImportService } from '@/services/business/blockchainTransactionImportService';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting fee transaction fix...');
    
    await BlockchainTransactionImportService.fixExistingFeeTransactions();
    
    return NextResponse.json({
      success: true,
      message: 'Fee transactions fixed successfully'
    });

  } catch (error) {
    console.error('❌ Fee transaction fix error:', error);
    return NextResponse.json(
      { error: 'Failed to fix fee transactions', details: error.message },
      { status: 500 }
    );
  }
}