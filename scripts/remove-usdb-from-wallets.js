/**
 * Script to remove USDB from existing Base blockchain wallets
 * This updates the currencies field to remove USDB
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeUSDBFromWallets() {
  try {
    console.log('🔍 Finding Base wallets with USDB...');

    // Find all Base blockchain wallets
    const baseWallets = await prisma.digitalWallet.findMany({
      where: {
        blockchain: {
          in: ['base', 'Base', 'BASE']
        }
      }
    });

    console.log(`📊 Found ${baseWallets.length} Base wallets`);

    let updatedCount = 0;

    for (const wallet of baseWallets) {
      let needsUpdate = false;
      let currenciesArray = [];

      // Parse currencies
      if (wallet.currencies) {
        if (Array.isArray(wallet.currencies)) {
          currenciesArray = wallet.currencies;
        } else if (typeof wallet.currencies === 'string') {
          currenciesArray = wallet.currencies.split(',').map(c => c.trim()).filter(c => c.length > 0);
        }
      }

      // Check if USDB exists
      if (currenciesArray.includes('USDB')) {
        console.log(`\n🔧 Wallet: ${wallet.walletName}`);
        console.log(`   Before: ${currenciesArray.join(', ')}`);

        // Remove USDB
        currenciesArray = currenciesArray.filter(c => c !== 'USDB');
        needsUpdate = true;

        console.log(`   After:  ${currenciesArray.join(', ')}`);
      }

      // Update wallet if needed
      if (needsUpdate) {
        // Convert array back to comma-separated string
        const currenciesString = currenciesArray.join(', ');

        await prisma.digitalWallet.update({
          where: { id: wallet.id },
          data: {
            currencies: currenciesString
          }
        });

        updatedCount++;
        console.log(`   ✅ Updated`);
      }
    }

    console.log(`\n✅ Complete! Updated ${updatedCount} wallets`);

    console.log('\n✅ Wallet currencies updated successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
removeUSDBFromWallets()
  .then(() => {
    console.log('\n🎉 Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
