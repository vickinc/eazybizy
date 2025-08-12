import { NextRequest, NextResponse } from 'next/server'
import { TronGridService } from '@/services/integrations/tronGridService'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Server-side authentication check
    const { user, error } = await authenticateRequest()
    
    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const currency = searchParams.get('currency') || 'TRX'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400 }
      )
    }

    console.log('🧪 Testing blockchain transaction fetch:', {
      address,
      currency,
      limit
    })

    let transactions
    
    try {
      if (currency.toUpperCase() === 'TRX') {
        transactions = await TronGridService.getTransactionHistory(address, { limit })
      } else {
        transactions = await TronGridService.getTRC20TransactionHistory(address, currency, { limit })
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }

    console.log(`✅ Fetched ${transactions.length} ${currency} transactions for testing`)

    return NextResponse.json({
      success: true,
      address,
      currency,
      transactionCount: transactions.length,
      transactions: transactions.slice(0, 5), // Return first 5 for testing
      sample: transactions.length > 0 ? {
        firstTransaction: {
          hash: transactions[0].hash,
          timestamp: new Date(transactions[0].timestamp).toISOString(),
          amount: transactions[0].amount,
          currency: transactions[0].currency,
          type: transactions[0].type,
          from: transactions[0].from,
          to: transactions[0].to
        },
        currencies: [...new Set(transactions.map(t => t.currency))]
      } : null
    })

  } catch (error) {
    console.error('❌ Error in transaction test API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test transaction fetching', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}