# Optivue Backend

A Node.js Express backend for the Optivue application.

## Installation

1. Install dependencies:
   ```
   npm install
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

## Running the Application

For development:
```
npm run dev
```

For production:
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