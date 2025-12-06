#!/bin/bash

# End-to-end integration test script

echo "🧪 Testing Backend-Frontend Integration"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Test Backend Health
echo -e "${BLUE}1. Testing Backend Health...${NC}"
BACKEND_HEALTH=$(curl -s http://localhost:3001/api/health 2>/dev/null)
if [ $? -eq 0 ]; then
    STATUS=$(echo "$BACKEND_HEALTH" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))" 2>/dev/null)
    if [ "$STATUS" = "healthy" ]; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend responded but status unclear${NC}"
    fi
else
    echo -e "${YELLOW}❌ Backend not responding (is it running on port 3001?)${NC}"
    exit 1
fi
echo ""

# 2. Test Frontend Accessibility
echo -e "${BLUE}2. Testing Frontend Accessibility...${NC}"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend responded with code $FRONTEND_RESPONSE${NC}"
fi
echo ""

# 3. Test Chemistry Prediction API
echo -e "${BLUE}3. Testing Chemistry Prediction API...${NC}"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/chemistry/predict-frontend \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": [
      {
        "userId": "user-1",
        "name": "Sarah Chen",
        "avatar": "",
        "age": 28,
        "gender": "female",
        "school": "Stanford University",
        "role": "Founder",
        "company": "Tech Corp",
        "bio": "Serial entrepreneur",
        "connectionDegree": 1,
        "alreadyKnow": false
      },
      {
        "userId": "user-2",
        "name": "Alex Thompson",
        "avatar": "",
        "age": 26,
        "gender": "male",
        "school": "Stanford University",
        "role": "Engineer",
        "company": "Google",
        "bio": "Full-stack developer",
        "connectionDegree": 2,
        "alreadyKnow": false
      }
    ]
  }' 2>/dev/null)

if [ $? -eq 0 ]; then
    SCORE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('groupScore', 0))" 2>/dev/null)
    if [ ! -z "$SCORE" ] && [ "$SCORE" != "0" ]; then
        echo -e "${GREEN}✅ Chemistry prediction working - Score: $SCORE${NC}"
        echo "$RESPONSE" | python3 -m json.tool | head -15
    else
        echo -e "${YELLOW}⚠️  API responded but score is invalid${NC}"
    fi
else
    echo -e "${YELLOW}❌ API request failed${NC}"
fi
echo ""

# 4. Test Optimization API
echo -e "${BLUE}4. Testing Guest List Optimization...${NC}"
OPT_RESPONSE=$(curl -s -X POST http://localhost:3001/api/chemistry/optimize-frontend \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": [
      {
        "userId": "user-1",
        "name": "Sarah",
        "avatar": "",
        "age": 28,
        "gender": "female",
        "school": "Stanford",
        "role": "Founder",
        "company": "Tech",
        "bio": "Test",
        "connectionDegree": 1,
        "alreadyKnow": false
      },
      {
        "userId": "user-2",
        "name": "Alex",
        "avatar": "",
        "age": 26,
        "gender": "male",
        "school": "MIT",
        "role": "Engineer",
        "company": "Google",
        "bio": "Test",
        "connectionDegree": 3,
        "alreadyKnow": false
      }
    ]
  }' 2>/dev/null)

if [ $? -eq 0 ]; then
    ORIG_SCORE=$(echo "$OPT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('original', {}).get('score', 0))" 2>/dev/null)
    if [ ! -z "$ORIG_SCORE" ]; then
        echo -e "${GREEN}✅ Optimization API working - Original Score: $ORIG_SCORE${NC}"
    else
        echo -e "${YELLOW}⚠️  Optimization API responded but score missing${NC}"
    fi
else
    echo -e "${YELLOW}❌ Optimization API request failed${NC}"
fi
echo ""

# 5. Summary
echo -e "${BLUE}=== Integration Summary ===${NC}"
echo ""
echo "Backend:  http://localhost:3001/api"
echo "Frontend: http://localhost:8080"
echo ""
echo "Test the integration:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Navigate to 'Create Event'"
echo "3. Fill out event form and proceed to 'Guest Builder'"
echo "4. Select guests and watch chemistry scores update"
echo ""
echo -e "${GREEN}✅ Integration test complete!${NC}"

