import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Find all digital wallets that should be crypto wallets
    const cryptoBlockchains = ['ethereum', 'solana', 'bitcoin', 'binance-smart-chain', 'tron'];
    const cryptoCurrencies = ['BTC', 'ETH', 'SOL', 'BNB', 'TRX', 'USDT', 'USDC', 'BUSD'];
    
    // Update wallets that have blockchain field set to crypto blockchains
    const blockchainUpdateResult = await prisma.digitalWallet.updateMany({
      where: {
        blockchain: {
          in: cryptoBlockchains
        },
        walletType: {
          not: 'crypto'
        }
      },
      data: {
        walletType: 'crypto'
      }
    });

    // Update wallets that have crypto currencies
    const currencyUpdateResult = await prisma.digitalWallet.updateMany({
      where: {
        currency: {
          in: cryptoCurrencies
        },
        walletType: {
          not: 'crypto'
        }
      },
      data: {
        walletType: 'crypto'
      }
    });

    // Get all crypto wallets to verify
    const cryptoWallets = await prisma.digitalWallet.findMany({
      where: {
        walletType: 'crypto'
      },
      select: {
        id: true,
        walletName: true,
        currency: true,
        blockchain: true,
        walletType: true,
        walletAddress: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Crypto wallet migration completed',
      blockchainUpdates: blockchainUpdateResult.count,
      currencyUpdates: currencyUpdateResult.count,
      totalCryptoWallets: cryptoWallets.length,
      cryptoWallets: cryptoWallets.map(w => ({
        id: w.id,
        name: w.walletName,
        currency: w.currency,
        blockchain: w.blockchain,
        hasAddress: !!w.walletAddress
      }))
    });

  } catch (error) {
    console.error('Error migrating crypto wallets:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    }, { status: 500 });
  }
}