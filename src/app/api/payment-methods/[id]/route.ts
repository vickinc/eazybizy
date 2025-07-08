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
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: {
        id: params.id,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
          },
        },
      },
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error('Error fetching payment method:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment method' },
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
      name,
      companyId,
      accountName,
      bankName,
      bankAddress,
      iban,
      swiftCode,
      accountNumber,
      walletAddress,
      currency,
      details,
    } = body

    // Check if payment method exists
    const existingPaymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: params.id },
    })

    if (!existingPaymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Update payment method
    const updatedPaymentMethod = await prisma.paymentMethod.update({
      where: { id: params.id },
      data: {
        type,
        name,
        companyId: companyId ? parseInt(companyId) : undefined,
        accountName,
        bankName,
        bankAddress,
        iban,
        swiftCode,
        accountNumber,
        walletAddress,
        currency,
        details,
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
          },
        },
      },
    })

    return NextResponse.json(updatedPaymentMethod)
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if payment method exists
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: params.id },
    })

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Check if payment method is used in any invoices
    const usageCount = await prisma.paymentMethodInvoice.count({
      where: { paymentMethodId: params.id },
    })

    if (usageCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete payment method',
          details: `Payment method is used in ${usageCount} invoice(s)`
        },
        { status: 400 }
      )
    }

    // Delete payment method
    await prisma.paymentMethod.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}