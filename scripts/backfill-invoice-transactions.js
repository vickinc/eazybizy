#!/usr/bin/env node

/**
 * Backfill missing transaction records for paid invoices
 * 
 * This script creates transaction records for existing bookkeeping entries
 * that were created from invoice payments but lack corresponding transaction records.
 */

const { PrismaClient } = require('@prisma/client');

async function backfillInvoiceTransactions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting backfill of invoice transaction records...');
    
    // Find all bookkeeping entries from invoices that don't have corresponding transactions
    const invoiceEntries = await prisma.bookkeepingEntry.findMany({
      where: {
        isFromInvoice: true,
        accountId: { not: null } // Only process entries with valid account IDs
      },
      include: {
        invoice: {
          include: {
            company: {
              select: {
                tradingName: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    console.log(`📊 Found ${invoiceEntries.length} bookkeeping entries from invoices with account IDs`);
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const entry of invoiceEntries) {
      try {
        // Check if a transaction already exists for this entry
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            linkedEntryId: entry.id,
            linkedEntryType: 'bookkeeping_entry'
          }
        });
        
        if (existingTransaction) {
          console.log(`⏭️  Skipping ${entry.invoice?.invoiceNumber} - transaction already exists`);
          skippedCount++;
          continue;
        }
        
        // Create the transaction record
        const transaction = await prisma.transaction.create({
          data: {
            companyId: entry.companyId,
            date: entry.date,
            paidBy: entry.invoice?.clientName || 'Unknown Client',
            paidTo: entry.invoice?.company?.tradingName || 'Unknown Company',
            netAmount: entry.amount,
            incomingAmount: entry.amount,
            outgoingAmount: 0,
            currency: entry.currency,
            baseCurrency: entry.currency, // Assuming same currency
            baseCurrencyAmount: entry.amount,
            exchangeRate: 1.0,
            accountId: entry.accountId,
            accountType: entry.accountType,
            reference: entry.reference || entry.invoice?.invoiceNumber,
            category: entry.category,
            description: entry.description,
            linkedEntryId: entry.id,
            linkedEntryType: 'bookkeeping_entry',
            status: 'CLEARED',
            reconciliationStatus: 'UNRECONCILED',
            approvalStatus: 'APPROVED'
          }
        });
        
        console.log(`✅ Created transaction for ${entry.invoice?.invoiceNumber}: ${entry.amount} ${entry.currency}`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${entry.invoice?.invoiceNumber}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Backfill Summary:');
    console.log(`✅ Transactions created: ${createdCount}`);
    console.log(`⏭️  Entries skipped (already have transactions): ${skippedCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📊 Total processed: ${createdCount + skippedCount + errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Backfill completed successfully!');
      console.log('💡 Invoice payments should now show up in balance calculations');
    } else {
      console.log('\n⚠️  Backfill completed with some errors. Please review the error messages above.');
    }
    
  } catch (error) {
    console.error('💥 Backfill failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
if (require.main === module) {
  backfillInvoiceTransactions()
    .then(() => {
      console.log('✨ Backfill script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Backfill script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  backfillInvoiceTransactions
};