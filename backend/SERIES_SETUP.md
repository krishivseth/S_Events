# Series API Integration Setup Guide

## Quick Start

### 1. Get Credentials at Hackathon

You'll receive:
- Series iMessage API credentials (API key, sender phone)
- Kafka credentials (Confluent Cloud - brokers, topic, API key/secret)

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Server
PORT=3001
NODE_ENV=development

# Series iMessage API
SERIES_API_KEY=your-api-key-here
SERIES_SENDER_PHONE=+16463230991
SERIES_API_BASE_URL=https://series-hackathon-service-202642729529.us-east1.run.app
USE_SERIES_API=true

# Series Kafka (Confluent Cloud)
SERIES_KAFKA_BROKERS=pkc-619z3.us-east1.gcp.confluent.cloud:9092
SERIES_KAFKA_TOPIC=team.team.6135e93cffe245169148f11402bb3476
SERIES_KAFKA_GROUP_ID=team-cg-6135e93cffe245169148f11402bb3476
SERIES_KAFKA_CLIENT_ID=team-client-6135e93cffe245169148f11402bb3476
SERIES_KAFKA_SASL_USERNAME=QRHNR6BCKVHD4M3U
SERIES_KAFKA_SASL_PASSWORD=your-sasl-password-here
USE_SERIES_API=true

# Logging
LOG_LEVEL=info
```

### 3. Start the Server

```bash
cd backend
npm install
npm run dev
```

The server will:
- Connect to Kafka if credentials provided
- Enable iMessage API if credentials provided
- Fall back to mock mode if credentials missing

## Testing Integration

### Test iMessage API

```bash
npm run test:imessage +1234567890
```

Replace `+1234567890` with your test phone number.

### Test Kafka Consumer

Check logs for:
```
✓ Kafka consumer connected (Series credentials)
Processing batch of X messages
```

Messages will be logged to `kafka-messages.log` for inspection.

### Test Invitation Endpoint

```bash
curl -X POST http://localhost:3001/api/events/:eventId/invite \
  -H "Content-Type: application/json" \
  -d '{
    "invites": [
      {
        "phoneNumber": "+1234567890",
        "userId": "user-1",
        "name": "Test User"
      }
    ]
  }'
```

## Credential Format

### iMessage API
- `SERIES_API_KEY`: Your Series API key (Bearer token)
- `SERIES_SENDER_PHONE`: E.164 format (e.g., `+1234567890`)

### Kafka (Confluent Cloud)
- `SERIES_KAFKA_BROKERS`: Single broker or comma-separated list
- `SERIES_KAFKA_TOPIC`: Topic name from Series team
- `SERIES_KAFKA_GROUP_ID`: Consumer group ID
- `SERIES_KAFKA_CLIENT_ID`: Unique client identifier
- `SERIES_KAFKA_SASL_USERNAME`: SASL username (for SASL_SSL)
- `SERIES_KAFKA_SASL_PASSWORD`: SASL password

## Features

### Automatic Fallback
- If Kafka credentials missing → Uses mock data generator
- If iMessage API credentials missing → Uses mock invitation mode
- All features work regardless of credential status

### Privacy
- Kafka messages logged to `kafka-messages.log` for schema inspection
- Only message metadata processed (no content)
- Phone numbers only used for sending invites

### Error Handling
- Network errors retry automatically
- Invalid messages logged and skipped
- Clear error messages in API responses

## Troubleshooting

### Kafka Connection Issues
1. Check broker URL format (should include port)
2. Verify SASL username/password are correct
3. Check network connectivity
4. Review `kafka-messages.log` for message format
5. Ensure TLS is enabled (SASL_SSL)

### iMessage API Issues
1. Verify API key is valid
2. Check sender phone is in E.164 format
3. Test with `npm run test:imessage`
4. Check server logs for detailed errors

### No Messages from Kafka
- Kafka stream may be sparse
- Use mock data generator for demo
- Check `kafka-messages.log` to see what's being received

