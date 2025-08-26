# Authentication System

This project implements a JWT-based authentication system with the following features:

## Components

### Login Page (`pages/Login.tsx`)
- Form with email and password validation using react-hook-form + zod
- POST to `${VITE_API_BASE_URL}/auth/login`
- Stores JWT token in both cookie (httpOnly preferred) and localStorage (fallback)
- Redirects to dashboard or intended page after successful login
- Prevents access if already authenticated

### Protected Routes (`components/ProtectedRoute.tsx`)
- Wraps protected pages to require authentication
- Redirects to login page if not authenticated
- Preserves intended destination for post-login redirect

### Auth Utilities (`pages/Login.tsx` - exported as `authUtils`)
- `setToken(token)` - Store JWT token
- `getToken()` - Retrieve JWT token
- `removeToken()` - Clear JWT token
- `isAuthenticated()` - Check if user is logged in

### API Client (`services/api.ts`)
- Automatically adds Authorization header with JWT token
- Handles 401 responses by clearing token and redirecting to login
- Supports both cookie and localStorage token storage

## Protected Routes

The following routes require authentication:
- `/receipts` - New Receipt form
- `/receipts/list` - Receipts listing
- `/lab-tests` - Lab tests (placeholder)
- `/reports` - Reports (placeholder)
- `/invoices` - Invoices (placeholder)

## Public Routes

- `/` - Dashboard (shows different content based on auth status)
- `/login` - Login page
- `/owner/track` - Public package tracking

## Token Storage Strategy

1. **Primary**: HTTP-only cookie (set via `document.cookie`)
2. **Fallback**: localStorage (for environments where cookies are restricted)
3. **Automatic cleanup**: Both storage methods are cleared on logout or 401 errors

## Usage Examples

```tsx
import { authUtils } from './pages/Login'

// Check if authenticated
if (authUtils.isAuthenticated()) {
  // User is logged in
}

// Logout
authUtils.removeToken()

// Get current token
const token = authUtils.getToken()
```

## Backend Integration

The system expects the backend to:

1. **Login endpoint**: `POST /auth/login`
   - Accept: `{ email: string, password: string }`
   - Return: `{ token: string }` (JWT)

2. **Protected endpoints**: Accept `Authorization: Bearer <token>` header

3. **Token validation**: Return 401 for invalid/expired tokens
