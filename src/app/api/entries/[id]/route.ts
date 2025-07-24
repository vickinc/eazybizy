import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/entries/[id] - Get single entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entry = await prisma.bookkeepingEntry.findUnique({
      where: { id: params.id },
      include: {
        company: {
          select: {
            id: true,
            legalName: true,
            tradingName: true,
            baseCurrency: true,
          }
        },
        account: true,
        invoice: true,
        chartOfAccount: true,
        transaction: true,
      }
    });
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entry' },
      { status: 500 }
    );
  }
}

// PUT /api/entries/[id] - Update entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Check if entry exists
    const existingEntry = await prisma.bookkeepingEntry.findUnique({
      where: { id: params.id }
    });
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }
    
    // Update the entry
    const entry = await prisma.bookkeepingEntry.update({
      where: { id: params.id },
      data: {
        type: body.type || existingEntry.type,
        category: body.category || existingEntry.category,
        subcategory: body.subcategory,
        description: body.description || existingEntry.description,
        amount: body.amount !== undefined ? parseFloat(body.amount) : existingEntry.amount,
        currency: body.currency || existingEntry.currency,
        date: body.date ? new Date(body.date) : existingEntry.date,
        reference: body.reference,
        notes: body.notes,
        accountId: body.accountId,
        accountType: body.accountType,
        cogs: body.cogs !== undefined ? parseFloat(body.cogs) : existingEntry.cogs,
        cogsPaid: body.cogsPaid !== undefined ? parseFloat(body.cogsPaid) : existingEntry.cogsPaid,
        vendorInvoice: body.vendorInvoice,
        isFromInvoice: body.isFromInvoice !== undefined ? body.isFromInvoice : existingEntry.isFromInvoice,
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
          }
        },
        account: true,
        invoice: true,
        chartOfAccount: true,
      }
    });
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/entries/[id] - Delete entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if entry exists
    const existingEntry = await prisma.bookkeepingEntry.findUnique({
      where: { id: params.id }
    });
    
    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }
    
    // Delete the entry
    await prisma.bookkeepingEntry.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}