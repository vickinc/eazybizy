import { NextRequest, NextResponse } from 'next/server';
import { CryptoAPIsService } from '@/services/integrations/cryptoAPIsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, blockchain, network = 'mainnet' } = body;

    if (!address || !blockchain) {
      return NextResponse.json({
        success: false,
        error: 'Address and blockchain are required'
      }, { status: 400 });
    }

    // Only support Bitcoin and Tron for now
    if (!['bitcoin', 'tron'].includes(blockchain.toLowerCase())) {
      return NextResponse.json({
        success: false,
        error: 'Only Bitcoin and Tron are supported for syncing'
      }, { status: 400 });
    }

    if (!CryptoAPIsService.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'CryptoAPIs is not configured. Missing CRYPTO_APIS_KEY environment variable.'
      }, { status: 500 });
    }

    let syncResult;
    if (blockchain.toLowerCase() === 'bitcoin') {
      syncResult = await CryptoAPIsService.syncBitcoinAddress(address, network);
    } else {
      // For now, we'll assume Tron addresses don't need syncing
      syncResult = true;
    }

    if (syncResult) {
      return NextResponse.json({
        success: true,
        message: `${blockchain} address sync initiated. Please wait a few minutes and refresh to see the balance.`,
        address,
        blockchain,
        network
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to sync address. Check server logs for details.',
        address,
        blockchain,
        network
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error syncing blockchain address:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}