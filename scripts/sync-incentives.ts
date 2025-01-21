import fetch from 'node-fetch';

async function syncIncentives() {
  try {
    console.log('Starting incentives sync...');
    
    const response = await fetch('http://localhost:3000/api/metrics/sync-all-incentives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Successfully synced incentives:', result);
    } else {
      console.error('Failed to sync incentives:', result.error);
    }

  } catch (error) {
    console.error('Error running incentives sync:', error);
  }
}

// Run the sync
syncIncentives(); 