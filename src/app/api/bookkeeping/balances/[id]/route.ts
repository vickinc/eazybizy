import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Server-side authentication check
    const { user, error } = await authenticateRequest()
    
    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    const initialBalance = await prisma.initialBalance.findUnique({
      where: { id },
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

    if (!initialBalance) {
      return NextResponse.json(
        { error: 'Initial balance not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(initialBalance)
  } catch (error) {
    console.error('Error fetching initial balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch initial balance' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Server-side authentication check
    const { user, error } = await authenticateRequest()
    
    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    
    const {
      amount,
      currency,
      notes,
    } = body

    // Check if initial balance exists
    const existingBalance = await prisma.initialBalance.findUnique({
      where: { id },
    })

    if (!existingBalance) {
      return NextResponse.json(
        { error: 'Initial balance not found' },
        { status: 404 }
      )
    }

    // Update initial balance
    const updatedBalance = await prisma.initialBalance.update({
      where: { id },
      data: {
        amount: amount !== undefined ? amount : existingBalance.amount,
        currency: currency || existingBalance.currency,
        notes: notes !== undefined ? notes : existingBalance.notes,
        updatedAt: new Date(),
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
    
    return NextResponse.json(updatedBalance)
  } catch (error) {
    console.error('Error updating initial balance:', error)
    return NextResponse.json(
      { error: 'Failed to update initial balance' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Server-side authentication check
    const { user, error } = await authenticateRequest()
    
    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Check if initial balance exists
    const existingBalance = await prisma.initialBalance.findUnique({
      where: { id },
    })

    if (!existingBalance) {
      return NextResponse.json(
        { error: 'Initial balance not found' },
        { status: 404 }
      )
    }

    // Delete initial balance
    await prisma.initialBalance.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting initial balance:', error)
    return NextResponse.json(
      { error: 'Failed to delete initial balance' },
      { status: 500 }
    )
  }
}