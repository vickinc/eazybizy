import { prisma } from '@/lib/prisma'

interface LocalStorageClient {
  id: string
  companyId?: number
  clientType: string
  name: string
  contactPersonName?: string
  contactPersonPosition?: string
  email: string
  phone?: string
  website?: string
  address?: string
  city?: string
  zipCode?: string
  country?: string
  industry?: string
  status: string
  notes?: string
  registrationNumber?: string
  vatNumber?: string
  passportNumber?: string
  dateOfBirth?: string
  totalInvoiced: number
  totalPaid: number
  lastInvoiceDate?: string
  createdAt: string
  updatedAt: string
}

interface LocalStorageInvoice {
  id: string
  clientName: string
  clientEmail: string
  totalAmount: number
  status: string
  fromCompanyId: number
  issueDate: string
  paidDate?: string
}

interface MigrationStats {
  clientsProcessed: number
  clientsCreated: number
  clientsUpdated: number
  clientsSkipped: number
  invoiceRelationsCreated: number
  errors: string[]
}

export class ClientMigrationService {
  private migrationStats: MigrationStats = {
    clientsProcessed: 0,
    clientsCreated: 0,
    clientsUpdated: 0,
    clientsSkipped: 0,
    invoiceRelationsCreated: 0,
    errors: []
  }

  // Migrate clients from localStorage to database
  async migrateClients(localStorageClients: LocalStorageClient[]): Promise<typeof this.migrationStats> {

    for (const localClient of localStorageClients) {
      try {
        this.migrationStats.clientsProcessed++

        // Check if client already exists in database
        const existingClient = await prisma.client.findFirst({
          where: {
            OR: [
              { id: localClient.id },
              { 
                email: localClient.email,
                companyId: localClient.companyId || null
              }
            ]
          }
        })

        if (existingClient) {
          // Update existing client with any new data
          await prisma.client.update({
            where: { id: existingClient.id },
            data: {
              name: localClient.name,
              contactPersonName: localClient.contactPersonName,
              contactPersonPosition: localClient.contactPersonPosition,
              phone: localClient.phone,
              website: localClient.website,
              address: localClient.address,
              city: localClient.city,
              zipCode: localClient.zipCode,
              country: localClient.country,
              industry: localClient.industry,
              status: this.mapClientStatus(localClient.status),
              notes: localClient.notes,
              registrationNumber: localClient.registrationNumber,
              vatNumber: localClient.vatNumber,
              passportNumber: localClient.passportNumber,
              dateOfBirth: localClient.dateOfBirth ? new Date(localClient.dateOfBirth) : null,
              totalInvoiced: localClient.totalInvoiced || 0,
              totalPaid: localClient.totalPaid || 0,
              lastInvoiceDate: localClient.lastInvoiceDate ? new Date(localClient.lastInvoiceDate) : null,
              updatedAt: new Date()
            }
          })
          this.migrationStats.clientsUpdated++
        } else {
          // Create new client
          await prisma.client.create({
            data: {
              id: localClient.id,
              companyId: localClient.companyId || null,
              clientType: localClient.clientType,
              name: localClient.name,
              contactPersonName: localClient.contactPersonName,
              contactPersonPosition: localClient.contactPersonPosition,
              email: localClient.email,
              phone: localClient.phone,
              website: localClient.website,
              address: localClient.address,
              city: localClient.city,
              zipCode: localClient.zipCode,
              country: localClient.country,
              industry: localClient.industry,
              status: this.mapClientStatus(localClient.status),
              notes: localClient.notes,
              registrationNumber: localClient.registrationNumber,
              vatNumber: localClient.vatNumber,
              passportNumber: localClient.passportNumber,
              dateOfBirth: localClient.dateOfBirth ? new Date(localClient.dateOfBirth) : null,
              totalInvoiced: localClient.totalInvoiced || 0,
              totalPaid: localClient.totalPaid || 0,
              lastInvoiceDate: localClient.lastInvoiceDate ? new Date(localClient.lastInvoiceDate) : null,
              createdAt: new Date(localClient.createdAt),
              updatedAt: new Date(localClient.updatedAt)
            }
          })
          this.migrationStats.clientsCreated++
        }

      } catch (error) {
        const errorMessage = `Error migrating client ${localClient.name}: ${error}`
        console.error(errorMessage)
        this.migrationStats.errors.push(errorMessage)
        this.migrationStats.clientsSkipped++
      }
    }

    return this.migrationStats
  }

  // Recalculate client totals from invoices
  async recalculateClientTotals(): Promise<void> {

    try {
      // Get all clients
      const clients = await prisma.client.findMany({
        select: { id: true, email: true }
      })

      for (const client of clients) {
        // Calculate totals from invoices
        const invoiceStats = await prisma.invoice.aggregate({
          where: {
            OR: [
              { clientId: client.id },
              { clientEmail: client.email }
            ]
          },
          _sum: {
            totalAmount: true
          },
          _count: true
        })

        const paidStats = await prisma.invoice.aggregate({
          where: {
            OR: [
              { clientId: client.id },
              { clientEmail: client.email }
            ],
            status: 'PAID'
          },
          _sum: {
            totalAmount: true
          }
        })

        const lastInvoice = await prisma.invoice.findFirst({
          where: {
            OR: [
              { clientId: client.id },
              { clientEmail: client.email }
            ]
          },
          orderBy: {
            issueDate: 'desc'
          },
          select: {
            issueDate: true
          }
        })

        // Update client with calculated totals
        await prisma.client.update({
          where: { id: client.id },
          data: {
            totalInvoiced: invoiceStats._sum.totalAmount || 0,
            totalPaid: paidStats._sum.totalAmount || 0,
            lastInvoiceDate: lastInvoice?.issueDate || null,
            updatedAt: new Date()
          }
        })
      }


    } catch (error) {
      console.error('Error recalculating client totals:', error)
      throw error
    }
  }

