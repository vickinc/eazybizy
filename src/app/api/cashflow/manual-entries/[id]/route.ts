import { NextRequest, NextResponse } from 'next/server'
import { CashflowSSRService } from '@/services/database/cashflowSSRService'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await CashflowSSRService.getManualCashflowEntryById(params.id)
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Manual cashflow entry not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error fetching manual cashflow entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manual cashflow entry' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const {
      accountId,
      accountType,
      type,
      amount,
      currency,
      period,
      description,
      notes
    } = body
    
    // Build update data object
    const updateData: any = {}
    
    if (accountId !== undefined) updateData.accountId = accountId
    if (accountType !== undefined) {
      if (!['bank', 'wallet'].includes(accountType)) {
        return NextResponse.json(
          { error: 'Invalid account type. Must be "bank" or "wallet"' },
          { status: 400 }
        )
      }
      updateData.accountType = accountType
    }
    if (type !== undefined) {
      if (!['inflow', 'outflow'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid type. Must be "inflow" or "outflow"' },
          { status: 400 }
        )
      }
      updateData.type = type
    }
    if (amount !== undefined) {
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive number' },
          { status: 400 }
        )
      }
      updateData.amount = numAmount
    }
    if (currency !== undefined) updateData.currency = currency
    if (period !== undefined) updateData.period = period
    if (description !== undefined) updateData.description = description
    if (notes !== undefined) updateData.notes = notes || null
    
    // Update entry
    const entry = await CashflowSSRService.updateManualCashflowEntry(params.id, updateData)
    
    // Invalidate cache
    await CacheInvalidationService.invalidateCashflowCache(entry.companyId)
    
    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating manual cashflow entry:', error)
    return NextResponse.json(
      { error: 'Failed to update manual cashflow entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the entry first to know which company to invalidate cache for
    const entry = await CashflowSSRService.getManualCashflowEntryById(params.id)
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Manual cashflow entry not found' },
        { status: 404 }
      )
    }
    
    // Delete the entry
    await CashflowSSRService.deleteManualCashflowEntry(params.id)
    
    // Invalidate cache
    await CacheInvalidationService.invalidateCashflowCache(entry.companyId)
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting manual cashflow entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete manual cashflow entry' },
      { status: 500 }
    )
  }
}