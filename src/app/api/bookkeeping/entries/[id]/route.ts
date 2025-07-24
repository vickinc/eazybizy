import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const entry = await prisma.bookkeepingEntry.findUnique({
      where: {
        id: params.id,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true,
            address: true,
            phone: true,
            email: true,
            website: true,
            vatNumber: true,
          },
        },
        account: true,
        transaction: true,
      },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Bookkeeping entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error fetching bookkeeping entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookkeeping entry' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()
    
    const {
      type,
      category,
      subcategory,
      description,
      amount,
      currency,
      date,
      reference,
      notes,
      accountId,
      accountType,
      cogs,
      cogsPaid,
    } = body

    const updatedEntry = await prisma.bookkeepingEntry.update({
      where: { id: params.id },
      data: {
        type,
        category,
        subcategory,
        description,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        currency,
        date: date ? new Date(date) : undefined,
        reference,
        notes,
        accountId,
        accountType,
        cogs: cogs !== undefined ? parseFloat(cogs) : undefined,
        cogsPaid: cogsPaid !== undefined ? parseFloat(cogsPaid) : undefined,
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
        account: true,
        transaction: true,
      },
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error('Error updating bookkeeping entry:', error)
    return NextResponse.json(
      { error: 'Failed to update bookkeeping entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if entry exists
    const entry = await prisma.bookkeepingEntry.findUnique({
      where: { id: params.id },
      include: {
        transaction: true,
      },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Bookkeeping entry not found' },
        { status: 404 }
      )
    }

    // If there's a linked transaction, handle it appropriately
    if (entry.transaction) {
      // You might want to delete the transaction as well or just unlink it
      await prisma.transaction.update({
        where: { id: entry.transaction.id },
        data: { linkedEntryId: null, linkedEntryType: null },
      })
    }

    // Delete the entry
    await prisma.bookkeepingEntry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bookkeeping entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookkeeping entry' },
      { status: 500 }
    )
  }
}