import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    // Build where clause for company filtering
    const companyFilter = companyId && companyId !== 'all' ? { companyId: parseInt(companyId) } : {}

    // Fetch both bank accounts and digital wallets to create a unified payment methods list
    const [bankAccounts, digitalWallets, paymentMethods] = await Promise.all([
      // Fetch active bank accounts
      prisma.bankAccount.findMany({
        where: {
          ...companyFilter,
          isActive: true,
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
        orderBy: [
          { bankName: 'asc' },
          { accountName: 'asc' },
        ],
      }),
      // Fetch active digital wallets
      prisma.digitalWallet.findMany({
        where: {
          ...companyFilter,
          isActive: true,
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
        orderBy: [
          { walletType: 'asc' },
          { walletName: 'asc' },
        ],
      }),
      // Fetch existing payment methods (for backwards compatibility)
      prisma.paymentMethod.findMany({
        where: companyFilter,
        include: {
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
            },
          },
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' },
        ],
      }),
    ])

    // Transform bank accounts to payment method format
    const bankAccountPaymentMethods = bankAccounts.map(account => ({
      id: `bank_${account.id}`,
      type: 'BANK',
      name: `${account.bankName} - ${account.accountName}`,
      companyId: account.companyId,
      accountName: account.accountName,
      bankName: account.bankName,
      bankAddress: account.bankAddress,
      iban: account.iban,
      swiftCode: account.swiftCode,
      accountNumber: account.accountNumber,
      walletAddress: null,
      currency: account.currency,
      details: account.notes || '',
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      company: account.company,
      source: 'bank_account', // Add source identifier
    }))

    // Transform digital wallets to payment method format
    const walletPaymentMethods = digitalWallets.map(wallet => ({
      id: `wallet_${wallet.id}`,
      type: 'WALLET',
      name: `${wallet.walletType} - ${wallet.walletName}`,
      companyId: wallet.companyId,
      accountName: null,
      bankName: null,
      bankAddress: null,
      iban: null,
      swiftCode: null,
      accountNumber: null,
      walletAddress: wallet.walletAddress,
      currency: wallet.currency,
      details: wallet.notes || '',
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      company: wallet.company,
      source: 'digital_wallet', // Add source identifier
    }))

    // Filter out PaymentMethod records that are duplicates of bank accounts or digital wallets
    const filteredPaymentMethods = paymentMethods.filter(pm => {
      // Check if this payment method is a duplicate of a bank account
      if (pm.type === 'BANK' && pm.iban) {
        const isDuplicateBank = bankAccounts.some(account => 
          account.iban === pm.iban && 
          account.bankName === pm.bankName &&
          account.accountName === pm.accountName
        )
        if (isDuplicateBank) return false
      }
      
      // Check if this payment method is a duplicate of a digital wallet
      if (pm.type === 'WALLET' && pm.walletAddress) {
        const isDuplicateWallet = digitalWallets.some(wallet => 
          wallet.walletAddress === pm.walletAddress
        )
        if (isDuplicateWallet) return false
      }
      
      return true
    })

    // Combine all payment methods
    const allPaymentMethods = [
      ...bankAccountPaymentMethods,
      ...walletPaymentMethods,
      ...filteredPaymentMethods.map(pm => ({ ...pm, source: 'payment_method' })),
    ]

    // Sort by type and name
    allPaymentMethods.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type)
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      data: allPaymentMethods,
      total: allPaymentMethods.length,
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      type,
      name,
      companyId,
      accountName,
      bankName,
      bankAddress,
      iban,
      swiftCode,
      accountNumber,
      walletAddress,
      currency,
      details = '',
    } = body

    // Validate required fields
    if (!type || !name || !companyId || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name, companyId, currency' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['BANK', 'WALLET'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be BANK or WALLET' },
        { status: 400 }
      )
    }

    // Create payment method
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        type,
        name,
        companyId: parseInt(companyId),
        accountName,
        bankName,
        bankAddress,
        iban,
        swiftCode,
        accountNumber,
        walletAddress,
        currency,
        details,
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

    return NextResponse.json(paymentMethod, { status: 201 })
  } catch (error) {
    console.error('Error creating payment method:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create payment method',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}