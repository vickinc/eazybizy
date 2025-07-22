import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/api-auth';
import { CurrencyAPIService } from '@/services/integrations/currencyAPIService';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate the request
    const { user, error } = await authenticateRequest();
    
    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if API is configured
    const apiStatus = CurrencyAPIService.getAPIStatus();
    if (!apiStatus.crypto && !apiStatus.fiat) {
      return NextResponse.json(
        { error: 'Currency APIs not configured. Please set API_NINJAS_KEY and FREE_CURRENCY_API_KEY environment variables.' },
        { status: 500 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const baseCurrency = searchParams.get('base_currency') || 'USD';
    const currenciesParam = searchParams.get('currencies');
    const currencies = currenciesParam ? currenciesParam.split(',').map(c => c.trim().toUpperCase()) : undefined;

    // Validate date parameter
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    // Validate date format and ensure it's not in the future
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (requestedDate > today) {
      return NextResponse.json(
        { error: 'Cannot fetch historical rates for future dates' },
        { status: 400 }
      );
    }

    // Fetch historical rates
    const result = await CurrencyAPIService.getHistoricalRates(date, baseCurrency, currencies);

    if (!result.success) {
      const statusCode = result.error === 'Rate limit exceeded' ? 429 : 500;
      return NextResponse.json(
        { 
          error: result.error,
          rateLimit: result.rateLimit
        },
        { status: statusCode }
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        date,
        baseCurrency,
        totalCurrencies: result.data?.length || 0,
        responseTime,
        rateLimit: result.rateLimit
      }
    });

  } catch (error) {
    console.error('Historical currency rates API error:', error);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch historical currency rates',
        responseTime
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate the request
    const { user, error } = await authenticateRequest();
    
    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if API is configured
    const apiStatus = CurrencyAPIService.getAPIStatus();
    if (!apiStatus.crypto && !apiStatus.fiat) {
      return NextResponse.json(
        { error: 'Currency APIs not configured. Please set API_NINJAS_KEY and FREE_CURRENCY_API_KEY environment variables.' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { date, baseCurrency = 'USD', currencies } = body;

    // Validate currencies array if provided
    if (currencies && !Array.isArray(currencies)) {
      return NextResponse.json(
        { error: 'Currencies must be an array of currency codes' },
        { status: 400 }
      );
    }

    // Validate date parameter
    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    // Validate date format and ensure it's not in the future
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (requestedDate > today) {
      return NextResponse.json(
        { error: 'Cannot fetch historical rates for future dates' },
        { status: 400 }
      );
    }

    const normalizedCurrencies = currencies?.map((c: string) => c.toUpperCase());

    // Fetch historical rates
    const result = await CurrencyAPIService.getHistoricalRates(date, baseCurrency, normalizedCurrencies);

    if (!result.success) {
      const statusCode = result.error === 'Rate limit exceeded' ? 429 : 500;
      return NextResponse.json(
        { 
          error: result.error,
          rateLimit: result.rateLimit
        },
        { status: statusCode }
      );
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        date,
        baseCurrency,
        totalCurrencies: result.data?.length || 0,
        responseTime,
        rateLimit: result.rateLimit
      }
    });

  } catch (error) {
    console.error('Historical currency rates API error:', error);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch historical currency rates',
        responseTime
      },
      { status: 500 }
    );
  }
}