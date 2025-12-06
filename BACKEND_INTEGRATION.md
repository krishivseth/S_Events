# Backend-Frontend Integration Guide

## Overview

The backend has been adapted to work with the frontend's data models and API expectations. The integration provides:

1. **Frontend-compatible API endpoints** that accept and return data in the format the frontend expects
2. **Hybrid chemistry calculation** that works with frontend social profiles
3. **API service layer** in the frontend that calls the backend with automatic fallback
4. **Graceful degradation** - frontend works with or without backend

## Architecture

```
Frontend (React)          Backend (Express)
     │                           │
     │  POST /api/chemistry/     │
     │  predict-frontend         │
     ├──────────────────────────>│
     │  { profiles: [...] }      │
     │                           │
     │                           │ FrontendAdapter
     │                           │ calculates chemistry
     │                           │ from social profiles
     │                           │
     │  { groupScore, insights,  │
     │    warnings, pairwiseScores }
     │<──────────────────────────┤
     │                           │
```

## Key Components

### 1. Frontend Adapter (`backend/src/services/frontendAdapter.ts`)

Bridges the gap between:
- **Frontend models**: Social profiles (name, school, age, connections)
- **Backend models**: Communication profiles (response times, verbosity, active hours)

The adapter:
- Accepts frontend `CommunicationProfile[]` format
- Calculates chemistry using social data (school, age, connections, etc.)
- Returns frontend `ChemistryAnalysis` format

### 2. API Service Layer (`frontend/src/services/api.ts`)

Provides typed API functions:
- `chemistryApi.predict(profiles)` - Predict chemistry
- `chemistryApi.optimize(profiles)` - Optimize guest list
- `eventsApi.create(eventData)` - Create event
- `eventsApi.getById(eventId)` - Get event

All functions include error handling and use environment variables for configuration.

### 3. Enhanced Chemistry Calculator (`frontend/src/services/chemistryCalculator.ts`)

Enhanced to:
- **Try backend API first** (if enabled)
- **Fallback to client-side** calculation if backend unavailable
- Support async/await for backend calls

## API Endpoints

### Chemistry Endpoints

#### POST `/api/chemistry/predict-frontend`
Predict chemistry from frontend profiles.

**Request:**
```json
{
  "profiles": [
    {
      "userId": "user-1",
      "name": "Sarah Chen",
      "avatar": "...",
      "age": 28,
      "gender": "female",
      "school": "Stanford University",
      "role": "Founder & CEO",
      "company": "Stealth Startup",
      "bio": "...",
      "connectionDegree": 1,
      "alreadyKnow": false
    }
  ]
}
```

**Response:**
```json
{
  "groupScore": 85,
  "insights": ["2 direct connections", "Great school diversity"],
  "warnings": [],
  "pairwiseScores": {
    "user-1_user-2": 87,
    "user-1_user-3": 82
  }
}
```

#### POST `/api/chemistry/optimize-frontend`
Optimize guest list by removing low-chemistry guests.

**Request:**
```json
{
  "profiles": [...]
}
```

**Response:**
```json
{
  "original": {
    "profiles": [...],
    "score": 75
  },
  "optimized": {
    "profiles": [...],
    "score": 82
  },
  "removed": ["user-5"],
  "improvements": {
    "scoreIncrease": 7
  }
}
```

### Event Endpoints

#### POST `/api/events-frontend`
Create an event in frontend format.

#### GET `/api/events-frontend/:eventId`
Get event by ID in frontend format.

## Setup

### Backend

1. Start the backend server:
```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:3001`

### Frontend

1. Create `.env` file:
```bash
cd frontend
cp .env.example .env
```

2. Update `.env`:
```
VITE_API_URL=http://localhost:3001/api
VITE_USE_BACKEND=true
```

3. Start the frontend:
```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:8080`

## Testing Integration

### 1. Test Backend Health
```bash
curl http://localhost:3001/api/health
```

### 2. Test Chemistry Prediction
```bash
curl -X POST http://localhost:3001/api/chemistry/predict-frontend \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": [
      {
        "userId": "user-1",
        "name": "Test User",
        "avatar": "",
        "age": 25,
        "gender": "male",
        "school": "Stanford",
        "role": "Engineer",
        "company": "Tech",
        "bio": "Test",
        "connectionDegree": 1,
        "alreadyKnow": false
      }
    ]
  }'
```

### 3. Test Frontend

1. Open `http://localhost:8080`
2. Navigate to "Create Event"
3. Fill out event form
4. Go to "Guest Builder"
5. Select some guests
6. Watch chemistry calculations - should use backend if available

## Fallback Behavior

The frontend is designed to work **with or without** the backend:

1. **Backend Available**: Uses backend API for chemistry calculations
2. **Backend Unavailable**: Falls back to client-side calculation (original algorithm)
3. **Backend Error**: Catches errors and uses client-side fallback

This ensures the demo works regardless of backend status.

## Data Model Mapping

| Frontend Model | Backend Model | Notes |
|----------------|---------------|-------|
| `CommunicationProfile` | `FrontendCommunicationProfile` | Social profile (name, school, age) |
| `ChemistryAnalysis` | `FrontendChemistryAnalysis` | Same structure, calculated differently |
| `Event` | `FrontendEvent` | Same structure |

The backend's original `CommunicationProfile` (based on message metadata) is separate and used for advanced analysis when available.

## Next Steps

1. **Add Profile Storage**: Store frontend profiles in backend database
2. **Merge Communication Data**: Enhance frontend profiles with backend communication analysis
3. **Real-time Updates**: Use WebSockets for live chemistry updates
4. **Caching**: Add Redis caching for frequent calculations
5. **Authentication**: Add user authentication and authorization

## Troubleshooting

### Backend not responding
- Check backend is running: `curl http://localhost:3001/api/health`
- Check CORS settings in backend
- Verify `VITE_API_URL` in frontend `.env`

### Chemistry not updating
- Check browser console for API errors
- Verify `VITE_USE_BACKEND=true` in `.env`
- Check backend logs for errors

### CORS errors
- Backend CORS is configured to allow `http://localhost:8080`
- Update `FRONTEND_URL` in backend `.env` if using different port

