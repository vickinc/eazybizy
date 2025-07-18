import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const digitalWallet = await prisma.digitalWallet.findUnique({
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
    
    if (!digitalWallet) {
      return NextResponse.json(
        { error: 'Digital wallet not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(digitalWallet)
  } catch (error) {
    console.error('Error fetching digital wallet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digital wallet' },
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
    
    // Normalize walletType if present
    if (body.walletType) {
      const normalizedWalletType = body.walletType.toUpperCase()
      const validWalletTypes = ['PAYPAL', 'STRIPE', 'WISE', 'CRYPTO', 'OTHER']
      if (!validWalletTypes.includes(normalizedWalletType)) {
        return NextResponse.json(
          { error: `Invalid walletType. Must be one of: ${validWalletTypes.map(t => t.toLowerCase()).join(', ')}` },
          { status: 400 }
        )
      }
      body.walletType = normalizedWalletType
    }
    
    // Convert currencies array to string if present, or handle string format
    if (body.currencies !== undefined) {
      if (Array.isArray(body.currencies)) {
        body.currencies = body.currencies.join(', ')
      } else if (typeof body.currencies === 'string') {
        // Keep as is if already a string
        body.currencies = body.currencies
      }
    }
    
    const digitalWallet = await prisma.digitalWallet.update({
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
    CacheInvalidationService.invalidateOnDigitalWalletMutation(digitalWallet.id, digitalWallet.companyId).catch(error => 
      console.error('Failed to invalidate caches after digital wallet update:', error)
    )
    
    return NextResponse.json(digitalWallet)
  } catch (error) {
    console.error('Error updating digital wallet:', error)
    return NextResponse.json(
      { error: 'Failed to update digital wallet' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get digital wallet data before deletion to access companyId
    const digitalWallet = await prisma.digitalWallet.findUnique({
      where: { id: params.id },
      select: { id: true, companyId: true }
    })
    
    if (!digitalWallet) {
      return NextResponse.json(
        { error: 'Digital wallet not found' },
        { status: 404 }
      )
    }
    
    await prisma.digitalWallet.delete({
      where: { id: params.id }
    })
    
    // Invalidate cache after successful deletion
    CacheInvalidationService.invalidateOnDigitalWalletMutation(digitalWallet.id, digitalWallet.companyId).catch(error => 
      console.error('Failed to invalidate caches after digital wallet deletion:', error)
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting digital wallet:', error)
    return NextResponse.json(
      { error: 'Failed to delete digital wallet' },
      { status: 500 }
    )
  }
}