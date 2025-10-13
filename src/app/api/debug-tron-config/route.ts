import { NextResponse } from 'next/server';
import { TronGridService } from '@/services/integrations/tronGridService';
import { AlchemyAPIService } from '@/services/integrations/alchemyAPIService';
import { CryptoAPIsService } from '@/services/integrations/cryptoAPIsService';

/**
 * Diagnostic endpoint to check TronGrid and other blockchain API configurations
 * GET /api/debug-tron-config
 */
export async function GET() {
  try {
    const tronGridConfigured = TronGridService.isConfigured();
    const alchemyConfigured = AlchemyAPIService.isConfigured();
    const cryptoAPIsConfigured = CryptoAPIsService.isConfigured();

    const diagnosis = {
      timestamp: new Date().toISOString(),
      services: {
        tronGrid: {
          configured: tronGridConfigured,
          apiKey: process.env.TRONGRID_API_KEY ? {
            present: true,
            length: process.env.TRONGRID_API_KEY.length,
            isPlaceholder: process.env.TRONGRID_API_KEY === 'your-trongrid-api-key-here' ||
                          process.env.TRONGRID_API_KEY === 'your-actual-trongrid-api-key-here'
          } : {
            present: false,
            length: 0,
            isPlaceholder: false
          },
          status: tronGridConfigured ?
            '✅ TronGrid is properly configured' :
            '❌ TronGrid is NOT configured - Tron balance enrichment will be skipped',
          solution: tronGridConfigured ?
            null :
            'Get a free API key from https://www.trongrid.io/ and add it to your .env file as TRONGRID_API_KEY'
        },
        alchemy: {
          configured: alchemyConfigured,
          apiKey: process.env.ALCHEMY_API_KEY ? {
            present: true,
            length: process.env.ALCHEMY_API_KEY.length,
            isPlaceholder: process.env.ALCHEMY_API_KEY === 'your-alchemy-api-key-here'
          } : {
            present: false,
            length: 0,
            isPlaceholder: false
          },
          supportedBlockchains: ['ethereum', 'solana', 'binance-smart-chain'],
          status: alchemyConfigured ?
            '✅ Alchemy is properly configured' :
            '⚠️ Alchemy is NOT configured - ETH, SOL, BNB balance enrichment will be skipped'
        },
        cryptoAPIs: {
          configured: cryptoAPIsConfigured,
          apiKey: process.env.CRYPTO_APIS_KEY ? {
            present: true,
            length: process.env.CRYPTO_APIS_KEY.length,
            isPlaceholder: process.env.CRYPTO_APIS_KEY === 'your-crypto-apis-key-here'
          } : {
            present: false,
            length: 0,
            isPlaceholder: false
          },
          supportedBlockchains: ['bitcoin'],
          status: cryptoAPIsConfigured ?
            '✅ CryptoAPIs is properly configured' :
            '⚠️ CryptoAPIs is NOT configured - BTC balance enrichment will be skipped'
        }
      },
      balanceEnrichmentStatus: {
        tron: tronGridConfigured ?
          '✅ Tron (TRX, USDT, USDC) balances will be fetched from blockchain' :
          '❌ Tron balances will remain at 0 (database only)',
        ethereum: alchemyConfigured ?
          '✅ Ethereum (ETH, USDT, USDC, etc.) balances will be fetched from blockchain' :
          '❌ Ethereum balances will remain at 0 (database only)',
        binanceSmartChain: alchemyConfigured ?
          '✅ BNB Smart Chain (BNB, BUSD, etc.) balances will be fetched from blockchain' :
          '❌ BNB Smart Chain balances will remain at 0 (database only)',
        bitcoin: cryptoAPIsConfigured ?
          '✅ Bitcoin (BTC) balances will be fetched from blockchain' :
          '❌ Bitcoin balances will remain at 0 (database only)',
        solana: alchemyConfigured ?
          '✅ Solana (SOL) balances will be fetched from blockchain' :
          '❌ Solana balances will remain at 0 (database only)'
      },
      recommendations: []
    };

    // Add recommendations based on configuration
    if (!tronGridConfigured) {
      diagnosis.recommendations.push({
        priority: 'HIGH',
        service: 'TronGrid',
        issue: 'Tron balance enrichment is disabled',
        action: 'Get a free API key from https://www.trongrid.io/ (100K requests/day)',
        envVariable: 'TRONGRID_API_KEY',
        impact: 'All Tron wallets will show 0 balance for TRX, USDT, and USDC'
      });
    }

    if (!alchemyConfigured) {
      diagnosis.recommendations.push({
        priority: 'MEDIUM',
        service: 'Alchemy',
        issue: 'Ethereum, Solana, and BNB balance enrichment is disabled',
        action: 'Get a free API key from https://www.alchemy.com/',
        envVariable: 'ALCHEMY_API_KEY',
        impact: 'ETH, SOL, BNB, and their tokens will show 0 balance'
      });
    }

    if (!cryptoAPIsConfigured) {
      diagnosis.recommendations.push({
        priority: 'LOW',
        service: 'CryptoAPIs',
        issue: 'Bitcoin balance enrichment is disabled',
        action: 'Get an API key from https://cryptoapis.io/',
        envVariable: 'CRYPTO_APIS_KEY',
        impact: 'Bitcoin wallets will show 0 balance'
      });
    }

    // Test TronGrid API if configured
    if (tronGridConfigured) {
      try {
        console.log('🧪 Testing TronGrid API with sample address...');
        const testAddress = 'TAFwhJwa9oHGPV1Li6FRBWETsynqMkQ8vF';
        const testBalance = await TronGridService.getTronBalance(testAddress);

        diagnosis.services.tronGrid.apiTest = {
          success: true,
          testAddress,
          testBalance: testBalance.balance,
          message: '✅ TronGrid API is working correctly'
        };
      } catch (error) {
        diagnosis.services.tronGrid.apiTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: '❌ TronGrid API test failed - check your API key'
        };
      }
    }

    return NextResponse.json(diagnosis, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Error in debug-tron-config endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to check TronGrid configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
