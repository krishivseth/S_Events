# Conversational Event Management via Series Bot

This document describes the conversational event management feature that allows users to create and manage events via iMessage using natural language.

## Overview

Users can now interact with Vibe (Series Events) through text messages via the Series iMessage API. The system uses Claude AI (Anthropic) to understand natural language intents and route requests appropriately.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (via iMessage)                      │
│  "Create a founder dinner Friday 7pm with Alex and Sarah"   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              POST /api/inbound-message                       │
│              (Series API Webhook)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    VIBE AI AGENT                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Intent Classifier (Claude Sonnet 4)                │   │
│  │  → create_event                                     │   │
│  │  → rsvp                                             │   │
│  │  → update_event                                     │   │
│  │  → cancel_event                                     │   │
│  │  → query                                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Event Service (CRUD + Chemistry)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
          ▼                           ▼
┌──────────────────────┐    ┌──────────────────────┐
│  EVENT SERVICE      │    │  INVITATION SERVICE  │
│  (Create/Update)    │    │  (Send iMessages)    │
└──────────────────────┘    └──────────────────────┘
```

## Features

### 1. Create Events via Text

**Example:**
```
User: "Create a dinner with Alex and Jordan this Friday at 8pm"

Vibe: "✅ Created 'Dinner' for Friday, Dec 13 at 8:00 PM!

🔥 Group chemistry score: 87%

This group is going to vibe HARD.

📨 Sending invites to 2 people now...

I'll keep you posted on RSVPs!"
```

**Supported formats:**
- "Create dinner Friday with Alex and Sarah"
- "Plan a meeting tomorrow at 2pm with John"
- "Organize lunch next Monday at noon with the team"

### 2. RSVP via Text

**Example:**
```
Vibe: "Hey Alex! 👋

Sarah is hosting 'Dinner' on Friday, Dec 13 at 8:00 PM.

Your VibeCheck with this group: 87% ✨

Interested? Reply YES, NO, or MAYBE"

Alex: "Yes!"

Vibe: "🎉 Awesome! You're confirmed for 'Dinner' on Friday, Dec 13.

See you there!"
```

**Supported responses:**
- "yes", "I'm in", "going", "confirm", "count me in"
- "no", "can't", "cannot", "decline", "sorry"
- "maybe", "might"

### 3. Query Events

**Example:**
```
User: "What events do I have?"

Vibe: "📅 Your Events:

Hosting (2):
• "Dinner" - 12/13/2024 (1 confirmed)
• "Team Meeting" - 12/20/2024 (3 confirmed)

Pending Invites (1):
• "Hackathon" - 12/15/2024"
```

### 4. Cancel Events

**Example:**
```
User: "Cancel the dinner on Friday"

Vibe: "✅ Cancelled 'Dinner'. I've notified all 2 guests."
```

## Setup

### Environment Variables

Add to your `.env` file:

```bash
# Claude AI (Anthropic) - Required for conversational features
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Series iMessage API - Already configured
SERIES_API_KEY=your_series_api_key
SERIES_SENDER_PHONE=+16463230991
SERIES_API_BASE_URL=https://series-hackathon-service-202642739529.us-east1.run.app
USE_SERIES_API=true
```

### Installing Dependencies

```bash
cd backend
npm install
```

This will install:
- `@anthropic-ai/sdk` - Claude AI SDK
- `googleapis` - Google Calendar integration (optional)
- `google-auth-library` - Google OAuth (optional)

## API Endpoint

### POST /api/inbound-message

Receives inbound messages from the Series API webhook.

**Request Body:**
```json
{
  "sender_phone": "+1234567890",
  "text": "Create dinner Friday with Alex",
  "chat_id": 12345,
  "timestamp": "2024-12-13T20:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message processed",
  "response_sent": true
}
```

The AI agent will:
1. Classify the intent using Claude AI
2. Process the request (create event, update RSVP, etc.)
3. Send a response back via iMessage
4. Return 200 OK to the Series API

## Intent Classification

The system uses Claude Sonnet 4 to classify user intents. If Claude is unavailable, it falls back to keyword matching.

**Supported Intents:**
- `create_event` - Create a new event
- `rsvp` - Respond to an invitation
- `update_event` - Modify an existing event (coming soon)
- `cancel_event` - Cancel an event
- `query` - Ask about events or chemistry scores
- `unknown` - Unclear intent (returns helpful message)

## Date Parsing

The system supports various date formats:
- Relative: "today", "tomorrow", "Friday", "next Monday"
- Absolute: "Dec 15", "2024-12-15", "12/15/2024"

Times are parsed in 24-hour format: "19:00", "8pm" → "20:00"

## Guest Resolution

For demo purposes, guest names are matched against demo profiles:
- "Alex" or "Alex Thompson" → +1 9178615579
- "Sarah" or "Sarah Kim" → +1 (484) 369-3839

In production, this would use the user's contact list.

## Chemistry Calculation

Group chemistry scores are calculated when creating events. The score is included in:
- Event creation confirmation
- Invitation messages to guests
- Event queries

## Limitations (MVP)

1. **Google Calendar Integration** - Not yet implemented (planned)
2. **Calendar Change Detection** - Not yet implemented (stretch goal)
3. **Guest Name Resolution** - Currently uses demo profiles only
4. **Event Updates** - Limited support (use web app for complex updates)

## Testing

To test the conversational feature:

1. Send a message to your Series sender phone number from another phone
2. The message will be received via the `/api/inbound-message` endpoint
3. Check the backend logs to see intent classification and processing
4. You should receive a response via iMessage

### Manual Test

You can also test manually using curl:

```bash
curl -X POST http://localhost:3001/api/inbound-message \
  -H "Content-Type: application/json" \
  -d '{
    "sender_phone": "+14843693839",
    "text": "Create dinner Friday with Alex",
    "chat_id": 12345,
    "timestamp": "2024-12-13T20:00:00Z"
  }'
```

## Future Enhancements

1. **Google Calendar Sync** - Two-way sync between Vibe and Google Calendar
2. **Calendar Change Detection** - Detect when users change events in their calendar
3. **Smart Notifications** - Proactive reminders and updates
4. **Multi-user Events** - Support for adding guests after initial creation
5. **Location Intelligence** - Suggest locations based on attendee locations
6. **Weather Integration** - Consider weather for outdoor events

## Troubleshooting

### Claude AI Not Working

If you see fallback intent classification logs, check:
- `ANTHROPIC_API_KEY` is set correctly
- API key has credits available
- Network connectivity

### Messages Not Received

1. Verify Series API webhook is configured to point to your server
2. Check that `/api/inbound-message` endpoint is accessible
3. Review backend logs for errors

### Intent Misclassification

- The system falls back to keyword matching if Claude fails
- You can improve classification by being more explicit: "create event" vs just "dinner"
- Check logs to see the confidence score of intent classification

## Demo Script

For your hackathon demo:

1. **Show Problem** (0-10s): "Event planning is broken. Group texts are chaos."

2. **Show Solution** (10-20s): "Just text Vibe: 'Create dinner Friday with Alex and Jordan'"

3. **Live Demo** (20-35s):
   - Send text message from phone
   - Show Vibe responds with VibeCheck (87%)
   - Show invites sent automatically
   - Show RSVP flow

4. **Magic Moment** (35-45s):
   - Guest responds "yes" via text
   - Show host receives confirmation
   - Show event appears in web app

5. **Impact** (45-60s):
   - "Zero UI. Zero friction. Just conversation."
   - "The future of events: chemistry + automation + human touch."
