import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/entries - List entries with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '20');
    
    // Filters
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type'); // 'income' | 'expense'
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const currency = searchParams.get('currency');
    const accountId = searchParams.get('accountId');
    const chartOfAccountsId = searchParams.get('chartOfAccountsId');
    const isFromInvoice = searchParams.get('isFromInvoice');
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where clause
    const where: Prisma.BookkeepingEntryWhereInput = {
      ...(companyId && companyId !== 'all' && { companyId: parseInt(companyId) }),
      ...(type && { type }),
      ...(category && { category }),
      ...(currency && { currency }),
      ...(accountId && { accountId }),
      ...(chartOfAccountsId && { chartOfAccountsId }),
      ...(isFromInvoice !== null && { isFromInvoice: isFromInvoice === 'true' }),
      ...(dateFrom || dateTo ? {
        date: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        }
      } : {}),
      ...(search && {
        OR: [
          { description: { contains: search } },
          { category: { contains: search } },
          { subcategory: { contains: search } },
          { reference: { contains: search } },
          { notes: { contains: search } },
        ]
      })
    };
    
    // Build orderBy
    const orderBy: Prisma.BookkeepingEntryOrderByWithRelationInput = {
      [sortBy]: sortOrder as Prisma.SortOrder
    };
    
    // Execute queries in parallel
    const [entries, total, stats] = await Promise.all([
      prisma.bookkeepingEntry.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          company: {
            select: {
              id: true,
              legalName: true,
              tradingName: true,
              baseCurrency: true,
              logo: true,
            }
          },
          // account: removed due to foreign key constraint removal
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              clientName: true,
              totalAmount: true,
              currency: true,
              status: true,
            }
          },
          chartOfAccount: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              category: true,
            }
          },
          linkedIncome: {
            select: {
              id: true,
              type: true,
              category: true,
              description: true,
              reference: true,
              amount: true,
              currency: true,
              date: true,
              cogs: true,
            }
          },
          linkedExpenses: {
            select: {
              id: true,
              type: true,
              category: true,
              description: true,
              reference: true,
              amount: true,
              currency: true,
              date: true,
              vendorInvoice: true,
            }
          }
        }
      }),
      prisma.bookkeepingEntry.count({ where }),
      // Calculate statistics
      prisma.bookkeepingEntry.aggregate({
        where,
        _sum: {
          amount: true,
          cogs: true,
          cogsPaid: true,
        },
        _avg: {
          amount: true,
        },
        _count: {
          _all: true,
        }
      })
    ]);
    
    // Calculate income/expense breakdown
    const [incomeStats, expenseStats, linkedExpenseStats] = await Promise.all([
      prisma.bookkeepingEntry.aggregate({
        where: { ...where, type: 'revenue' },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.bookkeepingEntry.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true, cogs: true, cogsPaid: true },
        _count: { _all: true }
      }),
      // Calculate COGS paid as sum of expense amounts that are linked to revenue
      prisma.bookkeepingEntry.aggregate({
        where: { 
          ...where, 
          type: 'expense',
          linkedIncomeId: { not: null }
        },
        _sum: { amount: true }
      })
    ]);
    
    return NextResponse.json({
      entries,
      pagination: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
      stats: {
        totalAmount: stats._sum.amount || 0,
        totalCogs: stats._sum.cogs || 0,
        totalCogsPaid: linkedExpenseStats._sum.amount || 0,
        averageAmount: stats._avg.amount || 0,
        count: stats._count._all,
        income: {
          total: incomeStats._sum.amount || 0,
          count: incomeStats._count._all,
        },
        expense: {
          total: expenseStats._sum.amount || 0,
          totalCogs: stats._sum.cogs || 0,
          totalCogsPaid: linkedExpenseStats._sum.amount || 0,
          count: expenseStats._count._all,
        },
        netProfit: (incomeStats._sum.amount || 0) - (expenseStats._sum.amount || 0),
      }
    });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

// POST /api/entries - Create new entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('POST /api/entries - Request body:', body);
    
    // Validate required fields
    const { companyId, type, category, amount, currency, date } = body;
    
    if (!companyId || !type || !category || !amount || !currency || !date) {
      const missingFields = [];
      if (!companyId) missingFields.push('companyId');
      if (!type) missingFields.push('type');
      if (!category) missingFields.push('category');
      if (!amount) missingFields.push('amount');
      if (!currency) missingFields.push('currency');
      if (!date) missingFields.push('date');
      
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate type
    if (!['revenue', 'expense'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid entry type' },
        { status: 400 }
      );
    }
    
    // Create the entry
    console.log('Creating entry with data:', {
      companyId: parseInt(companyId),
      type,
      category,
      amount: parseFloat(amount),
      currency,
      date: new Date(date),
    });
    
    const entry = await prisma.bookkeepingEntry.create({
      data: {
        companyId: parseInt(companyId),
        type,
        category,
        subcategory: body.subcategory,
        description: body.description || null,
        amount: parseFloat(amount),
        currency,
        date: new Date(date),
        reference: body.reference,
        notes: body.notes,
        accountId: body.accountId || null,
        accountType: body.accountType,
        cogs: body.cogs ? parseFloat(body.cogs) : 0,
        cogsPaid: body.cogsPaid ? parseFloat(body.cogsPaid) : 0,
        vendorInvoice: body.vendorInvoice,
        isFromInvoice: body.isFromInvoice || false,
        invoiceId: body.invoiceId,
        chartOfAccountsId: body.chartOfAccountsId,
      },
      include: {
        company: {
          select: {
            id: true,
            legalName: true,
            tradingName: true,
            baseCurrency: true,
            logo: true,
          }
        },
        // account: removed due to foreign key constraint removal
        invoice: true,
        chartOfAccount: true,
      }
    });
    
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Failed to create entry',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}