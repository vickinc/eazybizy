// Quick debug script to see what's in localStorage
(function() {
    console.log('🔍 Current localStorage contents:');
    
    const allKeys = Object.keys(localStorage).sort();
    console.log('Total keys:', allKeys.length);
    
    const oldKeys = allKeys.filter(key => key.startsWith('portalpro-'));
    const newKeys = allKeys.filter(key => key.startsWith('app-'));
    const otherKeys = allKeys.filter(key => !key.startsWith('portalpro-') && !key.startsWith('app-'));
    
    console.log('\n📊 Key breakdown:');
    console.log('Old keys (portalpro-):', oldKeys.length);
    console.log('New keys (app-):', newKeys.length);
    console.log('Other keys:', otherKeys.length);
    
    if (oldKeys.length > 0) {
        console.log('\n🔍 Old keys still present:');
        oldKeys.forEach(key => {
            const value = localStorage.getItem(key);
            const size = value ? value.length : 0;
            console.log(`  ${key}: ${size} chars`);
        });
    }
    
    // Check migration service mapping
    const keyMappings = {
        'portalpro-bookkeeping-entries': 'app-bookkeeping-entries',
        'portalpro-bookkeeping-accounts': 'app-bookkeeping-accounts',
        'portalpro-invoices': 'app-invoices',
        'portalpro-transactions': 'app-transactions',
        'portalpro-manual-cashflow': 'app-manual-cashflow',
        'portalpro-clients': 'app-clients',
        'portalpro-vendors': 'app-vendors',
        'portalpro-products': 'app-products',
        'portalpro-product-groups': 'app-product-groups',
        'portalpro-companies': 'app-companies',
        'portalpro-business-cards': 'app-business-cards',
        'portalpro-bank-accounts': 'app-bank-accounts',
        'portalpro-digital-wallets': 'app-digital-wallets',
        'portalpro-events': 'app-events',
        'portalpro-notes': 'app-notes',
        'portalpro-fiat-rates': 'app-fiat-rates',
        'portalpro-crypto-rates': 'app-crypto-rates',
        'portalpro-currency-rates-version': 'app-currency-rates-version',
    };
    
    console.log('\n🧹 Keys that should be cleaned up:');
    oldKeys.forEach(key => {
        if (keyMappings.hasOwnProperty(key)) {
            console.log(`  ✅ ${key} (mapped to ${keyMappings[key]})`);
        } else {
            console.log(`  ❓ ${key} (not in migration mapping)`);
        }
    });
    
    // Manual cleanup function
    window.manualCleanup = function() {
        console.log('🧹 Running manual cleanup...');
        let removedCount = 0;
        
        Object.keys(keyMappings).forEach(oldKey => {
            if (localStorage.getItem(oldKey) !== null) {
                localStorage.removeItem(oldKey);
                console.log(`🗑️ Removed ${oldKey}`);
                removedCount++;
            }
        });
        
        // Also remove any other portalpro- keys not in the mapping
        oldKeys.forEach(key => {
            if (!keyMappings.hasOwnProperty(key)) {
                localStorage.removeItem(key);
                console.log(`🗑️ Removed unmapped key ${key}`);
                removedCount++;
            }
        });
        
        console.log(`✅ Manual cleanup completed. Removed ${removedCount} keys.`);
        
        // Check result
        const remainingOldKeys = Object.keys(localStorage).filter(key => key.startsWith('portalpro-'));
        console.log(`Remaining old keys: ${remainingOldKeys.length}`);
        
        return { removedCount, remainingOldKeys };
    };
    
    console.log('\n💡 To manually clean up, run: manualCleanup()');
    
    return {
        totalKeys: allKeys.length,
        oldKeys: oldKeys.length,
        newKeys: newKeys.length,
        oldKeysList: oldKeys,
        newKeysList: newKeys
    };
})();