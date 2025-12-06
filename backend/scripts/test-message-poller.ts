import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const SERIES_API_BASE_URL = process.env.SERIES_API_BASE_URL || 
  'https://series-hackathon-service-202642739529.us-east1.run.app';
const SERIES_API_KEY = process.env.SERIES_API_KEY;
const SERIES_SENDER_PHONE = process.env.SERIES_SENDER_PHONE;

if (!SERIES_API_KEY || !SERIES_SENDER_PHONE) {
  console.error('❌ SERIES_API_KEY and SERIES_SENDER_PHONE required in .env');
  process.exit(1);
}

const api = axios.create({
  baseURL: SERIES_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERIES_API_KEY}`,
  },
  timeout: 30000,
});

async function testSeriesAPI() {
  console.log('🧪 Testing Series API Access...\n');
  console.log(`API Base URL: ${SERIES_API_BASE_URL}`);
  console.log(`Sender Phone: ${SERIES_SENDER_PHONE}\n`);

  // Test 1: Check if we can access chats
  console.log('📋 Test 1: Getting chats...');
  try {
    const chatsResponse = await api.get('/api/chats');
    const chats = chatsResponse.data?.data || chatsResponse.data || [];
    console.log(`✅ Found ${Array.isArray(chats) ? chats.length : 0} chats`);
    if (Array.isArray(chats) && chats.length > 0) {
      console.log('Sample chat:', JSON.stringify(chats[0], null, 2).substring(0, 200));
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.response?.status || error.message}`);
    if (error.response?.data) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2).substring(0, 200));
    }
  }

  console.log('\n📋 Test 2: Getting chats for sender phone...');
  try {
    const senderChatsResponse = await api.get('/api/chats', {
      params: {
        phone_number: SERIES_SENDER_PHONE,
      },
    });
    const senderChats = senderChatsResponse.data?.data || senderChatsResponse.data || [];
    console.log(`✅ Found ${Array.isArray(senderChats) ? senderChats.length : 0} chats for sender`);
  } catch (error: any) {
    console.log(`❌ Error: ${error.response?.status || error.message}`);
  }

  console.log('\n📋 Test 3: Getting messages...');
  try {
    const messagesResponse = await api.get('/api/messages', {
      params: {
        recipient: SERIES_SENDER_PHONE,
        limit: 5,
      },
    });
    const messages = messagesResponse.data?.data || messagesResponse.data || [];
    console.log(`✅ Found ${Array.isArray(messages) ? messages.length : 0} messages`);
    if (Array.isArray(messages) && messages.length > 0) {
      console.log('Sample message:', JSON.stringify(messages[0], null, 2).substring(0, 300));
    }
  } catch (error: any) {
    console.log(`⚠️  Messages endpoint not available: ${error.response?.status || error.message}`);
    console.log('   (This is okay - poller will try multiple endpoints)');
  }

  console.log('\n📋 Test 4: Testing inbound message endpoint...');
  try {
    const testResponse = await axios.post('http://localhost:3001/api/inbound-message', {
      sender_phone: '+14843693839',
      text: 'Test message - Create dinner Friday with Alex',
      chat_id: 12345,
      timestamp: new Date().toISOString(),
    });
    console.log('✅ Inbound message endpoint responded:', testResponse.data);
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Backend not running on port 3001');
      console.log('   Start it with: cd backend && npm run dev');
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Testing Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Next Steps:');
  console.log('   1. Make sure backend is running: cd backend && npm run dev');
  console.log('   2. Check logs for: "Message poller started"');
  console.log('   3. Send a real message to your Series sender phone');
  console.log('   4. Watch backend logs for message processing\n');
}

testSeriesAPI().catch(console.error);
