# Demo Guide - Series Events Platform

## How the Demo Works

The platform has **two modes** that work seamlessly:

### 🎯 Mode 1: With Series Credentials (Real Integration)

When you provide Series API credentials in `.env`:

**Kafka Integration:**
- ✅ Connects to Series Kafka cluster with SASL_SSL
- ✅ Consumes real message metadata in real-time
- ✅ Automatically builds communication profiles as messages arrive
- ✅ Updates social graph with user connections
- ✅ Logs messages to `kafka-messages.log` for inspection

**iMessage API Integration:**
- ✅ Sends real iMessage invitations when creating events
- ✅ Uses actual phone number (+16463230991) as sender
- ✅ Recipients receive real iMessages with event details

**User Flow:**
1. Start backend → Connects to Kafka automatically
2. Messages stream in → Profiles build automatically
3. Create event in frontend → Add guests
4. Click "Send Invitations" → Real iMessages sent
5. Recipients get iMessage → Can RSVP via link

---

### 🎭 Mode 2: Without Credentials (Mock Mode)

When credentials are missing or `USE_SERIES_API=false`:

**Mock Data:**
- ✅ Generates realistic mock message data (10 users, 30 days)
- ✅ Builds communication profiles from mock data
- ✅ Creates realistic social graphs
- ✅ All chemistry predictions work normally

