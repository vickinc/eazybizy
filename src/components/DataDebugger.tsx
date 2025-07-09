"use client";

import { useEffect, useState } from 'react';
import { StorageMigrationService } from '@/services/migration/storageMigrationService';

export function DataDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const checkData = () => {
      const allKeys = Object.keys(localStorage);
      const oldKeys = allKeys.filter(key => key.startsWith('portalpro-'));
      const newKeys = allKeys.filter(key => key.startsWith('app-'));
      const migrationVersion = localStorage.getItem('app-migration-version');
      
      const info = {
        migrationVersion,
        oldKeys: oldKeys.length,
        newKeys: newKeys.length,
        oldKeysList: oldKeys,
        newKeysList: newKeys,
        migrationStatus: StorageMigrationService.getMigrationStatus()
      };
      
      setDebugInfo(info);
    };

    // Check immediately
    checkData();
    
    // Check again after a short delay to see if migration ran
    const timeout = setTimeout(checkData, 1000);
    
    // Listen for storage changes (including cleanup events)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'migration-cleanup' || e.key?.startsWith('portalpro-') || e.key?.startsWith('app-')) {
        setTimeout(checkData, 100); // Small delay to ensure storage is updated
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleCleanup = () => {
    try {
      StorageMigrationService.forceCleanupOldKeys();
      
      // Force multiple refreshes to ensure the UI updates
      const refreshData = () => {
        const allKeys = Object.keys(localStorage);
        const oldKeys = allKeys.filter(key => key.startsWith('portalpro-'));
        const newKeys = allKeys.filter(key => key.startsWith('app-'));
        const migrationVersion = localStorage.getItem('app-migration-version');
        
        const info = {
          migrationVersion,
          oldKeys: oldKeys.length,
          newKeys: newKeys.length,
          oldKeysList: oldKeys,
          newKeysList: newKeys,
          migrationStatus: StorageMigrationService.getMigrationStatus()
        };
        
        setDebugInfo(info);
        
        return info;
      };
      
      // Refresh immediately
      const info1 = refreshData();
      
      // Refresh again after a short delay to catch any async operations
      setTimeout(() => {
        const info2 = refreshData();
        
        // If still showing old keys, try one more aggressive cleanup
        if (info2.oldKeys > 0) {
          console.warn('Old keys still present after cleanup, trying manual removal...');
          const allKeys = Object.keys(localStorage);
          const remainingOldKeys = allKeys.filter(key => key.startsWith('portalpro-'));
          
          remainingOldKeys.forEach(key => {
            localStorage.removeItem(key);
          });
          
          // Final refresh
          setTimeout(refreshData, 100);
        }
      }, 200);
      
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!debugInfo) {
    return null;
  }

  // Hide when migration is complete (no old keys remaining)
  if (debugInfo.migrationVersion === '1.0.0' && debugInfo.oldKeys === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#1a1a1a',
      color: '#fff',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px',
      border: '1px solid #333'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔍 Data Debug</div>
      <div>Migration: {debugInfo.migrationVersion || 'NOT SET'}</div>
      <div>Old Keys: {debugInfo.oldKeys}</div>
      <div>New Keys: {debugInfo.newKeys}</div>
      {debugInfo.oldKeys > 0 && debugInfo.migrationVersion === '1.0.0' && (
        <div>
          <div style={{ color: '#ff6b6b', marginTop: '5px' }}>
            ⚠️ Old keys found - cleanup needed
          </div>
          <button 
            onClick={handleCleanup}
            style={{
              background: '#ff6b6b',
              color: '#fff',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer',
              marginTop: '5px'
            }}
          >
            🧹 Cleanup Now
          </button>
        </div>
      )}
      {debugInfo.oldKeys > 0 && debugInfo.migrationVersion !== '1.0.0' && (
        <div style={{ color: '#ff6b6b', marginTop: '5px' }}>
          ⚠️ Old keys found - migration needed
        </div>
      )}
      {debugInfo.newKeys === 0 && debugInfo.oldKeys === 0 && (
        <div style={{ color: '#ff6b6b', marginTop: '5px' }}>
          ❌ No data found
        </div>
      )}
      {debugInfo.oldKeys === 0 && debugInfo.newKeys > 0 && (
        <div style={{ color: '#4ade80', marginTop: '5px' }}>
          ✅ Migration complete
        </div>
      )}
    </div>
  );
}