import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all digital wallets with their full details
    const allWallets = await prisma.digitalWallet.findMany({
      select: {
        id: true,
        walletName: true,
        currency: true,
        currencies: true,
        blockchain: true,
        walletType: true,
        walletAddress: true,
        companyId: true,
        company: {
          select: {
            tradingName: true
          }
        }
      },
      orderBy: {
        blockchain: 'asc'
      }
    });

    // Group by blockchain for better visualization
    const walletsByBlockchain = allWallets.reduce((acc, wallet) => {
      const blockchain = wallet.blockchain || 'unknown';
      if (!acc[blockchain]) {
        acc[blockchain] = [];
      }
      acc[blockchain].push({
        id: wallet.id,
        name: wallet.walletName,
        currency: wallet.currency,
        currencies: wallet.currencies,
        walletType: wallet.walletType,
        address: wallet.walletAddress,
        company: wallet.company?.tradingName,
        hasAddress: !!wallet.walletAddress,
        isMultiCurrency: !!wallet.currencies
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      totalWallets: allWallets.length,
      cryptoWallets: allWallets.filter(w => w.walletType === 'crypto').length,
      walletsWithAddresses: allWallets.filter(w => w.walletAddress).length,
      walletsByBlockchain,
      allWallets: allWallets.map(w => ({
        id: w.id,
        name: w.walletName,
        currency: w.currency,
        currencies: w.currencies,
        blockchain: w.blockchain,
        walletType: w.walletType,
        hasAddress: !!w.walletAddress,
        address: w.walletAddress?.substring(0, 20) + '...' // Truncate for security
      }))
    });

  } catch (error) {
    console.error('Error fetching wallet debug info:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch wallet info'
    }, { status: 500 });
  }
}