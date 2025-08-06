import { NextRequest, NextResponse } from 'next/server';
import { CurrencyRatesDatabaseService } from '@/services/api/currencyRatesDatabaseService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fiatRates, cryptoRates } = body;
    
    if (!Array.isArray(fiatRates) || !Array.isArray(cryptoRates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format: fiatRates and cryptoRates must be arrays' },
        { status: 400 }
      );
    }
    
    await CurrencyRatesDatabaseService.migrateFromLocalStorage(fiatRates, cryptoRates);
    
    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${fiatRates.length + cryptoRates.length} currency rates to database`
    });
  } catch (error) {
    console.error('Error migrating currency rates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to migrate currency rates' 
      },
      { status: 500 }
    );
  }
}