  // Map old client status to new enum values
  private mapClientStatus(oldStatus: string): 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' {
    switch (oldStatus.toLowerCase()) {
      case 'active':
        return 'ACTIVE'
      case 'inactive':
      case 'archived':
        return 'INACTIVE'
      case 'suspended':
      case 'lead':
        return 'SUSPENDED'
      default:
        return 'ACTIVE'
    }
  }

  // Migrate data from localStorage
  async migrateFromLocalStorage(): Promise<typeof this.migrationStats> {
    try {
      // This would run in a Node.js environment with access to the browser's localStorage
      // For actual migration, you'd export the localStorage data and import it here
      
      const clientsData = this.getLocalStorageData('app-clients')
      
      if (!clientsData || clientsData.length === 0) {
        return this.migrationStats
      }

      await this.migrateClients(clientsData)
      await this.recalculateClientTotals()


      return this.migrationStats

    } catch (error) {
      console.error('Error during client migration:', error)
      this.migrationStats.errors.push(`Migration failed: ${error}`)
      throw error
    }
  }

  // Helper to get localStorage data (would be implemented differently in actual migration)
  private getLocalStorageData(key: string): LocalStorageClient[] {
    // In actual migration, this would read from exported localStorage data
    // For now, return empty array as placeholder
    return []
  }

  // Validate migration results
  async validateMigration(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Check for clients without company associations
      const orphanClients = await prisma.client.count({
        where: { companyId: null }
      })
      if (orphanClients > 0) {
        issues.push(`${orphanClients} clients found without company associations`)
      }

      // Check for clients with invalid email formats
      const clients = await prisma.client.findMany({
        select: { id: true, email: true, name: true }
      })
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = clients.filter(client => !emailRegex.test(client.email))
      if (invalidEmails.length > 0) {
        issues.push(`${invalidEmails.length} clients have invalid email formats`)
      }

      // Check for duplicate emails within same company
      const duplicateEmails = await prisma.$queryRaw`
        SELECT company_id, email, COUNT(*) as count
        FROM clients
        WHERE company_id IS NOT NULL
        GROUP BY company_id, email
        HAVING COUNT(*) > 1
      `
      if (Array.isArray(duplicateEmails) && duplicateEmails.length > 0) {
        issues.push(`${duplicateEmails.length} duplicate email addresses found within companies`)
      }

      // Check client totals accuracy
      const clientsWithInvoices = await prisma.client.findMany({
        where: {
          totalInvoiced: { gt: 0 }
        },
        include: {
          _count: {
            select: { invoices: true }
          }
        }
      })
      
      const clientsWithoutInvoices = clientsWithInvoices.filter(client => client._count.invoices === 0)
      if (clientsWithoutInvoices.length > 0) {
        issues.push(`${clientsWithoutInvoices.length} clients have invoice totals but no invoice records`)
      }

      return {
        isValid: issues.length === 0,
        issues
      }

    } catch (error) {
      issues.push(`Validation error: ${error}`)
      return { isValid: false, issues }
    }
  }

  // Clean up migration artifacts
  async cleanup(): Promise<void> {
    try {
      // Remove any temporary migration data
      
      // Reset migration stats
      this.migrationStats = {
        clientsProcessed: 0,
        clientsCreated: 0,
        clientsUpdated: 0,
        clientsSkipped: 0,
        invoiceRelationsCreated: 0,
        errors: []
      }
      
    } catch (error) {
      console.error('Error during cleanup:', error)
      throw error
    }
  }

  // Get migration summary
  getMigrationSummary(): string {
    return `
Client Migration Summary:
========================
Clients Processed: ${this.migrationStats.clientsProcessed}
Clients Created: ${this.migrationStats.clientsCreated}
Clients Updated: ${this.migrationStats.clientsUpdated}
Clients Skipped: ${this.migrationStats.clientsSkipped}
Invoice Relations Created: ${this.migrationStats.invoiceRelationsCreated}
Errors: ${this.migrationStats.errors.length}

${this.migrationStats.errors.length > 0 ? 'Errors:\n' + this.migrationStats.errors.join('\n') : 'Migration completed successfully!'}
    `
  }
}

// Export singleton instance
export const clientMigrationService = new ClientMigrationService()

// Main migration function for CLI usage
export async function migrateAllClientData() {
  try {
    
    const migrationService = new ClientMigrationService()
    const stats = await migrationService.migrateFromLocalStorage()
    
    
    const validation = await migrationService.validateMigration()
    if (!validation.isValid) {
      console.warn('\nValidation Issues Found:')
      validation.issues.forEach(issue => console.warn('- ' + issue))
    } else {
    }
    
    await migrationService.cleanup()
    return stats
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Usage in browser environment to export localStorage data
export function exportClientDataForMigration(): string {
  if (typeof window === 'undefined') {
    throw new Error('This function can only be run in a browser environment')
  }
  
  const clientsData = localStorage.getItem('app-clients')
  const invoicesData = localStorage.getItem('app-invoices')
  
  const exportData = {
    clients: clientsData ? JSON.parse(clientsData) : [],
    invoices: invoicesData ? JSON.parse(invoicesData) : [],
    exportDate: new Date().toISOString(),
    version: '1.0'
  }
  
  return JSON.stringify(exportData, null, 2)
}