import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to fix Tron transaction currencies based on contract addresses
 * This fixes the issue where USDT transactions were incorrectly stored as TRX
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting Tron currency fix...');

    // Known TRC-20 token contracts mapping
    const tokenContracts: Record<string, { symbol: string; decimals: number }> = {
      // USDT TRC-20
      'tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t': { symbol: 'USDT', decimals: 6 },
      // USDC TRC-20  
      'tekxitehnsmsezxqrbj4w32run966rdz8': { symbol: 'USDC', decimals: 6 },
      // Additional tokens
      'tla2f6vpqdgre67v1736s7bj8ray5wyju7': { symbol: 'WIN', decimals: 6 },
      'tcfll5dx5zjdknwuesxxi1vpwjlvmwzzy9': { symbol: 'JST', decimals: 18 },
      'tkkeibotkxxkjpbmvfbv4a8ov5rafrdmf9': { symbol: 'APENFT', decimals: 6 }
    };

    // Find all transactions that might be incorrectly classified as TRX
    // but are actually TRC-20 tokens (have contract address in notes)
    const suspectTransactions = await prisma.transaction.findMany({
      where: {
        currency: 'TRX',
        linkedEntryType: 'BLOCKCHAIN_IMPORT',
        notes: {
          contains: 'contractAddress'
        }
      }
    });

    console.log(`🔍 Found ${suspectTransactions.length} suspect TRX transactions to analyze`);

    let fixedCount = 0;
    let errorCount = 0;
    const fixedTransactions: any[] = [];

    for (const transaction of suspectTransactions) {
      try {
        if (!transaction.notes) continue;

        // Parse the notes JSON to extract contract address
        const notes = JSON.parse(transaction.notes);
        const contractAddress = notes.contractAddress?.toLowerCase();

        if (!contractAddress) continue;

        // Check if this contract address matches a known token
        const tokenInfo = tokenContracts[contractAddress];
        
        if (tokenInfo) {
          console.log(`🔄 Fixing transaction ${transaction.reference}: ${contractAddress} → ${tokenInfo.symbol}`);

          // Calculate correct amount with proper decimals
          const currentAmount = Math.abs(transaction.netAmount);
          const correctedAmount = tokenInfo.symbol === 'USDT' || tokenInfo.symbol === 'USDC' 
            ? currentAmount / 1_000_000  // Convert from TRX scale (6 decimals vs TRX's scale)
            : currentAmount; // Keep as-is for other tokens

          // Update the transaction
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              currency: tokenInfo.symbol,
              // Keep the sign but use corrected amount
              netAmount: transaction.netAmount >= 0 ? correctedAmount : -correctedAmount,
              incomingAmount: transaction.incomingAmount > 0 ? correctedAmount : 0,
              outgoingAmount: transaction.outgoingAmount > 0 ? correctedAmount : 0,
              // Update description to reflect correct currency
              description: transaction.description?.replace('TRX', tokenInfo.symbol) || 
                          `${tokenInfo.symbol} transaction`,
              // Update subcategory if needed
              subcategory: transaction.subcategory?.replace('TRX', tokenInfo.symbol) || 
                          transaction.subcategory
            }
          });

          fixedTransactions.push({
            id: transaction.id,
            reference: transaction.reference,
            oldCurrency: 'TRX',
            newCurrency: tokenInfo.symbol,
            contractAddress,
            oldAmount: transaction.netAmount,
            newAmount: transaction.netAmount >= 0 ? correctedAmount : -correctedAmount
          });

          fixedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing transaction ${transaction.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Fixed ${fixedCount} transactions, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} Tron currency classifications`,
      details: {
        analyzed: suspectTransactions.length,
        fixed: fixedCount,
        errors: errorCount,
        fixedTransactions: fixedTransactions.slice(0, 10) // First 10 for preview
      }
    });

  } catch (error) {
    console.error('❌ Error in Tron currency fix:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix Tron currencies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Just preview what would be fixed without making changes
    const suspectTransactions = await prisma.transaction.findMany({
      where: {
        currency: 'TRX',
        linkedEntryType: 'BLOCKCHAIN_IMPORT',
        notes: {
          contains: 'contractAddress'
        }
      },
      take: 10
    });

    const preview = suspectTransactions.map(tx => {
      try {
        const notes = JSON.parse(tx.notes || '{}');
        return {
          id: tx.id,
          reference: tx.reference,
          currentCurrency: tx.currency,
          amount: tx.netAmount,
          contractAddress: notes.contractAddress,
          description: tx.description
        };
      } catch {
        return { id: tx.id, error: 'Invalid notes JSON' };
      }
    });

    return NextResponse.json({
      message: `Found ${suspectTransactions.length} transactions that might need currency fix`,
      preview
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to preview transactions' },
      { status: 500 }
    );
  }
}