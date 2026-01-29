# 🔄 Refresh Token Use Cases - Complete Guide with Examples

## 📋 Overview

Refresh tokens are used in **multiple scenarios** to maintain user sessions without requiring re-authentication. Here are all the cases:

---

## 🎯 Use Case 1: Browser Close & Reopen (Your Question!)

### Scenario:
User logs in, closes browser, and returns later (without logging out)

### Example Timeline:

```
10:00 AM - User logs in
├─ Access Token: Valid for 15 minutes (expires at 10:15 AM)
├─ Refresh Token: Valid for 7 days (expires at 10:00 AM, 7 days later)
└─ Both stored in localStorage (if "Remember Me" checked)

10:05 AM - User closes browser
└─ Tokens remain in localStorage

11:00 AM - User reopens browser and visits your site
├─ AuthContext loads (AuthContext.jsx line 42-87)
├─ Checks localStorage for tokens
├─ Finds refreshToken in storage
├─ Finds accessToken but it's EXPIRED (expired at 10:15 AM)
└─ What happens next?
```

### What Happens:

**Step 1: App Loads**
```javascript
// AuthContext.jsx - loadAuthState()
const token = localStorage.getItem("accessToken");
const storedRefreshToken = localStorage.getItem("refreshToken");

if (token && !isTokenExpired(token)) {
  // Token still valid - user stays logged in
} else if (token && isTokenExpired(token)) {
  // Token expired - clear storage
  clearAuth();
}
```

**Step 2: User Makes First API Call**
```javascript
// User clicks "Dashboard" → API call to /api/users
// api.js - Request Interceptor adds expired access token
Authorization: Bearer <expired-access-token>

// Backend returns 401 Unauthorized
```

**Step 3: Automatic Token Refresh**
```javascript
// api.js - Response Interceptor (line 44-121)
if (error.response?.status === 401) {
  // Get refreshToken from localStorage
  const refreshToken = localStorage.getItem("refreshToken");
  
  // Call /api/auth/refresh
  const response = await axios.post(`${API_URL}/auth/refresh`, {
    refreshToken: refreshToken
  });
  
  // Get new AccessToken
  const { AccessToken } = response.data;
  
  // Update localStorage
  localStorage.setItem("accessToken", AccessToken);
  
  // Retry original request
  return api(originalRequest);
}
```

**Result:** ✅ User is automatically logged back in without entering credentials!

---

## 🎯 Use Case 2: Access Token Expires During Active Session

### Scenario:
User is actively using the app, but access token expires

### Example Timeline:

```
2:00 PM - User logs in
├─ Access Token expires at: 2:15 PM
└─ User is browsing dashboard

2:10 PM - User clicks "View Users" button
└─ API call made with access token (still valid)

2:16 PM - User clicks "Refresh" button
└─ Access token is NOW EXPIRED
```

### What Happens:

```javascript
// User clicks "Refresh" → GET /api/users
// Request sent with expired token
Authorization: Bearer <expired-token>

// Backend returns 401
// Response Interceptor catches it

// Automatically:
1. Get refreshToken from storage
2. POST /api/auth/refresh
3. Get new AccessToken
4. Retry original request
5. User sees data (seamless experience!)
```

**Result:** ✅ User doesn't notice - refresh happens automatically in background!

---

## 🎯 Use Case 3: Multiple Tabs/Windows

### Scenario:
User has multiple tabs open, access token expires

### Example Timeline:

```
3:00 PM - User opens 3 tabs:
├─ Tab 1: Dashboard
├─ Tab 2: User List
└─ Tab 3: Profile

3:15 PM - Access token expires

3:16 PM - User clicks button in Tab 1
└─ Triggers API call
```

### What Happens:

**Tab 1 (First Request):**
```javascript
// Tab 1 makes API call
// Gets 401 → Starts refresh process
isRefreshing = true;

// Calls /api/auth/refresh
// Updates localStorage with new token
isRefreshing = false;
```

**Tab 2 & 3 (Simultaneous Requests):**
```javascript
// Tab 2 & 3 also make API calls (at same time)
// Both get 401
// Both see isRefreshing = true

// Instead of making 3 refresh calls, they QUEUE:
failedQueue.push({ resolve, reject });

// When Tab 1 finishes refresh:
processQueue(null, newAccessToken);

// Tab 2 & 3 get new token from queue
// All retry with same new token
```

**Result:** ✅ Only ONE refresh call made, all tabs get new token!

---

## 🎯 Use Case 4: Long-Running Session

### Scenario:
User stays logged in for hours, access token expires multiple times

### Example Timeline:

```
9:00 AM - User logs in
├─ Access Token: Expires at 9:15 AM
└─ User works continuously

9:15 AM - First expiration
└─ Auto-refresh (user doesn't notice)

10:15 AM - Second expiration
└─ Auto-refresh (user doesn't notice)

11:15 AM - Third expiration
└─ Auto-refresh (user doesn't notice)

... continues for 7 days until refresh token expires
```

### What Happens:

```javascript
// Every 15 minutes (access token lifetime):
1. User makes API call
2. Token expired → Auto-refresh
3. New access token issued
4. User continues working

// Refresh token stays same for 7 days
// After 7 days, refresh token expires
// User must login again
```

**Result:** ✅ User can work for days without re-authenticating!

---

## 🎯 Use Case 5: Network Interruption

### Scenario:
User loses internet, then reconnects

### Example Timeline:

```
4:00 PM - User is using app
├─ Access Token expires at 4:15 PM

4:10 PM - Internet disconnects
└─ User tries to make API call (fails)

4:20 PM - Internet reconnects
└─ User clicks button again
```

