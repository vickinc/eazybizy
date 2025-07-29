import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filter parameters
    const companyId = searchParams.get('companyId')
    const period = searchParams.get('period') || 'thisMonth'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }
    
    // Build date filter
    let dateFilter: unknown = {}
    const now = new Date()
    
    if (period && !dateFrom && !dateTo) {
      switch (period) {
        case 'thisMonth':
          dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter.lte = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case 'lastMonth':
          dateFilter.gte = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          dateFilter.lte = new Date(now.getFullYear(), now.getMonth(), 0)
          break
        case 'thisYear':
          dateFilter.gte = new Date(now.getFullYear(), 0, 1)
          break
        case 'lastYear':
          dateFilter.gte = new Date(now.getFullYear() - 1, 0, 1)
          dateFilter.lte = new Date(now.getFullYear() - 1, 11, 31)
          break
        case 'allTime':
          dateFilter = undefined
          break
      }
    } else {
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
    }
    
    const whereClause = {
      companyId: parseInt(companyId),
      ...(dateFilter && { date: dateFilter }),
    }
    
    // Get income statistics
    const incomeStats = await prisma.bookkeepingEntry.aggregate({
      where: {
        ...whereClause,
        type: 'revenue',
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    })
    
    // Get expense statistics
    const expenseStats = await prisma.bookkeepingEntry.aggregate({
      where: {
        ...whereClause,
        type: 'expense',
      },
      _sum: {
        amount: true,
        cogs: true,
        cogsPaid: true,
      },
      _count: {
        _all: true,
      },
    })
    
    // Get income by category
    const incomeByCategory = await prisma.bookkeepingEntry.groupBy({
      by: ['category'],
      where: {
        ...whereClause,
        type: 'revenue',
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    })
    
    // Get expense by category
    const expenseByCategory = await prisma.bookkeepingEntry.groupBy({
      by: ['category'],
      where: {
        ...whereClause,
        type: 'expense',
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    })
    
    // Get monthly trends (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
    twelveMonthsAgo.setDate(1)
    
    const monthlyEntries = await prisma.bookkeepingEntry.findMany({
      where: {
        companyId: parseInt(companyId),
        date: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        date: true,
        type: true,
        amount: true,
      },
      orderBy: {
        date: 'asc',
      },
    })
    
    // Process monthly data
    const monthlyTrends: Record<string, { income: number; expenses: number }> = {}
    
    monthlyEntries.forEach(entry => {
      const monthKey = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = { income: 0, expenses: 0 }
      }
      
      if (entry.type === 'revenue') {
        monthlyTrends[monthKey].income += entry.amount
      } else {
        monthlyTrends[monthKey].expenses += entry.amount
      }
    })
    
    // Get account balances
    const accountBalances = await prisma.companyAccount.findMany({
      where: {
        companyId: parseInt(companyId),
      },
      select: {
        id: true,
        name: true,
        type: true,
        currency: true,
        currentBalance: true,
      },
    })
    
    // Get recent transactions summary
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        companyId: parseInt(companyId),
      },
      select: {
        id: true,
        date: true,
        paidBy: true,
        paidTo: true,
        netAmount: true,
        currency: true,
        accountType: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: 10,
    })
    
    // Calculate financial summary
    const totalIncome = incomeStats._sum.amount || 0
    const totalExpenses = expenseStats._sum.amount || 0
    const totalCogs = expenseStats._sum.cogs || 0
    const netProfit = totalIncome - totalExpenses
    const grossProfit = totalIncome - totalCogs
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
    
    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses,
        totalCogs,
        netProfit,
        grossProfit,
        profitMargin,
        incomeCount: incomeStats._count._all,
        expenseCount: expenseStats._count._all,
      },
      incomeByCategory: incomeByCategory.map(item => ({
        category: item.category,
        amount: item._sum.amount || 0,
        count: item._count._all,
      })),
      expenseByCategory: expenseByCategory.map(item => ({
        category: item.category,
        amount: item._sum.amount || 0,
        count: item._count._all,
      })),
      monthlyTrends: Object.entries(monthlyTrends).map(([month, data]) => ({
        month,
        ...data,
        netProfit: data.income - data.expenses,
      })),
      accountBalances,
      recentTransactions,
    })
  } catch (error) {
    console.error('Error fetching bookkeeping statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookkeeping statistics' },
      { status: 500 }
    )
  }
}