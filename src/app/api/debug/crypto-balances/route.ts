import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    // Get all digital wallets
    const digitalWallets = await prisma.digitalWallet.findMany({
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
          },
        },
      },
    })

    // Get all initial balances
    const initialBalances = await prisma.initialBalance.findMany({
      where: {
        accountType: 'wallet'
      }
    })

    // Process multi-currency wallets to identify missing initial balances
    const walletAnalysis: any[] = []
    const missingInitialBalances: any[] = []

    digitalWallets.forEach(wallet => {
      // Parse currencies string into array if it exists
      let currenciesArray: string[] = []
      if (wallet.currencies) {
        if (Array.isArray(wallet.currencies)) {
          currenciesArray = wallet.currencies
        } else if (typeof wallet.currencies === 'string') {
          currenciesArray = wallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0)
        }
      }
      
      // For multi-currency wallets
      if (currenciesArray.length > 0) {
        currenciesArray.forEach(currency => {
          const hasInitialBalance = initialBalances.some(
            ib => ib.accountId === wallet.id && ib.currency === currency
          )
          
          walletAnalysis.push({
            walletId: wallet.id,
            walletName: wallet.walletName,
            currency,
            hasInitialBalance,
            companyName: wallet.company.tradingName,
            isCrypto: wallet.walletType?.toLowerCase() === 'crypto'
          })
          
          if (!hasInitialBalance && wallet.walletType?.toLowerCase() === 'crypto') {
            missingInitialBalances.push({
              accountId: wallet.id,
              accountType: 'wallet',
              currency,
              amount: 0,
              companyId: wallet.companyId,
              notes: `Auto-generated initial balance for ${wallet.walletName} (${currency})`
            })
          }
        })
      } else {
        // Single currency wallet
        const hasInitialBalance = initialBalances.some(
          ib => ib.accountId === wallet.id && ib.currency === wallet.currency
        )
        
        walletAnalysis.push({
          walletId: wallet.id,
          walletName: wallet.walletName,
          currency: wallet.currency,
          hasInitialBalance,
          companyName: wallet.company.tradingName,
          isCrypto: wallet.walletType?.toLowerCase() === 'crypto'
        })
        
        if (!hasInitialBalance && wallet.walletType?.toLowerCase() === 'crypto') {
          missingInitialBalances.push({
            accountId: wallet.id,
            accountType: 'wallet',
            currency: wallet.currency,
            amount: 0,
            companyId: wallet.companyId,
            notes: `Auto-generated initial balance for ${wallet.walletName} (${wallet.currency})`
          })
        }
      }
    })

    return NextResponse.json({
      summary: {
        totalWallets: digitalWallets.length,
        totalCryptoWallets: walletAnalysis.filter(w => w.isCrypto).length,
        walletsWithMissingBalances: missingInitialBalances.length,
        existingInitialBalances: initialBalances.length
      },
      walletAnalysis: walletAnalysis.filter(w => w.isCrypto), // Only show crypto wallets
      missingInitialBalances,
      existingInitialBalances: initialBalances
    })

  } catch (error) {
    console.error('Error analyzing crypto balances:', error)
    return NextResponse.json(
      { error: 'Failed to analyze crypto balances' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Server-side authentication check
    const { user, error } = await authenticateRequest()
    
    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { createMissing = false } = body

    if (!createMissing) {
      return NextResponse.json(
        { error: 'Set createMissing: true to create missing initial balances' },
        { status: 400 }
      )
    }

    // Get analysis from the GET endpoint logic
    const digitalWallets = await prisma.digitalWallet.findMany({
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
          },
        },
      },
    })

    const initialBalances = await prisma.initialBalance.findMany({
      where: {
        accountType: 'wallet'
      }
    })

    const missingInitialBalances: any[] = []

    digitalWallets.forEach(wallet => {
      let currenciesArray: string[] = []
      if (wallet.currencies) {
        if (Array.isArray(wallet.currencies)) {
          currenciesArray = wallet.currencies
        } else if (typeof wallet.currencies === 'string') {
          currenciesArray = wallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0)
        }
      }
      
      if (currenciesArray.length > 0) {
        currenciesArray.forEach(currency => {
          const hasInitialBalance = initialBalances.some(
            ib => ib.accountId === wallet.id && ib.currency === currency
          )
          
          if (!hasInitialBalance && wallet.walletType?.toLowerCase() === 'crypto') {
            missingInitialBalances.push({
              accountId: wallet.id,
              accountType: 'wallet',
              currency,
              amount: 0,
              companyId: wallet.companyId,
              notes: `Auto-generated initial balance for ${wallet.walletName} (${currency})`
            })
          }
        })
      } else {
        const hasInitialBalance = initialBalances.some(
          ib => ib.accountId === wallet.id && ib.currency === wallet.currency
        )
        
        if (!hasInitialBalance && wallet.walletType?.toLowerCase() === 'crypto') {
          missingInitialBalances.push({
            accountId: wallet.id,
            accountType: 'wallet',
            currency: wallet.currency,
            amount: 0,
            companyId: wallet.companyId,
            notes: `Auto-generated initial balance for ${wallet.walletName} (${wallet.currency})`
          })
        }
      }
    })

    // Create missing initial balances
    const createdBalances = []
    for (const balance of missingInitialBalances) {
      try {
        const created = await prisma.initialBalance.create({
          data: balance
        })
        createdBalances.push(created)
      } catch (err) {
        console.error('Error creating initial balance:', err)
      }
    }

    return NextResponse.json({
      message: `Created ${createdBalances.length} missing initial balance records`,
      created: createdBalances,
      totalMissing: missingInitialBalances.length
    })

  } catch (error) {
    console.error('Error creating missing initial balances:', error)
    return NextResponse.json(
      { error: 'Failed to create missing initial balances' },
      { status: 500 }
    )
  }
}