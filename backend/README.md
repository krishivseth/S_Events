# Series Events Backend

Backend service for **Series Events** - an event planning platform that predicts group chemistry for hackathons and events.

## 🔒 Privacy First

**NO message content is ever stored or accessed.** Only metadata is used:
- Timestamps
- Message lengths
- Sender/recipient IDs (hashed)
- Conversation IDs (hashed)

## Architecture

```
Kafka Stream → Consumer → Profile Builder → Chemistry Engine → API Layer → Frontend
```

## Quick Start

### Development (Mock Data)

```bash
npm install
npm run dev
```

Server runs on `http://localhost:3001`

### With Kafka

Set environment variables:
```bash
export KAFKA_BROKERS=kafka1:9092,kafka2:9092
export KAFKA_TOPIC=series-messages
export USE_KAFKA=true
npm run dev
```

### Docker

```bash
docker-compose up
```

## API Endpoints

### Health
- `GET /api/health` - Health check

### Profiles
- `GET /api/profile/:userId` - Get user's communication profile

### Chemistry Prediction
- `POST /api/chemistry/predict` - Predict group chemistry
  ```json
  {
    "userIds": ["user_1", "user_2", "user_3"]
  }
  ```

- `POST /api/chemistry/optimize` - Optimize guest list
  ```json
  {
    "userIds": ["user_1", "user_2", "user_3"],
    "targetScore": 80
  }
  ```

### Events
- `POST /api/events` - Create event
- `GET /api/events/:eventId` - Get event
- `GET /api/events/user/:userId` - Get user's events
- `POST /api/events/:eventId/invite` - Send invitations

### Privacy (GDPR)
- `GET /api/privacy/export/:userId` - Export user data
- `DELETE /api/privacy/delete/:userId` - Delete user data

## Chemistry Prediction Algorithm

The core algorithm evaluates:

1. **Pairwise Compatibility**
   - Response time similarity
   - Activity time overlap
   - Communication style balance
   - Energy level compatibility

2. **Group-Level Factors**
   - Social catalyst presence (connectors)
   - Conversation dominators (potential conflict)
   - Energy balance distribution
   - Communication style diversity

3. **Scoring**
   - Base score: 70 (neutral)
   - Catalysts: +5 per catalyst (max +15)
   - Multiple dominators: -15
   - Energy balance: +0 to +10
   - Activity overlap: +0 to +10
   - Style diversity: +0 to +5

## Environment Variables

### Server Configuration
- `PORT` - Server port (default: 3001)
- `LOG_LEVEL` - Logging level (default: info)
- `FRONTEND_URL` - CORS origin (default: *)

### Series iMessage API
- `SERIES_API_KEY` - Series API key for iMessage service
- `SERIES_SENDER_PHONE` - Phone number to send from (E.164 format, e.g., +1234567890)
- `SERIES_API_BASE_URL` - API base URL (defaults to hackathon service)
- `USE_SERIES_API` - Enable Series API integration (default: false)

### Series Kafka (Confluent Cloud)
- `SERIES_KAFKA_BROKERS` - Comma-separated broker URLs (e.g., `pkc-xxx.us-east1.gcp.confluent.cloud:9092`)
- `SERIES_KAFKA_TOPIC` - Topic name
- `SERIES_KAFKA_GROUP_ID` - Consumer group ID
- `SERIES_KAFKA_CLIENT_ID` - Client ID
- `SERIES_KAFKA_API_KEY` - Confluent Cloud API key (for SASL_SSL auth)
- `SERIES_KAFKA_API_SECRET` - Confluent Cloud API secret

### Legacy Kafka (fallback)
- `KAFKA_BROKERS` - Comma-separated Kafka broker URLs
- `KAFKA_TOPIC` - Kafka topic name
- `KAFKA_GROUP_ID` - Consumer group ID
- `KAFKA_CLIENT_ID` - Client ID
- `USE_KAFKA` - Enable Kafka consumer (default: false)

## Testing

```bash
npm test
```

## Project Structure

```
backend/
├── src/
│   ├── services/       # Core services
│   │   ├── kafkaConsumer.ts
│   │   ├── profileBuilder.ts
│   │   ├── graphAnalyzer.ts
│   │   ├── chemistryPredictor.ts
│   │   └── eventService.ts
│   ├── models/         # TypeScript interfaces
│   ├── api/            # Express routes
│   ├── utils/          # Utilities (privacy, logging)
│   └── index.ts        # Entry point
├── tests/              # Test files
└── docker-compose.yml
```

## Hackathon Demo

For the demo, the backend:
- ✅ Works with mock data (no Kafka required)
- ✅ Generates realistic communication profiles
- ✅ Predicts chemistry in <500ms
- ✅ Demonstrates privacy guarantees
- ✅ Provides clean API for frontend

## License

Built for Series Hackathon 2024

