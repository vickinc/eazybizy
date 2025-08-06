import { NextResponse } from 'next/server';
import { AlchemyAPIService } from '@/services/integrations/alchemyAPIService';

export async function GET() {
  try {
    // Test Alchemy API configuration and functionality
    console.log('🧪 Testing Alchemy API...');
    
    const isConfigured = AlchemyAPIService.isConfigured();
    console.log('📋 Alchemy configured:', isConfigured);
    
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Alchemy API is not configured',
        configured: false
      });
    }
    
    // Test with a known Ethereum address (Vitalik's public address)
    const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    
    console.log('🔍 Testing ETH balance fetch for address:', testAddress);
    const balance = await AlchemyAPIService.getNativeBalance(testAddress, 'ethereum', 'mainnet');
    
    return NextResponse.json({
      success: true,
      configured: isConfigured,
      testBalance: balance,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Alchemy test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      configured: AlchemyAPIService.isConfigured()
    }, { status: 500 });
  }
}