**Mock Invitations:**
- ✅ API accepts invitation requests
- ✅ Returns success response (but doesn't send real messages)
- ✅ Logs what would be sent (for demo purposes)

**User Flow:**
1. Start backend → Generates mock data automatically
2. Profiles are ready immediately (10 mock users)
3. Create event in frontend → Add guests
4. Click "Send Invitations" → Shows success (mock mode)
5. Can demonstrate full flow without real messages

---

## Demo Scenarios

### Scenario A: Full Real Integration Demo

**Setup:**
```bash
# In backend/.env
USE_SERIES_API=true
SERIES_API_KEY=fb6a6562-5629-42e8-9b36-3bef372fc99d
SERIES_SENDER_PHONE=+16463230991
SERIES_KAFKA_BROKERS=pkc-619z3.us-east1.gcp.confluent.cloud:9092
SERIES_KAFKA_TOPIC=team.team.6135e93cffe245169148f11402bb3476
SERIES_KAFKA_GROUP_ID=team-cg-6135e93cffe245169148f11402bb3476
SERIES_KAFKA_CLIENT_ID=team-client-6135e93cffe245169148f11402bb3476
SERIES_KAFKA_SASL_USERNAME=QRHNR6BCKVHD4M3U
SERIES_KAFKA_SASL_PASSWORD=cfltTIivf3OHq6tr9fpASLxV4pp7vzPfvnz3cwT8+NAoOAJUCZwRuxuk1sSZTK+w
```

**Demo Steps:**
1. **Show Kafka Connection:**
   ```bash
   cd backend && npm run dev
   # Look for: "✓ Kafka consumer connected (Series credentials)"
   ```

2. **Show Real-Time Profile Building:**
   - Watch console logs: "Processing X Kafka messages for profile building"
   - Explain: "As messages stream in, we're building profiles in real-time"

3. **Show Chemistry Prediction:**
   - Open frontend
   - Create an event
   - Add multiple guests
   - Show chemistry scores being calculated from real data

4. **Show Real iMessage Sending:**
   - Click "Send Invitations"
   - Show phone receiving actual iMessage
   - Show event details in message

**Talking Points:**
- ✅ "We're consuming real message metadata from Series Kafka"
- ✅ "Profiles update automatically as new messages arrive"
- ✅ "All predictions use actual communication patterns"
- ✅ "Invitations sent via Series iMessage API"

---

### Scenario B: Mock Mode Demo (If Kafka Unavailable)

**Setup:**
```bash
# In backend/.env - just don't set USE_SERIES_API or set it to false
USE_SERIES_API=false
# OR simply omit credentials
```

**Demo Steps:**
1. **Show Mock Data Generation:**
   ```bash
   cd backend && npm run dev
   # Look for: "Generated 300 mock messages"
   # Look for: "✓ 10 profiles built from mock data"
   ```

2. **Show Pre-built Profiles:**
   - Explain: "We've generated realistic mock data showing 10 users"
   - Show chemistry predictions working
   - Show social graph visualization

3. **Show Mock Invitations:**
   - Create event with guests
   - Click "Send Invitations"
   - Show success response (explain it's in mock mode)
   - Show logs: "Mock mode - Series API not configured"

**Talking Points:**
- ✅ "We can demo the full platform with realistic mock data"
- ✅ "All algorithms work the same way"
- ✅ "When connected to real Kafka, profiles build automatically"
- ✅ "Invitations would be sent via real iMessage API"

---

## Key Demo Highlights

### 1. **Privacy-First Architecture**
```
✓ NO message content stored
✓ Only metadata (timestamps, lengths, IDs)
✓ All user IDs are hashed
✓ Phone numbers only used for sending invites
```

### 2. **Real-Time Profile Building**
```
Kafka Messages → Batch Processing → Profile Updates
Every 5 seconds, new messages are processed
Profiles update automatically
No manual intervention needed
```

### 3. **Chemistry Prediction**
```
Communication Profiles → Graph Analysis → Chemistry Scores
- Response time patterns
- Activity levels
- Social connections
- Communication style
```

### 4. **End-to-End Integration**
```
Event Creation → Guest Selection → Chemistry Analysis → Invitation Sending
All connected via Series APIs
Real iMessage delivery
RSVP tracking
```

---

## Troubleshooting for Demo

### Kafka Connection Issues

**Problem:** "Failed to connect to Kafka"
**Solution:**
- Check credentials in `.env`
- Verify network connectivity
- Use mock mode: Set `USE_SERIES_API=false`
- Demo still works with mock data!

### No Messages in Kafka

**Problem:** Kafka connected but no messages
**Solution:**
- This is normal if stream is sparse
- Use mock mode for reliable demo
- Show logs: "kafka-messages.log" to inspect format
- Explain: "In production, messages stream continuously"

### iMessage API Not Working

**Problem:** Invitations not sending
**Solution:**
- Check API key and sender phone
- Verify phone number format (E.164)
- Mock mode still shows full flow
- Test with: `npm run test:imessage +1234567890`

---

## What Makes This Demo Stand Out

### ✅ **Real Integration**
- Not just a prototype - actually uses Series APIs
- Real Kafka consumption
- Real iMessage sending

### ✅ **Privacy Built-In**
- Explain privacy-first approach
- Show that no content is stored
- Demonstrate GDPR compliance features

### ✅ **Intelligent Predictions**
- Show chemistry scores
- Explain the algorithm
- Demonstrate group optimization

### ✅ **End-to-End Flow**
- Event creation → Invitations → RSVPs
- All connected
- Real-world usability

---

## Quick Start for Demo

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Open browser
open http://localhost:5173
```

**Demo Checklist:**
- [ ] Backend starts successfully
- [ ] Kafka connects (or mock data generates)
- [ ] Frontend loads
- [ ] Can create event
- [ ] Can add guests
- [ ] Chemistry scores calculate
- [ ] Can send invitations (real or mock)
- [ ] Can view event details

---

## Questions to Answer in Demo

**Q: How do you protect user privacy?**
A: We only store message metadata (timestamps, lengths, IDs). No content is ever stored. All IDs are hashed. Phone numbers only used for sending invites.

**Q: How real-time is this?**
A: Profiles update every 5 seconds as new messages arrive from Kafka. In production, this is continuous and automatic.

**Q: What if Kafka is down?**
A: System gracefully falls back to mock data. All features work, just with generated data instead of real streams.

**Q: How accurate are the predictions?**
A: Based on communication patterns, social graph analysis, and activity metrics. Scores reflect actual interaction patterns.

**Q: Can this scale?**
A: Yes - Kafka handles high throughput, profiles are built incrementally, and the system is designed for production scale.

