import { Company } from '@/types/company.types'

export class CompanyMigrationService {
  private static readonly MIGRATION_KEY = 'companies-migrated-to-db'
  private static readonly LOCALSTORAGE_KEY = 'app-companies'

  /**
   * Check if companies have already been migrated from localStorage to database
   */
  static hasMigrated(): boolean {
    if (typeof window === 'undefined') return true // SSR context
    return localStorage.getItem(this.MIGRATION_KEY) === 'true'
  }

  /**
   * Mark migration as completed
   */
  private static markMigrationComplete(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.MIGRATION_KEY, 'true')
    }
  }

  /**
   * Get companies from localStorage
   */
  private static getLocalStorageCompanies(): Company[] {
    if (typeof window === 'undefined') return []
    
    try {
      const savedCompanies = localStorage.getItem(this.LOCALSTORAGE_KEY)
      if (savedCompanies) {
        return JSON.parse(savedCompanies) as Company[]
      }
    } catch (error) {
      console.error('Error reading companies from localStorage:', error)
    }
    return []
  }

  /**
   * Migrate companies from localStorage to database via API
   * This is a one-time operation that should run on app startup
   */
  static async migrateFromLocalStorage(): Promise<{ 
    migrated: number
    skipped: number 
    errors: string[]
  }> {
    const result = {
      migrated: 0,
      skipped: 0,
      errors: [] as string[]
    }

    try {
      // Skip if already migrated
      if (this.hasMigrated()) {
        return result
      }

      // Get companies from localStorage
      const localCompanies = this.getLocalStorageCompanies()
      
      if (localCompanies.length === 0) {
        this.markMigrationComplete()
        return result
      }


      // Call migration API endpoint
      const response = await fetch('/api/migration/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companies: localCompanies }),
      })

      if (!response.ok) {
        throw new Error(`Migration API failed: ${response.status} ${response.statusText}`)
      }

      const migrationResult = await response.json()
      
      if (migrationResult.success) {
        // Mark migration as complete
        this.markMigrationComplete()
        return migrationResult.result
      } else {
        throw new Error(migrationResult.error || 'Migration failed')
      }

    } catch (error) {
      const errorMsg = `Critical migration error: ${error}`
      console.error(errorMsg)
      result.errors.push(errorMsg)
    }

    return result
  }

  /**
   * Clear localStorage companies after successful migration
   * WARNING: Only call this after confirming database has the data
   */
  static clearLocalStorageData(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(this.LOCALSTORAGE_KEY)
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  }

  /**
   * Run migration and optionally clear localStorage
   */
  static async runMigration(clearLocalStorageAfter: boolean = false): Promise<boolean> {
    try {
      const result = await this.migrateFromLocalStorage()
      
      if (result.errors.length === 0) {
        
        if (clearLocalStorageAfter) {
          this.clearLocalStorageData()
        }
        
        return true
      } else {
        console.error('❌ Company migration completed with errors:', result.errors)
        return false
      }
    } catch (error) {
      console.error('❌ Company migration failed:', error)
      return false
    }
  }
}