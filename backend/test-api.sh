#!/bin/bash

# Simple test script for Series Events Backend API

API_BASE="http://localhost:3001/api"

echo "🧪 Testing Series Events Backend API"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Health Check
echo -e "${BLUE}1. Health Check${NC}"
curl -s "$API_BASE/health" | python3 -m json.tool
echo ""
echo ""

# 2. Get Profile
echo -e "${BLUE}2. Get Profile (user_0)${NC}"
curl -s "$API_BASE/profile/user_0" | python3 -m json.tool | head -15
echo ""
echo ""

# 3. Predict Chemistry
echo -e "${BLUE}3. Predict Chemistry for group${NC}"
curl -s -X POST "$API_BASE/chemistry/predict" \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user_0", "user_1", "user_2"]}' | python3 -m json.tool
echo ""
echo ""

# 4. Optimize Group
echo -e "${BLUE}4. Optimize Group Chemistry${NC}"
curl -s -X POST "$API_BASE/chemistry/optimize" \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["user_0", "user_1", "user_2", "user_3"], "targetScore": 80}' | python3 -m json.tool
echo ""
echo ""

# 5. Create Event
echo -e "${BLUE}5. Create Event${NC}"
EVENT_JSON=$(curl -s -X POST "$API_BASE/events" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Series Hackathon Team",
    "description": "Team formation for hackathon",
    "date": "2024-12-15T10:00:00Z",
    "hostId": "user_0",
    "guestIds": ["user_1", "user_2"]
  }')
echo "$EVENT_JSON" | python3 -m json.tool
EVENT_ID=$(echo "$EVENT_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
echo ""
echo ""

# 6. Get Event
echo -e "${BLUE}6. Get Event${NC}"
curl -s "$API_BASE/events/$EVENT_ID" | python3 -m json.tool
echo ""
echo ""

# 7. Send Invitations
echo -e "${BLUE}7. Send Invitations${NC}"
curl -s -X POST "$API_BASE/events/$EVENT_ID/invite" | python3 -m json.tool
echo ""
echo ""

# 8. Get User Events
echo -e "${BLUE}8. Get Events for User${NC}"
curl -s "$API_BASE/events/user/user_0" | python3 -m json.tool | head -25
echo ""
echo ""

echo -e "${GREEN}✅ All tests complete!${NC}"

