// Force cleanup of ALL portalpro- keys
// Run this in browser console if the UI button isn't working

(function() {
    console.log('🧹 Force cleaning up ALL portalpro- keys...');
    
    // Get all keys that start with portalpro-
    const allKeys = Object.keys(localStorage);
    const oldKeys = allKeys.filter(key => key.startsWith('portalpro-'));
    
    console.log(`Found ${oldKeys.length} old keys to remove:`, oldKeys);
    
    // Remove all old keys
    let removedCount = 0;
    oldKeys.forEach(key => {
        try {
            localStorage.removeItem(key);
            console.log(`✅ Removed: ${key}`);
            removedCount++;
        } catch (error) {
            console.error(`❌ Failed to remove ${key}:`, error);
        }
    });
    
    console.log(`🎉 Cleanup completed! Removed ${removedCount} keys.`);
    
    // Verify cleanup
    const remainingOldKeys = Object.keys(localStorage).filter(key => key.startsWith('portalpro-'));
    const newKeys = Object.keys(localStorage).filter(key => key.startsWith('app-'));
    
    console.log(`📊 Final status:`);
    console.log(`  Old keys remaining: ${remainingOldKeys.length}`);
    console.log(`  New keys: ${newKeys.length}`);
    
    if (remainingOldKeys.length > 0) {
        console.warn('⚠️ Some old keys still remain:', remainingOldKeys);
    } else {
        console.log('✅ All old keys successfully removed!');
    }
    
    return {
        removedCount,
        remainingOldKeys: remainingOldKeys.length,
        newKeys: newKeys.length
    };
})();