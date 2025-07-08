import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filter parameters
    const companyId = searchParams.get('companyId')
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const currency = searchParams.get('currency')
    
    // Build where clause
    const where: Prisma.CompanyAccountWhereInput = {}
    
    // Company filter (required)
    if (companyId) {
      where.companyId = parseInt(companyId)
    } else {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }
    
    // Type filter
    if (type) {
      where.type = type as any
    }
    
    // Active filter
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }
    
    // Currency filter
    if (currency) {
      where.currency = currency
    }
    
    // Get accounts with related data
    const accounts = await prisma.companyAccount.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
          },
        },
        _count: {
          select: {
            entries: true,
            transactions: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })
    
    // Calculate total balances by currency
    const balancesByCurrency = await prisma.companyAccount.groupBy({
      by: ['currency'],
      where,
      _sum: {
        currentBalance: true,
      },
    })
    
    // Calculate total balances by type
    const balancesByType = await prisma.companyAccount.groupBy({
      by: ['type'],
      where,
      _sum: {
        currentBalance: true,
      },
      _count: {
        _all: true,
      },
    })
    
    return NextResponse.json({
      data: accounts,
      statistics: {
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(a => a.isActive).length,
        balancesByCurrency,
        balancesByType,
      },
    })
  } catch (error) {
    console.error('Error fetching company accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      companyId,
      type,
      name,
      accountNumber,
      currency,
      startingBalance = 0,
    } = body
    
    if (!companyId || !type || !name || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Check if account already exists
    const existingAccount = await prisma.companyAccount.findFirst({
      where: {
        companyId: parseInt(companyId),
        type,
        name,
      },
    })
    
    if (existingAccount) {
      return NextResponse.json(
        { error: 'Account with this name and type already exists' },
        { status: 400 }
      )
    }
    
    // Create the account
    const account = await prisma.companyAccount.create({
      data: {
        companyId: parseInt(companyId),
        type,
        name,
        accountNumber,
        currency,
        startingBalance: parseFloat(startingBalance),
        currentBalance: parseFloat(startingBalance),
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
          },
        },
      },
    })
    
    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating company account:', error)
    return NextResponse.json(
      { error: 'Failed to create company account' },
      { status: 500 }
    )
  }
}