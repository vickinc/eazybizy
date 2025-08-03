import { NextRequest, NextResponse } from 'next/server'
import { CashflowSSRService } from '@/services/database/cashflowSSRService'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract filters
    const companyId = searchParams.get('companyId')
    const accountId = searchParams.get('accountId')
    const accountType = searchParams.get('accountType') as 'bank' | 'wallet' | undefined
    const type = searchParams.get('type') as 'inflow' | 'outflow' | undefined
    const period = searchParams.get('period')
    const periodFrom = searchParams.get('periodFrom')
    const periodTo = searchParams.get('periodTo')
    const searchTerm = searchParams.get('search')
    
    // Extract pagination
    const skip = parseInt(searchParams.get('skip') || '0')
    const take = parseInt(searchParams.get('take') || '1000')
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc'
    
    // Build filters object
    const filters = {
      companyId: companyId === 'all' ? 'all' : companyId ? parseInt(companyId) : undefined,
      accountId: accountId || undefined,
      accountType,
      type,
      period: period || undefined,
      periodFrom: periodFrom || undefined,
      periodTo: periodTo || undefined,
      searchTerm: searchTerm || undefined
    }
    
    // Build pagination object
    const pagination = {
      skip,
      take,
      sortField,
      sortDirection
    }
    
    // Fetch data
    const result = await CashflowSSRService.getManualCashflowEntries(filters, pagination)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching manual cashflow entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manual cashflow entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      companyId,
      accountId,
      accountType,
      type,
      amount,
      currency,
      period,
      description,
      notes
    } = body
    
    // Validate required fields
    if (!companyId || !accountId || !accountType || !type || !amount || !currency || !period || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate account type
    if (!['bank', 'wallet'].includes(accountType)) {
      return NextResponse.json(
        { error: 'Invalid account type. Must be "bank" or "wallet"' },
        { status: 400 }
      )
    }
    
    // Validate type
    if (!['inflow', 'outflow'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "inflow" or "outflow"' },
        { status: 400 }
      )
    }
    
    // Validate amount
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }
    
    // Create entry
    const entry = await CashflowSSRService.createManualCashflowEntry({
      company: { connect: { id: parseInt(companyId) } },
      accountId,
      accountType,
      type,
      amount: numAmount,
      currency,
      period,
      description,
      notes: notes || null
    })
    
    // Invalidate cache
    await CacheInvalidationService.invalidateCashflowCache(parseInt(companyId))
    
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating manual cashflow entry:', error)
    return NextResponse.json(
      { error: 'Failed to create manual cashflow entry' },
      { status: 500 }
    )
  }
}