# Rate Limiting in Quiz Quest Application

## 📋 Overview

Yes, there are **multiple rate limits** configured in this codebase using `express-rate-limit` middleware.

---

## 🔍 Rate Limit Locations

### 1. **General API Rate Limit** (Applied to ALL routes)

**File:** `api/src/app.ts` (Line 99)
**File:** `api/src/middleware/validation.ts` (Line 24)

```typescript
general: createRateLimit(15 * 60 * 1000, 100, 'Too many requests, please try again later')
```

**Configuration:**
- **Window:** 15 minutes (15 * 60 * 1000 ms)
- **Max Requests:** 100 requests per IP per 15 minutes
- **Applied To:** ALL API routes (via `app.use(rateLimits.general)`)
- **Scope:** Per IP address

**Impact:**
- ✅ **Good:** Prevents abuse of any API endpoint
- ⚠️ **Potential Issue:** In a classroom with 30+ students from same IP, this could be hit if students are very active
- **Calculation:** 100 requests / 30 students = ~3 requests per student per 15 minutes

---

### 2. **Authentication Rate Limit**

**File:** `api/src/routes/auth.ts` (Line 18)
**File:** `api/src/middleware/validation.ts` (Line 27)

```typescript
auth: createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts')
```

**Configuration:**
- **Window:** 15 minutes
- **Max Requests:** 10 requests per IP per 15 minutes
- **Applied To:** `/api/verify-teacher` endpoint
- **Scope:** Per IP address

**Impact:**
- ✅ **Good:** Prevents brute-force password attempts
- ⚠️ **Potential Issue:** If multiple teachers try to login from same school network, they share this limit

---

### 3. **Quiz Creation Rate Limit**

**File:** `api/src/routes/quiz.ts` (Line 19)
**File:** `api/src/middleware/validation.ts` (Line 33)

```typescript
quizCreation: createRateLimit(10 * 60 * 1000, 5, 'Too many quiz creation attempts')
```

**Configuration:**
- **Window:** 10 minutes
- **Max Requests:** 5 quiz creations per IP per 10 minutes
- **Applied To:** `/api/create-quiz` endpoint
- **Scope:** Per IP address

**Impact:**
- ✅ **Good:** Prevents spam quiz creation
- ✅ **Reasonable:** 5 quizzes per 10 minutes is sufficient for normal use

---

### 4. **Room Creation Rate Limit**

**File:** `api/src/routes/room.ts` (Line 17)
**File:** `api/src/middleware/validation.ts` (Line 30)

```typescript
roomCreation: createRateLimit(5 * 60 * 1000, 3, 'Too many room creation attempts')
```

**Configuration:**
- **Window:** 5 minutes
- **Max Requests:** 3 requests per IP per 5 minutes
- **Applied To:** `/api/active-rooms` endpoint
- **Scope:** Per IP address

**Impact:**
- ✅ **Good:** Prevents excessive polling of active rooms
- ℹ️ **Note:** Applied to "active-rooms" GET request (checking rooms, not creating them)

---

### 5. **Socket.IO Rate Limit** ✅ REMOVED

**File:** `api/src/socket/socketConfig.ts` (Lines 39-41)

```typescript
// Note: IP-based rate limiting removed for classroom use
// In classroom environments, all students connect from the same IP (school router)
// Room codes and teacher authentication provide sufficient access control
```

**Status:** ✅ **FIXED** - Removed in previous fix
- **Previously:** Limited to 10 connections per IP
- **Now:** No Socket.IO connection limits (allows unlimited students from same classroom)

---

## ⚠️ Potential Issues for Classroom Use

### Issue 1: General API Rate Limit (100 requests/15min per IP)

**Scenario:**
- 30 students in a classroom (same IP)
- Each student makes requests during quiz (join room, submit answers, get results)
- Active quiz with 10 questions

**Calculation:**
```
30 students × 10 questions × 3 requests per question = 900 requests
Limit: 100 requests per 15 minutes
Result: ❌ WILL HIT LIMIT
```

**Solution Options:**

#### Option A: Increase the General Rate Limit
```typescript
// In api/src/middleware/validation.ts
general: createRateLimit(15 * 60 * 1000, 1000, 'Too many requests, please try again later'),
// Change from 100 to 1000
```

