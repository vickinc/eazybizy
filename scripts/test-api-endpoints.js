// Test API endpoints to verify data flow
async function testApiEndpoints() {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('🔗 TESTING API ENDPOINTS');
  console.log('=' .repeat(50));
  
  try {
    // Test Notes API
    console.log('\n📝 Testing Notes API...');
    const notesResponse = await fetch(`${baseUrl}/notes`);
    if (notesResponse.ok) {
      const notesData = await notesResponse.json();
      console.log(`✅ Notes API: ${notesData.notes?.length || 0} notes found`);
    } else {
      console.log(`❌ Notes API failed: ${notesResponse.status}`);
    }
    
    // Test Notes Statistics
    console.log('\n📊 Testing Notes Statistics API...');
    const notesStatsResponse = await fetch(`${baseUrl}/notes/statistics`);
    if (notesStatsResponse.ok) {
      const statsData = await notesStatsResponse.json();
      console.log('✅ Notes Statistics:', statsData);
    } else {
      console.log(`❌ Notes Statistics API failed: ${notesStatsResponse.status}`);
    }
    
    // Test Calendar Events API
    console.log('\n📅 Testing Calendar Events API...');
    const eventsResponse = await fetch(`${baseUrl}/calendar/events`);
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log(`✅ Calendar Events API: ${eventsData.events?.length || 0} events found`);
    } else {
      console.log(`❌ Calendar Events API failed: ${eventsResponse.status}`);
    }
    
    // Test Companies API
    console.log('\n🏢 Testing Companies API...');
    const companiesResponse = await fetch(`${baseUrl}/companies`);
    if (companiesResponse.ok) {
      const companiesData = await companiesResponse.json();
      console.log(`✅ Companies API: ${companiesData.companies?.length || 0} companies found`);
    } else {
      console.log(`❌ Companies API failed: ${companiesResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
    console.log('Make sure the development server is running: npm run dev');
  }
}

// Note: This script requires Node.js 18+ for fetch API
// Run with: node scripts/test-api-endpoints.js
testApiEndpoints();