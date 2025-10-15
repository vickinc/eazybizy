import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { authenticateRequest } from '@/lib/api-auth'
import { CurrencyService } from '@/services/business/currencyService'
import { CurrencyRatesIntegrationService } from '@/services/business/currencyRatesIntegrationService'
import { BalanceBusinessService } from '@/services/business/balanceBusinessService'
import { TronGridService } from '@/services/integrations/tronGridService'
import { AlchemyService } from '@/services/integrations/alchemyService'
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
    const asOfDate = searchParams.get('asOfDate')
    
    // Debug log for as-of-date requests
    if (selectedPeriod === 'asOfDate') {
      console.log('📅 As-of-date API request:', { selectedPeriod, asOfDate })
    }
    
    // Sorting parameters
    const sortField = searchParams.get('sortField') || 'finalBalance'
    const sortDirection = searchParams.get('sortDirection') || 'desc'
    
    // Blockchain balance option
    const includeBlockchainBalances = searchParams.get('includeBlockchainBalances') === 'true'
    
    console.log('🌐 Balance API route called with params:', {
      includeBlockchainBalances,
      includeBlockchainBalancesParam: searchParams.get('includeBlockchainBalances'),
      company: companyFilter,
      accountType: accountTypeFilter,
      selectedPeriod
    });

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

    // Build date filter for the period (shared logic)
    let dateFilter: any = {}
    
    if (selectedPeriod === 'asOfDate') {
      // Point-in-time query: get all transactions up to (and including) the specified date
      if (asOfDate) {
        const asOfDateObj = new Date(asOfDate)
        // Ensure we include the full day by setting time to end of day
        asOfDateObj.setHours(23, 59, 59, 999)
        dateFilter = { lte: asOfDateObj }
      }
    } else if (selectedPeriod !== 'allTime') {
      const now = new Date()
      let periodStartDate: Date
      
      switch (selectedPeriod) {
        case 'thisMonth':
          periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter = { gte: periodStartDate }
          break
        case 'lastMonth':
          periodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const periodEndDate = new Date(now.getFullYear(), now.getMonth(), 0)
          dateFilter = { gte: periodStartDate, lte: periodEndDate }
          break
        case 'thisYear':
          periodStartDate = new Date(now.getFullYear(), 0, 1)
          dateFilter = { gte: periodStartDate }
          break
        case 'lastYear':
          periodStartDate = new Date(now.getFullYear() - 1, 0, 1)
          const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31)
          dateFilter = { gte: periodStartDate, lte: endOfLastYear }
          break
        case 'custom':
          if (startDate && endDate) {
            dateFilter = { 
              gte: new Date(startDate), 
              lte: new Date(endDate) 
            }
          }
          break
      }
    }

    // Batch fetch all transaction data for all accounts
    const accountIds = allAccounts.map(acc => {
      // For multi-currency wallets, extract original wallet ID
      if (acc.__accountType === 'wallet' && acc.id.includes('-')) {
        return acc.id.split('-')[0]
      }
      return acc.id
    })

    // Get all transaction aggregates in a single query
    const transactionAggregates = await prisma.transaction.groupBy({
      by: ['accountId', 'accountType'],
      where: {
        accountId: { in: accountIds },
        ...(companyFilter !== 'all' && { companyId: parseInt(companyFilter) }),
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      _sum: {
        netAmount: true,
        incomingAmount: true,
        outgoingAmount: true,
      }
    })

    // Get all transactions to find last dates - batch query
    const allTransactions = await prisma.transaction.findMany({
      where: {
        accountId: { in: accountIds },
        ...(companyFilter !== 'all' && { companyId: parseInt(companyFilter) })
      },
      orderBy: { date: 'desc' },
      select: {
        accountId: true,
        accountType: true,
        date: true
      }
    })
    
    // Group to find last transaction per account
    const lastTransactionDates: Array<{accountId: string, accountType: string, lastDate: Date}> = []
    const seenAccounts = new Set<string>()
    
    for (const transaction of allTransactions) {
      const key = `${transaction.accountId}-${transaction.accountType}`
      if (!seenAccounts.has(key)) {
        seenAccounts.add(key)
        lastTransactionDates.push({
          accountId: transaction.accountId,
          accountType: transaction.accountType,
          lastDate: transaction.date
        })
      }
    }

    // Create lookup maps for efficient access
    const transactionMap = new Map(
      transactionAggregates.map(t => [`${t.accountId}-${t.accountType}`, t])
    )
    const lastDateMap = new Map(
      lastTransactionDates.map(d => [`${d.accountId}-${d.accountType}`, d.lastDate])
    )

    // Calculate balances for each account using batched data
    const accountBalancePromises = allAccounts.map(async (account) => {
      const accountType = account.__accountType
      
      // For multi-currency wallets, use original wallet ID for lookups
      const lookupId = accountType === 'wallet' && account.id.includes('-')
        ? account.id.split('-')[0]
        : account.id

      // Find corresponding initial balance - for multi-currency wallets, use original wallet ID
      const initialBalanceLookupId = accountType === 'wallet' && account.id.includes('-')
        ? account.id.split('-')[0]
        : account.id
      
      const initialBalance = initialBalances.find(
        ib => ib.accountId === initialBalanceLookupId && ib.accountType === accountType && ib.currency === account.currency
      )

      // Get transaction data from batch results
      const transactionData = transactionMap.get(`${lookupId}-${accountType}`)
      let netAmount = transactionData?._sum.netAmount || 0
      let totalIncoming = transactionData?._sum.incomingAmount || 0
      let totalOutgoing = transactionData?._sum.outgoingAmount || 0

      // PERFORMANCE OPTIMIZATION: Removed automatic blockchain fetching
      // Blockchain data is now fetched only when explicitly requested via includeBlockchainBalances parameter
      // This reduces API response time from 5-10s to <500ms for pages with crypto wallets
      // Users can manually refresh blockchain balances using the "Refresh Blockchain" button

      const initialAmount = initialBalance?.amount || 0
      const finalBalance = initialAmount + netAmount
      
      // Debug logging for multi-currency crypto wallets
      if (accountType === 'wallet' && account.id.includes('-') && account.currency && ['BTC', 'ETH', 'USDT', 'SOL', 'TRX', 'BNB', 'USDC'].includes(account.currency)) {
        console.log('🔍 Multi-currency crypto wallet balance calculation:', {
          walletId: account.id,
          originalId: initialBalanceLookupId,
          currency: account.currency,
          initialBalance: initialBalance ? `${initialBalance.amount} ${account.currency}` : 'NOT_FOUND',
          transactions: `${netAmount} ${account.currency}`,
          finalBalance: `${finalBalance} ${account.currency}`,
          walletName: account.walletName,
          availableInitialBalances: initialBalances.filter(ib => ib.accountId === initialBalanceLookupId).map(ib => ({ currency: ib.currency, amount: ib.amount }))
        });
      }
      
      // Additional debugging for all wallet balance calculations
      if (accountType === 'wallet' && finalBalance === 0 && account.currency && ['BTC', 'ETH', 'USDT', 'SOL', 'TRX', 'BNB', 'USDC'].includes(account.currency)) {
        console.log('⚠️ Zero balance detected for crypto wallet:', {
          walletId: account.id,
          originalId: initialBalanceLookupId,
          currency: account.currency,
          hasInitialBalance: !!initialBalance,
          hasTransactions: netAmount !== 0,
          allInitialBalancesForThisWallet: initialBalances.filter(ib => ib.accountId === initialBalanceLookupId || ib.accountId === account.id)
        });
      }

      // Get last transaction date from batch results
      const lastTransactionDate = lastDateMap.get(`${lookupId}-${accountType}`)

      return {
        account,
        company: initialBalance?.company || account.company,
        initialBalance: initialAmount,
        transactionBalance: netAmount,
        finalBalance,
        incomingAmount: totalIncoming,
        outgoingAmount: totalOutgoing,
        currency: account.currency,
        lastTransactionDate: lastTransactionDate?.toISOString()
      }
    });

    // Wait for all async operations to complete
    const accountBalances = await Promise.all(accountBalancePromises);

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

    // Optionally enrich with blockchain data (if requested and API is configured)
    console.log('🔍 Balance API: Checking blockchain enrichment:', {
      includeBlockchainBalances,
      filteredBalancesCount: filteredBalances.length,
      tronWallets: filteredBalances.filter(b => b.accountType === 'wallet' && 
        ((b as any).blockchain === 'tron' || (b as any).currency === 'TRX' || (b as any).currency === 'USDT' || (b as any).currency === 'USDC')
      ).map(b => ({
        accountId: b.accountId,
        currency: b.currency,
        finalBalance: b.finalBalance,
        walletName: (b as any).walletName
      }))
    });

    if (includeBlockchainBalances) {
      try {
        console.log('🚀 Balance API: Starting blockchain enrichment...');
        
        const beforeEnrichment = filteredBalances.filter(b => b.accountType === 'wallet' && 
          ((b as any).blockchain === 'tron' || (b as any).currency === 'TRX' || (b as any).currency === 'USDT' || (b as any).currency === 'USDC')
        ).map(b => ({
          accountId: b.accountId,
          currency: b.currency,
          finalBalance: b.finalBalance
        }));
        
        filteredBalances = await BalanceBusinessService.enrichWithBlockchainBalances(
          filteredBalances as any[], // Cast to AccountBalance[] for compatibility
          true,
          selectedPeriod === 'asOfDate' ? asOfDate : undefined // Pass asOfDate for historical balance accuracy
        ) as any[] // Cast back to maintain existing structure
        
        const afterEnrichment = filteredBalances.filter(b => b.accountType === 'wallet' && 
          ((b as any).blockchain === 'tron' || (b as any).currency === 'TRX' || (b as any).currency === 'USDT' || (b as any).currency === 'USDC')
        ).map(b => ({
          accountId: b.accountId,
          currency: b.currency,
          finalBalance: b.finalBalance,
          isLive: b.isLive
        }));
        
        console.log('✅ Balance API: Blockchain enrichment completed:', {
          beforeEnrichment,
          afterEnrichment
        });
        
      } catch (error) {
        console.error('❌ Error enriching balances with blockchain data in API route:', error)
        // Continue without blockchain data if enrichment fails
      }
    }

    // Calculate summary statistics - count unique accounts, not currency entries
    const uniqueAccountIds = new Set<string>();
    const uniqueBankIds = new Set<string>();
    const uniqueWalletIds = new Set<string>();

    // Get unique currencies for bulk exchange rate fetching
    const uniqueCurrencies = [...new Set(filteredBalances.map(b => b.currency))]
    
    // Batch fetch all exchange rates at once from the database
    const exchangeRatesObj = await CurrencyRatesIntegrationService.getExchangeRatesForConversion()
    
    // Create a map for efficient lookups
    const exchangeRates = new Map<string, number>()
    uniqueCurrencies.forEach(currency => {
      const rate = exchangeRatesObj[currency] || 1
      exchangeRates.set(currency, rate)
    })

    // Calculate USD converted totals using cached rates and add USD amount to each balance
    let totalAssetsUSD = 0;
    let totalLiabilitiesUSD = 0;

    for (const balance of filteredBalances) {
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

      // Convert balance to USD using cached rates
      const rate = exchangeRates.get(balance.currency) || 1;
      const balanceInUSD = balance.finalBalance * rate;
      
      // Add USD equivalent to balance object for client use
      (balance as any).finalBalanceUSD = balanceInUSD;
      
      if (balanceInUSD >= 0) {
        totalAssetsUSD += balanceInUSD;
      } else {
        totalLiabilitiesUSD += Math.abs(balanceInUSD);
      }
    }

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

    // Debug summary for as-of-date requests
    if (selectedPeriod === 'asOfDate') {
      console.log('📊 As-of-date summary:', {
        asOfDate,
        totalAccounts: filteredBalances.length,
        totalAssetsUSD: summary.totalAssetsUSD,
        sampleBalances: filteredBalances.slice(0, 3).map(b => ({
          account: b.account.__accountType === 'bank' 
            ? (b.account.accountName || b.account.bankName)
            : b.account.walletName,
          currency: b.currency,
          finalBalance: b.finalBalance
        }))
      })
    }

    return NextResponse.json({
      data: filteredBalances,
      summary,
      filters: {
        selectedPeriod,
        customDateRange: { startDate: startDate || '', endDate: endDate || '' },
        asOfDate: asOfDate || '',
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
  customRange: { startDate: string; endDate: string; asOfDate?: string }
): Promise<{ netAmount: number; totalIncoming: number; totalOutgoing: number }> {
  try {
    // For multi-currency wallets, extract the original wallet ID
    const originalAccountId = accountType === 'wallet' && accountId.includes('-') 
      ? accountId.split('-')[0] 
      : accountId;

    // Build date filter for the period
    let dateFilter: any = {}
    
    if (period === 'asOfDate') {
      // Point-in-time query: get all transactions up to (and including) the specified date
      if (customRange.asOfDate) {
        const asOfDateObj = new Date(customRange.asOfDate)
        // Ensure we include the full day by setting time to end of day
        asOfDateObj.setHours(23, 59, 59, 999)
        console.log('🔍 As-of-date query:', customRange.asOfDate, '=>', asOfDateObj.toISOString())
        dateFilter = { lte: asOfDateObj }
      }
    } else if (period !== 'allTime') {
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

    // Debug: Log transaction results for as-of-date
    if (period === 'asOfDate') {
      const transactionCount = await prisma.transaction.count({ where: transactionWhere })
      console.log('🔍 As-of-date results:', {
        account: `${originalAccountId} (${accountType})`,
        matchingTransactions: transactionCount,
        netAmount: transactionResult._sum.netAmount || 0
      })
    }

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

async function getBlockchainHistoricalBalanceAPI(
  walletAddress: string,
  blockchain: string,
  currency: string,
  asOfDate: Date
): Promise<{ netAmount: number; totalIncoming: number; totalOutgoing: number } | null> {
  try {
    console.log('🚀 API: Hybrid blockchain historical balance calculation:', {
      walletAddress: walletAddress.substring(0, 10) + '...',
      blockchain,
      currency,
      asOfDate: asOfDate.toISOString()
    });

    // Step 1: Validate historical date
    const dateValidation = TronGridService.validateHistoricalDate(asOfDate);
    if (!dateValidation.valid) {
      console.error('❌ API: Invalid historical date:', dateValidation.error);
      return { netAmount: 0, totalIncoming: 0, totalOutgoing: 0 };
    }

    // Step 2: Get current blockchain balance as baseline
    let currentBalance = 0;
    const blockchainLower = blockchain.toLowerCase();
    
    switch (blockchainLower) {
      case 'tron':
        currentBalance = await TronGridService.getCurrentBalance(walletAddress, currency, blockchain);
        break;
      case 'ethereum':
      case 'eth':
        currentBalance = await AlchemyService.getCurrentBalance(walletAddress, currency, blockchain);
        break;
      case 'binance-smart-chain':
        console.warn(`API: Historical balance fetching not yet implemented for ${blockchain}`);
        return null;
      default:
        console.warn(`API: Unsupported blockchain for historical balance: ${blockchain}`);
        return null;
    }

    console.log(`💰 API: Current ${currency} balance:`, currentBalance);

    // Step 3: Get transactions AFTER the historical date
    const normalizedHistoricalDate = TronGridService.normalizeToUTC(asOfDate);
    let futureTransactions = [];

    switch (blockchainLower) {
      case 'tron':
        if (currency.toUpperCase() === 'TRX') {
          futureTransactions = await TronGridService.getTransactionHistory(walletAddress, {
            limit: 2000,
            startDate: normalizedHistoricalDate
          });
        } else {
          // TRC-20 tokens
          futureTransactions = await TronGridService.getTRC20TransactionHistory(walletAddress, currency, {
            limit: 2000,
            startDate: normalizedHistoricalDate
          });
        }
        break;
    }

    // Step 4: Filter to only future transactions (after historical date)
    const postHistoricalTransactions = futureTransactions.filter(tx => 
      tx.timestamp > normalizedHistoricalDate.getTime()
    );

    console.log(`📊 API: Processing ${postHistoricalTransactions.length} transactions after historical date`);

    // Step 5: Calculate net change from future transactions
    let futureNetChange = 0;
    let futureIncoming = 0;
    let futureOutgoing = 0;

    for (const tx of postHistoricalTransactions) {
      if (tx.status !== 'success') continue;
      
      const amount = tx.amount || 0;
      
      if (tx.type === 'incoming') {
        futureIncoming += amount;
        futureNetChange += amount;
      } else if (tx.type === 'outgoing') {
        futureOutgoing += amount;
        futureNetChange -= amount;
      }
    }

    // Step 6: Calculate historical balance
    const calculatedHistoricalBalance = currentBalance - futureNetChange;

    console.log('📊 API: Transaction adjustments:', {
      futureNetChange,
      futureIncoming,
      futureOutgoing,
      futureTransactionCount: postHistoricalTransactions.length
    });

    // Step 7: Validate calculated balance
    const validation = TronGridService.validateBalanceRealistic(calculatedHistoricalBalance, currency, currentBalance);
    
    let finalHistoricalBalance = calculatedHistoricalBalance;
    if (!validation.valid) {
      console.warn('⚠️ API: Balance validation failed:', validation.error);
      finalHistoricalBalance = validation.adjustedAmount || 0;
    }

    console.log('✅ API: Historical balance calculation complete:', {
      currency,
      currentBalance,
      futureNetChange,
      calculatedHistoricalBalance,
      finalHistoricalBalance,
      wasAdjusted: finalHistoricalBalance !== calculatedHistoricalBalance
    });

    // Return as historical amounts (reverse the future changes for display)
    return {
      netAmount: finalHistoricalBalance,
      totalIncoming: futureOutgoing, // Reversed: future outgoing becomes historical incoming  
      totalOutgoing: futureIncoming  // Reversed: future incoming becomes historical outgoing
    };

  } catch (error) {
    console.error('❌ API: Error in hybrid blockchain historical balance calculation:', error);
    return { netAmount: 0, totalIncoming: 0, totalOutgoing: 0 };
  }
}