### What Happens:

**First Attempt (4:10 PM - No Internet):**
```javascript
// API call fails (network error)
// Not a 401 error, so no refresh attempted
// User sees error message
```

**Second Attempt (4:20 PM - Internet Back):**
```javascript
// API call made with expired token (expired at 4:15 PM)
// Backend returns 401

// Response Interceptor:
1. Detects 401
2. Gets refreshToken from storage
3. Calls /api/auth/refresh
4. Gets new AccessToken
5. Retries original request
6. Success!
```

**Result:** ✅ User reconnects and continues seamlessly!

---

## 🎯 Use Case 6: Mobile App Background/Foreground

### Scenario:
User switches apps, comes back later

### Example Timeline:

```
5:00 PM - User opens mobile app
├─ Logs in, gets tokens
└─ Tokens stored in device storage

5:10 PM - User switches to another app
└─ Your app goes to background

5:30 PM - User switches back to your app
└─ Access token expired (if expired)
```

### What Happens:

```javascript
// App comes to foreground
// First API call made (e.g., check notifications)

// If access token expired:
1. API returns 401
2. Interceptor catches it
3. Uses refreshToken from device storage
4. Gets new AccessToken
5. User continues using app
```

**Result:** ✅ App works seamlessly when user returns!

---

## 🎯 Use Case 7: Page Refresh (F5)

### Scenario:
User refreshes the page while logged in

### Example Timeline:

```
6:00 PM - User on dashboard
├─ Access Token expires at 6:15 PM

6:10 PM - User presses F5 (refresh page)
└─ Page reloads
```

### What Happens:

**On Page Load:**
```javascript
// AuthContext.jsx - useEffect (line 42)
const loadAuthState = () => {
  const token = localStorage.getItem("accessToken");
  const storedRefreshToken = localStorage.getItem("refreshToken");
  
  if (token && !isTokenExpired(token)) {
    // Token valid - restore session
    setAccessToken(token);
    setRefreshToken(storedRefreshToken);
  } else if (token && isTokenExpired(token)) {
    // Token expired - clear (will refresh on first API call)
    clearAuth();
  }
};
```

**First API Call After Refresh:**
```javascript
// User navigates to dashboard
// API call made with expired token
// Auto-refresh happens
// New token stored
// User continues
```

**Result:** ✅ Page refresh doesn't log user out!

---

## 🔍 Key Differences: localStorage vs sessionStorage

### localStorage (Remember Me = true)
```javascript
// Tokens persist even after browser close
// Use Case 1 applies - user stays logged in after closing browser
```

### sessionStorage (Remember Me = false)
```javascript
// Tokens cleared when browser tab closes
// User must login again after closing tab
// But refresh token still works during same session
```

---

## 📊 Summary Table

| Use Case | When It Happens | How Refresh Token Helps |
|----------|----------------|------------------------|
| **Browser Close/Reopen** | User closes browser, returns later | Auto-refreshes on first API call |
| **Token Expires During Use** | Access token expires while user active | Seamless auto-refresh in background |
| **Multiple Tabs** | Several tabs open, token expires | Queues requests, single refresh call |
| **Long Session** | User works for hours/days | Multiple auto-refreshes, stays logged in |
| **Network Issue** | Internet disconnects/reconnects | Refreshes when connection restored |
| **Mobile Background** | App goes to background, returns | Refreshes when app becomes active |
| **Page Refresh** | User presses F5 | Restores session, refreshes if needed |

---

## 🎯 Real-World Example Flow

### Complete User Journey:

```
Day 1, 9:00 AM:
├─ User logs in
├─ Gets accessToken (15min) + refreshToken (7 days)
└─ Starts working

Day 1, 9:15 AM:
├─ Access token expires
├─ User clicks button → Auto-refresh → New access token
└─ User doesn't notice

Day 1, 6:00 PM:
├─ User closes browser
└─ Tokens saved in localStorage

Day 2, 9:00 AM:
├─ User opens browser
├─ Visits your site
├─ Makes API call with expired token
├─ Auto-refresh happens
└─ User continues working (no login needed!)

Day 3-7:
├─ Same pattern continues
└─ Auto-refresh keeps user logged in

Day 8, 9:00 AM:
├─ Refresh token expires (7 days passed)
├─ User makes API call
├─ Refresh fails
└─ User redirected to login page
```

---

## 💡 Important Points

1. **Refresh Token is NOT used for API calls**
   - Only access token is sent in Authorization header
   - Refresh token is ONLY used to get new access tokens

2. **Automatic & Transparent**
   - User doesn't see refresh happening
   - Happens automatically in background

3. **Storage Matters**
   - localStorage = persists after browser close
   - sessionStorage = cleared when tab closes

4. **Security**
   - Access tokens are short-lived (15min)
   - Refresh tokens are long-lived (7 days)
   - Refresh tokens can be revoked (logout)

5. **Multiple Devices**
   - Each device gets its own refresh token
   - Up to 5 tokens per user (your implementation)
   - Logout on one device doesn't affect others

---

## 🚫 When Refresh Token is NOT Used

1. **User explicitly logs out**
   - Token is deleted from database
   - Cannot be used again

2. **Refresh token expires**
   - After 7 days (in your case)
   - User must login again

3. **Token revoked by admin**
   - If you implement admin token revocation
   - Token deleted from database

4. **User account deleted**
   - All tokens become invalid
   - User cannot refresh

---

This comprehensive system ensures users have a seamless experience while maintaining security! 🚀

