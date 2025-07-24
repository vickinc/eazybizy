import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/entries/bulk - Create multiple entries
export async function POST(request: NextRequest) {
  try {
    const { entries } = await request.json();
    
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'Invalid entries data' },
        { status: 400 }
      );
    }
    
    // Validate all entries
    const validatedEntries = entries.map((entry, index) => {
      const { companyId, type, category, description, amount, currency, date } = entry;
      
      // More flexible validation
      if (!companyId || !type || !category || !description || amount === undefined || amount === '' || !currency || !date) {
        console.error(`Entry validation failed at index ${index}:`, {
          companyId: !!companyId,
          type: !!type,
          category: !!category,
          description: !!description,
          amount: amount,
          currency: !!currency,
          date: !!date,
          entry
        });
        throw new Error(`Entry at index ${index} is missing required fields: ${
          [
            !companyId && 'companyId',
            !type && 'type',
            !category && 'category',
            !description && 'description',
            (amount === undefined || amount === '') && 'amount',
            !currency && 'currency',
            !date && 'date'
          ].filter(Boolean).join(', ')
        }`);
      }
      
      if (!['revenue', 'expense'].includes(type)) {
        throw new Error(`Entry at index ${index} has invalid type: ${type}`);
      }
      
      // Parse and validate amount
      const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error(`Entry at index ${index} has invalid amount: ${amount}`);
      }
      
      return {
        companyId: typeof companyId === 'string' ? parseInt(companyId) : companyId,
        type,
        category,
        subcategory: entry.subcategory,
        description,
        amount: parsedAmount,
        currency,
        date: new Date(date),
        reference: entry.reference,
        notes: entry.notes,
        accountId: entry.accountId,
        accountType: entry.accountType,
        cogs: entry.cogs ? (typeof entry.cogs === 'string' ? parseFloat(entry.cogs) : entry.cogs) : 0,
        cogsPaid: entry.cogsPaid ? (typeof entry.cogsPaid === 'string' ? parseFloat(entry.cogsPaid) : entry.cogsPaid) : 0,
        vendorInvoice: entry.vendorInvoice,
        isFromInvoice: entry.isFromInvoice || false,
        invoiceId: entry.invoiceId,
        chartOfAccountsId: entry.chartOfAccountsId,
      };
    });
    
    // Create all entries in a transaction
    const createdEntries = await prisma.$transaction(
      validatedEntries.map(data => 
        prisma.bookkeepingEntry.create({
          data,
          include: {
            company: {
              select: {
                id: true,
                legalName: true,
                tradingName: true,
                baseCurrency: true,
              }
            }
          }
        })
      )
    );
    
    return NextResponse.json({
      entries: createdEntries,
      count: createdEntries.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating bulk entries:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create entries' },
      { status: 500 }
    );
  }
}

// DELETE /api/entries/bulk - Delete multiple entries
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid entry IDs' },
        { status: 400 }
      );
    }
    
    // Delete all entries
    const result = await prisma.bookkeepingEntry.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    
    return NextResponse.json({
      message: 'Entries deleted successfully',
      count: result.count,
    });
  } catch (error) {
    console.error('Error deleting bulk entries:', error);
    return NextResponse.json(
      { error: 'Failed to delete entries' },
      { status: 500 }
    );
  }
}