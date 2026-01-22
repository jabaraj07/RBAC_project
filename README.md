# User Authentication & Authorization System with RBAC

A full-stack authentication and authorization system with Role-Based Access Control (RBAC) built with Node.js/Express backend and React frontend.

## Features

### Backend
- User registration and login
- JWT-based authentication (Access & Refresh tokens)
- Role-based access control (Admin & User roles)
- Password hashing with bcrypt
- Token refresh mechanism
- Protected routes with middleware
- User management API (Admin only)

### Frontend
- Responsive login and registration pages
- Protected dashboard
- Admin-only user list page
- Context API for state management
- Automatic token refresh
- Auto-logout on token expiration
- Remember credentials option
- Modern UI design

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "User Authenticaion - authorization project"
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Create .env file
# Copy the content from Backend/.env.example or create manually
# See Environment Variables section below for required variables
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd front-end

# Install dependencies
npm install

# Create .env file (optional - only if backend runs on different URL)
# Copy the content from front-end/.env.example or create manually
```

### 4. Environment Variables

#### Backend (.env)
Create a `.env` file in the `Backend` directory:

```env
PORT=5000
MONGO_DB_URI=mongodb://localhost:27017/user-auth-db
ACCESS_TOKEN_SECRET=your_access_token_secret_key_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_here
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d
```

**Important:** Generate strong secret keys for production:
```bash
# Generate random secret keys
openssl rand -base64 32
```

#### Frontend (.env) - Optional
Create a `.env` file in the `front-end` directory (only if backend runs on different URL):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in MONGO_DB_URI
```

## How to Run the Project

### Start Backend Server

```bash
cd Backend

# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Start Frontend Development Server

```bash
cd front-end

# Start React development server
npm start
```

The frontend will run on `http://localhost:3000` and automatically open in your browser.

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user" // optional, defaults to "user"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "UserData": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "..."
  },
  "AccessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "RefreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** The first user registered automatically becomes an admin.

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login credential verified successfully",
  "UserData": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "AccessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "RefreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Refresh Access Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "AccessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "User is authenticated",
  "UserData": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Protected Endpoints

#### 5. Get All Users (Admin Only)
```http
GET /api/users?page=1&limit=10
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**
```json
{
  "users": [
    {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "..."
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

### Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "message": "Required field missing.."
}
```

**401 Unauthorized:**
```json
{
  "message": "Not authorized to access this route"
}
```

**404 Not Found:**
```json
{
  "message": "User Not exists"
}
```

**409 Conflict:**
```json
{
  "message": "User already exists"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Server error"
}
```

## Test Credentials

### Admin Account
```
Email: admin@example.com
Password: Admin@123
```

### Regular User Account
```
Email: user@example.com
Password: User@123
```

**Note:** You can register new users through the registration page. The first user registered will automatically be assigned the admin role.


## Security Features

- **Password Hashing:** bcrypt with 11 salt rounds
- **JWT Tokens:** Secure token-based authentication
- **Token Expiration:** Access tokens expire in 15 minutes, refresh tokens in 7 days
- **Auto Token Refresh:** Automatic token refresh on expiration
- **Role-Based Access Control:** Admin and User roles with route protection
- **Input Validation:** Email format and password strength validation
- **CORS:** Configured for secure cross-origin requests

## Frontend Features

- **Responsive Design:** Works on desktop, tablet, and mobile devices
- **Modern UI:** Beautiful gradient designs and smooth animations
- **Context API:** Centralized authentication state management
- **Protected Routes:** Automatic redirection for unauthorized access
- **Token Management:** Secure token storage with localStorage/sessionStorage
- **Auto-logout:** Automatic logout on token expiration
- **Error Handling:** User-friendly error messages

## Testing the Application

1. **Start both servers** (backend and frontend)
2. **Register a new user** - This will be the admin (first user)
3. **Login with admin credentials**
4. **Access the Users List page** - Should work for admin
5. **Logout and register/login as regular user**
6. **Try accessing Users List** - Should show "Access Denied" page

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check `MONGO_DB_URI` in `.env` file
- Verify MongoDB connection string format

**Port Already in Use:**
- Change `PORT` in `.env` file
- Or stop the process using port 5000

**JWT Token Errors:**
- Ensure `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` are set
- Use strong, random secret keys

### Frontend Issues

**API Connection Error:**
- Verify backend is running on correct port
- Check `REACT_APP_API_URL` in `.env` file
- Ensure CORS is enabled in backend

**Token Not Persisting:**
- Check browser console for errors
- Verify localStorage/sessionStorage is enabled
- Clear browser cache and try again

## Notes

- The first user registered automatically becomes an admin
- Access tokens expire in 15 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- Passwords must be at least 6 characters long
- Email format is validated on both client and server

