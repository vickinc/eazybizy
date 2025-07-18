import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: params.id },
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
    
    if (!bankAccount) {
      return NextResponse.json(
        { error: 'Bank account not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(bankAccount)
  } catch (error) {
    console.error('Error fetching bank account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bank account' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const bankAccount = await prisma.bankAccount.update({
      where: { id: params.id },
      data: body,
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
    
    // Invalidate cache after successful update
    CacheInvalidationService.invalidateOnBankAccountMutation(bankAccount.id, bankAccount.companyId).catch(error => 
      console.error('Failed to invalidate caches after bank account update:', error)
    )
    
    return NextResponse.json(bankAccount)
  } catch (error) {
    console.error('Error updating bank account:', error)
    return NextResponse.json(
      { error: 'Failed to update bank account' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get bank account data before deletion to access companyId
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { id: params.id },
      select: { id: true, companyId: true }
    })
    
    if (!bankAccount) {
      return NextResponse.json(
        { error: 'Bank account not found' },
        { status: 404 }
      )
    }
    
    await prisma.bankAccount.delete({
      where: { id: params.id }
    })
    
    // Invalidate cache after successful deletion
    CacheInvalidationService.invalidateOnBankAccountMutation(bankAccount.id, bankAccount.companyId).catch(error => 
      console.error('Failed to invalidate caches after bank account deletion:', error)
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bank account:', error)
    return NextResponse.json(
      { error: 'Failed to delete bank account' },
      { status: 500 }
    )
  }
}