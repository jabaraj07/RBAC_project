# 🔄 Refresh Token Logic - Complete Explanation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Token Types](#token-types)
3. [Complete Flow Diagram](#complete-flow-diagram)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Security Features](#security-features)

---

## 🎯 Overview

**Refresh Tokens** allow users to stay logged in without re-entering credentials, while keeping access tokens short-lived for security.

### Key Concepts:
- **Access Token**: Short-lived (15min-1hr), used for API requests
- **Refresh Token**: Long-lived (7-30 days), used to get new access tokens
- **Token Storage**: Refresh tokens stored in database for revocation

---

## 🔑 Token Types

### Access Token
```javascript
// Generated in: Backend/src/utils/generateToken.js
{
  id: user._id,
  role: user.role
}
// Expires: ACCESS_TOKEN_EXPIRE (e.g., "15m")
// Secret: ACCESS_TOKEN_SECRET
// Usage: Sent in Authorization header for API calls
```

### Refresh Token
```javascript
// Generated in: Backend/src/utils/generateToken.js
{
  id: user._id
}
// Expires: REFRESH_TOKEN_EXPIRE (e.g., "7d")
// Secret: REFRESH_TOKEN_SECRET
// Usage: Stored in database, used to get new access tokens
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────┐
│   USER      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. POST /api/auth/login
       │    { email, password }
       ▼
┌─────────────────────────────────┐
│         BACKEND                 │
│  ┌──────────────────────────┐  │
│  │  authController.login()   │  │
│  │  1. Verify credentials   │  │
│  │  2. Generate tokens       │  │
│  │  3. Save refresh token    │  │
│  │     to database           │  │
│  └──────────────────────────┘  │
│                                 │
│  Response:                      │
│  {                              │
│    AccessToken: "eyJ...",       │
│    RefreshToken: "eyJ..."       │
│  }                              │
└─────────────────────────────────┘
       │
       │ 2. Store tokens in localStorage/sessionStorage
       ▼
┌─────────────────────────────────┐
│      FRONTEND STORAGE           │
│  localStorage/sessionStorage:   │
│  - accessToken                  │
│  - refreshToken                 │
│  - userData                     │
└─────────────────────────────────┘
       │
       │ 3. User makes API request
       │    Authorization: Bearer <accessToken>
       ▼
┌─────────────────────────────────┐
│    API REQUEST INTERCEPTOR      │
│  (api.js - request interceptor) │
│  Adds: Authorization header     │
└─────────────────────────────────┘
       │
       │ 4. API Request to backend
       ▼
┌─────────────────────────────────┐
│         BACKEND                 │
│  ┌──────────────────────────┐  │
│  │  authenticateToken.js     │  │
│  │  Verifies access token    │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
       │
       │ 5a. ✅ Token Valid → Process Request
       │ 5b. ❌ Token Expired (401)
       ▼
┌─────────────────────────────────┐
│   RESPONSE INTERCEPTOR          │
│  (api.js - response interceptor)│
│                                 │
│  If 401 Error:                  │
│  1. Check if already refreshing │
│  2. Queue request if refreshing │
│  3. Get refreshToken from store │
│  4. POST /api/auth/refresh      │
└─────────────────────────────────┘
       │
       │ 6. POST /api/auth/refresh
       │    { refreshToken }
       ▼
┌─────────────────────────────────┐
│         BACKEND                 │
│  ┌──────────────────────────┐  │
│  │ refreshAccessToken()    │  │
│  │  1. Verify token sig    │  │
│  │  2. Check DB (not revoked)│
│  │  3. Generate new access  │  │
│  │     token               │  │
│  └──────────────────────────┘  │
│                                 │
│  Response:                      │
│  { AccessToken: "new-token" }    │
└─────────────────────────────────┘
       │
       │ 7. Update accessToken in storage
       │ 8. Retry original request with new token
       ▼
┌─────────────────────────────────┐
│    ORIGINAL REQUEST RETRIED     │
│    (Now with valid token)       │
└─────────────────────────────────┘
```

---

## 🔧 Backend Implementation

### 1. Token Generation (`generateToken.js`)

```javascript
const generateToken = (user) => {
  // Access Token - Short-lived, contains user ID and role
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE } // e.g., "15m"
  );

  // Refresh Token - Long-lived, contains only user ID
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE } // e.g., "7d"
  );

  return { accessToken, refreshToken };
};
```

**Why different secrets?**
- If access token secret is compromised, refresh tokens remain secure
- Allows independent rotation of secrets

### 2. Token Storage (`authController.js`)

```javascript
// When user logs in or registers
const saveRefreshToken = async (userId, token) => {
  // 1. Decode token to get expiration
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  // 2. Clean up old tokens (keep only 5 most recent)
  const userTokens = await RefreshToken.find({ user: userId })
    .sort({ createdAt: -1 });
  
  if (userTokens.length >= 5) {
    // Delete older tokens, keep 5 newest
    const tokensToDelete = userTokens.slice(5);
    await RefreshToken.deleteMany({ 
      _id: { $in: tokensToDelete.map(t => t._id) } 
    });
  }

  // 3. Save new refresh token to database
  const refreshTokenDoc = new RefreshToken({
    token,
    user: userId,
    expiresAt,
  });
  await refreshTokenDoc.save();
};
```

**Why store in database?**
- Allows token revocation (logout)
- Prevents token reuse after logout
- Tracks active sessions

### 3. Token Refresh (`authController.js`)

```javascript
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  // Step 1: Verify token signature (JWT validation)
  const decoded = jwt.verify(
    refreshToken, 
    process.env.REFRESH_TOKEN_SECRET
  );

  // Step 2: Check if token exists in database (not revoked)
  const tokenDoc = await RefreshToken.findOne({ 
    token: refreshToken,
    user: decoded.id 
  });

  if (!tokenDoc) {
    return res.status(403).json({ 
      message: "Refresh token not found or has been revoked" 
    });
  }

  // Step 3: Verify user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Step 4: Generate NEW access token (refresh token stays same)
  const { accessToken } = generateToken(user);

  res.status(200).json({ AccessToken: accessToken });
};
```

**Important Points:**
- ✅ Refresh token is NOT regenerated (stays same until logout)
- ✅ Only access token is regenerated
- ✅ Database check ensures token wasn't revoked
- ✅ User verification ensures account still exists

### 4. Token Revocation (`authController.js`)

```javascript
export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  // Verify token to get user ID
  const decoded = jwt.verify(
    refreshToken, 
    process.env.REFRESH_TOKEN_SECRET
  );

  // Delete token from database (revoke it)
  await RefreshToken.findOneAndDelete({ 
    token: refreshToken,
    user: decoded.id 
  });

  res.status(200).json({ 
    message: "Logged out successfully" 
  });
};
```

**What happens:**
- Token removed from database
- Token can no longer be used to refresh
- User must login again to get new tokens

---

## 💻 Frontend Implementation

### 1. Request Interceptor (`api.js`)

```javascript
// Automatically adds access token to all requests
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken") || 
                      sessionStorage.getItem("accessToken");
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return config;
});
```

**Purpose:** Automatically attach token to every API request

### 2. Response Interceptor (`api.js`)

```javascript
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const originalRequest = error.config;

    // If 401 (Unauthorized) and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Prevent multiple simultaneous refresh calls
      if (isRefreshing) {
        // Queue this request to retry after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      // Mark request as retried
      originalRequest._retry = true;
      isRefreshing = true;

      // Get refresh token from storage
      const refreshToken = localStorage.getItem("refreshToken") || 
                           sessionStorage.getItem("refreshToken");

      if (!refreshToken) {
        // No refresh token = user must login again
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: refreshToken
        });

        const { AccessToken } = response.data;
        
        // Update stored access token
        const storage = localStorage.getItem("accessToken") 
          ? localStorage 
          : sessionStorage;
        storage.setItem("accessToken", AccessToken);

        // Update request header
        originalRequest.headers.Authorization = `Bearer ${AccessToken}`;

        // Process queued requests
        processQueue(null, AccessToken);
        isRefreshing = false;

        // Retry original request
        return api(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed = logout user
        processQueue(refreshError, null);
        isRefreshing = false;
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**Key Features:**
- ✅ Automatic token refresh on 401 errors
- ✅ Prevents multiple simultaneous refresh calls
- ✅ Queues requests during refresh
- ✅ Retries original request with new token
- ✅ Logs out if refresh fails

### 3. Request Queuing

```javascript
let isRefreshing = false;
let failedQueue = [];

// When refresh completes, process all queued requests
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};
```

**Why queue?**
- If multiple API calls fail simultaneously (e.g., page load)
- Only ONE refresh call is made
- Other requests wait and retry with new token
- Prevents race conditions

---

## 🔒 Security Features

### 1. Token Storage in Database
- ✅ Refresh tokens stored in MongoDB
- ✅ Allows server-side revocation
- ✅ TTL index auto-deletes expired tokens

### 2. Token Validation
- ✅ JWT signature verification
- ✅ Database existence check (prevents revoked tokens)
- ✅ User existence verification

### 3. Token Limits
- ✅ Max 5 refresh tokens per user
- ✅ Oldest tokens deleted automatically
- ✅ Prevents token accumulation

### 4. Automatic Cleanup
```javascript
// MongoDB TTL Index (RefreshToken.js)
RefreshTokenSchema.index(
  { expiresAt: 1 }, 
  { expireAfterSeconds: 0 }
);
```
- ✅ Expired tokens automatically deleted
- ✅ No manual cleanup needed

### 5. Separate Secrets
- ✅ Access token secret ≠ Refresh token secret
- ✅ Compromise of one doesn't affect the other

---

## 📊 Token Lifecycle

```
┌─────────────────────────────────────────────┐
│           TOKEN LIFECYCLE                   │
└─────────────────────────────────────────────┘

