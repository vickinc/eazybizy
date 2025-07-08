// CRITICAL: This barrel export has been optimized for performance
// Only core types that are used across many components should be here
// 
// For specific domains, use focused imports:
// - Accounting: import from '@/types/accounting'
// - Chart of Accounts: import from '@/types/chartOfAccounts.types'
// - Fixed Assets: import from '@/types/fixedAssets.types'
// - Heavy financial types: import directly (consolidation, comparativeReporting, etc.)

// Core types (lightweight, frequently used)
export * from './core';
