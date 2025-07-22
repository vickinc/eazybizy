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
    if (!CurrencyAPIService.isConfigured()) {
      return NextResponse.json(
        { error: 'Currency API not configured. Please set FREE_CURRENCY_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const baseCurrency = searchParams.get('base_currency') || 'USD';
    const currenciesParam = searchParams.get('currencies');
    const currencies = currenciesParam ? currenciesParam.split(',').map(c => c.trim().toUpperCase()) : undefined;

    // Fetch latest rates from API
    const result = await CurrencyAPIService.getLatestRates(baseCurrency, currencies);

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
        baseCurrency,
        totalCurrencies: result.data?.length || 0,
        responseTime,
        rateLimit: result.rateLimit
      }
    });

  } catch (error) {
    console.error('Latest currency rates API error:', error);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch latest currency rates',
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
    if (!CurrencyAPIService.isConfigured()) {
      return NextResponse.json(
        { error: 'Currency API not configured. Please set FREE_CURRENCY_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { baseCurrency = 'USD', currencies } = body;

    // Validate currencies array if provided
    if (currencies && !Array.isArray(currencies)) {
      return NextResponse.json(
        { error: 'Currencies must be an array of currency codes' },
        { status: 400 }
      );
    }

    // Fetch latest rates from API
    const result = await CurrencyAPIService.getLatestRates(
      baseCurrency, 
      currencies?.map((c: string) => c.toUpperCase())
    );

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
        baseCurrency,
        totalCurrencies: result.data?.length || 0,
        responseTime,
        rateLimit: result.rateLimit
      }
    });

  } catch (error) {
    console.error('Latest currency rates API error:', error);
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch latest currency rates',
        responseTime
      },
      { status: 500 }
    );
  }
}