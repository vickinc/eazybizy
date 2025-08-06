import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const CRYPTO_APIS_KEY = process.env.CRYPTO_APIS_KEY;
    
    if (!CRYPTO_APIS_KEY) {
      return NextResponse.json({ error: 'CryptoAPIs key not configured' });
    }

    const bitcoinAddress = 'bc1qs6s3grt2enzu7a4legwgcw6aylrc7y2dt8re07';
    const endpoint = `/addresses-historical/utxo/bitcoin/mainnet/${bitcoinAddress}/balance`;
    const url = `https://rest.cryptoapis.io/v2${endpoint}`;

    console.log('🔍 Making request to:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': CRYPTO_APIS_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        url,
        endpoint
      });
    }

    const data = await response.json();

    // Return the full response for analysis
    return NextResponse.json({
      success: true,
      url,
      endpoint,
      fullResponse: data,
      analysis: {
        hasData: !!data.data,
        hasItem: !!(data.data && data.data.item),
        hasConfirmedBalance: !!(data.data && data.data.item && data.data.item.confirmedBalance),
        responseStructure: Object.keys(data),
        dataStructure: data.data ? Object.keys(data.data) : null,
        itemStructure: (data.data && data.data.item) ? Object.keys(data.data.item) : null
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}