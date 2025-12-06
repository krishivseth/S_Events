# Series Events - AI-Powered Event Planning Platform

Event planning platform with group chemistry prediction and conversational AI assistant.

## 🚀 Features

- **Chemistry Prediction**: AI-powered analysis of group compatibility
- **Conversational AI**: Create and manage events via iMessage with Vibe bot
- **Smart Invitations**: Personalized event invitations via iMessage
- **Privacy-First**: No message content stored, only metadata
- **Real-time Polling**: Automatic message detection (no webhooks needed)
- **Kafka Integration**: Stream message metadata for profile building

## 📁 Project Structure

```
Series/
├── backend/          # Node.js/Express backend
│   ├── src/
│   │   ├── api/      # REST API routes
│   │   ├── models/   # Data models
│   │   ├── services/ # Business logic
│   │   └── utils/    # Utilities
│   ├── scripts/      # Test scripts
│   └── tests/        # Unit tests
│
├── frontend/         # React/TypeScript frontend
│   ├── src/
│   │   ├── pages/    # App pages
│   │   ├── components/ # UI components
│   │   ├── services/ # API client
│   │   └── contexts/ # React contexts
│
└── docs/             # Documentation
    ├── DEMO_GUIDE.md
    ├── CONVERSATIONAL_EVENTS.md
    └── KAFKA_MESSAGE_PROCESSING.md
```

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or bun
- Series API credentials (for iMessage & Kafka)

### Installation

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Configuration

1. Create `backend/.env`:
```bash
# Series iMessage API
SERIES_API_KEY=your-api-key
SERIES_SENDER_PHONE=+16463230991
SERIES_API_BASE_URL=https://series-hackathon-service-202642739529.us-east1.run.app
USE_SERIES_API=true

# Series Kafka
SERIES_KAFKA_BROKERS=pkc-619z3.us-east1.gcp.confluent.cloud:9092
SERIES_KAFKA_TOPIC=team.team.6135e93cffe245169148f11402bb3476
SERIES_KAFKA_GROUP_ID=team-cg-6135e93cffe245169148f11402bb3476
SERIES_KAFKA_CLIENT_ID=team-client-6135e93cffe245169148f11402bb3476
SERIES_KAFKA_SASL_USERNAME=your-username
SERIES_KAFKA_SASL_PASSWORD=your-password

# Anthropic AI (Claude)
ANTHROPIC_API_KEY=your-anthropic-key
```

2. Create `frontend/.env`:
```bash
VITE_API_URL=http://localhost:3001/api
VITE_USE_BACKEND=true
```

### Run Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

## 📱 Demo Users

For testing, use these phone numbers:

- **Guest 1 (Sarah Kim)**: +14843693839
  - Login: `+14843693839` / Password: `123`

- **Guest 2 (Alex Thompson)**: +19178615579
  - Login: `+19178615579` / Password: `123`

## 🤖 Conversational AI (Vibe Bot)

Send iMessages to `+16463230991` from the demo phone numbers:

```
"Create dinner Friday at 7pm with Sarah"
"Yes I will attend"
"What events do I have?"
"Cancel the dinner event"
```

The bot responds within 3-6 seconds with natural language.

## 📚 Documentation

- [DEMO_GUIDE.md](./DEMO_GUIDE.md) - Demo walkthrough
- [CONVERSATIONAL_EVENTS.md](./CONVERSATIONAL_EVENTS.md) - AI agent architecture
- [KAFKA_MESSAGE_PROCESSING.md](./KAFKA_MESSAGE_PROCESSING.md) - Message polling setup
- [backend/README.md](./backend/README.md) - Backend API docs
- [backend/SERIES_SETUP.md](./backend/SERIES_SETUP.md) - Series API configuration
- [backend/RATE_LIMITS.md](./backend/RATE_LIMITS.md) - Rate limit handling

## 🧪 Testing

```bash
# Test iMessage API
cd backend
npx tsx scripts/test-imessage.ts

# Test message poller
npx tsx scripts/test-message-poller.ts

# Test invitations
npx tsx scripts/test-invite.ts

# Run unit tests
npm test
```

## 🔒 Security

- **Authorization**: Only processes messages from authorized demo profiles
- **Topic Isolation**: Kafka consumer only reads from your team's topic
- **Privacy**: No message content stored, only metadata
- **Rate Limiting**: Automatic handling with retry logic

## 🛡️ Authorized Users

The bot only interacts with these phone numbers:
- `+14843693839` (Sarah Kim)
- `+19178615579` (Alex Thompson)

All other users are silently ignored.

## 🏗️ Technology Stack

### Backend
- Node.js + Express + TypeScript
- KafkaJS (Confluent Cloud)
- Anthropic Claude AI
- Winston (logging)
- Graphology (social graph analysis)

### Frontend
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- React Router
- Axios

## 📊 Architecture

```
User Phone → Series API → Message Poller (3s interval)
                          ↓
                    Vibe AI Agent (Claude)
                          ↓
                    Event Service
                          ↓
                    iMessage Response
```

## 🚢 Deployment

See [backend/README.md](./backend/README.md) for Docker deployment instructions.

## 📝 License

MIT

