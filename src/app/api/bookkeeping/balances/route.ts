import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { authenticateRequest } from '@/lib/api-auth'
import { CurrencyService } from '@/services/business/currencyService'
// Note: Server-side route should use database queries directly instead of localStorage services

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
    
    // Filter parameters
    const companyFilter = searchParams.get('company') || 'all'
    const accountTypeFilter = searchParams.get('accountType') || 'all'
    const searchTerm = searchParams.get('search') || ''
    const showZeroBalances = searchParams.get('showZeroBalances') !== 'false'
    const viewFilter = searchParams.get('viewFilter') || 'all'
    const groupBy = searchParams.get('groupBy') || 'account'
    
    // Date range parameters
    const selectedPeriod = searchParams.get('selectedPeriod') || 'thisMonth'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Sorting parameters
    const sortField = searchParams.get('sortField') || 'finalBalance'
    const sortDirection = searchParams.get('sortDirection') || 'desc'

    // Get all accounts directly from database
    const bankAccountsWhere: Prisma.BankAccountWhereInput = {}
    const digitalWalletsWhere: Prisma.DigitalWalletWhereInput = {}
    
    if (companyFilter !== 'all') {
      bankAccountsWhere.companyId = parseInt(companyFilter)
      digitalWalletsWhere.companyId = parseInt(companyFilter)
    }

    const [bankAccounts, digitalWallets] = await Promise.all([
      prisma.bankAccount.findMany({
        where: bankAccountsWhere,
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
      }),
      prisma.digitalWallet.findMany({
        where: digitalWalletsWhere,
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
    ])

    // Combine accounts with type metadata and handle multi-currency wallets
    const bankAccountsWithMeta = bankAccounts.map(account => ({ 
      ...account, 
      __accountType: 'bank' as const 
    }));

    // Process digital wallets, handling multi-currency support
    const walletAccountsWithMeta: any[] = [];
    
    digitalWallets.forEach(wallet => {
      // Parse currencies string into array if it exists
      let currenciesArray: string[] = [];
      if (wallet.currencies) {
        if (Array.isArray(wallet.currencies)) {
          currenciesArray = wallet.currencies;
        } else if (typeof wallet.currencies === 'string') {
          // Parse comma-separated string into array
          currenciesArray = wallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0);
        }
      }
      
      // Check if wallet supports multiple currencies
      if (currenciesArray.length > 0) {
        // Create separate account entries for each supported currency
        currenciesArray.forEach(currency => {
          walletAccountsWithMeta.push({
            ...wallet,
            id: `${wallet.id}-${currency}`, // Unique ID for each currency
            walletName: `${wallet.walletName} (${currency})`, // Include currency in name
            currency: currency, // Override currency for this entry
            __accountType: 'wallet' as const,
          });
        });
      } else {
        // Fall back to single currency wallet
        walletAccountsWithMeta.push({
          ...wallet,
          __accountType: 'wallet' as const
        });
      }
    });

    const allAccounts = [
      ...bankAccountsWithMeta,
      ...walletAccountsWithMeta
    ]

    // Get initial balances from database
    const initialBalancesWhere: Prisma.InitialBalanceWhereInput = {}
    if (companyFilter !== 'all') {
      initialBalancesWhere.companyId = parseInt(companyFilter)
    }

    const initialBalances = await prisma.initialBalance.findMany({
      where: initialBalancesWhere,
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

    // Calculate balances for each account
    const accountBalances = await Promise.all(
      allAccounts.map(async (account) => {
        const accountType = account.__accountType

        // Find corresponding initial balance
        const initialBalance = initialBalances.find(
          ib => ib.accountId === account.id && ib.accountType === accountType
        )

        // Calculate transaction balance for the period
        const transactionData = await calculateTransactionBalanceDetailed(
          account.id,
          accountType,
          account.companyId,
          selectedPeriod,
          { startDate: startDate || '', endDate: endDate || '' }
        )

        const initialAmount = initialBalance?.amount || 0
        const finalBalance = initialAmount + transactionData.netAmount

        return {
          account,
          company: initialBalance?.company || account.company,
          initialBalance: initialAmount,
          transactionBalance: transactionData.netAmount,
          finalBalance,
          incomingAmount: transactionData.totalIncoming,
          outgoingAmount: transactionData.totalOutgoing,
          currency: account.currency,
          lastTransactionDate: await getLastTransactionDate(account.id, accountType)
        }
      })
    )

    // Apply filters
    let filteredBalances = accountBalances

    // Account type filter
    if (accountTypeFilter !== 'all') {
      filteredBalances = filteredBalances.filter(balance => {
        const isBank = balance.account.__accountType === 'bank'
        return accountTypeFilter === 'banks' ? isBank : !isBank
      })
    }

    // View filter (assets/liabilities)
    if (viewFilter !== 'all') {
      filteredBalances = filteredBalances.filter(balance => {
        switch (viewFilter) {
          case 'assets':
            return balance.finalBalance >= 0
          case 'liabilities':
            return balance.finalBalance < 0
          case 'equity':
            return balance.finalBalance >= 0
          default:
            return true
        }
      })
    }

    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filteredBalances = filteredBalances.filter(balance => {
        const account = balance.account
        const company = balance.company
        
        const accountName = account.__accountType === 'bank' 
          ? (account.accountName || account.bankName) 
          : account.walletName;
          
        return (
          accountName?.toLowerCase().includes(searchLower) ||
          company.tradingName.toLowerCase().includes(searchLower) ||
          account.currency.toLowerCase().includes(searchLower) ||
          ('accountNumber' in account && account.accountNumber?.toLowerCase().includes(searchLower)) ||
          ('bankName' in account && account.bankName?.toLowerCase().includes(searchLower))
        )
      })
    }

    // Zero balances filter
    if (!showZeroBalances) {
      filteredBalances = filteredBalances.filter(balance => Math.abs(balance.finalBalance) > 0.01)
    }

    // Sort balances
    filteredBalances.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'accountName':
          aValue = a.account.__accountType === 'bank' 
            ? (a.account.accountName || a.account.bankName) 
            : a.account.walletName;
          bValue = b.account.__accountType === 'bank' 
            ? (b.account.accountName || b.account.bankName) 
            : b.account.walletName;
          break
        case 'companyName':
          aValue = a.company.tradingName
          bValue = b.company.tradingName
          break
        case 'finalBalance':
          aValue = a.finalBalance
          bValue = b.finalBalance
          break
        case 'currency':
          aValue = a.currency
          bValue = b.currency
          break
        default:
          aValue = a.finalBalance
          bValue = b.finalBalance
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
    })

    // Calculate summary statistics - count unique accounts, not currency entries
    const uniqueAccountIds = new Set<string>();
    const uniqueBankIds = new Set<string>();
    const uniqueWalletIds = new Set<string>();

    // Calculate USD converted totals
    let totalAssetsUSD = 0;
    let totalLiabilitiesUSD = 0;

    filteredBalances.forEach(balance => {
      const accountType = balance.account.__accountType;
      let originalAccountId = balance.account.id;
      
      // For multi-currency wallets, extract original wallet ID
      if (accountType === 'wallet' && originalAccountId.includes('-')) {
        originalAccountId = originalAccountId.split('-')[0];
      }
      
      uniqueAccountIds.add(originalAccountId);
      
      if (accountType === 'bank') {
        uniqueBankIds.add(originalAccountId);
      } else {
        uniqueWalletIds.add(originalAccountId);
      }

      // Convert balance to USD for totals
      try {
        const balanceInUSD = CurrencyService.convertToUSD(balance.finalBalance, balance.currency);
        if (balanceInUSD >= 0) {
          totalAssetsUSD += balanceInUSD;
        } else {
          totalLiabilitiesUSD += Math.abs(balanceInUSD);
        }
      } catch (error) {
        console.error('Error converting balance to USD in API route:', error);
        // Fallback to original amount for totals
        if (balance.finalBalance >= 0) {
          totalAssetsUSD += balance.finalBalance;
        } else {
          totalLiabilitiesUSD += Math.abs(balance.finalBalance);
        }
      }
    });

    const netWorthUSD = totalAssetsUSD - totalLiabilitiesUSD;

    const summary = {
      // Original currency totals (kept for backward compatibility)
      totalAssets: filteredBalances.reduce((sum, b) => sum + (b.finalBalance >= 0 ? b.finalBalance : 0), 0),
      totalLiabilities: filteredBalances.reduce((sum, b) => sum + (b.finalBalance < 0 ? Math.abs(b.finalBalance) : 0), 0),
      netWorth: filteredBalances.reduce((sum, b) => sum + b.finalBalance, 0),
      // USD converted totals
      totalAssetsUSD,
      totalLiabilitiesUSD,
      netWorthUSD,
      baseCurrency: 'USD',
      // Account counts
      accountCount: uniqueAccountIds.size, // Count unique accounts, not currency entries
      bankAccountCount: uniqueBankIds.size, // Count unique banks
      walletCount: uniqueWalletIds.size, // Count unique wallets
      currencyBreakdown: {} as Record<string, { assets: number; liabilities: number; netWorth: number }>
    }

    // Calculate currency breakdown
    filteredBalances.forEach(balance => {
      const currency = balance.currency
      if (!summary.currencyBreakdown[currency]) {
        summary.currencyBreakdown[currency] = { assets: 0, liabilities: 0, netWorth: 0 }
      }

      if (balance.finalBalance >= 0) {
        summary.currencyBreakdown[currency].assets += balance.finalBalance
      } else {
        summary.currencyBreakdown[currency].liabilities += Math.abs(balance.finalBalance)
      }
      summary.currencyBreakdown[currency].netWorth += balance.finalBalance
    })

    return NextResponse.json({
      data: filteredBalances,
      summary,
      filters: {
        selectedPeriod,
        customDateRange: { startDate: startDate || '', endDate: endDate || '' },
        accountTypeFilter,
        viewFilter,
        groupBy,
        searchTerm,
        showZeroBalances
      }
    })

  } catch (error) {
    console.error('Error fetching balances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
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
    
    const {
      accountId,
      accountType,
      amount,
      currency,
      companyId,
      notes,
    } = body

    // Validate required fields
    if (!accountId || !accountType || amount === undefined || !currency || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create or update initial balance
    const initialBalance = await prisma.initialBalance.upsert({
      where: {
        accountId_accountType: {
          accountId,
          accountType,
        },
      },
      update: {
        amount,
        currency,
        notes,
        updatedAt: new Date(),
      },
      create: {
        accountId,
        accountType,
        amount,
        currency,
        companyId,
        notes,
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
    
    return NextResponse.json(initialBalance, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating initial balance:', error)
    return NextResponse.json(
      { error: 'Failed to create/update initial balance' },
      { status: 500 }
    )
  }
}

// Server-side helper functions using database queries
async function calculateTransactionBalanceDetailed(
  accountId: string,
  accountType: 'bank' | 'wallet',
  companyId: number,
  period: string,
  customRange: { startDate: string; endDate: string }
): Promise<{ netAmount: number; totalIncoming: number; totalOutgoing: number }> {
  try {
    // For multi-currency wallets, extract the original wallet ID
    const originalAccountId = accountType === 'wallet' && accountId.includes('-') 
      ? accountId.split('-')[0] 
      : accountId;

    // Build date filter for the period
    let dateFilter: any = {}
    
    if (period !== 'allTime') {
      const now = new Date()
      let startDate: Date
      
      switch (period) {
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter = { gte: startDate }
          break
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          dateFilter = { gte: startDate, lte: endDate }
          break
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1)
          dateFilter = { gte: startDate }
          break
        case 'lastYear':
          startDate = new Date(now.getFullYear() - 1, 0, 1)
          const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31)
          dateFilter = { gte: startDate, lte: endOfLastYear }
          break
        case 'custom':
          if (customRange.startDate && customRange.endDate) {
            dateFilter = { 
              gte: new Date(customRange.startDate), 
              lte: new Date(customRange.endDate) 
            }
          }
          break
      }
    }

    // Get transaction data - for multi-currency wallets, use original wallet ID
    const transactionWhere: Prisma.TransactionWhereInput = {
      accountId: originalAccountId,
      accountType,
      companyId,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
    }

    const transactionResult = await prisma.transaction.aggregate({
      where: transactionWhere,
      _sum: {
        netAmount: true,
        incomingAmount: true,
        outgoingAmount: true,
      },
    })

    // Use transaction data only to avoid double-counting
    // (Transaction records are created when invoices are paid and represent actual cash flow)
    const transactionIncoming = transactionResult._sum.incomingAmount || 0
    const transactionOutgoing = transactionResult._sum.outgoingAmount || 0
    const transactionNet = transactionResult._sum.netAmount || 0

    return {
      netAmount: transactionNet,
      totalIncoming: transactionIncoming,
      totalOutgoing: transactionOutgoing
    }
  } catch (error) {
    console.error('Error calculating transaction balance:', error)
    return {
      netAmount: 0,
      totalIncoming: 0,
      totalOutgoing: 0
    }
  }
}

async function getLastTransactionDate(accountId: string, accountType: 'bank' | 'wallet'): Promise<string | undefined> {
  try {
    // For multi-currency wallets, extract the original wallet ID
    const originalAccountId = accountType === 'wallet' && accountId.includes('-') 
      ? accountId.split('-')[0] 
      : accountId;

    const lastTransaction = await prisma.transaction.findFirst({
      where: {
        accountId: originalAccountId,
        accountType,
      },
      orderBy: {
        date: 'desc',
      },
      select: {
        date: true,
      },
    })

    return lastTransaction?.date.toISOString()
  } catch (error) {
    console.error('Error getting last transaction date:', error)
    return undefined
  }
}