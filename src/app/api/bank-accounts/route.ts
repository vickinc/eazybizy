import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    // Build where clause based on companyId
    const where: any = { isActive: true }
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId)
    }
    
    const bankAccounts = await prisma.bankAccount.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({
      data: bankAccounts,
      total: bankAccounts.length
    })
  } catch (error) {
    console.error('Error fetching bank accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      companyId,
      bankName,
      bankAddress,
      currency,
      iban,
      swiftCode,
      accountNumber,
      accountName,
      notes
    } = body
    
    const bankAccount = await prisma.bankAccount.create({
      data: {
        companyId,
        bankName,
        bankAddress,
        currency,
        iban,
        swiftCode,
        accountNumber,
        accountName,
        notes,
        isActive: true
      },
      include: {
        company: {
          select: {
            id: true,
            tradingName: true,
            legalName: true,
            logo: true
          }
        }
      }
    })
    
    // Invalidate cache after successful creation
    CacheInvalidationService.invalidateOnBankAccountMutation(bankAccount.id, bankAccount.companyId).catch(error => 
      console.error('Failed to invalidate caches after bank account creation:', error)
    )
    
    return NextResponse.json(bankAccount, { status: 201 })
  } catch (error) {
    console.error('Error creating bank account:', error)
    return NextResponse.json(
      { error: 'Failed to create bank account' },
      { status: 500 }
    )
  }
}