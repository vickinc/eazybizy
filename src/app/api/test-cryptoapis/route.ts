import { NextResponse } from 'next/server';
import { CryptoAPIsService } from '@/services/integrations/cryptoAPIsService';

export async function GET() {
  try {
    // Test configuration
    const isConfigured = CryptoAPIsService.isConfigured();
    
    // Test with a Bitcoin address for demonstration (well-known address that should be synced)
    const testBitcoinAddress = 'bc1qs6s3grt2enzu7a4legwgcw6aylrc7y2dt8re07'; // User's actual BTC wallet address
    
    let bitcoinResult = null;
    if (isConfigured) {
      try {
        console.log('Testing Bitcoin balance fetch...');
        bitcoinResult = await CryptoAPIsService.getBitcoinBalance(testBitcoinAddress, 'mainnet');
      } catch (error) {
        console.error('Bitcoin test failed:', error);
        bitcoinResult = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }
    
    return NextResponse.json({
      success: true,
      cryptoAPIsConfigured: isConfigured,
      hasApiKey: !!process.env.CRYPTO_APIS_KEY,
      apiKeyLength: process.env.CRYPTO_APIS_KEY?.length || 0,
      supportedBlockchains: ['bitcoin', 'tron'],
      testResults: {
        bitcoin: bitcoinResult
      },
      message: isConfigured ? 'CryptoAPIs is configured and ready' : 'CryptoAPIs API key not found'
    });

  } catch (error) {
    console.error('CryptoAPIs test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test CryptoAPIs integration'
    }, { status: 500 });
  }
}