import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * RESTful API endpoint for transactions
 * Provides comprehensive CRUD operations with filtering, sorting, and pagination
 */

interface TransactionQueryParams {
  skip?: string
  take?: string
  searchTerm?: string
  status?: 'all' | 'pending' | 'cleared' | 'cancelled'
  reconciliationStatus?: 'all' | 'unreconciled' | 'reconciled' | 'auto_reconciled'
  approvalStatus?: 'all' | 'pending' | 'approved' | 'rejected'
  accountId?: string
  accountType?: 'all' | 'bank' | 'wallet'
  currency?: string
  companyId?: string
  dateRange?: 'all' | 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'last3months' | 'last6months' | 'thisYear' | 'lastYear' | 'custom'
  dateFrom?: string
  dateTo?: string
  sortField?: 'date' | 'paidBy' | 'paidTo' | 'netAmount' | 'currency' | 'category' | 'status' | 'createdAt' | 'updatedAt'
  sortDirection?: 'asc' | 'desc'
}

// GET /api/transactions - Fetch transactions with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters with defaults
    const params: TransactionQueryParams = {
      skip: searchParams.get('skip') || '0',
      take: searchParams.get('take') || '20',
      searchTerm: searchParams.get('searchTerm') || '',
      status: (searchParams.get('status') as any) || 'all',
      reconciliationStatus: (searchParams.get('reconciliationStatus') as any) || 'all',
      approvalStatus: (searchParams.get('approvalStatus') as any) || 'all',
      accountId: searchParams.get('accountId') || undefined,
      accountType: (searchParams.get('accountType') as any) || 'all',
      currency: searchParams.get('currency') || undefined,
      companyId: searchParams.get('companyId') || undefined,
      dateRange: (searchParams.get('dateRange') as any) || 'all',
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortField: (searchParams.get('sortField') as any) || 'date',
      sortDirection: (searchParams.get('sortDirection') as any) || 'desc',
    };

    const skip = parseInt(params.skip || '0');
    const take = Math.min(parseInt(params.take || '20'), 50000); // Increased limit to support large result sets

    // Build optimized where clause
    const where: Prisma.TransactionWhereInput = {
      isDeleted: false
    };

    // Search across multiple fields
    if (params.searchTerm) {
      where.OR = [
        { paidBy: { contains: params.searchTerm, mode: 'insensitive' } },
        { paidTo: { contains: params.searchTerm, mode: 'insensitive' } },
        { reference: { contains: params.searchTerm, mode: 'insensitive' } },
        { description: { contains: params.searchTerm, mode: 'insensitive' } },
        { category: { contains: params.searchTerm, mode: 'insensitive' } },
        { currency: { contains: params.searchTerm } },
      ];
    }

    // Status filters
    if (params.status && params.status !== 'all') {
      where.status = params.status.toUpperCase() as any;
    }

    if (params.reconciliationStatus && params.reconciliationStatus !== 'all') {
      where.reconciliationStatus = params.reconciliationStatus.toUpperCase() as any;
    }

    if (params.approvalStatus && params.approvalStatus !== 'all') {
      where.approvalStatus = params.approvalStatus.toUpperCase() as any;
    }

    // Account filters
    if (params.accountId && params.accountId !== 'all') {
      where.accountId = params.accountId;
    }

    if (params.accountType && params.accountType !== 'all') {
      where.accountType = params.accountType;
    }

    // Currency filter
    if (params.currency && params.currency !== 'all') {
      where.currency = params.currency;
    }

    // Company filter
    if (params.companyId && params.companyId !== 'all') {
      where.companyId = parseInt(params.companyId);
    }

    // Enhanced date range filtering
    if (params.dateRange && params.dateRange !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      let startDate: Date;
      let endDate: Date = now;

      switch (params.dateRange) {
        case 'today':
          startDate = startOfToday;
          endDate = endOfToday;
          break;
        case 'yesterday':
          const yesterday = new Date(startOfToday);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = yesterday;
          endDate = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1);
          break;
        case 'last7days':
          startDate = new Date(startOfToday);
          startDate.setDate(startDate.getDate() - 7);
          endDate = endOfToday;
          break;
        case 'last30days':
          startDate = new Date(startOfToday);
          startDate.setDate(startDate.getDate() - 30);
          endDate = endOfToday;
          break;
        case 'thisMonth':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'lastMonth':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        case 'last3months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          endDate = endOfToday;
          break;
        case 'last6months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          endDate = endOfToday;
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        case 'lastYear':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          break;
        case 'custom':
          if (params.dateFrom && params.dateTo) {
            startDate = new Date(params.dateFrom);
            endDate = new Date(params.dateTo);
          } else {
            startDate = new Date(0); // Default to beginning of time
          }
          break;
        default:
          startDate = new Date(0);
      }

      where.date = {
        gte: startDate,
        lte: endDate
      };
    } else if (params.dateFrom && params.dateTo) {
      // Custom date range from direct date parameters
      where.date = {
        gte: new Date(params.dateFrom),
        lte: new Date(params.dateTo)
      };
    }

    // Build orderBy clause
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {};
    switch (params.sortField) {
      case 'date':
        orderBy.date = params.sortDirection;
        break;
      case 'paidBy':
        orderBy.paidBy = params.sortDirection;
        break;
      case 'paidTo':
        orderBy.paidTo = params.sortDirection;
        break;
      case 'netAmount':
        orderBy.netAmount = params.sortDirection;
        break;
      case 'currency':
        orderBy.currency = params.sortDirection;
        break;
      case 'category':
        orderBy.category = params.sortDirection;
        break;
      case 'status':
        orderBy.status = params.sortDirection;
        break;
      case 'createdAt':
        orderBy.createdAt = params.sortDirection;
        break;
      case 'updatedAt':
        orderBy.updatedAt = params.sortDirection;
        break;
      default:
        orderBy.date = params.sortDirection;
    }

    // Execute optimized queries in parallel
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          // Include related data for rich transaction display
          company: {
            select: {
              id: true,
              tradingName: true,
              legalName: true,
            }
          },
          linkedEntry: {
            select: {
              id: true,
              type: true,
              category: true,
              amount: true,
              currency: true,
              description: true,
            }
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              filePath: true,
              fileSize: true,
              mimeType: true,
              createdAt: true,
            }
          }
        }
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate basic statistics for the current result set
    const statistics = {
      total: totalCount,
      totalIncoming: transactions.reduce((sum, tx) => sum + tx.incomingAmount, 0),
      totalOutgoing: transactions.reduce((sum, tx) => sum + tx.outgoingAmount, 0),
      netAmount: transactions.reduce((sum, tx) => sum + tx.netAmount, 0),
    };

    const response = {
      data: transactions,
      pagination: {
        total: totalCount,
        skip,
        take,
        hasMore: skip + take < totalCount,
      },
      statistics,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const { user, error: authError } = await authenticateApiRequest(request);
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'date', 'paidBy', 'paidTo', 'netAmount', 'incomingAmount', 'outgoingAmount',
      'currency', 'baseCurrency', 'baseCurrencyAmount', 'exchangeRate',
      'accountId', 'accountType', 'category', 'companyId'
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate enum values
    if (!['bank', 'wallet'].includes(body.accountType)) {
      return NextResponse.json(
        { error: 'Invalid accountType. Must be "bank" or "wallet"' },
        { status: 400 }
      );
    }

    if (body.status && !['PENDING', 'CLEARED', 'CANCELLED'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be PENDING, CLEARED, or CANCELLED' },
        { status: 400 }
      );
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(body.date),
        paidBy: body.paidBy,
        paidTo: body.paidTo,
        netAmount: body.netAmount,
        incomingAmount: body.incomingAmount,
        outgoingAmount: body.outgoingAmount,
        currency: body.currency,
        baseCurrency: body.baseCurrency,
        baseCurrencyAmount: body.baseCurrencyAmount,
        exchangeRate: body.exchangeRate,
        accountId: body.accountId,
        accountType: body.accountType,
        reference: body.reference || null,
        category: body.category,
        description: body.description || null,
        linkedEntryId: body.linkedEntryId || null,
        linkedEntryType: body.linkedEntryType || null,
        status: body.status || 'PENDING',
        reconciliationStatus: body.reconciliationStatus || 'UNRECONCILED',
        approvalStatus: body.approvalStatus || 'PENDING',
        companyId: body.companyId,
        isDeleted: false,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
          }
        },
        linkedEntry: {
          select: {
            id: true,
            type: true,
            category: true,
            amount: true,
            currency: true,
            description: true,
          }
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          }
        }
      }
    });

    return NextResponse.json(transaction, { status: 201 });

  } catch (error) {
    console.error('POST /api/transactions error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A transaction with this data already exists' },
          { status: 409 }
        );
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Referenced company, account, or entry does not exist' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}