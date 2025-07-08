# 📋 Expense Entries Recovery Guide

## What Happened?

During a recent update to improve the display of negative amounts in profit/loss reports, a migration issue occurred that may have affected some expense entries in your bookkeeping data.

### The Technical Issue

The issue was in the `migrateEntries` method in `bookkeepingStorageService.ts`. The filtering logic was accidentally removing **all expense entries** that had `isFromInvoice: true`, not just the intended COGS entries.

**Problematic code (now fixed):**
```typescript
// This incorrectly filtered out ALL expense entries with isFromInvoice: true
if ((entry.type === 'expense' || entry.type === 'cogs') && entry.isFromInvoice) {
  return false;
}
```

**Correct code:**
```typescript
// Only filter out entries that have type 'cogs' (not 'expense')  
if (entry.type === 'cogs' && entry.isFromInvoice) {
  return false;
}
```

## How to Check if You're Affected

### 1. Automatic Detection
The system now automatically checks for data integrity issues. If you're affected, you'll see a **Data Integrity Alert** on your bookkeeping pages.

### 2. Manual Check (Browser Console)
1. Open your browser's developer tools (F12)
2. Go to the Console tab
3. Run: `DataRecoveryService.logDetailedReport()`

### 3. Quick Visual Check
- Do you have income entries but very few or no expense entries?
- Does your expense-to-income ratio seem unusually low?

## Recovery Options

### Option 1: Restore from Backup
If you have a backup of your bookkeeping data:

1. Create a current backup first: 
   ```javascript
   // In browser console
   const backup = DataRecoveryService.createDataBackup();
   console.log(backup); // Copy this to a safe location
   ```

2. Import your backup data through the bookkeeping interface

### Option 2: Manual Re-entry
If affected entries are few:

1. Review your income entries to identify which should have had corresponding expenses
2. Add the missing expense entries manually through the bookkeeping interface
3. Use the categories that were originally used

### Option 3: Browser localStorage Inspection
For advanced users:

1. Open browser console
2. Run: `localStorage.getItem('app-bookkeeping-entries')`
3. Look for expense entries that might still be there in corrupted format

## Prevention Measures Implemented

### 1. Enhanced Data Integrity Checks
- ✅ Migration now includes before/after validation
- ✅ Automatic detection of suspicious data patterns
- ✅ Comprehensive logging of all data operations

### 2. Storage Format Standardization
- ✅ Fixed inconsistency between ProfitLossStorageService and BookkeepingStorageService
- ✅ Standardized on array format across all services
- ✅ Improved migration logic with safeguards

### 3. User Notification System
- ✅ Automatic alerts when data issues are detected
- ✅ Detailed diagnostics and recovery recommendations
- ✅ Built-in backup and export functionality

### 4. Validation Before Save
- ✅ All data is validated before being saved to localStorage
- ✅ Suspicious patterns are logged and reported
- ✅ Data statistics are tracked on every save operation

## Using the Recovery Tools

### DataRecoveryService
Available in browser console as `DataRecoveryService`:

```javascript
// Get detailed analysis
DataRecoveryService.logDetailedReport()

// Create backup
const backup = DataRecoveryService.createDataBackup()

// Analyze current data
const report = DataRecoveryService.analyzeLocalStorageData()
```

### BookkeepingStorageService  
Available for integrity checks:

```javascript
// Check data integrity
const integrity = BookkeepingStorageService.checkDataIntegrity()

// Create backup
const backup = BookkeepingStorageService.createBackup()
```

### Test Suite
Run comprehensive tests:

```javascript
// Run all recovery tests
DataRecoveryTests.runAllTests()

// Run system test
DataRecoveryTests.runSystemTest()
```

## Support

If you need help recovering your data:

1. **Create a backup first** using the tools above
2. **Run the diagnostic report** and save the output
3. **Document which expense entries you believe are missing**
4. **Contact support** with the diagnostic information

## Technical Notes

### Files Modified/Created:
- ✅ `src/services/recovery/dataRecoveryService.ts` - New recovery utilities
- ✅ `src/services/storage/bookkeepingStorageService.ts` - Enhanced with integrity checks
- ✅ `src/services/storage/profitLossStorageService.ts` - Fixed storage format consistency
- ✅ `src/components/features/DataIntegrityAlert.tsx` - User notification system
- ✅ `src/services/recovery/dataRecoveryService.test.ts` - Comprehensive test suite

### Storage Format Changes:
- **Before**: Mixed object/array formats causing inconsistencies
- **After**: Standardized array format across all services
- **Migration**: Automatic conversion with integrity checking

### Negative Amount Display:
The original goal of showing losses as negative amounts has been implemented correctly in the `formatCurrency` function without affecting data integrity.

---

## Quick Start Recovery Checklist

- [ ] Open your bookkeeping page and check for Data Integrity Alert
- [ ] If alert shows, click "Show Details" to see the analysis
- [ ] Click "Create Backup" to save your current data
- [ ] If issues detected, review your expense entries manually
- [ ] Re-add any missing expense entries through the normal interface
- [ ] Run "Recheck Data" to verify the fix

The system is now much more robust and will prevent similar issues in the future. All data operations are logged and validated to ensure your bookkeeping data remains accurate and complete.