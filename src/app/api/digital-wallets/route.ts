import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CacheInvalidationService } from '@/services/cache/cacheInvalidationService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const walletType = searchParams.get('walletType')
    const blockchain = searchParams.get('blockchain')
    const isActive = searchParams.get('isActive')
    
    console.log('🔍 Digital wallets API called with params:', {
      companyId,
      walletType,
      blockchain,
      isActive,
      url: request.url
    });
    
    // Build where clause with multiple filters
    const where: any = {}
    
    // Company filter
    if (companyId && companyId !== 'all') {
      where.companyId = parseInt(companyId)
    }
    
    // Wallet type filter (e.g., 'crypto') - handle case insensitivity
    if (walletType) {
      where.walletType = {
        equals: walletType,
        mode: 'insensitive'
      }
    }
    
    // Blockchain filter (e.g., 'tron', 'ethereum') - handle case insensitivity
    if (blockchain) {
      where.blockchain = {
        equals: blockchain,
        mode: 'insensitive'
      }
    }
    
    // Active status filter - default to true unless explicitly set
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    } else {
      where.isActive = true
    }
    
    console.log('🔍 Database query where clause:', where);
    
    const digitalWallets = await prisma.digitalWallet.findMany({
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
    
    console.log('✅ Found digital wallets:', {
      count: digitalWallets.length,
      wallets: digitalWallets.map(w => ({
        id: w.id,
        walletName: w.walletName,
        walletType: w.walletType,
        blockchain: w.blockchain,
        isActive: w.isActive,
        company: w.company.tradingName
      }))
    });
    
    return NextResponse.json({
      data: digitalWallets,
      total: digitalWallets.length
    })
  } catch (error) {
    console.error('Error fetching digital wallets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digital wallets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      companyId,
      walletType,
      walletName,
      walletAddress,
      currency,
      currencies,
      description,
      blockchain,
      notes
    } = body
    
    // Validate required fields
    if (!companyId || !walletType || !walletName || !walletAddress || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields: companyId, walletType, walletName, walletAddress, currency' },
        { status: 400 }
      )
    }
    
    // Validate and normalize walletType enum
    const normalizedWalletType = walletType.toUpperCase()
    const validWalletTypes = ['PAYPAL', 'STRIPE', 'WISE', 'CRYPTO', 'OTHER']
    if (!validWalletTypes.includes(normalizedWalletType)) {
      return NextResponse.json(
        { error: `Invalid walletType. Must be one of: ${validWalletTypes.map(t => t.toLowerCase()).join(', ')}` },
        { status: 400 }
      )
    }
    
    const digitalWallet = await prisma.digitalWallet.create({
      data: {
        companyId,
        walletType: normalizedWalletType,
        walletName,
        walletAddress,
        currency,
        currencies: Array.isArray(currencies) ? currencies.join(', ') : (currencies || currency),
        description: description || '',
        blockchain,
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
    CacheInvalidationService.invalidateOnDigitalWalletMutation(digitalWallet.id, digitalWallet.companyId).catch(error => 
      console.error('Failed to invalidate caches after digital wallet creation:', error)
    )
    
    return NextResponse.json(digitalWallet, { status: 201 })
  } catch (error) {
    console.error('Error creating digital wallet:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create digital wallet'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}