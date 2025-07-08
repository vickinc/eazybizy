/**
 * localStorage Data Inspector and Recovery Tool
 * Run this in the browser console to diagnose data loss issues
 */

(function() {
    console.log('🔍 localStorage Data Inspector Started...\n');

    // 1. Check migration status
    console.group('📋 Migration Status');
    const migrationVersion = localStorage.getItem('app-migration-version');
    console.log('Migration Version:', migrationVersion || 'NOT SET');
    console.log('Migration Completed:', migrationVersion === '1.0.0' ? '✅ YES' : '❌ NO');
    console.groupEnd();

    // 2. List all localStorage keys
    console.group('🗂️ All localStorage Keys');
    const allKeys = Object.keys(localStorage).sort();
    console.log('Total Keys:', allKeys.length);
    
    const oldKeys = allKeys.filter(key => key.startsWith('portalpro-'));
    const newKeys = allKeys.filter(key => key.startsWith('app-'));
    const otherKeys = allKeys.filter(key => !key.startsWith('portalpro-') && !key.startsWith('app-'));
    
    console.log('\n📊 Key Distribution:');
    console.log('Old keys (portalpro-):', oldKeys.length);
    console.log('New keys (app-):', newKeys.length);
    console.log('Other keys:', otherKeys.length);
    
    if (oldKeys.length > 0) {
        console.log('\n🔍 Old Keys Found:');
        oldKeys.forEach(key => {
            const value = localStorage.getItem(key);
            const size = value ? value.length : 0;
            console.log(`  ${key}: ${size} chars`);
        });
    }
    
    if (newKeys.length > 0) {
        console.log('\n✅ New Keys Found:');
        newKeys.forEach(key => {
            const value = localStorage.getItem(key);
            const size = value ? value.length : 0;
            console.log(`  ${key}: ${size} chars`);
        });
    }
    
    if (otherKeys.length > 0) {
        console.log('\n🔧 Other Keys:');
        otherKeys.forEach(key => {
            const value = localStorage.getItem(key);
            const size = value ? value.length : 0;
            console.log(`  ${key}: ${size} chars`);
        });
    }
    console.groupEnd();

    // 3. Detailed data analysis for key data types
    console.group('📊 Data Analysis');
    
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

    Object.entries(keyMappings).forEach(([oldKey, newKey]) => {
        const oldData = localStorage.getItem(oldKey);
        const newData = localStorage.getItem(newKey);
        
        if (oldData || newData) {
            console.log(`\n📂 ${oldKey.replace('portalpro-', '').toUpperCase()}`);
            
            if (oldData) {
                try {
                    const parsed = JSON.parse(oldData);
                    const count = Array.isArray(parsed) ? parsed.length : (typeof parsed === 'object' ? Object.keys(parsed).length : 1);
                    console.log(`  Old (${oldKey}): ${count} items`);
                } catch {
                    console.log(`  Old (${oldKey}): Invalid JSON`);
                }
            }
            
            if (newData) {
                try {
                    const parsed = JSON.parse(newData);
                    const count = Array.isArray(parsed) ? parsed.length : (typeof parsed === 'object' ? Object.keys(parsed).length : 1);
                    console.log(`  New (${newKey}): ${count} items`);
                } catch {
                    console.log(`  New (${newKey}): Invalid JSON`);
                }
            }
            
            if (!oldData && !newData) {
                console.log(`  No data found for this category`);
            }
        }
    });
    console.groupEnd();

    // 4. Recovery recommendations
    console.group('💡 Recovery Recommendations');
    
    if (oldKeys.length > 0 && newKeys.length === 0) {
        console.log('🔄 MIGRATION NEEDED:');
        console.log('  - Old data found but migration not completed');
        console.log('  - Run: StorageMigrationService.runMigration()');
        console.log('  - Or reload the app to trigger automatic migration');
    } else if (oldKeys.length > 0 && newKeys.length > 0) {
        console.log('⚠️ DUPLICATE DATA:');
        console.log('  - Both old and new keys found');
        console.log('  - Migration may have failed partway');
        console.log('  - Check data integrity before cleanup');
    } else if (oldKeys.length === 0 && newKeys.length > 0) {
        console.log('✅ MIGRATION COMPLETED:');
        console.log('  - Data successfully migrated to new keys');
        console.log('  - Old keys have been cleaned up');
    } else {
        console.log('❌ NO DATA FOUND:');
        console.log('  - No data in localStorage');
        console.log('  - This could indicate:');
        console.log('    1. First time use');
        console.log('    2. Browser cache was cleared');
        console.log('    3. Data was accidentally deleted');
        console.log('    4. Migration failed completely');
    }
    
    console.groupEnd();

    // 5. Recovery functions
    console.group('🔧 Recovery Functions');
    console.log('Available recovery functions:');
    console.log('  window.migrateData() - Force run migration');
    console.log('  window.createBackup() - Create backup of current data');
    console.log('  window.showMigrationStatus() - Show detailed migration status');
    console.log('  window.restoreFromOldKeys() - Attempt to restore from old keys');
    console.groupEnd();

    // Define recovery functions on window
    window.migrateData = function() {
        console.log('🔄 Running migration...');
        if (typeof StorageMigrationService !== 'undefined') {
            StorageMigrationService.runMigration();
        } else {
            console.error('StorageMigrationService not available. Try reloading the page.');
        }
    };

    window.createBackup = function() {
        console.log('💾 Creating backup...');
        const backup = {};
        Object.keys(localStorage).forEach(key => {
            backup[key] = localStorage.getItem(key);
        });
        const backupString = JSON.stringify(backup, null, 2);
        console.log('Backup created. Copy this data to a safe place:');
        console.log(backupString);
        return backupString;
    };

    window.showMigrationStatus = function() {
        const keyMappings = {
            'portalpro-bookkeeping-entries': 'app-bookkeeping-entries',
            'portalpro-invoices': 'app-invoices',
            'portalpro-companies': 'app-companies',
            'portalpro-clients': 'app-clients',
            'portalpro-products': 'app-products',
            'portalpro-vendors': 'app-vendors',
        };

        console.table(
            Object.entries(keyMappings).map(([oldKey, newKey]) => ({
                'Data Type': oldKey.replace('portalpro-', ''),
                'Old Key Exists': localStorage.getItem(oldKey) !== null,
                'New Key Exists': localStorage.getItem(newKey) !== null,
                'Status': localStorage.getItem(oldKey) !== null && localStorage.getItem(newKey) !== null 
                    ? 'Both Present' 
                    : localStorage.getItem(newKey) !== null 
                    ? 'Migrated' 
                    : localStorage.getItem(oldKey) !== null 
                    ? 'Not Migrated' 
                    : 'No Data'
            }))
        );
    };

    window.restoreFromOldKeys = function() {
        console.log('🔄 Attempting to restore from old keys...');
        let restoredCount = 0;
        
        Object.entries(keyMappings).forEach(([oldKey, newKey]) => {
            const oldData = localStorage.getItem(oldKey);
            const newData = localStorage.getItem(newKey);
            
            if (oldData && !newData) {
                localStorage.setItem(newKey, oldData);
                console.log(`✅ Restored ${oldKey} → ${newKey}`);
                restoredCount++;
            }
        });
        
        if (restoredCount > 0) {
            localStorage.setItem('app-migration-version', '1.0.0');
            console.log(`✅ Restored ${restoredCount} data sets. Please reload the page.`);
        } else {
            console.log('❌ No data to restore from old keys.');
        }
    };

    console.log('\n✅ localStorage inspection complete. Check the groups above for details.');
})();