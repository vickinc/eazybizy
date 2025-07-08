import { prisma } from '@/lib/prisma'

/**
 * Migration script to move transaction data from localStorage to database
 * This should be run once after setting up the database and transaction schema
 */
export class TransactionDataMigration {
  private migrationStats = {
    transactionsMigrated: 0,
    bankAccountsMigrated: 0,
    digitalWalletsMigrated: 0,
    errors: [] as string[],
  }

  async migrateAll(): Promise<typeof this.migrationStats> {
    console.log('🚀 Starting transaction data migration...')
    
    try {
      // Step 1: Migrate bank accounts first (needed for transactions)
      await this.migrateBankAccounts()
      
      // Step 2: Migrate digital wallets
      await this.migrateDigitalWallets()
      
      // Step 3: Migrate transactions
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

  private async migrateBankAccounts(): Promise<void> {
    console.log('🏦 Migrating bank accounts...')
    
    try {
      const localBankAccounts = this.getLocalStorageBankAccounts()
      
      for (const account of localBankAccounts) {
        try {
          // Check if account already exists
          const existingAccount = await prisma.bankAccount.findFirst({
            where: {
              companyId: account.companyId,
              iban: account.iban,
              accountNumber: account.accountNumber,
            },
          })
          
          if (!existingAccount) {
            await prisma.bankAccount.create({
              data: {
                id: account.id,
                companyId: account.companyId,
                bankName: account.bankName,
                bankAddress: account.bankAddress,
                currency: account.currency,
                iban: account.iban,
                swiftCode: account.swiftCode,
                accountNumber: account.accountNumber,
                accountName: account.accountName,
                isActive: account.isActive ?? true,
                notes: account.notes,
                createdAt: new Date(account.createdAt || Date.now()),
                updatedAt: new Date(account.updatedAt || Date.now()),
              },
            })
            
            this.migrationStats.bankAccountsMigrated++
            console.log(`✅ Migrated bank account: ${account.accountName}`)
          } else {
            console.log(`⏭️  Bank account already exists: ${account.accountName}`)
          }
        } catch (error) {
          const errorMsg = `Failed to migrate bank account ${account.accountName}: ${error}`
          console.error(`❌ ${errorMsg}`)
          this.migrationStats.errors.push(errorMsg)
        }
      }
      
      console.log(`🏦 Bank accounts migration complete: ${this.migrationStats.bankAccountsMigrated} accounts migrated`)
    } catch (error) {
      console.error('❌ Error accessing localStorage bank accounts:', error)
      throw error
    }
  }

  private async migrateDigitalWallets(): Promise<void> {
    console.log('💳 Migrating digital wallets...')
    
    try {
      const localWallets = this.getLocalStorageDigitalWallets()
      
      for (const wallet of localWallets) {
        try {
          // Check if wallet already exists
          const existingWallet = await prisma.digitalWallet.findFirst({
            where: {
              companyId: wallet.companyId,
              walletAddress: wallet.walletAddress,
            },
          })
          
          if (!existingWallet) {
            await prisma.digitalWallet.create({
              data: {
                id: wallet.id,
                companyId: wallet.companyId,
                walletType: this.mapWalletType(wallet.walletType),
                walletName: wallet.walletName,
                walletAddress: wallet.walletAddress,
                currency: wallet.currency,
                currencies: wallet.currencies || [],
                description: wallet.description || '',
                blockchain: wallet.blockchain,
                isActive: wallet.isActive ?? true,
                notes: wallet.notes,
                createdAt: new Date(wallet.createdAt || Date.now()),
                updatedAt: new Date(wallet.updatedAt || Date.now()),
              },
            })
            
            this.migrationStats.digitalWalletsMigrated++
            console.log(`✅ Migrated digital wallet: ${wallet.walletName}`)
          } else {
            console.log(`⏭️  Digital wallet already exists: ${wallet.walletName}`)
          }
        } catch (error) {
          const errorMsg = `Failed to migrate digital wallet ${wallet.walletName}: ${error}`
          console.error(`❌ ${errorMsg}`)
          this.migrationStats.errors.push(errorMsg)
        }
      }
      
      console.log(`💳 Digital wallets migration complete: ${this.migrationStats.digitalWalletsMigrated} wallets migrated`)
    } catch (error) {
      console.error('❌ Error accessing localStorage digital wallets:', error)
      throw error
    }
  }

  private async migrateTransactions(): Promise<void> {
    console.log('💰 Migrating transactions...')
    
    try {
      const localTransactions = this.getLocalStorageTransactions()
      
      for (const transaction of localTransactions) {
        try {
          // Check if transaction already exists
          const existingTransaction = await prisma.transaction.findUnique({
            where: { id: transaction.id },
          })
          
          if (!existingTransaction) {
            // Map localStorage transaction to Prisma transaction
            const mappedTransaction = await this.mapTransactionData(transaction)
            
            await prisma.transaction.create({
              data: mappedTransaction,
            })
            
            this.migrationStats.transactionsMigrated++
            console.log(`✅ Migrated transaction: ${transaction.paidBy} → ${transaction.paidTo} (${transaction.netAmount} ${transaction.currency})`)
          } else {
            console.log(`⏭️  Transaction already exists: ${transaction.paidBy} → ${transaction.paidTo}`)
          }
        } catch (error) {
          const errorMsg = `Failed to migrate transaction ${transaction.id}: ${error}`
          console.error(`❌ ${errorMsg}`)
          this.migrationStats.errors.push(errorMsg)
        }
      }
      
      console.log(`💰 Transactions migration complete: ${this.migrationStats.transactionsMigrated} transactions migrated`)
    } catch (error) {
      console.error('❌ Error accessing localStorage transactions:', error)
      throw error
    }
  }

  private async mapTransactionData(localTransaction: any): Promise<any> {
    // Convert localStorage transaction format to Prisma format
    const mappedData = {
      id: localTransaction.id,
      companyId: localTransaction.companyId,
      date: new Date(localTransaction.date),
      paidBy: localTransaction.paidBy,
      paidTo: localTransaction.paidTo,
      netAmount: parseFloat(localTransaction.netAmount.toString()),
      incomingAmount: localTransaction.incomingAmount ? parseFloat(localTransaction.incomingAmount.toString()) : null,
      outgoingAmount: localTransaction.outgoingAmount ? parseFloat(localTransaction.outgoingAmount.toString()) : null,
      currency: localTransaction.currency,
      baseCurrency: localTransaction.baseCurrency || localTransaction.currency,
      baseCurrencyAmount: localTransaction.baseCurrencyAmount ? parseFloat(localTransaction.baseCurrencyAmount.toString()) : parseFloat(localTransaction.netAmount.toString()),
      exchangeRate: localTransaction.exchangeRate ? parseFloat(localTransaction.exchangeRate.toString()) : null,
      accountId: localTransaction.accountId,
      accountType: this.mapAccountType(localTransaction.accountType),
      reference: localTransaction.reference || null,
      category: localTransaction.category || null,
      subcategory: localTransaction.subcategory || null,
      description: localTransaction.description || null,
      notes: localTransaction.notes || null,
      tags: localTransaction.tags || [],
      
      // Map status fields with defaults
      status: this.mapTransactionStatus(localTransaction.status),
      reconciliationStatus: this.mapReconciliationStatus(localTransaction.reconciliationStatus),
      approvalStatus: this.mapApprovalStatus(localTransaction.approvalStatus),
      
      // Handle optional fields
      statementDate: localTransaction.statementDate ? new Date(localTransaction.statementDate) : null,
      statementReference: localTransaction.statementReference || null,
      isRecurring: localTransaction.isRecurring || false,
      recurringPattern: localTransaction.recurringPattern || null,
      parentTransactionId: localTransaction.parentTransactionId || null,
      
      // Handle linked entry
      linkedEntryId: localTransaction.linkedEntryId || null,
      linkedEntryType: localTransaction.linkedEntryType ? (localTransaction.linkedEntryType.toUpperCase() as any) : null,
      
      // Audit fields
      isDeleted: localTransaction.isDeleted || false,
      deletedAt: localTransaction.deletedAt ? new Date(localTransaction.deletedAt) : null,
      deletedBy: localTransaction.deletedBy || null,
      createdBy: localTransaction.createdBy || null,
      updatedBy: localTransaction.updatedBy || null,
      createdAt: new Date(localTransaction.createdAt || Date.now()),
      updatedAt: new Date(localTransaction.updatedAt || Date.now()),
    }

    // Handle approval fields
    if (localTransaction.approvedBy) {
      mappedData['approvedBy'] = localTransaction.approvedBy
    }
    if (localTransaction.approvedAt) {
      mappedData['approvedAt'] = new Date(localTransaction.approvedAt)
    }

    return mappedData
  }

  private mapAccountType(accountType: string): string {
    const mappings: { [key: string]: string } = {
      'bank': 'BANK',
      'wallet': 'WALLET',
      'cash': 'CASH',
      'credit_card': 'CREDIT_CARD',
      'creditcard': 'CREDIT_CARD',
    }
    return mappings[accountType?.toLowerCase()] || 'BANK'
  }

  private mapWalletType(walletType: string): string {
    const mappings: { [key: string]: string } = {
      'paypal': 'PAYPAL',
      'stripe': 'STRIPE',
      'wise': 'WISE',
      'crypto': 'CRYPTO',
      'cryptocurrency': 'CRYPTO',
      'bitcoin': 'CRYPTO',
      'ethereum': 'CRYPTO',
    }
    return mappings[walletType?.toLowerCase()] || 'OTHER'
  }

  private mapTransactionStatus(status: string): string {
    const mappings: { [key: string]: string } = {
      'pending': 'PENDING',
      'cleared': 'CLEARED',
      'completed': 'CLEARED',
      'failed': 'FAILED',
      'cancelled': 'CANCELLED',
      'canceled': 'CANCELLED',
    }
    return mappings[status?.toLowerCase()] || 'CLEARED'
  }

  private mapReconciliationStatus(status: string): string {
    const mappings: { [key: string]: string } = {
      'unreconciled': 'UNRECONCILED',
      'reconciled': 'RECONCILED',
      'disputed': 'DISPUTED',
      'pending': 'UNRECONCILED',
    }
    return mappings[status?.toLowerCase()] || 'UNRECONCILED'
  }

  private mapApprovalStatus(status: string): string {
    const mappings: { [key: string]: string } = {
      'pending': 'PENDING',
      'approved': 'APPROVED',
      'rejected': 'REJECTED',
    }
    return mappings[status?.toLowerCase()] || 'APPROVED'
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

  private getLocalStorageBankAccounts(): any[] {
    try {
      if (typeof window === 'undefined') return []
      
      const data = localStorage.getItem('app_bank_accounts')
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.warn('Could not access localStorage bank accounts:', error)
      return []
    }
  }

  private getLocalStorageDigitalWallets(): any[] {
    try {
      if (typeof window === 'undefined') return []
      
      const data = localStorage.getItem('app_digital_wallets')
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.warn('Could not access localStorage digital wallets:', error)
      return []
    }
  }

  async validateMigration(): Promise<boolean> {
    console.log('🔍 Validating transaction migration...')
    
    try {
      // Count records in database
      const [transactionsCount, bankAccountsCount, digitalWalletsCount] = await Promise.all([
        prisma.transaction.count(),
        prisma.bankAccount.count(),
        prisma.digitalWallet.count(),
      ])
      
      console.log(`📊 Database counts:`)
      console.log(`  - Transactions: ${transactionsCount}`)
      console.log(`  - Bank Accounts: ${bankAccountsCount}`)
      console.log(`  - Digital Wallets: ${digitalWalletsCount}`)
      
      // Check if migration was successful
      const hasData = transactionsCount > 0 || bankAccountsCount > 0 || digitalWalletsCount > 0
      
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
    console.log('🧹 Clearing localStorage transaction data...')
    
    try {
      if (typeof window === 'undefined') {
        console.log('⏭️  Not in browser environment, skipping localStorage cleanup')
        return
      }
      
      // Clear transaction-related data from localStorage
      const keysToRemove = [
        'app_transactions',
        'app_bank_accounts',
        'app_digital_wallets',
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

  // Utility method to get migration statistics without running migration
  async getLocalStorageStats(): Promise<{
    transactions: number
    bankAccounts: number
    digitalWallets: number
  }> {
    return {
      transactions: this.getLocalStorageTransactions().length,
      bankAccounts: this.getLocalStorageBankAccounts().length,
      digitalWallets: this.getLocalStorageDigitalWallets().length,
    }
  }
}

// Helper function for manual migration
export async function runTransactionMigration(): Promise<void> {
  const migration = new TransactionDataMigration()
  
  console.log('🔄 Starting manual transaction migration...')
  
  try {
    // Show what will be migrated
    const localStats = await migration.getLocalStorageStats()
    console.log('📊 Found in localStorage:')
    console.log(`  - Transactions: ${localStats.transactions}`)
    console.log(`  - Bank Accounts: ${localStats.bankAccounts}`)
    console.log(`  - Digital Wallets: ${localStats.digitalWallets}`)
    
    if (localStats.transactions === 0 && localStats.bankAccounts === 0 && localStats.digitalWallets === 0) {
      console.log('ℹ️  No data found in localStorage to migrate')
      return
    }
    
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
        'Transaction migration completed! Would you like to clear the old localStorage data?'
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