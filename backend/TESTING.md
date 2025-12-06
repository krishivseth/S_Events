# Backend Testing Guide

## Quick Start

The backend server is running on `http://localhost:3001`

### Manual Testing

Use the provided test script:
```bash
./test-api.sh
```

### Manual API Testing

#### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

#### 2. Get User Profile
```bash
curl http://localhost:3001/api/profile/user_0
```

#### 3. Predict Group Chemistry
```bash
curl -X POST http://localhost:3001/api/chemistry/predict \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user_0", "user_1", "user_2"]}'
```

#### 4. Optimize Group
```bash
curl -X POST http://localhost:3001/api/chemistry/optimize \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user_0", "user_1", "user_2", "user_3"], "targetScore": 80}'
```

#### 5. Create Event
```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hackathon Team",
    "description": "Team formation",
    "date": "2024-12-15T10:00:00Z",
    "hostId": "user_0",
    "guestIds": ["user_1", "user_2"]
  }'
```

#### 6. Get Event
```bash
curl http://localhost:3001/api/events/{eventId}
```

#### 7. Send Invitations
```bash
curl -X POST http://localhost:3001/api/events/{eventId}/invite
```

## Available Users (Mock Data)

The backend generates 10 users with mock data:
- `user_0` through `user_9`

Each user has:
- Communication profile (response times, active hours, verbosity, etc.)
- Network metrics (centrality, clustering, degree)
- Social catalyst score
- Energy level

## Expected Responses

### Profile Response
```json
{
  "user_id": "user_0",
  "avg_response_time_seconds": 600,
  "active_hours": [9, 10, 14, 15, 19, 20],
  "social_catalyst_score": 7.5,
  "energy_level": "medium",
  ...
}
```

### Chemistry Prediction Response
```json
{
  "group_score": 82,
  "confidence": 0.88,
  "insights": ["4 social catalysts present"],
  "warnings": ["Low activity time overlap"],
  "pairwise_scores": {
    "user_0_user_1": 75,
    "user_0_user_2": 82
  },
  "recommended_removals": []
}
```

## Performance

- Chemistry predictions: <500ms
- Profile retrieval: <50ms
- Event creation: <100ms

## Privacy Testing

All endpoints respect privacy:
- No message content is stored
- Only metadata (timestamps, lengths, IDs) is used
- User IDs are hashed in logs

To verify:
```bash
# Check logs - you'll see "✓ Privacy Guard Active"
tail -f chemistry.log
```

