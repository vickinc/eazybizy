import { prisma } from '@/lib/prisma'
import { BookkeepingStorageService } from '@/services/storage/bookkeepingStorageService'

/**
 * Migration script to move bookkeeping data from localStorage to database
 * This should be run once after setting up the database
 */
export class BookkeepingDataMigration {
  private migrationStats = {
    entriesMigrated: 0,
    accountsMigrated: 0,
    transactionsMigrated: 0,
    errors: [] as string[],
  }

  async migrateAll(): Promise<typeof this.migrationStats> {
    console.log('🚀 Starting bookkeeping data migration...')
    
    try {
      // Step 1: Migrate company accounts first (needed for entries)
      await this.migrateCompanyAccounts()
      
      // Step 2: Migrate bookkeeping entries
      await this.migrateBookkeepingEntries()
      
      // Step 3: Migrate transactions (optional, may not exist in localStorage)
      await this.migrateTransactions()
      
      console.log('✅ Migration completed successfully!')
      console.log(`📊 Stats:`, this.migrationStats)
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      this.migrationStats.errors.push(`Migration failed: ${error}`)
      throw error
    }
    
    return this.migrationStats
  }

  private async migrateCompanyAccounts(): Promise<void> {
    console.log('📦 Migrating company accounts...')
    
    try {
      // Get accounts from localStorage
      const localAccounts = BookkeepingStorageService.getAccounts()
      
      for (const account of localAccounts) {
        try {
          // Check if account already exists
          const existingAccount = await prisma.companyAccount.findFirst({
            where: {
              companyId: account.companyId,
              type: account.type as any,
              name: account.name,
            },
          })
          
          if (!existingAccount) {
            await prisma.companyAccount.create({
              data: {
                id: account.id,
                companyId: account.companyId,
                type: account.type as any,
                name: account.name,
                accountNumber: account.accountNumber,
                currency: account.currency,
                startingBalance: account.startingBalance || 0,
                currentBalance: account.currentBalance || 0,
                isActive: true,
                createdAt: new Date(account.createdAt),
                updatedAt: new Date(account.updatedAt),
              },
            })
            
            this.migrationStats.accountsMigrated++
            console.log(`✅ Migrated account: ${account.name}`)
          } else {
            console.log(`⏭️  Account already exists: ${account.name}`)
          }
        } catch (error) {
          const errorMsg = `Failed to migrate account ${account.name}: ${error}`
          console.error(`❌ ${errorMsg}`)
          this.migrationStats.errors.push(errorMsg)
        }
      }
      
      console.log(`📦 Accounts migration complete: ${this.migrationStats.accountsMigrated} accounts migrated`)
    } catch (error) {
      console.error('❌ Error accessing localStorage accounts:', error)
      throw error
    }
  }

  private async migrateBookkeepingEntries(): Promise<void> {
    console.log('📝 Migrating bookkeeping entries...')
    
    try {
      // Get entries from localStorage
      const localEntries = BookkeepingStorageService.getEntries()
      
      for (const entry of localEntries) {
        try {
          // Check if entry already exists
          const existingEntry = await prisma.bookkeepingEntry.findUnique({
            where: { id: entry.id },
          })
          
          if (!existingEntry) {
            await prisma.bookkeepingEntry.create({
              data: {
                id: entry.id,
                companyId: entry.companyId,
                type: entry.type === 'income' ? 'INCOME' : 'EXPENSE',
                category: entry.category,
                subcategory: entry.subcategory || '',
                description: entry.description,
                amount: entry.amount,
                currency: entry.currency,
                date: new Date(entry.date),
                reference: entry.reference || '',
                notes: entry.notes || '',
                accountId: entry.accountId || null,
                accountType: entry.accountType ? (entry.accountType.toUpperCase() as any) : null,
                cogs: entry.cogs || 0,
                cogsPaid: entry.cogsPaid || 0,
                createdAt: new Date(entry.createdAt || Date.now()),
                updatedAt: new Date(entry.updatedAt || Date.now()),
              },
            })
            
            this.migrationStats.entriesMigrated++
            console.log(`✅ Migrated entry: ${entry.description} (${entry.amount} ${entry.currency})`)
          } else {
            console.log(`⏭️  Entry already exists: ${entry.description}`)
          }
        } catch (error) {
          const errorMsg = `Failed to migrate entry ${entry.description}: ${error}`
          console.error(`❌ ${errorMsg}`)
          this.migrationStats.errors.push(errorMsg)
        }
      }
      
      console.log(`📝 Entries migration complete: ${this.migrationStats.entriesMigrated} entries migrated`)
    } catch (error) {
      console.error('❌ Error accessing localStorage entries:', error)
      throw error
    }
  }

