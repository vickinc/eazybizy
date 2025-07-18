import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    // Build where clause for company filtering
    const companyFilter = companyId && companyId !== 'all' ? { companyId: parseInt(companyId) } : {}

    // Fetch all payment sources for the company
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
      // Fetch standalone payment methods (not duplicating bank accounts or wallets)
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

    // Transform data to unified payment source format
    const paymentSources = [
      // Bank accounts
      ...bankAccounts.map(account => ({
        id: account.id,
        sourceType: 'BANK_ACCOUNT',
        type: 'BANK',
        name: `${account.bankName} - ${account.accountName}`,
        displayName: account.accountName,
        details: {
          bankName: account.bankName,
          bankAddress: account.bankAddress,
          iban: account.iban,
          swiftCode: account.swiftCode,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
        },
        currency: account.currency,
        companyId: account.companyId,
        company: account.company,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      })),
      // Digital wallets  
      ...digitalWallets.map(wallet => ({
        id: wallet.id,
        sourceType: 'DIGITAL_WALLET',
        type: 'WALLET',
        name: `${wallet.walletType} - ${wallet.walletName}`,
        displayName: wallet.walletName,
        details: {
          walletType: wallet.walletType,
          walletAddress: wallet.walletAddress,
          blockchain: wallet.blockchain,
          description: wallet.description,
        },
        currency: wallet.currency,
        companyId: wallet.companyId,
        company: wallet.company,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      })),
      // Standalone payment methods (excluding those that duplicate bank accounts/wallets)
      ...paymentMethods
        .filter(pm => {
          // Filter out payment methods that are duplicates of bank accounts or digital wallets
          if (pm.type === 'BANK' && pm.iban) {
            const isDuplicateBank = bankAccounts.some(account => 
              account.iban === pm.iban && 
              account.bankName === pm.bankName &&
              account.accountName === pm.accountName
            )
            if (isDuplicateBank) return false
          }
          
          if (pm.type === 'WALLET' && pm.walletAddress) {
            const isDuplicateWallet = digitalWallets.some(wallet => 
              wallet.walletAddress === pm.walletAddress
            )
            if (isDuplicateWallet) return false
          }
          
          return true
        })
        .map(pm => ({
          id: pm.id,
          sourceType: 'PAYMENT_METHOD',
          type: pm.type,
          name: pm.name,
          displayName: pm.name,
          details: {
            accountName: pm.accountName,
            bankName: pm.bankName,
            bankAddress: pm.bankAddress,
            iban: pm.iban,
            swiftCode: pm.swiftCode,
            accountNumber: pm.accountNumber,
            walletAddress: pm.walletAddress,
            details: pm.details,
          },
          currency: pm.currency,
          companyId: pm.companyId,
          company: pm.company,
          createdAt: pm.createdAt,
          updatedAt: pm.updatedAt,
        })),
    ]

    // Sort by type and name
    paymentSources.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type)
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      data: paymentSources,
      total: paymentSources.length,
    })
  } catch (error) {
    console.error('Error fetching invoice payment sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice payment sources' },
      { status: 500 }
    )
  }
}