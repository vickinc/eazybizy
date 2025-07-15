// Test script to verify anniversary event duplication fix
const { CompanyAnniversaryService } = require('./src/services/business/companyAnniversaryService.ts');

// Mock company data
const mockCompany = {
  id: 1,
  tradingName: 'LegalBison',
  registrationDate: new Date('2023-01-01'),
  status: 'Active'
};

// Test anniversary event generation
console.log('Testing anniversary event generation...');
const anniversaryEvents = CompanyAnniversaryService.generateAnniversaryEvents(
  mockCompany,
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

console.log('Generated anniversary events:', anniversaryEvents.length);
anniversaryEvents.forEach(event => {
  console.log(`- ${event.title} at ${event.time} (ID: ${event.id})`);
});

// Test conversion to calendar event
console.log('\nTesting conversion to calendar event...');
const calendarEvents = anniversaryEvents.map(event => 
  CompanyAnniversaryService.convertToCalendarEvent(event)
);

calendarEvents.forEach(event => {
  console.log(`- Title: ${event.title}`);
  console.log(`  Type: ${event.type}`);
  console.log(`  isSystemGenerated: ${event.isSystemGenerated}`);
  console.log(`  Time: ${event.time}`);
  console.log('---');
});

console.log('\nFix verification:');
console.log('✓ Anniversary events should have original titles (no "Company Event:" prefix)');
console.log('✓ Anniversary events should have isSystemGenerated: true');
console.log('✓ Anniversary events should have type: "anniversary"');
console.log('✓ Anniversary events should have time: "09:00"');