import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/entries/stats - Get entry statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    // Build where clause
    const where: any = {};
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId);
    }

    // Get basic counts and totals
    const [revenueStats, expenseStats] = await Promise.all([
      prisma.bookkeepingEntry.aggregate({
        where: { ...where, type: 'revenue' },
        _sum: { amount: true, cogs: true },
        _count: true,
      }),
      prisma.bookkeepingEntry.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true, cogs: true, cogsPaid: true },
        _count: true,
      }),
    ]);

    const revenueTotal = revenueStats._sum.amount || 0;
    const expenseTotal = expenseStats._sum.amount || 0;
    const totalCogs = expenseStats._sum.cogs || 0;
    const totalCogsPaid = expenseStats._sum.cogsPaid || 0;

    const stats = {
      totalAmount: revenueTotal + expenseTotal,
      totalCogs,
      totalCogsPaid,
      averageAmount: 0, // Calculate if needed
      count: revenueStats._count + expenseStats._count,
      income: {
        total: revenueTotal,
        count: revenueStats._count,
      },
      expense: {
        total: expenseTotal,
        totalCogs,
        totalCogsPaid,
        count: expenseStats._count,
      },
      netProfit: revenueTotal - expenseTotal,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching entry statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entry statistics' },
      { status: 500 }
    );
  }
}