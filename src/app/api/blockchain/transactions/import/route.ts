import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/api-auth'
import { BlockchainTransactionImportService } from '@/services/business/blockchainTransactionImportService'
import { TransactionImportOptions } from '@/types/blockchain.types'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Server-side authentication check
    const { user, error } = await authenticateRequest()
    
    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const {
      walletId,
      startDate,
      endDate,
      currencies,
      limit,
      overwriteDuplicates,
      createInitialBalances
    } = body

    // Validate required fields
    if (!walletId) {
      return NextResponse.json(
        { error: 'Missing required field: walletId' },
        { status: 400 }
      )
    }

    // Get wallet details from database
    const wallet = await prisma.digitalWallet.findUnique({
      where: { id: walletId },
      include: { company: true }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      )
    }

    // Verify wallet is a crypto wallet
    if (wallet.walletType?.toLowerCase() !== 'crypto') {
      return NextResponse.json(
        { error: 'Only cryptocurrency wallets support blockchain transaction import' },
        { status: 400 }
      )
    }

    // Prepare import options
    const importOptions: TransactionImportOptions = {
      walletAddress: wallet.walletAddress,
      blockchain: wallet.blockchain || 'ethereum',
      network: 'mainnet',
      currencies: currencies || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit || 5000,
      overwriteDuplicates: overwriteDuplicates || false,
      createInitialBalances: createInitialBalances || false
    }

    console.log('🚀 Starting blockchain transaction import via API:', {
      walletId,
      walletName: wallet.walletName,
      walletAddress: wallet.walletAddress,
      blockchain: wallet.blockchain,
      company: wallet.company.tradingName,
      options: {
        ...importOptions,
        startDate: importOptions.startDate?.toISOString(),
        endDate: importOptions.endDate?.toISOString()
      }
    })

    // Start the import process
    const result = await BlockchainTransactionImportService.importTransactionHistory(
      walletId,
      importOptions
    )

    console.log('✅ Blockchain transaction import completed:', result)

    return NextResponse.json({
      success: true,
      message: 'Blockchain transaction import completed',
      result
    })

  } catch (error) {
    console.error('❌ Error in blockchain transaction import API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to import blockchain transactions', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Server-side authentication check
    const { user, error } = await authenticateRequest()
    
    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const walletId = searchParams.get('walletId')
    const importId = searchParams.get('importId')

    if (importId) {
      // Get specific import status
      const status = BlockchainTransactionImportService.getImportStatus(importId)
      
      if (!status) {
        return NextResponse.json(
          { error: 'Import status not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        status
      })
    }

    if (walletId) {
      // Get all import statuses for a wallet
      const statuses = BlockchainTransactionImportService.getWalletImportStatuses(walletId)
      
      return NextResponse.json({
        success: true,
        statuses
      })
    }

    return NextResponse.json(
      { error: 'Either walletId or importId parameter is required' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Error getting blockchain import status:', error)
    return NextResponse.json(
      { error: 'Failed to get import status' },
      { status: 500 }
    )
  }
}