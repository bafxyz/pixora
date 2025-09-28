# Authentication System Documentation

## Overview

The Pixora authentication system is built on Supabase and provides role-based access control with session management and multi-tenant support.

## Architecture

### Components

1. **Supabase Client** - Handles authentication operations
2. **Auth Store** - Client-side state management for authentication
3. **Middleware** - Server-side authentication and authorization
4. **Role Guard** - Role-based access control utilities
5. **Multi-tenant Middleware** - Tenant isolation for photographers and studios

### Technologies Used

- Supabase Auth
- Next.js Middleware
- Zustand for state management
- TypeScript for type safety

## Authentication Flow

### Initial Load
1. Auth store initializes when the application loads
2. Attempts to retrieve existing session from Supabase
3. If session exists, user state is set
4. If session doesn't exist or is expired, session refresh is attempted

### Session Refresh
The system implements automatic session refresh:
1. When `getUser()` fails, the system tries `refreshSession()`
2. If refresh succeeds, it attempts `getUser()` again
3. If refresh fails, the user is redirected to login

### Middleware Protection
1. All routes are checked by middleware (except public routes)
2. API routes have specific role-based protection
3. Protected UI routes redirect unauthenticated users to login
4. Multi-tenant routes ensure users only access their tenant data

## Role System

### Available Roles

- `admin` - Platform administrator with full access
- `studio-admin` - Studio administrator with studio-level access
- `photographer` - Photographer with photographer-level access
- `guest` - Unauthenticated user with limited access

### Role-Based Access

#### API Endpoints Protection
- `/api/admin/*` - Admin only
- `/api/studio-admin/*` - Studio admin and admin
- `/api/photographer/*` - Photographer, studio admin, and admin
- `/api/qr/*` - Photographer, studio admin, and admin
- `/api/photos/*` - Authenticated users
- `/api/gallery/*` - Public
- `/api/payments/*` - Authenticated users

#### UI Routes Protection
- `/admin` - Admin only
- `/studio-admin` - Studio admin and admin
- `/photographer` - Photographer, studio admin, and admin
- `/dashboard` - Authenticated users
- Public routes: `/`, `/login`, `/session`, `/gallery`, `/payment`

## Error Handling

### Common Authentication Errors

1. **Missing Supabase Environment Variables** - Server configuration error
2. **Session Expired** - Automatic refresh attempted
3. **Invalid Session** - User redirected to login
4. **Insufficient Permissions** - Access denied with appropriate status code

### Logging

All authentication events are logged with:
- Timestamp
- Request path
- User ID (if available)
- Error details (if any)
- Role information

## Security Considerations

1. All API routes are protected based on roles
2. Multi-tenant isolation prevents cross-tenant data access
3. Session refresh helps maintain valid sessions
4. Secure cookie handling in both client and server environments

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key

## Client Usage

### Accessing Auth State

```typescript
import { useAuthUser, useAuthSession, useAuthLoading } from '@/shared/stores/auth.store'

const user = useAuthUser() // Current authenticated user
const session = useAuthSession() // Current session
const loading = useAuthLoading() // Loading state
```

### Sign In/Sign Up

```typescript
import { useAuthStore } from '@/shared/stores/auth.store'

const { signIn, signUp } = useAuthStore.getState()
const result = await signIn(email, password)
```

## Troubleshooting

### Common Issues

1. **Persistent "Auth session missing!" errors**:
   - Ensure Supabase environment variables are properly set
   - Check that cookies are allowed in the browser
   - Verify Supabase project settings for authentication

2. **Redirect loops**:
   - Check middleware configuration
   - Ensure public routes are properly defined

3. **Role-based access issues**:
   - Verify user roles are properly set in Supabase user metadata
   - Check that role guards are correctly implemented

## Testing

### Unit Tests

Authentication utilities should be tested for:
- Session refresh functionality
- Role-based access control
- Error handling scenarios
- Multi-tenant isolation

### Integration Tests

Test the full authentication flow:
- Sign in/sign up process
- Session management
- Route protection
- API endpoint access control