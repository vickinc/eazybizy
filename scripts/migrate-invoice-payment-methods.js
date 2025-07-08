#!/usr/bin/env node

/**
 * Migration Script: Move payment method data from invoice notes to PaymentMethodInvoice table
 * 
 * This script:
 * 1. Finds invoices with __PAYMENT_METHODS__ data in notes
 * 2. Extracts and parses the payment method IDs
 * 3. Maps original bank/wallet IDs to new PaymentMethod IDs
 * 4. Creates PaymentMethodInvoice records
 * 5. Cleans up the notes field
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting invoice payment method migration...\n');

  try {
    // Step 1: Load the mapping from the previous migration
    const mappingPath = path.join(process.cwd(), 'payment-method-mapping.json');
    if (!fs.existsSync(mappingPath)) {
      throw new Error('❌ payment-method-mapping.json not found. Please run migrate-payment-methods.js first.');
    }

    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    console.log('📋 Loaded payment method mapping');

    // Create lookup maps for quick ID resolution
    const bankIdToPaymentMethodId = new Map();
    mapping.bankAccounts.forEach(item => {
      bankIdToPaymentMethodId.set(item.originalId, item.paymentMethodId);
    });

    const walletIdToPaymentMethodId = new Map();
    mapping.digitalWallets.forEach(item => {
      walletIdToPaymentMethodId.set(item.originalId, item.paymentMethodId);
    });

    console.log(`  • Bank account mappings: ${bankIdToPaymentMethodId.size}`);
    console.log(`  • Digital wallet mappings: ${walletIdToPaymentMethodId.size}\n`);

    // Step 2: Find invoices with payment method data in notes
    const invoicesWithPaymentMethods = await prisma.invoice.findMany({
      where: {
        notes: {
          contains: '__PAYMENT_METHODS__'
        }
      }
    });

    console.log(`📊 Found ${invoicesWithPaymentMethods.length} invoices with payment method data in notes\n`);

    if (invoicesWithPaymentMethods.length === 0) {
      console.log('✅ No invoices need migration. All done!');
      return;
    }

    // Step 3: Process each invoice
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const invoice of invoicesWithPaymentMethods) {
      try {
        console.log(`Processing invoice: ${invoice.invoiceNumber}`);

        // Extract payment method IDs from notes
        const paymentMethodIds = extractPaymentMethodIds(invoice.notes);
        
        if (!paymentMethodIds || paymentMethodIds.length === 0) {
          console.log(`  ⚠️  No valid payment method IDs found in notes`);
          continue;
        }

        console.log(`  📋 Found ${paymentMethodIds.length} payment method IDs: ${paymentMethodIds.join(', ')}`);

        // Map original IDs to new PaymentMethod IDs
        const mappedPaymentMethodIds = [];
        for (const originalId of paymentMethodIds) {
          let newPaymentMethodId = null;

          // Check if it's a bank account ID
          if (bankIdToPaymentMethodId.has(originalId)) {
            newPaymentMethodId = bankIdToPaymentMethodId.get(originalId);
          }
          // Check if it's a wallet ID
          else if (walletIdToPaymentMethodId.has(originalId)) {
            newPaymentMethodId = walletIdToPaymentMethodId.get(originalId);
          }

          if (newPaymentMethodId) {
            mappedPaymentMethodIds.push(newPaymentMethodId);
            console.log(`    ✅ Mapped ${originalId} → ${newPaymentMethodId}`);
          } else {
            console.log(`    ⚠️  Could not map original ID: ${originalId}`);
          }
        }

        // Step 4: Create PaymentMethodInvoice records
        for (const paymentMethodId of mappedPaymentMethodIds) {
          try {
            // Check if record already exists
            const existing = await prisma.paymentMethodInvoice.findUnique({
              where: {
                invoiceId_paymentMethodId: {
                  invoiceId: invoice.id,
                  paymentMethodId: paymentMethodId
                }
              }
            });

            if (!existing) {
              await prisma.paymentMethodInvoice.create({
                data: {
                  invoiceId: invoice.id,
                  paymentMethodId: paymentMethodId
                }
              });
              console.log(`    ✅ Created PaymentMethodInvoice record`);
            } else {
              console.log(`    ℹ️  PaymentMethodInvoice record already exists`);
            }
          } catch (error) {
            console.log(`    ❌ Failed to create PaymentMethodInvoice record: ${error.message}`);
          }
        }

        // Step 5: Clean up the notes field
        const cleanedNotes = cleanNotesField(invoice.notes);
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { notes: cleanedNotes }
        });

        console.log(`    🧹 Cleaned notes field`);
        console.log(`    ✅ Completed migration for ${invoice.invoiceNumber}\n`);
        
        successCount++;

      } catch (error) {
        console.log(`    ❌ Error processing ${invoice.invoiceNumber}: ${error.message}\n`);
        errors.push({ invoiceNumber: invoice.invoiceNumber, error: error.message });
        errorCount++;
      }
    }

    // Step 6: Summary
    console.log('📋 Migration Summary:');
    console.log(`  • Successfully migrated: ${successCount} invoices`);
    console.log(`  • Errors: ${errorCount} invoices`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => {
        console.log(`  • ${err.invoiceNumber}: ${err.error}`);
      });
    }

    // Step 7: Verify the migration
    const totalPaymentMethodInvoices = await prisma.paymentMethodInvoice.count();
    console.log(`\n📊 Total PaymentMethodInvoice records: ${totalPaymentMethodInvoices}`);

    console.log('\n✅ Invoice payment method migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Extract payment method IDs from invoice notes
 */
function extractPaymentMethodIds(notes) {
  if (!notes) return [];

  try {
    // Match the pattern: __PAYMENT_METHODS__:["id1","id2",...]
    const match = notes.match(/__PAYMENT_METHODS__:\[(.*?)\]/);
    if (!match) return [];

    const jsonString = `[${match[1]}]`;
    const ids = JSON.parse(jsonString);
    
    return Array.isArray(ids) ? ids : [];
  } catch (error) {
    console.log(`    ⚠️  Failed to parse payment method IDs: ${error.message}`);
    return [];
  }
}

/**
 * Clean the notes field by removing payment method data
 */
function cleanNotesField(notes) {
  if (!notes) return '';

  // Remove the payment method data and clean up
  let cleaned = notes.replace(/\n?__PAYMENT_METHODS__:\[.*?\]/g, '');
  
  // Trim whitespace and normalize line breaks
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Run the migration
main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });