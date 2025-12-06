# Kafka-Based Message Processing (No Webhooks Required)

This guide explains how the system processes inbound messages using Kafka polling instead of webhooks.

## How It Works

Instead of using webhooks, the system uses **two approaches** to receive and process messages:

### Approach 1: Message Poller (Active Polling)

The `MessagePoller` service polls the Series API every 5 seconds for new messages sent to your sender phone number.

**Flow:**
1. Poller calls Series API: `/api/chats` or `/api/messages`
2. Checks for new messages to your sender phone
3. When new message found, processes it through Vibe AI agent
4. Responds automatically via iMessage

**Advantages:**
- ✅ No webhook configuration needed
- ✅ Works with any Series API setup
- ✅ Simple and reliable
- ✅ Automatic retry on errors

**Configuration:**
- Automatically starts if `SERIES_API_KEY` and `SERIES_SENDER_PHONE` are set
- Polls every 5 seconds (configurable)
- Only processes new messages (tracks last message ID)

### Approach 2: Kafka Consumer (If Message Text Available)

The existing Kafka consumer processes message metadata for building profiles. If Kafka messages include message text (not just metadata), you can extend it to also handle conversational AI.

**Note:** Current implementation filters out message content for privacy. If Series provides message text in Kafka with proper permissions, you can enable it.

## Setup

### Prerequisites

1. **Series API Credentials** (required for poller):
   ```bash
   SERIES_API_KEY=your_api_key
   SERIES_SENDER_PHONE=+16463230991
   SERIES_API_BASE_URL=https://series-hackathon-service-202642739529.us-east1.run.app
   USE_SERIES_API=true
   ```

2. **Anthropic API Key** (required for AI):
   ```bash
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

### Starting the Service

Just start your backend server:

```bash
cd backend
npm run dev
```

The message poller will automatically start if credentials are configured!

You'll see:
```
✓ Message poller started - checking for new messages every 5 seconds
  No webhook configuration needed!
```

## How Messages Are Processed

### Step 1: Message Detection

The poller checks Series API for:
- Messages in chats with your sender phone
- New messages since last poll
- Messages from other users (not your own)

### Step 2: Intent Classification

Each message is processed through Claude AI to classify intent:
- `create_event`: User wants to create an event
- `rsvp`: User responding to invitation
- `query`: User asking about events
- `cancel_event`: User wants to cancel event

### Step 3: Action Execution

Based on intent:
- **Create Event**: Creates event, calculates chemistry, sends invites
- **RSVP**: Updates RSVP status, notifies host
- **Query**: Returns list of events/invites
- **Cancel**: Cancels event, notifies guests

### Step 4: Response

Automatically sends response back via iMessage using Series API.

## API Endpoints Used

The poller tries multiple Series API endpoints to find messages:

1. `/api/chats?phone_number={sender}` - Get chats
2. `/api/messages?recipient={sender}` - Get messages
3. `/api/chats` - List all chats
4. `/api/chats/{chatId}/chat_messages` - Get messages in chat

## Monitoring

### Check Poller Status

Look for these log messages:

```
MessagePoller: Processing new message
  sender: +1234567890
  textLength: 25
```

```
MessagePoller: Sent response via iMessage
```

### View Polling Activity

The poller logs:
- When it finds new messages
- When it processes messages
- Any errors during polling
- API endpoint responses

## Troubleshooting

### Poller Not Starting

**Check:**
- `SERIES_API_KEY` is set in `.env`
- `SERIES_SENDER_PHONE` is set in `.env`
- `USE_SERIES_API=true` in `.env`

**Look for:**
```
MessagePoller: Initialized with Series API
MessagePoller: Starting to poll for messages every 5000ms
```

### No Messages Being Processed

1. **Verify messages exist:**
   - Send a test message to your sender phone
   - Check Series API directly if possible

2. **Check API endpoints:**
   - Poller tries multiple endpoints
   - Check logs for which endpoints work
   - May need to adjust endpoint paths based on Series API

3. **Check message format:**
   - Poller expects `sender_phone`, `text`, `chat_id`
   - If Series API uses different field names, update `processMessage()` in `messagePoller.ts`

### Response Not Sent

**Check:**
- InvitationService is enabled
- Series API credentials are valid
- Check logs for send errors

**Look for:**
```
MessagePoller: Error processing message
InvitationService: Error sending message
```

## Customization

### Change Poll Interval

In `messagePoller.ts`, modify:

```typescript
private pollIntervalMs: number = 5000; // Change to desired milliseconds
```

**Recommendations:**
- **Development:** 5-10 seconds
- **Production:** 2-5 seconds (balance responsiveness vs API rate limits)

### Filter Messages

You can add filtering logic in `processMessage()`:

```typescript
// Skip messages that don't mention events
if (!text.toLowerCase().includes('event') && 
    !text.toLowerCase().includes('dinner') &&
    !text.toLowerCase().includes('meeting')) {
  return; // Skip this message
}
```

### Handle Different Message Formats

If Series API uses different field names, update the extraction logic:

```typescript
const senderPhone = message.sender_phone || 
                   message.from_phone ||      // Add alternative
                   message.phone;             // Add alternative
```

## Comparison: Polling vs Webhooks

| Feature | Polling (Current) | Webhooks |
|---------|------------------|----------|
| Setup | ✅ Automatic | ❌ Manual configuration |
| Reliability | ✅ Always works | ⚠️ Requires public URL |
| Latency | ~2.5s average | <1s |
| Rate Limits | ⚠️ API dependent | ✅ No limits |
| Complexity | ✅ Simple | ⚠️ More complex |

## Future Enhancements

1. **Kafka Integration**: If Series provides message text in Kafka, process there
2. **WebSocket Support**: If Series offers WebSocket, use for real-time messages
3. **Smart Polling**: Increase poll frequency when recent activity detected
4. **Message Batching**: Process multiple messages in one batch

## API Response Format Examples

The poller handles various response formats. If you see errors, check what format Series API returns and update accordingly:

### Example 1: Chat List
```json
{
  "data": [
    {
      "id": 123,
      "phone_numbers": ["+1234567890"],
      "last_message": {
        "text": "Create dinner Friday",
        "sender": "+1234567890"
      }
    }
  ]
}
```

### Example 2: Messages List
```json
{
  "data": [
    {
      "id": 456,
      "text": "Create dinner Friday",
      "sender_phone": "+1234567890",
      "chat_id": 123,
      "timestamp": "2024-12-13T20:00:00Z"
    }
  ]
}
```

## Summary

✅ **No webhooks needed** - Polling handles everything  
✅ **Automatic processing** - Messages processed as they arrive  
✅ **Simple setup** - Just configure API credentials  
✅ **Works immediately** - Start backend and it's ready!

The system will automatically poll for messages and process them through your conversational AI. Just make sure your Series API credentials are configured!
