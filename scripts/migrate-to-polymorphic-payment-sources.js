const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateToPolymorphicPaymentSources() {
  try {
    console.log('Starting migration to polymorphic payment sources...');
    
    // Get all existing PaymentMethodInvoice records
    const paymentMethodInvoices = await prisma.paymentMethodInvoice.findMany({
      include: {
        paymentMethod: true,
      },
    });
    
    console.log(`Found ${paymentMethodInvoices.length} PaymentMethodInvoice records to migrate`);
    
    // Get all bank accounts and digital wallets for reference
    const [bankAccounts, digitalWallets] = await Promise.all([
      prisma.bankAccount.findMany(),
      prisma.digitalWallet.findMany(),
    ]);
    
    const migrationData = [];
    
    for (const pmi of paymentMethodInvoices) {
      const pm = pmi.paymentMethod;
      let sourceType = 'PAYMENT_METHOD';
      let sourceId = pm.id;
      
      // Check if this payment method is actually a duplicate of a bank account
      if (pm.type === 'BANK' && pm.iban) {
        const originalBankAccount = bankAccounts.find(account => 
          account.iban === pm.iban && 
          account.bankName === pm.bankName &&
          account.accountName === pm.accountName &&
          account.companyId === pm.companyId
        );
        
        if (originalBankAccount) {
          sourceType = 'BANK_ACCOUNT';
          sourceId = originalBankAccount.id;
          console.log(`Mapping PaymentMethod ${pm.id} to BankAccount ${originalBankAccount.id}`);
        }
      }
      
      // Check if this payment method is actually a duplicate of a digital wallet
      if (pm.type === 'WALLET' && pm.walletAddress) {
        const originalWallet = digitalWallets.find(wallet => 
          wallet.walletAddress === pm.walletAddress &&
          wallet.companyId === pm.companyId
        );
        
        if (originalWallet) {
          sourceType = 'DIGITAL_WALLET';
          sourceId = originalWallet.id;
          console.log(`Mapping PaymentMethod ${pm.id} to DigitalWallet ${originalWallet.id}`);
        }
      }
      
      migrationData.push({
        invoiceId: pmi.invoiceId,
        sourceType,
        sourceId,
      });
    }
    
    // Create InvoicePaymentSource records
    if (migrationData.length > 0) {
      console.log(`Creating ${migrationData.length} InvoicePaymentSource records...`);
      
      // Use createMany for better performance
      await prisma.invoicePaymentSource.createMany({
        data: migrationData,
      });
      
      console.log('Successfully created InvoicePaymentSource records');
    }
    
    // Report summary
    const sourceCounts = migrationData.reduce((acc, item) => {
      acc[item.sourceType] = (acc[item.sourceType] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nMigration Summary:');
    console.log(`Total records migrated: ${migrationData.length}`);
    Object.entries(sourceCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} records`);
    });
    
    console.log('\nMigration completed successfully!');
    console.log('\nNote: Original PaymentMethodInvoice records have been preserved for compatibility.');
    console.log('You can safely remove them after verifying the new system works correctly.');
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToPolymorphicPaymentSources();
}

module.exports = { migrateToPolymorphicPaymentSources };