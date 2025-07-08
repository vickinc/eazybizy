import { JournalEntry } from '@/types';
import { UserManagementService } from '../business/userManagementService';

const JOURNAL_ENTRIES_KEY = 'app-journal-entries';
const JOURNAL_NUMBER_COUNTER_KEY = 'app-journal-number-counter';

interface IntegrityCheckResult {
  isValid: boolean;
  issues: string[];
  entriesBefore: number;
  entriesAfter: number;
  balancedEntries: number;
  unbalancedEntries: number;
}

export class JournalEntryStorageService {
  static getJournalEntries(): JournalEntry[] {
    try {
      const savedEntries = localStorage.getItem(JOURNAL_ENTRIES_KEY);
      if (savedEntries) {
        const parsed = JSON.parse(savedEntries);
        
        // Handle case where entries might be stored as an object
        let entries: JournalEntry[];
        if (Array.isArray(parsed)) {
          entries = parsed;
        } else if (parsed && typeof parsed === 'object') {
          // If it's an object, try to extract array values
          entries = Object.values(parsed);
          console.warn('Journal entries were stored as object, converting to array');
        } else {
          console.error('Invalid journal entries format:', typeof parsed);
          return [];
        }
        
        return this.migrateEntriesWithIntegrityCheck(entries);
      }
    } catch (error) {
      console.error('Error loading journal entries from localStorage:', error);
    }
    return [];
  }

