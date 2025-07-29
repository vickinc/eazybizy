/**
 * SQLite Data Export Script
 * Exports all data from SQLite database for migration to PostgreSQL
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// SQLite database path
const SQLITE_DB_PATH = path.join(__dirname, '../prisma/database.db');
const EXPORT_DIR = path.join(__dirname, '../migration-data');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// Define table export order (respecting foreign key dependencies)
const TABLE_EXPORT_ORDER = [
  'users',
  'companies',
  'company_memberships',
  'audit_logs',
  'shareholders',
  'representatives',
  'clients',
  'vendors',
  'products',
  'bank_accounts',
  'digital_wallets',
  'payment_methods',
  'company_accounts',
  'chart_of_accounts',
  'tax_treatments',
  'invoices',
  'invoice_items',
  'payment_method_invoices',
  'invoice_payment_sources',
  'bookkeeping_entries',
  'transactions',
  'transaction_attachments',
  'journal_entries',
  'journal_entry_lines',
  'calendar_events',
  'google_calendar_syncs',
  'auto_generated_event_syncs',
  'notes',
  'business_cards'
];

class SQLiteDataExporter {
  constructor() {
    this.db = null;
    this.exportStats = {};
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('Error connecting to SQLite database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async exportTable(tableName) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM ${tableName}`;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          console.error(`Error exporting table ${tableName}:`, err);
          reject(err);
          return;
        }

        // Convert SQLite-specific data types and handle special cases
        const processedRows = rows.map(row => {
          const processed = { ...row };
          
          // Handle Boolean fields (SQLite stores as 0/1)
          Object.keys(processed).forEach(key => {
            if (typeof processed[key] === 'number' && (processed[key] === 0 || processed[key] === 1)) {
              // Check if this might be a boolean field based on common naming patterns
              if (key.startsWith('is') || key.startsWith('has') || 
                  key.endsWith('Active') || key.endsWith('Enabled') || 
                  key.endsWith('Verified') || key.endsWith('Deleted') ||
                  key.endsWith('Sent') || key.endsWith('Generated') ||
                  key.endsWith('Archived') || key.endsWith('Completed') ||
                  key.includes('AllDay') || key.includes('Recurring')) {
                processed[key] = processed[key] === 1;
              }
            }
            
            // Handle empty strings that should be null
            if (processed[key] === '') {
              processed[key] = null;
            }
          });
          
          return processed;
        });

        const exportPath = path.join(EXPORT_DIR, `${tableName}.json`);
        fs.writeFileSync(exportPath, JSON.stringify(processedRows, null, 2));
        
        this.exportStats[tableName] = rows.length;
        console.log(`✓ Exported ${rows.length} records from ${tableName}`);
        resolve(rows.length);
      });
    });
  }

  async exportAllTables() {
    console.log('Starting SQLite data export...\n');
    
    let totalRecords = 0;
    for (const tableName of TABLE_EXPORT_ORDER) {
      try {
        const count = await this.exportTable(tableName);
        totalRecords += count;
      } catch (error) {
        console.error(`Failed to export ${tableName}:`, error.message);
        // Continue with other tables
      }
    }

    // Write export summary
    const summary = {
      exportDate: new Date().toISOString(),
      totalRecords,
      tableStats: this.exportStats,
      exportOrder: TABLE_EXPORT_ORDER
    };

    fs.writeFileSync(
      path.join(EXPORT_DIR, 'export-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log(`\n✅ Export complete! Exported ${totalRecords} total records`);
    console.log(`Export files saved to: ${EXPORT_DIR}`);
    
    return summary;
  }

  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          console.log('SQLite database connection closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Run the export
async function runExport() {
  const exporter = new SQLiteDataExporter();
  
  try {
    await exporter.connect();
    await exporter.exportAllTables();
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  } finally {
    await exporter.close();
  }
}

// Check if file exists before running
if (!fs.existsSync(SQLITE_DB_PATH)) {
  console.error(`SQLite database not found at: ${SQLITE_DB_PATH}`);
  process.exit(1);
}

if (require.main === module) {
  runExport();
}

module.exports = { SQLiteDataExporter };