#### Option B: Remove General Rate Limit for Classroom Use
```typescript
// In api/src/app.ts
// Comment out or remove:
// this.app.use(rateLimits.general);
```

#### Option C: Use Per-Session Rate Limiting
Instead of per-IP, track by session ID (more complex implementation).

---

### Issue 2: Auth Rate Limit (10 attempts/15min per IP)

**Scenario:**
- Multiple teachers trying to login from teacher's lounge
- Share same school IP

**Impact:** ⚠️ Low - unlikely to hit limit unless many failed login attempts

**Recommendation:** Keep as-is (security benefit outweighs risk)

---

## 📊 Rate Limit Summary Table

| Rate Limit | Window | Max Requests | Applied To | Classroom Impact |
|------------|--------|--------------|------------|------------------|
| **General** | 15 min | 100/IP | All API routes | ⚠️ **HIGH RISK** - May block students |
| **Auth** | 15 min | 10/IP | Teacher login | ✅ Low risk |
| **Quiz Creation** | 10 min | 5/IP | Create quiz | ✅ Low risk |
| **Room Creation** | 5 min | 3/IP | Check rooms | ✅ Low risk |
| **Socket.IO** | N/A | ~~10/IP~~ REMOVED | WebSocket connections | ✅ **FIXED** |

---

## 🔧 Recommended Actions

### For Production Classroom Use:

1. **CRITICAL: Increase or Remove General Rate Limit**
   ```typescript
   // Option 1: Increase to 1000
   general: createRateLimit(15 * 60 * 1000, 1000, 'Too many requests')
   
   // Option 2: Increase to 5000 for classroom use
   general: createRateLimit(15 * 60 * 1000, 5000, 'Too many requests')
   
   // Option 3: Remove completely (in app.ts)
   // this.app.use(rateLimits.general); // Commented out
   ```

2. **Keep Other Rate Limits**
   - Auth, Quiz, and Room limits are reasonable
   - They protect specific endpoints without blocking students

3. **Monitor Usage**
   - Add logging to track when rate limits are hit
   - Adjust limits based on actual classroom size

---

## 📝 Implementation Files

All rate limiting code is in:
- **Configuration:** `api/src/middleware/validation.ts`
- **Applied in App:** `api/src/app.ts`
- **Applied in Routes:**
  - `api/src/routes/auth.ts`
  - `api/src/routes/quiz.ts`
  - `api/src/routes/room.ts`

---

## 🧪 How to Test Rate Limits

### Test General Rate Limit:
```bash
# Make 101 requests from same IP within 15 minutes
for i in {1..101}; do
  curl http://localhost:3000/api/quizzes
  echo "Request $i"
done

# Request 101 should return:
# { "error": "Too many requests, please try again later" }
```

### Test Auth Rate Limit:
```bash
# Make 11 failed login attempts from same IP
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/verify-teacher \
    -H "Content-Type: application/json" \
    -d '{"password":"wrong"}'
done

# Request 11 should return:
# { "error": "Too many authentication attempts" }
```

---

## 💡 Alternative: Smart Rate Limiting

Instead of simple IP-based limits, consider:

### Per-Room Rate Limiting:
```typescript
// Limit requests per room instead of per IP
const roomRateLimits = new Map<string, number>();

function checkRoomRateLimit(roomId: string, maxRequests: number): boolean {
  const count = roomRateLimits.get(roomId) || 0;
  if (count >= maxRequests) return false;
  
  roomRateLimits.set(roomId, count + 1);
  setTimeout(() => {
    roomRateLimits.set(roomId, (roomRateLimits.get(roomId) || 0) - 1);
  }, 60000); // 1 minute window
  
  return true;
}
```

### Per-User Rate Limiting:
```typescript
// Track by session ID or student ID instead of IP
const userRateLimits = new Map<string, number>();
```

---

## ✅ Conclusion

**Yes, there are 4 active rate limits in the codebase:**

1. ⚠️ **General API Rate Limit** - **NEEDS ADJUSTMENT** for classrooms (100 → 1000+)
2. ✅ **Auth Rate Limit** - Fine as-is
3. ✅ **Quiz Creation Rate Limit** - Fine as-is
4. ✅ **Room Creation Rate Limit** - Fine as-is
5. ✅ **Socket.IO Rate Limit** - Already removed (previous fix)

**Next Step:** Increase or remove the general rate limit to prevent blocking students during active quizzes.
