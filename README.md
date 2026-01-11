# Optivue Backend

A Node.js Express backend for the Optivue application.

## Installation

1. Install dependencies:
   ```
   npm install
   ```

## Environment Variables

Copy `.env.example` to `.env` and fill in your actual values:

### Required Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: Google OAuth redirect URI
- `GOOGLE_REFRESH_TOKEN`: Google OAuth refresh token
- `BREVO_API_KEY`: Brevo (Sendinblue) API key for email service
- `BREVO_FROM_NAME`: Sender name for emails (default: Optivue)
- `BREVO_FROM_EMAIL`: Sender email address
- `SITE_URL`: Base site URL
- `PORT`: Server port (default: 8000)
- `FRONTEND_URL`: Frontend application URL

## Deployment

### Vercel Deployment
1. Set environment variables in Vercel dashboard or using CLI:
   ```
   vercel env add BREVO_API_KEY
   vercel env add MONGODB_URI
   # Add other required environment variables
   ```

2. Deploy:
   ```
   vercel --prod
   ```

### Local Development
```
npm run dev
```

### Production
```
npm start
```

## Project Structure

- `app.js`: Main application file
- `routes/`: Route handlers
- `controllers/`: Business logic
- `models/`: Data models
- `middleware/`: Custom middleware
- `config/`: Configuration files
- `utils/`: Utility functions
- `tests/`: Test files

## API Endpoints

### Authentication

All future APIs will be user-specific and require authentication via JWT token.

#### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### POST /auth/login
Authenticate a user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### GET /auth/profile
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### General

- `GET /`: Welcome message