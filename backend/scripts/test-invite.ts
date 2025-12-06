#!/usr/bin/env tsx
/**
 * Test script for invitation functionality
 * Tests that demo phone numbers are used correctly
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function testInvitations() {
  console.log('🧪 Testing Invitation Functionality\n');

  // Step 1: Create a test event
  console.log('1️⃣ Creating test event...');
  const createEventResponse = await fetch(`${API_URL}/api/events-frontend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Hackathon Event',
      description: 'Testing demo phone number functionality',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      host: 'test-host',
      type: 'private',
      maxAttendees: 10,
      guests: [
        { userId: 'user-1', name: 'Test User 1' },
        { userId: 'user-2', name: 'Test User 2' },
      ],
    }),
  });

  if (!createEventResponse.ok) {
    console.error('❌ Failed to create event:', await createEventResponse.text());
    process.exit(1);
  }

  const event = await createEventResponse.json();
  console.log(`✅ Event created: ${event.id}`);
  console.log(`   Title: ${event.title}`);
  console.log(`   Full response:`, JSON.stringify(event, null, 2).substring(0, 200) + '...\n');

  // Get the backend event ID (might be stored differently)
  // The frontend event might have a different ID format, check if there's a backend event
  let eventId = event.id;
  
  // Try to get the event from backend to find the correct ID
  try {
    const backendEventResponse = await fetch(`${API_URL}/api/events-frontend/${event.id}`);
    if (backendEventResponse.ok) {
      const backendEvent = await backendEventResponse.json();
      eventId = backendEvent.id || event.id;
      console.log(`   Using event ID: ${eventId}\n`);
    }
  } catch (e) {
    console.log(`   Using original event ID: ${eventId}\n`);
  }

  // Step 2: Send invitations
  console.log('2️⃣ Sending invitations...');
  console.log('   Expected: Invites should go to +14843693839 and +19178615579');
  console.log('   (regardless of what guests are selected)\n');

  const inviteResponse = await fetch(`${API_URL}/api/events-frontend/${eventId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invites: [
        { userId: 'user-1', phoneNumber: '+1234567890', name: 'Test User 1' },
        { userId: 'user-2', phoneNumber: '+0987654321', name: 'Test User 2' },
      ],
    }),
  });

  if (!inviteResponse.ok) {
    console.error('❌ Failed to send invitations:', await inviteResponse.text());
    process.exit(1);
  }

  const inviteResult = await inviteResponse.json();
  console.log('✅ Invitation response received:');
  console.log(JSON.stringify(inviteResult, null, 2));
  console.log('\n');

  // Step 3: Verify demo phone numbers
  console.log('3️⃣ Verifying demo phone numbers...');
  const sentPhones = inviteResult.invitations?.map((inv: any) => inv.phoneNumber) || [];
  const expectedPhones = ['+14843693839', '+19178615579'];

  let allCorrect = true;
  for (const expectedPhone of expectedPhones) {
    if (sentPhones.includes(expectedPhone)) {
      console.log(`   ✅ ${expectedPhone} - Correct`);
    } else {
      console.log(`   ❌ ${expectedPhone} - Missing!`);
      allCorrect = false;
    }
  }

  // Check for unexpected phone numbers
  for (const sentPhone of sentPhones) {
    if (!expectedPhones.includes(sentPhone)) {
      console.log(`   ⚠️  ${sentPhone} - Unexpected!`);
      allCorrect = false;
    }
  }

  console.log('\n');
  if (allCorrect && sentPhones.length === expectedPhones.length) {
    console.log('🎉 All tests passed! Demo phone numbers are working correctly.');
  } else {
    console.log('❌ Test failed! Phone numbers do not match expected values.');
    process.exit(1);
  }
}

// Run test
testInvitations().catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});

