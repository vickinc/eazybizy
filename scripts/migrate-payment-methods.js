#!/usr/bin/env node

/**
 * Migration Script: Populate PaymentMethod table from BankAccount and DigitalWallet data
 * 
 * This script:
 * 1. Reads existing BankAccount and DigitalWallet records
 * 2. Creates corresponding PaymentMethod records
 * 3. Handles multi-currency crypto wallets by creating separate records for each currency
 * 4. Maintains referential integrity
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting PaymentMethod migration...\n');

  try {
    // Step 1: Clear existing PaymentMethod records (in case of re-run)
    const existingCount = await prisma.paymentMethod.count();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing PaymentMethod records. Clearing them first...`);
      await prisma.paymentMethod.deleteMany({});
      console.log('✅ Cleared existing PaymentMethod records\n');
    }

    // Step 2: Fetch all active bank accounts
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
      include: { company: true }
    });

    console.log(`📊 Found ${bankAccounts.length} active bank accounts`);

    // Step 3: Create PaymentMethod records for bank accounts
    const bankPaymentMethods = [];
    for (const bank of bankAccounts) {
      const paymentMethod = {
        type: 'BANK',
        name: bank.bankName,
        companyId: bank.companyId,
        accountName: bank.accountName,
        bankName: bank.bankName,
        bankAddress: bank.bankAddress,
        iban: bank.iban,
        swiftCode: bank.swiftCode,
        accountNumber: bank.accountNumber,
        currency: bank.currency,
        details: `Bank Account: ${bank.bankName} (${bank.iban})`
      };

      const created = await prisma.paymentMethod.create({
        data: paymentMethod
      });

      bankPaymentMethods.push({ original: bank, paymentMethod: created });
      console.log(`  ✅ Created bank payment method: ${bank.bankName} (${bank.currency})`);
    }

    // Step 4: Fetch all active digital wallets
    const digitalWallets = await prisma.digitalWallet.findMany({
      where: { isActive: true },
      include: { company: true }
    });

    console.log(`\n📊 Found ${digitalWallets.length} active digital wallets`);

    // Step 5: Create PaymentMethod records for digital wallets
    const walletPaymentMethods = [];
    for (const wallet of digitalWallets) {
      // Handle multi-currency wallets
      const currencies = wallet.currencies 
        ? wallet.currencies.split(',').map(c => c.trim()).filter(c => c)
        : [wallet.currency];

      for (const currency of currencies) {
        const paymentMethod = {
          type: 'WALLET',
          name: `${wallet.walletName} (${currency})`,
          companyId: wallet.companyId,
          walletAddress: wallet.walletAddress,
          currency: currency,
          details: `Digital Wallet: ${wallet.walletType} - ${wallet.description || wallet.walletName} (${wallet.blockchain || 'N/A'})`
        };

        const created = await prisma.paymentMethod.create({
          data: paymentMethod
        });

        walletPaymentMethods.push({ original: wallet, paymentMethod: created, currency });
        console.log(`  ✅ Created wallet payment method: ${wallet.walletName} (${currency})`);
      }
    }

    // Step 6: Summary
    console.log('\n📋 Migration Summary:');
    console.log(`  • Bank accounts migrated: ${bankPaymentMethods.length}`);
    console.log(`  • Digital wallets migrated: ${walletPaymentMethods.length}`);
    console.log(`  • Total PaymentMethod records created: ${bankPaymentMethods.length + walletPaymentMethods.length}`);

    // Step 7: Create mapping file for reference (optional)
    const mapping = {
      bankAccounts: bankPaymentMethods.map(item => ({
        originalId: item.original.id,
        paymentMethodId: item.paymentMethod.id,
        bankName: item.original.bankName,
        currency: item.original.currency
      })),
      digitalWallets: walletPaymentMethods.map(item => ({
        originalId: item.original.id,
        paymentMethodId: item.paymentMethod.id,
        walletName: item.original.walletName,
        currency: item.currency
      }))
    };

    console.log('\n💾 Saving migration mapping to payment-method-mapping.json...');
    const fs = require('fs');
    fs.writeFileSync(
      'payment-method-mapping.json', 
      JSON.stringify(mapping, null, 2)
    );

    console.log('\n✅ PaymentMethod migration completed successfully!');
    console.log('📄 Migration mapping saved to payment-method-mapping.json');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });