/**
 * Data Recovery Service Tests
 * 
 * These tests validate that our data recovery and integrity checking systems work correctly.
 * Run these tests in the browser console to verify functionality.
 */

import { DataRecoveryService } from './dataRecoveryService';
import { BookkeepingStorageService } from '../storage/bookkeepingStorageService';

export class DataRecoveryTests {
  static runAllTests(): void {
    console.group('🧪 Data Recovery Service Tests');
    
    try {
      this.testBasicAnalysis();
      this.testDataLossDetection();
      this.testBackupCreation();
      this.testValidationLogic();
      
      console.log('✅ All tests passed!');
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
    
    console.groupEnd();
  }

  static testBasicAnalysis(): void {
    console.log('📊 Testing basic analysis...');
    
    const report = DataRecoveryService.analyzeLocalStorageData();
    
    // Basic structure validation
    if (!report.hasOwnProperty('totalEntries')) {
      throw new Error('Report missing totalEntries');
    }
    if (!report.hasOwnProperty('possibleDataLoss')) {
      throw new Error('Report missing possibleDataLoss');
    }
    if (!Array.isArray(report.recommendations)) {
      throw new Error('Report recommendations should be an array');
    }
    
    console.log('  ✓ Analysis report structure is valid');
  }

  static testDataLossDetection(): void {
    console.log('🔍 Testing data loss detection...');
    
    // Create mock data with suspicious patterns
    const mockEntries = [
      { type: 'income', amount: 1000, category: 'Sales' },
      { type: 'income', amount: 2000, category: 'Services' },
      { type: 'income', amount: 1500, category: 'Consulting' },
      // No expense entries - this should trigger data loss detection
    ];

    const validation = DataRecoveryService.validateExpenseEntries(mockEntries as any);
    
    if (validation.isValid) {
      throw new Error('Should detect missing expense entries');
    }
    
    if (validation.issues.length === 0) {
      throw new Error('Should report issues when expenses are missing');
    }
    
    console.log('  ✓ Data loss detection working correctly');
  }

  static testBackupCreation(): void {
    console.log('💾 Testing backup creation...');
    
    try {
      const backup = DataRecoveryService.createDataBackup();
      const parsed = JSON.parse(backup);
      
      if (!parsed.timestamp) {
        throw new Error('Backup missing timestamp');
      }
      if (!parsed.hasOwnProperty('data')) {
        throw new Error('Backup missing data property');
      }
      if (!parsed.version) {
        throw new Error('Backup missing version');
      }
      
      console.log('  ✓ Backup creation working correctly');
    } catch (error) {
      throw new Error(`Backup creation failed: ${error}`);
    }
  }

  static testValidationLogic(): void {
    console.log('✅ Testing validation logic...');
    
    // Test with valid entries
    const validEntries = [
      { type: 'income', amount: 1000, category: 'Sales' },
      { type: 'expense', amount: 500, category: 'Rent' },
    ];
    
    const validResult = DataRecoveryService.validateExpenseEntries(validEntries as any);
    if (!validResult.isValid) {
      throw new Error('Should validate healthy data as valid');
    }
    
    // Test with problematic entries
    const problematicEntries = [
      { type: 'income', amount: 1000, category: 'Sales' },
      { type: 'income', amount: 2000, category: 'Services' },
      { type: 'income', amount: 1500, category: 'Consulting' },
      // Missing expenses
    ];
    
    const problematicResult = DataRecoveryService.validateExpenseEntries(problematicEntries as any);
    if (problematicResult.isValid) {
      throw new Error('Should detect problematic data patterns');
    }
    
    console.log('  ✓ Validation logic working correctly');
  }

  /**
   * Integration test with actual localStorage
   */
  static testIntegrationWithStorage(): void {
    console.log('🔗 Testing integration with storage...');
    
    try {
      const integrityCheck = BookkeepingStorageService.checkDataIntegrity();
      
      if (!integrityCheck.hasOwnProperty('isValid')) {
        throw new Error('Integrity check missing isValid property');
      }
      
      if (!Array.isArray(integrityCheck.issues)) {
        throw new Error('Integrity check issues should be an array');
      }
      
      if (!Array.isArray(integrityCheck.recommendations)) {
        throw new Error('Integrity check recommendations should be an array');
      }
      
      console.log('  ✓ Storage integration working correctly');
      console.log('  📊 Current data status:', {
        isValid: integrityCheck.isValid,
        issueCount: integrityCheck.issues.length,
        recommendationCount: integrityCheck.recommendations.length
      });
      
    } catch (error) {
      throw new Error(`Storage integration test failed: ${error}`);
    }
  }

  /**
   * Run a comprehensive system test
   */
  static runSystemTest(): void {
    console.group('🔧 Comprehensive System Test');
    
    try {
      // Step 1: Check current data state
      console.log('1. Analyzing current data state...');
      const analysis = DataRecoveryService.analyzeLocalStorageData();
      console.log('   Current state:', {
        totalEntries: analysis.totalEntries,
        expenses: analysis.expenseEntries,
        income: analysis.incomeEntries,
        possibleDataLoss: analysis.possibleDataLoss
      });
      
      // Step 2: Run integrity check
      console.log('2. Running integrity check...');
      const integrity = BookkeepingStorageService.checkDataIntegrity();
      console.log('   Integrity status:', integrity.isValid ? '✅ Valid' : '⚠️ Issues detected');
      
      // Step 3: Test backup functionality
      console.log('3. Testing backup functionality...');
      const backup = DataRecoveryService.createDataBackup();
      console.log('   Backup size:', new Blob([backup]).size, 'bytes');
      
      // Step 4: Generate detailed report
      console.log('4. Generating detailed report...');
      DataRecoveryService.logDetailedReport();
      
      console.log('✅ System test completed successfully');
      
    } catch (error) {
      console.error('❌ System test failed:', error);
    }
    
    console.groupEnd();
  }
}

// Make tests available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).DataRecoveryTests = DataRecoveryTests;
  console.log('🧪 Data Recovery Tests loaded. Run DataRecoveryTests.runAllTests() to execute.');
}