1. LOGIN/REGISTER
   ├─ Generate Access Token (15min)
   ├─ Generate Refresh Token (7 days)
   └─ Save Refresh Token to Database

2. API REQUESTS
   ├─ Use Access Token in Authorization header
   ├─ If expired → Auto-refresh via interceptor
   └─ Continue with new access token

3. TOKEN REFRESH
   ├─ Send Refresh Token to /api/auth/refresh
   ├─ Verify token in database
   ├─ Generate new Access Token
   └─ Refresh Token stays same

4. LOGOUT
   ├─ Send Refresh Token to /api/auth/logout
   ├─ Delete token from database
   └─ Token can no longer be used

5. EXPIRATION
   ├─ Access Token expires → Auto-refresh
   ├─ Refresh Token expires → User must login
   └─ Expired tokens auto-deleted from DB
```

---

## 🎯 Key Takeaways

1. **Access Tokens**: Short-lived, used for API calls, auto-refreshed
2. **Refresh Tokens**: Long-lived, stored in DB, used to get new access tokens
3. **Automatic Refresh**: Frontend interceptor handles token refresh transparently
4. **Token Revocation**: Logout deletes token from database
5. **Security**: Multiple layers (signature, DB check, expiration, limits)

---

## 🔍 Testing the Flow

### Test Scenario:
1. Login → Get both tokens
2. Make API call → Uses access token
3. Wait for access token to expire
4. Make another API call → Auto-refreshes in background
5. Logout → Token revoked in database
6. Try to refresh → Should fail (403)

---

## 📝 Environment Variables Needed

```env
# Backend (.env)
ACCESS_TOKEN_SECRET=your-access-secret
REFRESH_TOKEN_SECRET=your-refresh-secret
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d
```

---

This implementation provides a secure, user-friendly authentication system with automatic token management! 🚀

