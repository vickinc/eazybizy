import { NextRequest, NextResponse } from 'next/server';
import { CurrencyRatesDatabaseService } from '@/services/api/currencyRatesDatabaseService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { defaultRates } = body;
    
    if (!Array.isArray(defaultRates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format: defaultRates must be an array' },
        { status: 400 }
      );
    }
    
    await CurrencyRatesDatabaseService.initializeDefaults(defaultRates);
    
    return NextResponse.json({
      success: true,
      message: `Successfully initialized ${defaultRates.length} default currency rates`
    });
  } catch (error) {
    console.error('Error initializing currency rates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize default currency rates' 
      },
      { status: 500 }
    );
  }
}