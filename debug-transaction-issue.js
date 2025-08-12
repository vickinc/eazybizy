#!/usr/bin/env node

/**
 * Debug script to investigate transaction parsing issues
 * Run with: node debug-transaction-issue.js
 */

console.log('🔍 Transaction Issue Debug Script');
console.log('=================================');

// Check what the issue might be:

console.log('\n1. POTENTIAL CAUSES OF WRONG AMOUNTS:');
console.log('   • Transaction direction incorrectly detected (incoming vs outgoing)');
console.log('   • Wallet address normalization issues');  
console.log('   • TRC-20 contract parsing errors');
console.log('   • Mixed data from different sources (database vs live)');

console.log('\n2. POTENTIAL CAUSES OF MISSING TRANSACTIONS:');
console.log('   • API endpoint filtering too restrictively');
console.log('   • Unsupported token contracts (only USDT/USDC allowed)');
console.log('   • Date range filtering excluding some transactions');
console.log('   • Pagination not fetching all pages');
console.log('   • Duplicate detection removing valid transactions');

console.log('\n3. KEY FILES TO CHECK:');
console.log('   • /src/app/api/tron-transactions/route.ts (lines 69-79: supported tokens filter)');
console.log('   • /src/services/integrations/tronGridService.ts (transaction parsing logic)');
console.log('   • /src/services/business/liveCryptoTransactionService.ts (amount calculation)');

console.log('\n4. RECOMMENDED FIXES:');
console.log('   A) Expand supported TRC-20 tokens list');
console.log('   B) Add more detailed logging to track transaction processing');
console.log('   C) Check if wallet address normalization is consistent');
console.log('   D) Verify TRC-20 contract address recognition');
console.log('   E) Debug the specific transactions showing wrong amounts');

console.log('\n5. DEBUGGING STEPS:');
console.log('   1. Check browser console for TronGrid API logs');
console.log('   2. Verify which token contracts are being processed');
console.log('   3. Check if wallet addresses are normalized consistently');
console.log('   4. Look for "❌" error messages in console');
console.log('   5. Check if date filtering is too restrictive');

console.log('\n✅ Debug script completed. Check the issues above to fix transaction problems.');