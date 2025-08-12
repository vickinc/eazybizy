import { NextRequest, NextResponse } from 'next/server';
import { TronGridService } from '@/services/integrations/tronGridService';

/**
 * Server-side API endpoint for fetching Tron transactions using TronGrid API
 * This avoids CORS issues when accessing TronGrid API from the browser
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const blockchain = searchParams.get('blockchain');
    const currency = searchParams.get('currency');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') || '1000';

    if (!address || !blockchain) {
      return NextResponse.json(
        { error: 'Address and blockchain are required' },
        { status: 400 }
      );
    }

    if (blockchain.toLowerCase() !== 'tron') {
      return NextResponse.json(
        { error: 'Only Tron blockchain is supported' },
        { status: 400 }
      );
    }

    // Check if TronGrid is configured (server-side check)
    const apiKey = process.env.TRONGRID_API_KEY;
    console.log('🔍 TronGrid API key check:', apiKey ? `Configured (${apiKey.substring(0, 8)}...)` : 'Not configured');
    
    if (!apiKey || apiKey.length < 10) {
      console.error('❌ TronGrid API key not found in server environment variables');
      return NextResponse.json(
        { error: 'TronGrid API is not configured on the server. Please add TRONGRID_API_KEY to your .env.local file and restart the server.' },
        { status: 503 }
      );
    }

    console.log('🚀 Server-side Tron transaction fetch using TronGrid:', {
      address,
      currency,
      startDate,
      endDate,
      limit,
      apiKeyConfigured: !!apiKey
    });

    const options = {
      limit: parseInt(limit),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      onlyConfirmed: true
    };

    let transactions = [];

    if (!currency || currency.toUpperCase() === 'TRX') {
      // Fetch native TRX transactions
      transactions = await TronGridService.getTransactionHistory(address, options);
      
      // Filter to only native TRX transactions (not TRC-20)
      transactions = transactions.filter(tx => 
        tx.tokenType === 'native' && tx.currency === 'TRX'
      );
      
      console.log(`✅ Fetched ${transactions.length} native TRX transactions from TronGrid`);
    } else if (currency) {
      // Fetch specific TRC-20 token transactions using direct API call
      const currencyUpper = currency.toUpperCase();
      console.log(`📝 Fetching TRC-20 transactions for token: ${currencyUpper}`);
      
      // Direct API call to TronGrid (bypassing the service class)
      const contractAddresses: Record<string, string> = {
        'USDT': 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        'USDC': 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
      };
      
      const contractAddress = contractAddresses[currencyUpper];
      if (!contractAddress) {
        console.warn(`⚠️ Unknown token symbol: ${currencyUpper}`);
        transactions = [];
      } else {
        try {
          const url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20`;
          const params = new URLSearchParams({
            contract_address: contractAddress,
            limit: Math.min(parseInt(limit), 200).toString()
          });
          
          if (startDate) {
            params.append('min_timestamp', new Date(startDate).getTime().toString());
          }
          if (endDate) {
            params.append('max_timestamp', new Date(endDate).getTime().toString());
          }
          
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          
          if (apiKey) {
            headers['TRON-PRO-API-KEY'] = apiKey;
          }
          
          console.log(`🔍 Direct API call: ${url}?${params.toString()}`);
          
          const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers
          });
          
          if (!response.ok) {
            throw new Error(`TronGrid API error: ${response.status} ${response.statusText}`);
          }
          
          const responseData = await response.json();
          const rawTransactions = responseData.data || [];
          
          console.log(`📊 Received ${rawTransactions.length} raw transactions from TronGrid`);
          
          // Parse transactions directly
          transactions = rawTransactions.map((tx: any) => {
            const isIncoming = tx.to?.toLowerCase() === address.toLowerCase();
            const tokenInfo = tx.token_info || {};
            const decimals = tokenInfo.decimals || 6;
            const amount = parseFloat(tx.value || '0') / Math.pow(10, decimals);
            
            return {
              hash: tx.transaction_id,
              from: tx.from,
              to: tx.to,
              amount: isIncoming ? amount : -amount,
              currency: tokenInfo.symbol || currencyUpper,
              timestamp: tx.block_timestamp || Date.now(),
              status: 'success',
              type: isIncoming ? 'incoming' : 'outgoing',
              fee: 0,
              blockchain: 'tron',
              tokenType: 'trc20',
              contractAddress: tokenInfo.address
            };
          });
          
          console.log(`✅ Parsed ${transactions.length} ${currencyUpper} transactions`);
          
        } catch (directApiError) {
          console.error('❌ Direct API call failed:', directApiError);
          throw directApiError;
        }
      }
      
      // Log sample transaction if available for debugging
      if (transactions.length > 0) {
        console.log('📝 Sample transaction:', {
          hash: transactions[0].hash,
          currency: transactions[0].currency,
          amount: transactions[0].amount,
          type: transactions[0].type,
          timestamp: transactions[0].timestamp
        });
      } else {
        console.log('⚠️ No transactions found. Possible reasons:');
        console.log('   1. The wallet has no USDT transactions');
        console.log('   2. The date range is too restrictive');
        console.log('   3. The wallet address might be incorrect');
        console.log('   Debug info:', {
          walletAddress: address,
          dateRange: {
            start: options.startDate?.toISOString(),
            end: options.endDate?.toISOString()
          }
        });
      }
    } else {
      // No specific currency requested - return empty to avoid mixing
      console.log(`⚠️ No specific currency requested for Tron transactions - returning empty array`);
      transactions = [];
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length
    });

  } catch (error) {
    console.error('❌ Server-side Tron transaction fetch error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Tron transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}