  private async migrateTransactions(): Promise<void> {
    console.log('💳 Migrating transactions...')
    
    try {
      // Check if transactions exist in localStorage
      const localTransactions = this.getLocalStorageTransactions()
      
      if (!localTransactions || localTransactions.length === 0) {
        console.log('📝 No transactions found in localStorage')
        return
      }
      
      for (const transaction of localTransactions) {
        try {
          // Check if transaction already exists
          const existingTransaction = await prisma.transaction.findUnique({
            where: { id: transaction.id },
          })
          
          if (!existingTransaction) {
            await prisma.transaction.create({
              data: {
                id: transaction.id,
                companyId: transaction.companyId,
                date: new Date(transaction.date),
                paidBy: transaction.paidBy,
                paidTo: transaction.paidTo,
                netAmount: transaction.netAmount,
                incomingAmount: transaction.incomingAmount || null,
                outgoingAmount: transaction.outgoingAmount || null,
                currency: transaction.currency,
                baseCurrency: transaction.baseCurrency || transaction.currency,
                baseCurrencyAmount: transaction.baseCurrencyAmount || transaction.netAmount,
                accountId: transaction.accountId,
                accountType: transaction.accountType as any,
                reference: transaction.reference || '',
                category: transaction.category || '',
                description: transaction.description || '',
                notes: transaction.notes || '',
                linkedEntryId: transaction.linkedEntryId || null,
                linkedEntryType: transaction.linkedEntryType as any || null,
                createdAt: new Date(transaction.createdAt || Date.now()),
                updatedAt: new Date(transaction.updatedAt || Date.now()),
              },
            })
            
            this.migrationStats.transactionsMigrated++
            console.log(`✅ Migrated transaction: ${transaction.description}`)
          } else {
            console.log(`⏭️  Transaction already exists: ${transaction.description}`)
          }
        } catch (error) {
          const errorMsg = `Failed to migrate transaction ${transaction.description}: ${error}`
          console.error(`❌ ${errorMsg}`)
          this.migrationStats.errors.push(errorMsg)
        }
      }
      
      console.log(`💳 Transactions migration complete: ${this.migrationStats.transactionsMigrated} transactions migrated`)
    } catch (error) {
      console.error('❌ Error accessing localStorage transactions:', error)
      // Don't throw here as transactions might not exist
    }
  }

  private getLocalStorageTransactions(): any[] {
    try {
      if (typeof window === 'undefined') return []
      
      const data = localStorage.getItem('app_transactions')
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.warn('Could not access localStorage transactions:', error)
      return []
    }
  }

  async validateMigration(): Promise<boolean> {
    console.log('🔍 Validating migration...')
    
    try {
      // Count records in database
      const [entriesCount, accountsCount, transactionsCount] = await Promise.all([
        prisma.bookkeepingEntry.count(),
        prisma.companyAccount.count(),
        prisma.transaction.count(),
      ])
      
      console.log(`📊 Database counts:`)
      console.log(`  - Entries: ${entriesCount}`)
      console.log(`  - Accounts: ${accountsCount}`)
      console.log(`  - Transactions: ${transactionsCount}`)
      
      // Check if migration was successful
      const hasData = entriesCount > 0 || accountsCount > 0
      
      if (hasData) {
        console.log('✅ Migration validation successful - data found in database')
        return true
      } else {
        console.log('⚠️  Migration validation warning - no data found in database')
        return false
      }
    } catch (error) {
      console.error('❌ Migration validation failed:', error)
      return false
    }
  }

  async clearLocalStorageData(): Promise<void> {
    console.log('🧹 Clearing localStorage data...')
    
    try {
      if (typeof window === 'undefined') {
        console.log('⏭️  Not in browser environment, skipping localStorage cleanup')
        return
      }
      
      // Clear bookkeeping data from localStorage
      const keysToRemove = [
        'app_bookkeeping_entries',
        'app_company_accounts',
        'app_transactions',
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️  Cleared: ${key}`)
      })
      
      console.log('✅ localStorage cleanup complete')
    } catch (error) {
      console.error('❌ Error cleaning localStorage:', error)
      throw error
    }
  }
}

// Helper function for manual migration
export async function runBookkeepingMigration(): Promise<void> {
  const migration = new BookkeepingDataMigration()
  
  console.log('🔄 Starting manual bookkeeping migration...')
  
  try {
    const stats = await migration.migrateAll()
    
    if (stats.errors.length > 0) {
      console.warn('⚠️  Migration completed with errors:')
      stats.errors.forEach(error => console.warn(`  - ${error}`))
    }
    
    // Validate migration
    const isValid = await migration.validateMigration()
    
    if (isValid) {
      console.log('🎉 Migration completed successfully!')
      
      // Ask user if they want to clear localStorage
      const shouldClear = confirm(
        'Migration completed! Would you like to clear the old localStorage data?'
      )
      
      if (shouldClear) {
        await migration.clearLocalStorageData()
        console.log('🧹 Old data cleared!')
      }
    } else {
      console.error('❌ Migration validation failed')
    }
  } catch (error) {
    console.error('💥 Migration failed:', error)
    throw error
  }
}