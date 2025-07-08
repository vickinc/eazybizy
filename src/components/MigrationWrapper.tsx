"use client";

import { useEffect } from 'react';
import { StorageMigrationService } from '@/services/migration/storageMigrationService';
import { CompanyMigrationService } from '@/services/migration/companyMigrationService';

export function MigrationWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const runMigration = async () => {
      try {
        // Run existing storage migrations
        await StorageMigrationService.runMigration();
        
        // Run company migration from localStorage to database
        console.log('Starting company migration...');
        const success = await CompanyMigrationService.runMigration(false); // Don't clear localStorage yet
        
        if (success) {
          console.log('✅ Company migration completed successfully');
        } else {
          console.warn('⚠️ Company migration completed with errors');
        }
      } catch (error) {
        console.error('❌ Migration failed:', error);
      }
    };

    runMigration();
  }, []);

  return <>{children}</>;
}