#!/usr/bin/env node

/**
 * Data Migration Script: localStorage to PostgreSQL Database
 * 
 * This script migrates initial balance data from localStorage to the database.
 * It should be run once after deploying the new balance architecture.
 * 
 * Usage:
 *   node scripts/migrate-balance-data.js
 * 
 * Requirements:
 *   - Prisma client must be available
 *   - Database connection must be configured
 *   - User must provide localStorage data JSON
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Sample localStorage data structure for reference
const SAMPLE_DATA = {
  "app-initial-balances": [
    {
      "id": "ib_1234567890",
      "accountId": "acc_bank_123",
      "accountType": "bank",
      "amount": 5000.00,
      "currency": "USD",
      "companyId": 1,
      "notes": "Opening balance for main checking account",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
};

async function migrateBalanceData() {
  console.log('🚀 Starting balance data migration...');
  
  try {
    // Check if migration data file exists
    const migrationDataPath = path.join(process.cwd(), 'migration-data', 'localStorage-balances.json');
    
    if (!fs.existsSync(migrationDataPath)) {
      console.log('📋 Creating sample migration data file...');
      
      // Create migration-data directory if it doesn't exist
      const migrationDir = path.dirname(migrationDataPath);
      if (!fs.existsSync(migrationDir)) {
        fs.mkdirSync(migrationDir, { recursive: true });
      }
      
      // Write sample data
      fs.writeFileSync(migrationDataPath, JSON.stringify(SAMPLE_DATA, null, 2));
      
      console.log(`✅ Sample data file created at: ${migrationDataPath}`);
      console.log('📝 Please replace the sample data with your actual localStorage data');
      console.log('💡 You can export localStorage data from the browser console with:');
      console.log('   JSON.stringify({ "app-initial-balances": JSON.parse(localStorage.getItem("app-initial-balances") || "[]") }, null, 2)');
      
      return;
    }
    
    console.log('📖 Reading migration data...');
    const rawData = fs.readFileSync(migrationDataPath, 'utf8');
    const migrationData = JSON.parse(rawData);
    
    const initialBalances = migrationData['app-initial-balances'] || [];
    
    if (initialBalances.length === 0) {
      console.log('⚠️  No initial balances found in migration data');
      return;
    }
    
    console.log(`📊 Found ${initialBalances.length} initial balance records to migrate`);
    
    // Validate data structure
    for (const balance of initialBalances) {
      if (!balance.accountId || !balance.accountType || balance.amount === undefined || !balance.currency || !balance.companyId) {
        console.error('❌ Invalid balance record:', balance);
        throw new Error('Migration data contains invalid records. Please check the data format.');
      }
    }
    
    console.log('✅ Data validation passed');
    
    // Check for existing data
    const existingCount = await prisma.initialBalance.count();
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing initial balance records in the database`);
      console.log('🤔 Do you want to proceed? This will update existing records or create new ones.');
      
      // In a real scenario, you might want to prompt for user confirmation
      // For now, we'll continue with upsert operations
    }
    
    let migratedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    console.log('🔄 Starting migration process...');
    
    for (const balance of initialBalances) {
      try {
        // Check if record already exists
        const existing = await prisma.initialBalance.findFirst({
          where: {
            accountId: balance.accountId,
            accountType: balance.accountType
          }
        });
        
        if (existing) {
          // Update existing record
          await prisma.initialBalance.update({
            where: { id: existing.id },
            data: {
              amount: balance.amount,
              currency: balance.currency,
              notes: balance.notes,
              updatedAt: new Date()
            }
          });
          updatedCount++;
          console.log(`✏️  Updated: ${balance.accountType} account ${balance.accountId}`);
        } else {
          // Create new record
          await prisma.initialBalance.create({
            data: {
              accountId: balance.accountId,
              accountType: balance.accountType,
              amount: balance.amount,
              currency: balance.currency,
              companyId: balance.companyId,
              notes: balance.notes || null
            }
          });
          migratedCount++;
          console.log(`➕ Created: ${balance.accountType} account ${balance.accountId}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${balance.accountType} account ${balance.accountId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} records`);
    console.log(`✏️  Successfully updated: ${updatedCount} records`);
    console.log(`❌ Errors encountered: ${errorCount} records`);
    console.log(`📊 Total processed: ${migratedCount + updatedCount + errorCount} records`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      
      // Optionally, create a backup file with timestamp
      const backupPath = path.join(path.dirname(migrationDataPath), `localStorage-balances-backup-${new Date().toISOString().split('T')[0]}.json`);
      fs.copyFileSync(migrationDataPath, backupPath);
      console.log(`💾 Backup created at: ${backupPath}`);
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the error messages above.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Utility function to validate company exists
async function validateCompanyExists(companyId) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    return !!company;
  } catch (error) {
    return false;
  }
}

// Main execution
if (require.main === module) {
  migrateBalanceData()
    .then(() => {
      console.log('✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  migrateBalanceData,
  SAMPLE_DATA
};