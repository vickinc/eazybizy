// This script simulates what the UI hook should be doing
const mockEntry = {
  id: "cmdhz11tj00059k0631pzkfsh",
  type: "INCOME",
  description: "Invoice INV-COGS-1753395074885 - COGS Test Client Corp",
  amount: 1870,
  cogs: 710,
  cogsPaid: 0,
  isFromInvoice: true
};

// This is what the useBookkeepingManagement hook should do
const enrichedEntry = {
  ...mockEntry,
  type: mockEntry.type === 'INCOME' ? 'revenue' : 'expense',
  company: undefined,
  accountsPayable: mockEntry.type === 'INCOME' && mockEntry.cogs 
    ? (mockEntry.cogs || 0) - (mockEntry.cogsPaid || 0)
    : 0
};

console.log('🧪 Testing UI data enrichment:');
console.log('Original entry type:', mockEntry.type);
console.log('Enriched entry type:', enrichedEntry.type);
console.log('COGS:', enrichedEntry.cogs);
console.log('COGS Paid:', enrichedEntry.cogsPaid);
console.log('Accounts Payable:', enrichedEntry.accountsPayable);

// Test the UI condition
const shouldShowCOGS = enrichedEntry.type === 'revenue' && enrichedEntry.cogs && enrichedEntry.accountsPayable > 0;
console.log('\n📊 UI Display Test:');
console.log('Should show COGS info:', shouldShowCOGS ? '✅ YES' : '❌ NO');
console.log('Reason:');
console.log('- Type is revenue:', enrichedEntry.type === 'revenue');
console.log('- Has COGS:', !!enrichedEntry.cogs);
console.log('- Accounts Payable > 0:', enrichedEntry.accountsPayable > 0);

if (shouldShowCOGS) {
  console.log('\n💰 Display would show:');
  console.log(`A/P: $${enrichedEntry.accountsPayable.toFixed(2)}`);
}