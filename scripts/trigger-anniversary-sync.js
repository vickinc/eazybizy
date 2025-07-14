#!/usr/bin/env node

/**
 * Script to trigger immediate sync of anniversary events to Google Calendar
 * This simulates what happens when a user accesses the calendar with Google auth
 */

async function triggerAnniversarySync() {
  try {
    console.log('🚀 Triggering anniversary events sync to Google Calendar...');
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Call the anniversary sync API
    const response = await fetch(`${baseUrl}/api/calendar/anniversary-events/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, this would require proper authentication
      },
      body: JSON.stringify({
        action: 'sync_pending'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sync triggered successfully');
      console.log(`📊 Response:`, result);
    } else {
      const error = await response.text();
      console.log(`❌ Sync failed: ${response.status} ${response.statusText}`);
      console.log(`   Error details: ${error}`);
      
      if (response.status === 401) {
        console.log('\n📝 Note: Anniversary events will automatically sync when:');
        console.log('   1. User accesses calendar page with Google Calendar connected');
        console.log('   2. Scheduled sync job runs (if configured)');
        console.log('   3. User manually triggers sync from calendar UI');
      }
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.log('\n📝 Note: Anniversary events are configured to sync automatically when:');
    console.log('   1. User accesses calendar page with Google Calendar connected');
    console.log('   2. Scheduled sync job runs (if configured)');
    console.log('   3. User manually triggers sync from calendar UI');
  }
}

// Run the script
triggerAnniversarySync();