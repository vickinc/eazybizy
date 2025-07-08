/**
 * Quick fix for orphaned bank accounts and digital wallets
 * Run this in the browser console to clean up the specific error
 */

(function() {
    console.log('🔧 Fixing orphaned bank accounts and digital wallets...');

    // Get current data
    const companies = JSON.parse(localStorage.getItem('app-companies') || '[]');
    const bankAccounts = JSON.parse(localStorage.getItem('app-bank-accounts') || '[]');
    const digitalWallets = JSON.parse(localStorage.getItem('app-digital-wallets') || '[]');

    console.log('Current data:');
    console.log('Companies:', companies.length);
    console.log('Bank accounts:', bankAccounts.length);
    console.log('Digital wallets:', digitalWallets.length);

    // Get valid company IDs
    const validCompanyIds = new Set(companies.map(c => c.id));
    console.log('Valid company IDs:', Array.from(validCompanyIds));

    // Filter out orphaned bank accounts
    const validBankAccounts = bankAccounts.filter(account => {
        const isValid = validCompanyIds.has(account.companyId);
        if (!isValid) {
            console.warn(`🗑️ Removing orphaned bank account ${account.id} (references company ${account.companyId})`);
        }
        return isValid;
    });

    // Filter out orphaned digital wallets
    const validDigitalWallets = digitalWallets.filter(wallet => {
        const isValid = validCompanyIds.has(wallet.companyId);
        if (!isValid) {
            console.warn(`🗑️ Removing orphaned digital wallet ${wallet.id} (references company ${wallet.companyId})`);
        }
        return isValid;
    });

    // Save cleaned data
    localStorage.setItem('app-bank-accounts', JSON.stringify(validBankAccounts));
    localStorage.setItem('app-digital-wallets', JSON.stringify(validDigitalWallets));

    const removedBankAccounts = bankAccounts.length - validBankAccounts.length;
    const removedDigitalWallets = digitalWallets.length - validDigitalWallets.length;

    console.log('✅ Cleanup completed:');
    console.log(`  Removed ${removedBankAccounts} orphaned bank accounts`);
    console.log(`  Removed ${removedDigitalWallets} orphaned digital wallets`);
    console.log(`  Remaining bank accounts: ${validBankAccounts.length}`);
    console.log(`  Remaining digital wallets: ${validDigitalWallets.length}`);

    if (removedBankAccounts > 0 || removedDigitalWallets > 0) {
        console.log('🔄 Please refresh the page to see the changes.');
    } else {
        console.log('ℹ️ No orphaned data found.');
    }

    // Return summary for further inspection
    return {
        removedBankAccounts,
        removedDigitalWallets,
        validBankAccounts: validBankAccounts.length,
        validDigitalWallets: validDigitalWallets.length,
        validCompanyIds: Array.from(validCompanyIds)
    };
})();