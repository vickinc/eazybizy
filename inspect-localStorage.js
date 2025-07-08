/**
 * Script to inspect localStorage keys and bookkeeping entries
 * Run this in the browser console
 */

// Function to inspect bookkeeping entries
function inspectBookkeepingEntries() {
  console.log('=== BOOKKEEPING ENTRIES INSPECTION ===');
  
  const entriesKey = 'app-bookkeeping-entries';
  const savedData = localStorage.getItem(entriesKey);
  
  if (!savedData) {
    console.log('❌ No bookkeeping entries found in localStorage');
    return;
  }
  
  try {
    const parsed = JSON.parse(savedData);
    let entries = [];
    
    // Handle both array format and object format
    if (Array.isArray(parsed)) {
      entries = parsed;
      console.log('✅ Found entries in array format');
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.entries)) {
      entries = parsed.entries;
      console.log('✅ Found entries in object format with metadata');
    } else {
      console.log('❌ Unknown data format:', typeof parsed);
      return;
    }
    
    console.log(`📊 Total entries: ${entries.length}`);
    
    // Count by type
    const incomeCount = entries.filter(e => e.type === 'income').length;
    const expenseCount = entries.filter(e => e.type === 'expense').length;
    const otherCount = entries.filter(e => e.type !== 'income' && e.type !== 'expense').length;
    
    console.log(`   Income entries: ${incomeCount}`);
    console.log(`   Expense entries: ${expenseCount}`);
    if (otherCount > 0) {
      console.log(`   Other types: ${otherCount}`);
      const otherTypes = [...new Set(entries.filter(e => e.type !== 'income' && e.type !== 'expense').map(e => e.type))];
      console.log(`   Other types found: ${otherTypes.join(', ')}`);
    }
    
    // Show recent entries
    console.log('\n📅 Last 5 entries:');
    const sortedEntries = [...entries].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    sortedEntries.slice(0, 5).forEach(entry => {
      console.log(`   ${entry.type} - ${entry.description || entry.vendorInvoice || 'No description'} - Amount: ${entry.amount} ${entry.currency} - Date: ${entry.date}`);
    });
    
    // Check for any entries with 'cogs' type
    const cogsEntries = entries.filter(e => e.type === 'cogs');
    if (cogsEntries.length > 0) {
      console.log(`\n⚠️  Found ${cogsEntries.length} entries with type 'cogs' (these might be legacy entries)`);
    }
    
    return entries;
  } catch (error) {
    console.error('❌ Error parsing bookkeeping entries:', error);
  }
}

// Function to list all localStorage keys
function listAllAppKeys() {
  console.log('\n=== ALL APP LOCALSTORAGE KEYS ===');
  const appKeys = Object.keys(localStorage).filter(key => key.startsWith('app-'));
  
  console.log(`Found ${appKeys.length} App keys:`);
  appKeys.forEach(key => {
    const value = localStorage.getItem(key);
    const size = new Blob([value]).size;
    console.log(`   ${key} (${(size / 1024).toFixed(2)} KB)`);
  });
  
  return appKeys;
}

// Function to check if there's a migration issue
function checkForMigrationIssues() {
  console.log('\n=== CHECKING FOR MIGRATION ISSUES ===');
  
  const bookkeepingKey = 'app-bookkeeping-entries';
  const savedData = localStorage.getItem(bookkeepingKey);
  
  if (!savedData) {
    console.log('No data to check');
    return;
  }
  
  try {
    const parsed = JSON.parse(savedData);
    
    // Check if it's the new format with metadata
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.version) {
      console.log('✅ Data is in new format with metadata');
      console.log(`   Version: ${parsed.version}`);
      console.log(`   Last Modified: ${parsed.lastModified}`);
      console.log(`   Entry Count: ${parsed.entries?.length || 0}`);
    } else if (Array.isArray(parsed)) {
      console.log('⚠️  Data is in old array format (needs migration)');
      console.log(`   Entry Count: ${parsed.length}`);
    } else {
      console.log('❌ Unknown data format');
    }
  } catch (error) {
    console.error('❌ Error checking data format:', error);
  }
}

// Main inspection
console.log('🔍 App LocalStorage Inspector\n');
inspectBookkeepingEntries();
listAllAppKeys();
checkForMigrationIssues();

console.log('\n✅ Inspection complete!');
