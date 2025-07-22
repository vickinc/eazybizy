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
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const baseCurrency = searchParams.get('base_currency') || 'USD';
    const currenciesParam = searchParams.get('currencies');
    const currencies = currenciesParam ? currenciesParam.split(',').map(c => c.trim().toUpperCase()) : undefined;

    // Validate date parameters
    if (!date && (!startDate || !endDate)) {
      return NextResponse.json(
        { error: 'Either "date" or both "start_date" and "end_date" parameters are required' },
        { status: 400 }
      );
    }

    if (date && (startDate || endDate)) {
      return NextResponse.json(
        { error: 'Cannot specify both "date" and date range parameters' },
        { status: 400 }
      );
    }

    let result;

    // Handle single date request
    if (date) {
      result = await CurrencyAPIService.getHistoricalRates(date, baseCurrency, currencies);

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
    }

    // Handle date range request
    if (startDate && endDate) {
      // Validate date range (max 31 days to prevent abuse)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 31) {
        return NextResponse.json(
          { error: 'Date range cannot exceed 31 days' },
          { status: 400 }
        );
      }

      if (start > end) {
        return NextResponse.json(
          { error: 'start_date must be before or equal to end_date' },
          { status: 400 }
        );
      }

      const rangeResult = await CurrencyAPIService.getHistoricalRatesRange(
        startDate, 
        endDate, 
        baseCurrency, 
        currencies
      );

      if (!rangeResult.success) {
        const statusCode = rangeResult.error === 'Rate limit exceeded' ? 429 : 500;
        return NextResponse.json(
          { 
            error: rangeResult.error,
            rateLimit: rangeResult.rateLimit
          },
          { status: statusCode }
        );
      }

      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        data: rangeResult.data,
        meta: {
          startDate,
          endDate,
          baseCurrency,
          totalDays: rangeResult.data?.length || 0,
          responseTime,
          rateLimit: rangeResult.rateLimit
        }
      });
    }

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
    if (!CurrencyAPIService.isConfigured()) {
      return NextResponse.json(
        { error: 'Currency API not configured. Please set FREE_CURRENCY_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      date, 
      startDate, 
      endDate, 
      baseCurrency = 'USD', 
      currencies 
    } = body;

    // Validate currencies array if provided
    if (currencies && !Array.isArray(currencies)) {
      return NextResponse.json(
        { error: 'Currencies must be an array of currency codes' },
        { status: 400 }
      );
    }

    // Validate date parameters
    if (!date && (!startDate || !endDate)) {
      return NextResponse.json(
        { error: 'Either "date" or both "startDate" and "endDate" are required' },
        { status: 400 }
      );
    }

    if (date && (startDate || endDate)) {
      return NextResponse.json(
        { error: 'Cannot specify both "date" and date range parameters' },
        { status: 400 }
      );
    }

    let result;
    const normalizedCurrencies = currencies?.map((c: string) => c.toUpperCase());

    // Handle single date request
    if (date) {
      result = await CurrencyAPIService.getHistoricalRates(date, baseCurrency, normalizedCurrencies);

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
    }

    // Handle date range request
    if (startDate && endDate) {
      // Validate date range (max 31 days to prevent abuse)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 31) {
        return NextResponse.json(
          { error: 'Date range cannot exceed 31 days' },
          { status: 400 }
        );
      }

      if (start > end) {
        return NextResponse.json(
          { error: 'startDate must be before or equal to endDate' },
          { status: 400 }
        );
      }

      const rangeResult = await CurrencyAPIService.getHistoricalRatesRange(
        startDate, 
        endDate, 
        baseCurrency, 
        normalizedCurrencies
      );

      if (!rangeResult.success) {
        const statusCode = rangeResult.error === 'Rate limit exceeded' ? 429 : 500;
        return NextResponse.json(
          { 
            error: rangeResult.error,
            rateLimit: rangeResult.rateLimit
          },
          { status: statusCode }
        );
      }

      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        data: rangeResult.data,
        meta: {
          startDate,
          endDate,
          baseCurrency,
          totalDays: rangeResult.data?.length || 0,
          responseTime,
          rateLimit: rangeResult.rateLimit
        }
      });
    }

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