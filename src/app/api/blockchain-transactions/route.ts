import { NextRequest, NextResponse } from 'next/server';
import { EtherscanAPIService } from '@/services/integrations/etherscanAPIService';
import { TronGridService } from '@/services/integrations/tronGridService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const blockchain = searchParams.get('blockchain');
    const currency = searchParams.get('currency');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '1000');

    if (!address || !blockchain) {
      return NextResponse.json(
        { error: 'Missing required parameters: address and blockchain' },
        { status: 400 }
      );
    }

    const blockchainLower = blockchain.toLowerCase();
    let transactions = [];

    // Parse dates if provided
    const options: any = {
      limit,
      currency: currency || undefined
    };

    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    // Fetch transactions based on blockchain
    switch (blockchainLower) {
      case 'tron':
        if (!TronGridService.isConfigured()) {
          return NextResponse.json(
            { error: 'TronGrid API not configured' },
            { status: 503 }
          );
        }

        if (currency?.toUpperCase() === 'TRX') {
          transactions = await TronGridService.getTransactionHistory(address, options);
        } else if (currency) {
          transactions = await TronGridService.getTRC20TransactionHistory(
            address,
            currency,
            options
          );
        } else {
          // Get all transactions
          transactions = await TronGridService.getTransactionHistory(address, options);
        }
        break;

      case 'ethereum':
        if (!EtherscanAPIService.isConfigured('ethereum')) {
          return NextResponse.json(
            { error: 'Etherscan API not configured' },
            { status: 503 }
          );
        }

        transactions = await EtherscanAPIService.getTransactionHistory(
          address,
          'ethereum',
          options
        );
        break;

      case 'bsc':
      case 'binance-smart-chain':
        if (!EtherscanAPIService.isConfigured('bsc')) {
          return NextResponse.json(
            { error: 'BSCScan API not configured' },
            { status: 503 }
          );
        }

        transactions = await EtherscanAPIService.getTransactionHistory(
          address,
          'bsc',
          options
        );
        break;

      default:
        return NextResponse.json(
          { error: `Blockchain ${blockchain} not supported` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: transactions,
      count: transactions.length
    });

  } catch (error) {
    console.error('Blockchain transaction API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blockchain transactions', details: error.message },
      { status: 500 }
    );
  }
}