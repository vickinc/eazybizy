/**
 * PostgreSQL Data Import Script - Fixed Version
 * Imports data from exported JSON files into PostgreSQL database with proper handling
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const IMPORT_DIR = path.join(__dirname, '../migration-data');

// Import order (respecting dependencies)
const TABLE_IMPORT_ORDER = [
  'users',
  'companies', 
  'clients',
  'vendors',
  'products',
  'bank_accounts',
  'digital_wallets',
  'chart_of_accounts',
  'tax_treatments',
  'invoices',
  'invoice_items',
  'invoice_payment_sources',
  'bookkeeping_entries'
];

// Map SQLite table names to Prisma model names
const TABLE_TO_MODEL_MAP = {
  'users': 'user',
  'companies': 'company',
  'clients': 'client',
  'vendors': 'vendor',
  'products': 'product',
  'bank_accounts': 'bankAccount',
  'digital_wallets': 'digitalWallet',
  'chart_of_accounts': 'chartOfAccount',
  'tax_treatments': 'taxTreatment',
  'invoices': 'invoice',
  'invoice_items': 'invoiceItem',
  'invoice_payment_sources': 'invoicePaymentSource',
  'bookkeeping_entries': 'bookkeepingEntry'
};

// Company ID mapping (old SQLite ID -> new PostgreSQL ID)
const COMPANY_ID_MAP = {};

class PostgreSQLDataImporter {
  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    this.importStats = {};
    this.errors = [];
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('Connected to PostgreSQL database');
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  loadTableData(tableName) {
    const filePath = path.join(IMPORT_DIR, `${tableName}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  No data file found for ${tableName}, skipping...`);
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    } catch (error) {
      console.error(`Error reading ${tableName} data:`, error);
      return null;
    }
  }

  transformDataForPostgreSQL(tableName, data) {
    return data.map(record => {
      const transformed = { ...record };

      // Handle all field transformations
      Object.keys(transformed).forEach(key => {
        // Handle timestamp integers from SQLite (convert to Date objects)
        if (typeof transformed[key] === 'number' && transformed[key] > 1000000000000) {
          if (key.includes('Date') || key.includes('At') || key === 'date' || 
              key === 'timestamp' || key === 'time') {
            transformed[key] = new Date(transformed[key]);
          }
        }
        
        // Handle date strings
        if (transformed[key] && typeof transformed[key] === 'string') {
          if (key.includes('Date') || key.includes('At') || key === 'date' || 
              key === 'timestamp' || key === 'time') {
            try {
              const date = new Date(transformed[key]);
              if (!isNaN(date.getTime())) {
                transformed[key] = date;
              }
            } catch (e) {
              // Keep original value if date parsing fails
            }
          }
        }

        // Handle numeric fields
        if (typeof transformed[key] === 'string' && !isNaN(transformed[key]) && transformed[key] !== '') {
          if (key.includes('Amount') || key.includes('Price') || key.includes('Rate') || 
              key.includes('Balance') || key.includes('Total') || key.includes('Percent') ||
              key === 'subtotal' || key === 'taxAmount' || key === 'totalAmount' ||
              key === 'quantity' || key === 'unitPrice' || key === 'total' ||
              key === 'amount' || key === 'cogs' || key === 'cogsPaid' ||
              key === 'cost' || key === 'price' || key === 'startingBalance' ||
              key === 'currentBalance' || key === 'ownershipPercent') {
            transformed[key] = parseFloat(transformed[key]);
          }
        }

        // Convert empty strings to null for optional fields, or provide defaults for required fields
        if (transformed[key] === '') {
          // Handle required fields that cannot be null
          if (tableName === 'companies' && key === 'logo') {
            transformed[key] = '';
          } else if (tableName === 'clients' && key === 'phone') {
            transformed[key] = '';
          } else if (tableName === 'digital_wallets' && key === 'description') {
            transformed[key] = '';
          } else {
            transformed[key] = null;
          }
        }
        
        // Handle null values for required fields
        if (transformed[key] === null) {
          if (tableName === 'companies' && key === 'logo') {
            transformed[key] = '';
          } else if (tableName === 'clients' && (key === 'phone' || key === 'website')) {
            transformed[key] = '';
          } else if (tableName === 'digital_wallets' && key === 'description') {
            transformed[key] = '';
          } else if (tableName === 'invoice_items' && key === 'description') {
            transformed[key] = '';
          }
        }
      });

      // Handle special cases per table
      if (tableName === 'companies') {
        // Remove ID for autoincrement
        delete transformed.id;
      }

      if (tableName === 'products' && !transformed.description) {
        transformed.description = ''; // Required field
      }

      if (tableName === 'clients' && transformed.companyId) {
        const oldCompanyId = transformed.companyId;
        delete transformed.companyId;
        const newCompanyId = COMPANY_ID_MAP[oldCompanyId];
        if (newCompanyId) {
          transformed.company = { connect: { id: newCompanyId } };
        }
      }

      if (tableName === 'vendors' && transformed.companyId) {
        const oldCompanyId = transformed.companyId;
        delete transformed.companyId;
        const newCompanyId = COMPANY_ID_MAP[oldCompanyId];
        if (newCompanyId) {
          transformed.company = { connect: { id: newCompanyId } };
        }
      }

      if (tableName === 'products' && transformed.companyId) {
        const oldCompanyId = transformed.companyId;
        delete transformed.companyId;
        const newCompanyId = COMPANY_ID_MAP[oldCompanyId];
        if (newCompanyId) {
          transformed.company = { connect: { id: newCompanyId } };
        }
        // Handle vendor relationship
        if (transformed.vendorId) {
          transformed.vendor = { connect: { id: transformed.vendorId } };
          delete transformed.vendorId;
        } else {
          delete transformed.vendorId;
        }
      }

      if (tableName === 'bank_accounts' && transformed.companyId) {
        const oldCompanyId = transformed.companyId;
        delete transformed.companyId;
        const newCompanyId = COMPANY_ID_MAP[oldCompanyId];
        if (newCompanyId) {
          transformed.company = { connect: { id: newCompanyId } };
        }
      }

      if (tableName === 'digital_wallets' && transformed.companyId) {
        const oldCompanyId = transformed.companyId;
        delete transformed.companyId;
        const newCompanyId = COMPANY_ID_MAP[oldCompanyId];
        if (newCompanyId) {
          transformed.company = { connect: { id: newCompanyId } };
        }
      }

      if (tableName === 'invoices') {
        if (transformed.fromCompanyId) {
          const oldCompanyId = transformed.fromCompanyId;
          delete transformed.fromCompanyId;
          const newCompanyId = COMPANY_ID_MAP[oldCompanyId];
          if (newCompanyId) {
            transformed.company = { connect: { id: newCompanyId } };
          }
        }
        // Handle client relationship
        if (transformed.clientId) {
          transformed.client = { connect: { id: transformed.clientId } };
          delete transformed.clientId;
        }
      }

      if (tableName === 'bookkeeping_entries' && transformed.companyId) {
        const oldCompanyId = transformed.companyId;
        delete transformed.companyId;
        const newCompanyId = COMPANY_ID_MAP[oldCompanyId];
        if (newCompanyId) {
          transformed.company = { connect: { id: newCompanyId } };
        }
        // Handle invoice relationship
        if (transformed.invoiceId) {
          transformed.invoice = { connect: { id: transformed.invoiceId } };
          delete transformed.invoiceId;
        }
        // Handle account relationship (remove invalid foreign keys)
        delete transformed.accountId;
        // Handle chart of accounts relationship
        if (transformed.chartOfAccountsId) {
          transformed.chartOfAccount = { connect: { id: transformed.chartOfAccountsId } };
          delete transformed.chartOfAccountsId;
        }
        // Handle linked income relationship
        if (transformed.linkedIncomeId) {
          transformed.linkedIncome = { connect: { id: transformed.linkedIncomeId } };
          delete transformed.linkedIncomeId;
        }
      }

      if (tableName === 'chart_of_accounts' && transformed.companyId) {
        const oldCompanyId = transformed.companyId;
        delete transformed.companyId;
        const newCompanyId = COMPANY_ID_MAP[oldCompanyId];
        if (newCompanyId) {
          transformed.company = { connect: { id: newCompanyId } };
        }
      }

      if (tableName === 'tax_treatments' && transformed.companyId) {
        const oldCompanyId = transformed.companyId;
        delete transformed.companyId;
        const newCompanyId = COMPANY_ID_MAP[oldCompanyId];
        if (newCompanyId) {
          transformed.company = { connect: { id: newCompanyId } };
        }
      }

      if (tableName === 'invoice_items' && transformed.invoiceId) {
        transformed.invoice = { connect: { id: transformed.invoiceId } };
        delete transformed.invoiceId;
        // Handle product relationship
        if (transformed.productId) {
          transformed.product = { connect: { id: transformed.productId } };
          delete transformed.productId;
        }
      }

      if (tableName === 'invoice_payment_sources' && transformed.invoiceId) {
        transformed.invoice = { connect: { id: transformed.invoiceId } };
        delete transformed.invoiceId;
      }

      return transformed;
    });
  }

  async importTable(tableName) {
    const modelName = TABLE_TO_MODEL_MAP[tableName];
    if (!modelName) {
      console.log(`⚠️  No model mapping found for ${tableName}, skipping...`);
      return 0;
    }

    const data = this.loadTableData(tableName);
    if (!data || data.length === 0) {
      console.log(`⚠️  No data to import for ${tableName}`);
      return 0;
    }

    try {
      const transformedData = this.transformDataForPostgreSQL(tableName, data);
      let imported = 0;
      let skipped = 0;

      console.log(`\n📥 Importing ${transformedData.length} records into ${tableName}...`);

      for (const record of transformedData) {
        try {
          const result = await this.prisma[modelName].create({
            data: record
          });
          
          // Store company ID mapping for later use
          if (tableName === 'companies') {
            const originalId = data[imported].id; // Get original SQLite ID
            COMPANY_ID_MAP[originalId] = result.id;
            console.log(`   📝 Company mapping: ${originalId} -> ${result.id}`);
          }
          
          imported++;
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`   ⚠️  Skipping duplicate record in ${tableName}`);
            skipped++;
          } else {
            console.error(`   ❌ Error importing record in ${tableName}:`, error.message);
            this.errors.push({
              table: tableName,
              record,
              error: error.message
            });
          }
        }
      }

      this.importStats[tableName] = { imported, skipped, total: transformedData.length };
      console.log(`✅ ${tableName}: ${imported} imported, ${skipped} skipped`);
      
      return imported;
    } catch (error) {
      console.error(`❌ Failed to import ${tableName}:`, error);
      this.errors.push({
        table: tableName,
        error: error.message
      });
      return 0;
    }
  }

  async importAllTables() {
    console.log('🚀 Starting PostgreSQL data import...\n');
    
    let totalImported = 0;
    
    for (const tableName of TABLE_IMPORT_ORDER) {
      try {
        const imported = await this.importTable(tableName);
        totalImported += imported;
      } catch (error) {
        console.error(`Critical error importing ${tableName}:`, error);
      }
    }

    // Write import summary
    const summary = {
      importDate: new Date().toISOString(),
      totalImported,
      tableStats: this.importStats,
      companyIdMap: COMPANY_ID_MAP,
      errors: this.errors,
      importOrder: TABLE_IMPORT_ORDER
    };

    fs.writeFileSync(
      path.join(IMPORT_DIR, 'import-summary-fixed.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log(`\n🎉 Import complete!`);
    console.log(`   📊 Total records imported: ${totalImported}`);
    console.log(`   ⚠️  Total errors: ${this.errors.length}`);
    console.log(`   🗺️  Company ID mappings: ${Object.keys(COMPANY_ID_MAP).length}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors encountered during import:`);
      this.errors.slice(0, 5).forEach(error => {
        console.log(`   • ${error.table}: ${error.error}`);
      });
    }

    return summary;
  }

  async validateImport() {
    console.log('\n🔍 Validating imported data...');
    
    const validationResults = {};
    
    for (const tableName of TABLE_IMPORT_ORDER) {
      const modelName = TABLE_TO_MODEL_MAP[tableName];
      if (!modelName) continue;

      try {
        const count = await this.prisma[modelName].count();
        validationResults[tableName] = count;
        console.log(`   ✅ ${tableName}: ${count} records`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: Error counting records - ${error.message}`);
        validationResults[tableName] = 'ERROR';
      }
    }

    return validationResults;
  }

  async close() {
    await this.prisma.$disconnect();
    console.log('PostgreSQL connection closed');
  }
}

// Run the import
async function runImport() {
  const importer = new PostgreSQLDataImporter();
  
  try {
    await importer.connect();
    await importer.importAllTables();
    await importer.validateImport();
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await importer.close();
  }
}

if (require.main === module) {
  runImport();
}

module.exports = { PostgreSQLDataImporter };