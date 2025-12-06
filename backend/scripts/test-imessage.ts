/**
 * Test script for Series iMessage API
 * Tests sending a message to verify credentials and API connection
 */

import { loadSeriesCredentials } from '../src/models/SeriesConfig.js';
import { InvitationService } from '../src/services/invitationService.js';
import { logger } from '../src/utils/logger.js';

async function testIMessage() {
  console.log('🧪 Testing Series iMessage API Integration\n');

  // Load credentials
  const credentials = loadSeriesCredentials();

  if (!credentials) {
    console.error('❌ Series API credentials not found!');
    console.error('\nPlease set the following environment variables:');
    console.error('  SERIES_API_KEY=your-api-key');
    console.error('  SERIES_SENDER_PHONE=+1234567890');
    console.error('  SERIES_API_BASE_URL=https://series-hackathon-service-202642729529.us-east1.run.app');
    console.error('\nThen run: USE_SERIES_API=true npm run dev');
    process.exit(1);
  }

  console.log('✓ Credentials loaded:');
  console.log(`  API Base URL: ${credentials.apiBaseUrl}`);
  console.log(`  Sender Phone: ${credentials.senderPhone}`);
  console.log('');

  // Initialize service
  const invitationService = new InvitationService(credentials);

  if (!invitationService.isEnabled()) {
    console.error('❌ InvitationService not enabled');
    process.exit(1);
  }

  // Get test phone number from args or env
  const testPhone = process.argv[2] || process.env.TEST_PHONE;

  if (!testPhone) {
    console.error('❌ Test phone number required!');
    console.error('\nUsage:');
    console.error('  npm run test:imessage +1234567890');
    console.error('  or set TEST_PHONE environment variable');
    process.exit(1);
  }

  console.log(`📱 Testing with phone: ${testPhone}\n`);

  try {
    // Test 1: Check iMessage availability
    console.log('1. Checking iMessage availability...');
    const available = await invitationService.checkIMessageAvailability(testPhone);
    console.log(`   Result: ${available ? '✓ Available' : '✗ Not available'}\n`);

    // Test 2: Get or create chat
    console.log('2. Getting or creating chat...');
    const chat = await invitationService.getOrCreateChat(testPhone);
    if (!chat) {
      console.error('   ✗ Failed to get/create chat');
      process.exit(1);
    }
    console.log(`   ✓ Chat ID: ${chat.id}\n`);

    // Test 3: Send test message
    console.log('3. Sending test message...');
    const testMessage = `Hello! This is a test message from Series Events API integration. 🎉

If you receive this, the iMessage API integration is working correctly!

Timestamp: ${new Date().toISOString()}`;

    const sent = await invitationService.sendMessage(chat.id, testMessage);
    if (sent) {
      console.log('   ✓ Message sent successfully!');
      console.log('   📨 Check your phone for the test message.\n');
    } else {
      console.error('   ✗ Failed to send message');
      process.exit(1);
    }

    console.log('✅ All tests passed!');
    console.log('\nYour Series iMessage API integration is working correctly.');
    console.log('You can now use the /api/events/:eventId/invite endpoint to send event invitations.');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run test
testIMessage().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

