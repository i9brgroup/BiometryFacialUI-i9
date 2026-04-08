# Authentication API Specification

This document outlines the changes made to the backend authentication system and provides guidance for frontend integration. It follows the **Spec-Driven Development (SDD)** methodology to ensure clarity and alignment between backend and frontend teams.

## Overview

### Key Changes
1. **Refresh Token Logic**:
   - Refresh tokens are now managed in-memory using a `HashMap`.
   - Tokens are rotated during refresh to enhance security.
   - Tokens are now sent as HTTPOnly cookies.
2. **New Logout Endpoint**:
   - A `/logout` endpoint has been added to invalidate refresh tokens.
3. **Token Storage**:
   - Transition from `localStorage` to HTTPOnly cookies for storing tokens.

### Security Improvements
- Tokens are no longer exposed to JavaScript, reducing the risk of XSS attacks.
- Refresh tokens are short-lived and rotated on each use.

---

## API Endpoints

### 1. Login
**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
- **200 OK**:
```json
{
  "accessToken": "<JWT_ACCESS_TOKEN>"
}
```
- **401 Unauthorized**: Invalid credentials.

**Notes**:
- The `accessToken` is returned in the response body.
- The `refreshToken` is sent as an HTTPOnly cookie.

---

### 2. Refresh Token
**Endpoint**: `POST /api/v1/auth/refresh`

**Request**:
- **Cookies**:
  - `refreshToken`: Required

**Response**:
- **200 OK**:
```json
{
  "accessToken": "<NEW_JWT_ACCESS_TOKEN>"
}
```
- **401 Unauthorized**: Missing or invalid refresh token.

**Notes**:
- The old refresh token is invalidated, and a new one is issued as an HTTPOnly cookie.

---

### 3. Logout
**Endpoint**: `POST /api/v1/auth/logout`

**Request**:
- **Headers**:
  - `Authorization`: Bearer `<ACCESS_TOKEN>`

**Response**:
- **200 OK**: Logout successful.

**Notes**:
- The `refreshToken` cookie is cleared.

---

## Business Rules

1. **Token Rotation**:
   - Refresh tokens are rotated on each use.
   - Old tokens are invalidated immediately after use.

2. **Token Expiration**:
   - `accessToken`: 15 minutes.
   - `refreshToken`: 7 days.

3. **HTTPOnly Cookies**:
   - The `refreshToken` is stored in an HTTPOnly cookie to prevent XSS attacks.
   - The cookie should have the `Secure` and `SameSite=Strict` attributes.

---

## Frontend Integration

### Authentication Flow
1. **Login**:
   - Send credentials to `/login`.
   - Store `accessToken` in memory.
   - The `refreshToken` is automatically stored in an HTTPOnly cookie.

2. **Token Refresh**:
   - Automatically call `/refresh` when the `accessToken` expires.
   - The `refreshToken` cookie is automatically updated.

3. **Logout**:
   - Call `/logout` to invalidate tokens.
   - The `refreshToken` cookie is cleared.

### Example: Axios Configuration
```javascript
const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
  withCredentials: true
});
```

---

## Examples

### Login Request
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}' \
  http://localhost:8080/api/v1/auth/login
```

### Refresh Token Request
```bash
curl -X POST \
  --cookie "refreshToken=<REFRESH_TOKEN>" \
  http://localhost:8080/api/v1/auth/refresh
```

### Logout Request
```bash
curl -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  http://localhost:8080/api/v1/auth/logout
```

---

## Conclusion
This document provides a comprehensive guide for integrating the new authentication system. Follow the outlined API contracts and business rules to ensure seamless integration between the backend and frontend.
