/**
 * Demo script to test the chemistry prediction API
 * Run after starting the server: npm run dev
 */

const API_BASE = 'http://localhost:3001/api';

async function demo() {
  console.log('🧪 Testing Series Events Backend API\n');

  try {
    // 1. Health check
    console.log('1. Health Check...');
    const health = await fetch(`${API_BASE}/health`);
    const healthData = await health.json();
    console.log('✅', healthData);
    console.log('');

    // 2. Get profiles (assuming mock data was generated)
    console.log('2. Getting profiles...');
    const profiles = ['user_0', 'user_1', 'user_2', 'user_3'];
    
    for (const userId of profiles) {
      try {
        const profileRes = await fetch(`${API_BASE}/profile/${userId}`);
        if (profileRes.ok) {
          const profile = await profileRes.json();
          console.log(`✅ Profile ${userId}: catalyst=${profile.social_catalyst_score.toFixed(1)}, energy=${profile.energy_level}`);
        } else {
          console.log(`⚠️  Profile ${userId} not found`);
        }
      } catch (e) {
        console.log(`❌ Error getting profile ${userId}`);
      }
    }
    console.log('');

    // 3. Predict chemistry
    console.log('3. Predicting chemistry...');
    const predictRes = await fetch(`${API_BASE}/chemistry/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: profiles }),
    });

    if (predictRes.ok) {
      const prediction = await predictRes.json();
      console.log(`✅ Group Score: ${prediction.group_score}/100`);
      console.log(`   Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
      console.log(`   Insights: ${prediction.insights.join(', ')}`);
      if (prediction.warnings.length > 0) {
        console.log(`   Warnings: ${prediction.warnings.join(', ')}`);
      }
    } else {
      const error = await predictRes.json();
      console.log('❌', error);
    }
    console.log('');

    // 4. Create event
    console.log('4. Creating event...');
    const eventRes = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Hackathon Team Formation',
        description: 'Forming teams for Series Hackathon',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        hostId: 'user_0',
        guestIds: profiles.slice(1),
      }),
    });

    if (eventRes.ok) {
      const event = await eventRes.json();
      console.log(`✅ Event created: ${event.id}`);
      console.log(`   Title: ${event.title}`);
      console.log(`   Guests: ${event.guest_ids.length}`);
    } else {
      const error = await eventRes.json();
      console.log('❌', error);
    }

    console.log('\n✅ Demo complete!');
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

demo();

