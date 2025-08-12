// Debug script to test historical balance calculation
const testWalletAddress = 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE'; // Sample Tron wallet
const testDate = new Date('2024-01-01'); // Historical date to test

console.log('🧪 Testing historical balance calculation for:');
console.log('Wallet:', testWalletAddress);
console.log('Historical Date:', testDate.toISOString());
console.log('Historical Date Timestamp:', testDate.getTime());
console.log('Current Date:', new Date().toISOString());

// Test URL that would be used
const testUrl = `http://localhost:3002/api/blockchain/test-historical-balance?address=${testWalletAddress}&blockchain=tron&currency=TRX&asOfDate=2024-01-01`;

console.log('🔗 Test URL:', testUrl);
console.log('\n📝 Expected behavior:');
console.log('- Should fetch all TRX transactions up to 2024-01-01');  
console.log('- Should calculate: incoming - outgoing = net balance as of that date');
console.log('- Should NOT show massive positive or negative amounts');

console.log('\n⚠️  Current issue:');
console.log('- TRX showing: 253168.75015800 TRX (way too high)');
console.log('- USDT showing: -45003.17 USDT (negative)');  
console.log('- This suggests calculation is wrong');

console.log('\n🔍 Possible causes:');
console.log('1. Transaction amounts in wrong units (SUN vs TRX)');
console.log('2. All transactions being counted instead of filtered by date');
console.log('3. Transaction direction (incoming/outgoing) logic reversed');
console.log('4. Duplicate transactions being counted');