// Debug transaction calculation logic
console.log('🔍 Debugging Cryptocurrency Balance Calculation Issues');

// The problematic amounts we're seeing:
const problematicAmounts = {
  TRX: 253168.75015800,   // Way too high
  USDT: -45003.17,        // Negative (should be positive or lower negative)
  USDC: -45003.17         // Same negative as USDT
};

console.log('❌ Current problematic amounts:', problematicAmounts);

// Test date being used (01.08.2025 from screenshot)
const historicalDate = new Date('2025-08-01');
const currentDate = new Date();
const daysDifference = Math.round((currentDate - historicalDate) / (1000 * 60 * 60 * 24));

console.log('📅 Date Analysis:');
console.log('Historical Date:', historicalDate.toISOString());
console.log('Current Date:', currentDate.toISOString());
console.log('Days Difference:', daysDifference, daysDifference > 0 ? '(historical date is in the past)' : '(historical date is in the future!)');

console.log('\n🧐 Possible Issues:');
console.log('1. FUTURE DATE ISSUE: If historical date (2025-08-01) is in the future,');
console.log('   then NO transactions would be <= that date, resulting in 0 balance.');
console.log('   But we\'re seeing large amounts, suggesting ALL transactions are being counted.');

console.log('\n2. TRANSACTION DIRECTION ISSUE:');
console.log('   - Large positive TRX suggests: Many incoming transactions OR direction is wrong');
console.log('   - Negative USDT/USDC suggests: More outgoing than incoming OR direction is reversed');

console.log('\n3. DATE FILTERING ISSUE:');
console.log('   - Large amounts suggest we\'re counting ALL transactions, not filtering by date');
console.log('   - The filter: tx.timestamp <= asOfDate.getTime() might not be working');

console.log('\n4. UNIT CONVERSION ISSUE:');
console.log('   - TRX: 253,168 TRX = very large amount (should be much smaller)');
console.log('   - USDT/USDC: 45,003 is also very large for most wallets');

console.log('\n🎯 What to check in logs:');
console.log('✅ Look for: "Retrieved X total transactions"');
console.log('✅ Look for: "Processing Y transactions up to [date]"');
console.log('✅ Look for: "Sample transactions" to see actual data');
console.log('✅ Look for: "Processing tx:" entries for each transaction');

console.log('\n🔧 Expected behavior for 2025-08-01:');
if (daysDifference > 0) {
  console.log('- Should count ALL transactions up to 2025-08-01');
  console.log('- Should show realistic historical balance');
} else {
  console.log('- Should count NO transactions (date is in future)');
  console.log('- Should show 0 balance for all cryptocurrencies');
}