  static saveJournalEntries(entries: JournalEntry[]): boolean {
    try {
      // Validate entries before saving
      const validation = this.validateEntriesBeforeSave(entries);
      if (!validation.isValid) {
        console.error('Validation failed before saving journal entries:', validation.issues);
        // Still save but log the issues
        validation.issues.forEach(issue => console.warn('⚠️', issue));
      }

      localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
      console.log(`✅ Saved ${entries.length} journal entries to localStorage`);
      
      // Verify the save was successful
      const savedData = localStorage.getItem(JOURNAL_ENTRIES_KEY);
      if (!savedData) {
        console.error('❌ Failed to verify journal entries save');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving journal entries to localStorage:', error);
      return false;
    }
  }

  static addJournalEntry(entry: JournalEntry): boolean {
    try {
      const entries = this.getJournalEntries();
      
      // Ensure entry has a journal number
      if (!entry.entryNumber) {
        entry.entryNumber = this.generateNextJournalNumber();
      }
      
      entries.push(entry);
      return this.saveJournalEntries(entries);
    } catch (error) {
      console.error('Error adding journal entry:', error);
      return false;
    }
  }

  static updateJournalEntry(updatedEntry: JournalEntry): boolean {
    try {
      const entries = this.getJournalEntries();
      const index = entries.findIndex(entry => entry.id === updatedEntry.id);
      
      if (index === -1) {
        console.error('Journal entry not found for update:', updatedEntry.id);
        return false;
      }
      
      entries[index] = updatedEntry;
      return this.saveJournalEntries(entries);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      return false;
    }
  }

  static deleteJournalEntry(entryId: string): boolean {
    try {
      const entries = this.getJournalEntries();
      const filteredEntries = entries.filter(entry => entry.id !== entryId);
      
      if (filteredEntries.length === entries.length) {
        console.error('Journal entry not found for deletion:', entryId);
        return false;
      }
      
      return this.saveJournalEntries(filteredEntries);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      return false;
    }
  }

  static getJournalEntryById(id: string): JournalEntry | null {
    try {
      const entries = this.getJournalEntries();
      return entries.find(entry => entry.id === id) || null;
    } catch (error) {
      console.error('Error getting journal entry by ID:', error);
      return null;
    }
  }

  static getJournalEntriesByCompany(companyId: number): JournalEntry[] {
    try {
      const entries = this.getJournalEntries();
      return entries.filter(entry => entry.companyId === companyId);
    } catch (error) {
      console.error('Error getting journal entries by company:', error);
      return [];
    }
  }

  static getJournalEntriesByPeriod(startDate: Date, endDate: Date, companyId?: number): JournalEntry[] {
    try {
      let entries = this.getJournalEntries();
      
      // Filter by company if specified
      if (companyId !== undefined) {
        entries = entries.filter(entry => entry.companyId === companyId);
      }
      
      // Filter by date range
      return entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate && entry.status === 'posted';
      });
    } catch (error) {
      console.error('Error getting journal entries by period:', error);
      return [];
    }
  }

  static validateEntriesBeforeSave(entries: JournalEntry[]): IntegrityCheckResult {
    const result: IntegrityCheckResult = {
      isValid: true,
      issues: [],
      entriesBefore: entries.length,
      entriesAfter: entries.length,
      balancedEntries: 0,
      unbalancedEntries: 0
    };

    if (!Array.isArray(entries)) {
      result.isValid = false;
      result.issues.push('Entries must be an array');
      return result;
    }

    entries.forEach((entry, index) => {
      // Validate required fields
      if (!entry.id) {
        result.issues.push(`Entry ${index}: Missing id`);
        result.isValid = false;
      }
      
      if (!entry.entryNumber) {
        result.issues.push(`Entry ${index}: Missing entryNumber`);
        result.isValid = false;
      }
      
      if (!entry.date) {
        result.issues.push(`Entry ${index}: Missing date`);
        result.isValid = false;
      }
      
      if (!entry.description) {
        result.issues.push(`Entry ${index}: Missing description`);
        result.isValid = false;
      }
      
      if (!entry.lines || !Array.isArray(entry.lines) || entry.lines.length < 2) {
        result.issues.push(`Entry ${index}: Must have at least 2 journal lines`);
        result.isValid = false;
      }

      // Validate double-entry balance
      if (entry.lines) {
        const totalDebits = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredits = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        const difference = Math.abs(totalDebits - totalCredits);
        
        if (difference > 0.01) {
          result.issues.push(`Entry ${index} (${entry.entryNumber}): Not balanced - Debits: ${totalDebits}, Credits: ${totalCredits}`);
          result.unbalancedEntries++;
          result.isValid = false;
        } else {
          result.balancedEntries++;
        }
        
        // Validate that calculated totals match stored totals
        if (Math.abs(entry.totalDebits - totalDebits) > 0.01) {
          result.issues.push(`Entry ${index}: Stored totalDebits (${entry.totalDebits}) doesn't match calculated (${totalDebits})`);
        }
        
        if (Math.abs(entry.totalCredits - totalCredits) > 0.01) {
          result.issues.push(`Entry ${index}: Stored totalCredits (${entry.totalCredits}) doesn't match calculated (${totalCredits})`);
        }
      }

      // Validate journal lines
      if (entry.lines) {
        entry.lines.forEach((line, lineIndex) => {
          if (!line.id) {
            result.issues.push(`Entry ${index}, Line ${lineIndex}: Missing line id`);
          }
          
          if (!line.accountId) {
            result.issues.push(`Entry ${index}, Line ${lineIndex}: Missing accountId`);
            result.isValid = false;
          }
          
          const hasDebit = (line.debit || 0) > 0;
          const hasCredit = (line.credit || 0) > 0;
          
          if (!hasDebit && !hasCredit) {
            result.issues.push(`Entry ${index}, Line ${lineIndex}: Must have either debit or credit amount`);
            result.isValid = false;
          }
          
          if (hasDebit && hasCredit) {
            result.issues.push(`Entry ${index}, Line ${lineIndex}: Cannot have both debit and credit amounts`);
            result.isValid = false;
          }
          
          if ((line.debit || 0) < 0 || (line.credit || 0) < 0) {
            result.issues.push(`Entry ${index}, Line ${lineIndex}: Amounts cannot be negative`);
            result.isValid = false;
          }
        });
      }
    });

    return result;
  }

  static migrateEntriesWithIntegrityCheck(entries: JournalEntry[]): JournalEntry[] {
    if (!Array.isArray(entries)) {
      console.error('❌ Journal entries migration failed: not an array');
      return [];
    }

    console.log(`🔄 Migrating ${entries.length} journal entries...`);
    
    // Ensure all entries have proper structure
    const migratedEntries = entries.map(entry => {
      // Recalculate totals to ensure accuracy
      if (entry.lines && Array.isArray(entry.lines)) {
        const totalDebits = entry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredits = entry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
        
        return {
          ...entry,
          totalDebits,
          totalCredits,
          isBalanced,
          // Ensure timestamps exist
          createdAt: entry.createdAt || new Date().toISOString(),
          updatedAt: entry.updatedAt || new Date().toISOString()
        };
      }
      
      return entry;
    });

    // Validate migrated entries
    const validation = this.validateEntriesBeforeSave(migratedEntries);
    
    if (!validation.isValid) {
      console.warn(`⚠️ ${validation.issues.length} issues found during journal entries migration:`);
      validation.issues.forEach(issue => console.warn('  -', issue));
    }
    
    console.log(`✅ Journal entries migration complete: ${migratedEntries.length} entries, ${validation.balancedEntries} balanced`);
    
    return migratedEntries;
  }

  static checkDataIntegrity(): IntegrityCheckResult {
    const entries = this.getJournalEntries();
    return this.validateEntriesBeforeSave(entries);
  }

  static clearAllJournalEntries(): void {
    try {
      localStorage.removeItem(JOURNAL_ENTRIES_KEY);
      console.log('✅ Cleared all journal entries from localStorage');
    } catch (error) {
      console.error('Error clearing journal entries:', error);
    }
  }

  static createBackup(): string | null {
    try {
      const entries = this.getJournalEntries();
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'journal-entries',
        data: entries
      };
      
      const backupString = JSON.stringify(backup, null, 2);
      console.log(`✅ Created backup of ${entries.length} journal entries`);
      return backupString;
    } catch (error) {
      console.error('Error creating journal entries backup:', error);
      return null;
    }
  }

  static restoreFromBackup(backupString: string): boolean {
    try {
      const backup = JSON.parse(backupString);
      
      if (backup.type !== 'journal-entries' || !Array.isArray(backup.data)) {
        console.error('Invalid backup format for journal entries');
        return false;
      }
      
      const validation = this.validateEntriesBeforeSave(backup.data);
      if (!validation.isValid) {
        console.error('Backup data validation failed:', validation.issues);
        return false;
      }
      
      const success = this.saveJournalEntries(backup.data);
      if (success) {
        console.log(`✅ Restored ${backup.data.length} journal entries from backup`);
      }
      
      return success;
    } catch (error) {
      console.error('Error restoring journal entries from backup:', error);
      return false;
    }
  }

  // Debug helper methods
  static logDetailedReport(): void {
    const entries = this.getJournalEntries();
    const integrity = this.checkDataIntegrity();
    
    console.group('📊 Journal Entries Storage Report');
    console.log('Total entries:', entries.length);
    console.log('Balanced entries:', integrity.balancedEntries);
    console.log('Unbalanced entries:', integrity.unbalancedEntries);
    console.log('Data integrity:', integrity.isValid ? '✅ Valid' : '❌ Invalid');
    
    if (integrity.issues.length > 0) {
      console.group('⚠️ Issues found:');
      integrity.issues.forEach(issue => console.log('-', issue));
      console.groupEnd();
    }
    
    if (entries.length > 0) {
      console.group('📋 Sample entries:');
      entries.slice(0, 3).forEach(entry => {
        console.log(`${entry.entryNumber}: ${entry.description} (${entry.lines?.length || 0} lines)`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  // Journal Number Generation Methods
  static generateNextJournalNumber(): string {
    try {
      const currentCounter = this.getJournalNumberCounter();
      const nextNumber = currentCounter + 1;
      this.setJournalNumberCounter(nextNumber);
      
      // Format as JE-001, JE-002, etc.
      return `JE-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating journal number:', error);
      // Fallback to timestamp-based number
      return `JE-${Date.now().toString().slice(-6)}`;
    }
  }

  static getJournalNumberCounter(): number {
    try {
      const counterStr = localStorage.getItem(JOURNAL_NUMBER_COUNTER_KEY);
      if (counterStr) {
        return parseInt(counterStr, 10) || 0;
      }
      
      // Initialize counter based on existing entries
      const entries = this.getJournalEntries();
      const maxNumber = this.findHighestJournalNumber(entries);
      this.setJournalNumberCounter(maxNumber);
      return maxNumber;
    } catch (error) {
      console.error('Error getting journal number counter:', error);
      return 0;
    }
  }

  static setJournalNumberCounter(counter: number): void {
    try {
      localStorage.setItem(JOURNAL_NUMBER_COUNTER_KEY, counter.toString());
    } catch (error) {
      console.error('Error setting journal number counter:', error);
    }
  }

  static findHighestJournalNumber(entries: JournalEntry[]): number {
    try {
      let maxNumber = 0;
      
      entries.forEach(entry => {
        if (entry.entryNumber && entry.entryNumber.startsWith('JE-')) {
          const numberStr = entry.entryNumber.replace('JE-', '');
          const number = parseInt(numberStr, 10);
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      });
      
      return maxNumber;
    } catch (error) {
      console.error('Error finding highest journal number:', error);
      return 0;
    }
  }

  static resetJournalNumberCounter(): void {
    try {
      localStorage.removeItem(JOURNAL_NUMBER_COUNTER_KEY);
      console.log('✅ Reset journal number counter');
    } catch (error) {
      console.error('Error resetting journal number counter:', error);
    }
  }

  static getPreviewNextJournalNumber(): string {
    const currentCounter = this.getJournalNumberCounter();
    const nextNumber = currentCounter + 1;
    return `JE-${nextNumber.toString().padStart(3, '0')}`;
  }

  // Entry Status Management Methods
  static postJournalEntry(entryId: string): boolean {
    try {
      const entry = this.getJournalEntryById(entryId);
      if (!entry) {
        console.error('Journal entry not found for posting:', entryId);
        return false;
      }

      if (entry.status === 'posted') {
        console.warn('Journal entry is already posted:', entryId);
        return true;
      }

      if (entry.status === 'reversed') {
        console.error('Cannot post a reversed journal entry:', entryId);
        return false;
      }

      // Validate entry is balanced before posting
      if (!entry.isBalanced) {
        console.error('Cannot post unbalanced journal entry:', entryId);
        return false;
      }

      const updatedEntry = {
        ...entry,
        status: 'posted' as const,
        updatedAt: new Date().toISOString()
      };

      return this.updateJournalEntry(updatedEntry);
    } catch (error) {
      console.error('Error posting journal entry:', error);
      return false;
    }
  }

  static reverseJournalEntry(entryId: string, reversalReason?: string): JournalEntry | null {
    try {
      const originalEntry = this.getJournalEntryById(entryId);
      if (!originalEntry) {
        console.error('Journal entry not found for reversal:', entryId);
        return null;
      }

      if (originalEntry.status !== 'posted') {
        console.error('Can only reverse posted journal entries:', entryId);
        return null;
      }

      if (originalEntry.reversalEntryId) {
        console.error('Journal entry is already reversed:', entryId);
        return null;
      }

      // Get current user for audit trail
      const currentUser = UserManagementService.getCurrentUser();
      const now = new Date().toISOString();

      // Create reversal entry
      const reversalEntry: JournalEntry = {
        id: `${originalEntry.id}-reversal-${Date.now()}`,
        entryNumber: this.generateNextJournalNumber(),
        date: new Date().toISOString().split('T')[0],
        description: `REVERSAL: ${originalEntry.description}${reversalReason ? ` - ${reversalReason}` : ''}`,
        reference: `REV-${originalEntry.entryNumber}`,
        companyId: originalEntry.companyId,
        lines: originalEntry.lines.map(line => ({
          ...line,
          id: `${line.id}-reversal`,
          debit: line.credit, // Reverse the amounts
          credit: line.debit
        })),
        totalDebits: originalEntry.totalCredits, // Reversed
        totalCredits: originalEntry.totalDebits, // Reversed
        isBalanced: originalEntry.isBalanced,
        source: 'manual',
        sourceId: originalEntry.id,
        
        // Audit trail for reversal entry
        createdBy: currentUser.id,
        createdByName: currentUser.fullName,
        approvedBy: currentUser.id,
        approvedByName: currentUser.fullName,
        approvedAt: now,
        postedBy: currentUser.id,
        postedByName: currentUser.fullName,
        postedAt: now,
        lastModifiedBy: currentUser.id,
        lastModifiedByName: currentUser.fullName,
        
        status: 'posted',
        createdAt: now,
        updatedAt: now
      };

      // Update original entry to mark as reversed
      const updatedOriginalEntry = {
        ...originalEntry,
        status: 'reversed' as const,
        reversalEntryId: reversalEntry.id,
        reversedBy: currentUser.id,
        reversedByName: currentUser.fullName,
        reversedAt: now,
        lastModifiedBy: currentUser.id,
        lastModifiedByName: currentUser.fullName,
        updatedAt: now
      };

      // Save both entries
      const entries = this.getJournalEntries();
      const originalIndex = entries.findIndex(e => e.id === originalEntry.id);
      if (originalIndex === -1) {
        console.error('Original entry not found in storage');
        return null;
      }

      entries[originalIndex] = updatedOriginalEntry;
      entries.push(reversalEntry);

      if (this.saveJournalEntries(entries)) {
        // Log audit actions
        UserManagementService.logAction(
          'reverse',
          'journal-entry',
          originalEntry.id,
          `Reversed journal entry ${originalEntry.entryNumber}${reversalReason ? `: ${reversalReason}` : ''}`
        );
        
        UserManagementService.logAction(
          'create',
          'journal-entry',
          reversalEntry.id,
          `Created reversal entry ${reversalEntry.entryNumber} for ${originalEntry.entryNumber}`
        );

        console.log(`✅ Created reversal entry ${reversalEntry.entryNumber} for ${originalEntry.entryNumber}`);
        return reversalEntry;
      } else {
        console.error('Failed to save reversal entries');
        return null;
      }
    } catch (error) {
      console.error('Error reversing journal entry:', error);
      return null;
    }
  }

  static getJournalEntriesByStatus(status: 'draft' | 'posted' | 'reversed', companyId?: number): JournalEntry[] {
    try {
      let entries = this.getJournalEntries();
      
      // Filter by company if specified
      if (companyId !== undefined) {
        entries = entries.filter(entry => entry.companyId === companyId);
      }
      
      // Filter by status
      return entries.filter(entry => entry.status === status);
    } catch (error) {
      console.error('Error getting journal entries by status:', error);
      return [];
    }
  }

  static getDraftJournalEntries(companyId?: number): JournalEntry[] {
    return this.getJournalEntriesByStatus('draft', companyId);
  }

  static getPostedJournalEntries(companyId?: number): JournalEntry[] {
    return this.getJournalEntriesByStatus('posted', companyId);
  }

  static getReversedJournalEntries(companyId?: number): JournalEntry[] {
    return this.getJournalEntriesByStatus('reversed', companyId);
  }
}