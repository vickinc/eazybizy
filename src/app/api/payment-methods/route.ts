import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    // Build where clause
    const where: unknown = {}
    
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId)
    }

    // Fetch payment methods with company information
    const paymentMethods = await prisma.paymentMethod.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({
      data: paymentMethods,
      total: paymentMethods.length,
    })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
      details = '',
    } = body

    // Validate required fields
    if (!type || !name || !companyId || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name, companyId, currency' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['BANK', 'WALLET'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be BANK or WALLET' },
        { status: 400 }
      )
    }

    // Create payment method
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        type,
        name,
        companyId: parseInt(companyId),
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

    return NextResponse.json(paymentMethod, { status: 201 })
  } catch (error) {
    console.error('Error creating payment method:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create payment method',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}