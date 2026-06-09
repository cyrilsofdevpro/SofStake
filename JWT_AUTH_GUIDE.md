# JWT Authentication System

This project uses JWT (JSON Web Tokens) for authentication. Tokens are stored in secure, httpOnly cookies.

## Setup

### 1. Environment Variables
Make sure your `.env.local` has:
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

⚠️ **IMPORTANT**: Change this to a strong, random secret in production.

## Authentication Flow

### Registration
- **Endpoint**: `POST /api/auth/register`
- **Body**: `{ email, password, username, name }`
- **Response**: User data + JWT token in httpOnly cookie

### Login
- **Endpoint**: `POST /api/auth/login`
- **Body**: `{ email, password }`
- **Response**: User data + JWT token in httpOnly cookie

### Get Current User
- **Endpoint**: `GET /api/auth/me`
- **Response**: Current user data (requires valid JWT in cookie)

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Response**: Clears JWT token cookie

## Protected Routes

The following routes are automatically protected by middleware:
- `/dashboard`
- `/profile`
- `/wallet`
- `/customize-profile`
- `/friends`
- `/leaderboard`
- `/referrals`
- `/admin`
- `/game`

Unauthenticated users are redirected to `/auth`.

## Using JWT in Components

### Client-Side Hook
```tsx
import { useAuth } from '@/lib/useAuth';

export function MyComponent() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Protecting API Routes

### Using withAuth Helper
```tsx
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, unauthorizedResponse } from '@/lib/protected-route';

export async function POST(request: NextRequest) {
  const user = withAuth(request);
  
  if (!user) {
    return unauthorizedResponse('You must be logged in');
  }

  // Your protected logic here
  console.log(`Request from user: ${user.id}`);

  return NextResponse.json({ success: true });
}
```

## Token Details

- **Token Type**: HS256 (HMAC with SHA-256)
- **Expiry**: 30 days
- **Storage**: httpOnly cookie (secure against XSS)
- **Cookie Name**: `authToken`
- **Cookie Settings**:
  - `httpOnly: true` (prevents JS access)
  - `secure: true` (in production, HTTPS only)
  - `sameSite: 'lax'` (CSRF protection)

## Token Payload

```typescript
interface JWTPayload {
  id: string;          // User ID
  email: string;       // User email
  username: string;    // Username
  iat?: number;        // Issued at (unix timestamp)
  exp?: number;        // Expiration (unix timestamp)
}
```

## Utilities

### In lib/auth.ts
- `generateToken(payload)` - Create a new JWT token
- `verifyToken(token)` - Verify and decode a token
- `getTokenFromCookies()` - Get token from cookies (server-side)
- `getCurrentUser()` - Get current user from token (server-side)
- `setAuthCookie(token)` - Set auth token in cookies
- `clearAuthCookie()` - Clear auth token

### In lib/protected-route.ts
- `withAuth(request)` - Verify token in API request
- `verifyRequestToken(request)` - Get user payload from request
- `unauthorizedResponse()` - Create 401 response
- `forbiddenResponse()` - Create 403 response

## Security Best Practices

✅ Use strong JWT_SECRET (minimum 32 characters)
✅ Keep JWT_SECRET secure in environment variables
✅ Use httpOnly cookies (not localStorage)
✅ Use HTTPS in production
✅ Set appropriate token expiry (30 days is reasonable)
✅ Implement logout that clears the cookie
✅ Refresh tokens before expiry (optional enhancement)

## Common Issues

### "JWT_SECRET is not set"
Make sure you have `JWT_SECRET` in your `.env.local` file.

### Token not persisting
The token is stored in an httpOnly cookie. Ensure cookies are enabled.

### 401 Unauthorized on protected routes
The token may have expired. User needs to login again.

## Adding New Protected Routes

1. Add route path to `protectedRoutes` array in `middleware.ts`:
```ts
const protectedRoutes = [
  '/new-protected-route',
  // ...
];
```

2. (Optional) Wrap API endpoints with `withAuth`:
```ts
import { withAuth } from '@/lib/protected-route';

export async function GET(request: NextRequest) {
  const user = withAuth(request);
  if (!user) return unauthorizedResponse();
  // ...
}
```

## Next Steps

Consider implementing:
- Refresh token rotation for enhanced security
- Rate limiting on auth endpoints
- Email verification
- Password reset flow
- Remember me functionality
