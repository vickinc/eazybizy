import { NextRequest, NextResponse } from 'next/server';
import { CurrencyRatesDatabaseService } from '@/services/api/currencyRatesDatabaseService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'fiat' | 'crypto' | null;
    
    let rates;
    if (type) {
      rates = await CurrencyRatesDatabaseService.findByType(type);
    } else {
      rates = await CurrencyRatesDatabaseService.findAll();
    }
    
    // Convert to application format
    const currencyRates = CurrencyRatesDatabaseService.toCurrencyRates(rates);
    
    return NextResponse.json({
      success: true,
      data: currencyRates
    });
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch currency rates' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rates } = body;
    
    if (!Array.isArray(rates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format: rates must be an array' },
        { status: 400 }
      );
    }
    
    // Convert to database format and bulk upsert
    const createInputs = rates.map(rate => ({
      code: rate.code,
      name: rate.name,
      rate: rate.rate,
      type: rate.type,
      source: rate.source || 'manual'
    }));
    
    await CurrencyRatesDatabaseService.bulkUpsert(createInputs);
    
    return NextResponse.json({
      success: true,
      message: `Successfully saved ${rates.length} currency rates`
    });
  } catch (error) {
    console.error('Error saving currency rates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save currency rates' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, rate, source = 'manual' } = body;
    
    if (!code || typeof rate !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid data: code and rate are required' },
        { status: 400 }
      );
    }
    
    const updatedRate = await CurrencyRatesDatabaseService.updateRate(code, rate, source);
    const currencyRate = CurrencyRatesDatabaseService.toCurrencyRate(updatedRate);
    
    return NextResponse.json({
      success: true,
      data: currencyRate
    });
  } catch (error) {
    console.error('Error updating currency rate:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update currency rate' 
      },
      { status: 500 }
    );
  }
}