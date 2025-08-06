import { NextResponse } from 'next/server';
import { CurrencyRatesDatabaseService } from '@/services/api/currencyRatesDatabaseService';

export async function GET() {
  try {
    const stats = await CurrencyRatesDatabaseService.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        totalRates: stats.totalRates,
        fiatRates: stats.fiatRates,
        cryptoRates: stats.cryptoRates,
        lastUpdated: stats.lastUpdated?.toISOString() || null
      }
    });
  } catch (error) {
    console.error('Error fetching currency rates stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch currency rates statistics' 
      },
      { status: 500 }
    );
  }
}