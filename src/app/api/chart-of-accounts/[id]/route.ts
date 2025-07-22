import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const account = await prisma.chartOfAccount.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
          },
        },
      },
    })
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(account)
  } catch (error) {
    console.error('Error fetching account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Check if account exists
    const existingAccount = await prisma.chartOfAccount.findUnique({
      where: { id: params.id }
    })
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }
    
    // If code is being changed, check for uniqueness
    if (body.code && body.code !== existingAccount.code) {
      const codeExists = await prisma.chartOfAccount.findUnique({
        where: { code: body.code }
      })
      
      if (codeExists) {
        return NextResponse.json(
          { error: 'Account code already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update the account
    const account = await prisma.chartOfAccount.update({
      where: { id: params.id },
      data: {
        code: body.code,
        name: body.name,
        type: body.type,
        category: body.category,
        subcategory: body.subcategory,
        vat: body.vat,
        relatedVendor: body.relatedVendor,
        accountType: body.accountType,
        isActive: body.isActive,
        balance: body.balance,
        classification: body.classification,
        ifrsReference: body.ifrsReference,
        companyId: body.companyId,
        lastActivity: body.lastActivity ? new Date(body.lastActivity) : undefined,
        transactionCount: body.transactionCount,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
          },
        },
      },
    })
    
    // Invalidate cache
    CacheInvalidationService.invalidatePattern('chart-of-accounts')
    
    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check if account exists
    const existingAccount = await prisma.chartOfAccount.findUnique({
      where: { id: params.id }
    })
    
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }
    
    // Check if account has transactions (if you implement transaction linking later)
    // For now, we'll allow deletion
    
    // Delete the account
    await prisma.chartOfAccount.delete({
      where: { id: params.id }
    })
    
    // Invalidate cache
    CacheInvalidationService.invalidatePattern('chart-of-accounts')
    
    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}