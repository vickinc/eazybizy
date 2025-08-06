import { NextResponse } from 'next/server';
import { CryptoAPIsService } from '@/services/integrations/cryptoAPIsService';

export async function GET() {
  try {
    const isConfigured = CryptoAPIsService.isConfigured();
    
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'CryptoAPIs is not configured'
      });
    }

    // Test with the actual wallet addresses from the database
    const bitcoinAddress = 'bc1qs6s3grt2enzu7a4legwgcw6aylrc7y2dt8re07';
    const tronAddress = 'TAFwhJwa9oHGPV1Li6FRBWETsynqMkQ8vF';

    const [bitcoinResult, tronResult] = await Promise.allSettled([
      CryptoAPIsService.getBitcoinBalance(bitcoinAddress, 'mainnet'),
      CryptoAPIsService.getTronBalance(tronAddress, 'mainnet')
    ]);

    return NextResponse.json({
      success: true,
      cryptoAPIsConfigured: true,
      results: {
        bitcoin: {
          address: bitcoinAddress,
          result: bitcoinResult.status === 'fulfilled' ? bitcoinResult.value : { error: bitcoinResult.reason?.message }
        },
        tron: {
          address: tronAddress,
          result: tronResult.status === 'fulfilled' ? tronResult.value : { error: tronResult.reason?.message }
        }
      },
      message: 'Bitcoin and Tron balance test completed'
    });

  } catch (error) {
    console.error('BTC/TRX test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}