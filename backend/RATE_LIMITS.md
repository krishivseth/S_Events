# Rate Limits & Handling

## Current Status

### Claude (Anthropic) API
- **Status**: ⚠️ **No rate limit handling implemented**
- **Known Limits** (varies by tier):
  - Requests per Minute (RPM): 50+ (Tier 1)
  - Input Tokens per Minute (ITPM): 30,000+ (Tier 1)
  - Output Tokens per Minute (OTPM): 8,000+ (Tier 1)
  - **429 errors** are returned when limits exceeded
  - Includes `retry-after` header with wait time

### Series iMessage API
- **Status**: ✅ **Basic retry logic exists**
- **Current Implementation**: 
  - Retries 429 and 500+ errors once after 1 second
  - Only in `InvitationService.sendMessage()`
  - **Missing** in `MessagePoller` message sending
- **Polling Frequency**: Every 3 seconds (20 requests/minute)
- **Potential Issues**: 
  - No exponential backoff
  - No rate limit tracking
  - MessagePoller sends without retry logic

## Recommendations

### 1. Add Claude API Rate Limit Handling

**Priority**: HIGH

Add to `inboundMessageHandler.ts`:
- Handle 429 errors with exponential backoff
- Check `retry-after` header
- Fallback to keyword matching if rate limited
- Add request queuing if needed

### 2. Improve Series API Rate Limit Handling

**Priority**: MEDIUM

Enhancements needed:
- Add exponential backoff (instead of fixed 1 second)
- Track rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- Add delays between multiple message sends
- Add retry logic to MessagePoller message sending
- Consider increasing poll interval if rate limited

### 3. Add Rate Limit Monitoring

**Priority**: LOW

- Log rate limit warnings
- Track API call frequencies
- Alert on repeated 429 errors

## Current Risk Assessment

### Claude API
- **Risk**: MEDIUM
- **Reason**: Intent classification happens on every message
- **Impact**: Messages may fail to be processed if rate limited
- **Mitigation**: Fallback to keyword matching exists ✅

### Series iMessage API  
- **Risk**: LOW-MEDIUM
- **Reason**: 
  - Polling every 3 seconds (20/min) may be acceptable
  - Message sending has basic retry logic
- **Impact**: Responses may be delayed or fail if rate limited
- **Mitigation**: Basic retry exists, but could be improved

## Action Items

1. [ ] Add Claude API 429 error handling with exponential backoff
2. [ ] Improve Series API retry logic with exponential backoff
3. [ ] Add rate limit headers tracking for Series API
4. [ ] Add retry logic to MessagePoller message sending
5. [ ] Consider adding request queuing for high-volume scenarios
6. [ ] Add rate limit monitoring/logging

