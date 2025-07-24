import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookkeepingEntry } from '@/types/bookkeeping.types';

// POST /api/entries/migrate - Migrate entries from localStorage to database
export async function POST(request: NextRequest) {
  try {
    const { entries, companyId } = await request.json();
    
    if (!entries || !Array.isArray(entries) || !companyId) {
      return NextResponse.json(
        { error: 'Invalid migration data' },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: parseInt(companyId) }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Transform localStorage entries to database format
    const transformedEntries = entries.map((entry: BookkeepingEntry) => {
      return {
        id: entry.id, // Preserve existing ID if possible
        companyId: parseInt(companyId),
        type: entry.type,
        category: entry.category,
        subcategory: entry.subcategory,
        description: entry.description,
        amount: entry.amount,
        currency: entry.currency,
        date: new Date(entry.date),
        reference: entry.reference,
        notes: entry.notes || undefined,
        accountId: entry.accountId,
        accountType: entry.accountType,
        cogs: entry.cogs || 0,
        cogsPaid: entry.cogsPaid || 0,
        vendorInvoice: entry.vendorInvoice,
        isFromInvoice: entry.isFromInvoice || false,
        invoiceId: entry.invoiceId,
        chartOfAccountsId: entry.chartOfAccountsId,
        // Preserve timestamps if they exist
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : new Date(),
      };
    });

    let migrated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Migrate entries one by one to handle conflicts gracefully
    for (const entryData of transformedEntries) {
      try {
        // Check if entry already exists
        const existingEntry = await prisma.bookkeepingEntry.findUnique({
          where: { id: entryData.id }
        });

        if (existingEntry) {
          skipped++;
          continue;
        }

        // Create the entry
        await prisma.bookkeepingEntry.create({
          data: entryData
        });

        migrated++;
      } catch (error) {
        console.error(`Error migrating entry ${entryData.id}:`, error);
        errors.push(`Entry ${entryData.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      migrated,
      skipped,
      total: entries.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    );
  }
}

// GET /api/entries/migrate/check - Check migration status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID required' },
        { status: 400 }
      );
    }

    // Count entries in database for this company
    const count = await prisma.bookkeepingEntry.count({
      where: { companyId: parseInt(companyId) }
    });

    // Get basic stats
    const [incomeCount, expenseCount] = await Promise.all([
      prisma.bookkeepingEntry.count({
        where: { companyId: parseInt(companyId), type: 'income' }
      }),
      prisma.bookkeepingEntry.count({
        where: { companyId: parseInt(companyId), type: 'expense' }
      })
    ]);

    return NextResponse.json({
      totalEntries: count,
      incomeEntries: incomeCount,
      expenseEntries: expenseCount,
      lastMigration: null, // Could track this if needed
    });
  } catch (error) {
    console.error('Check migration error:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}