# ADR 001: Authentication Token Storage

## Context

The frontend needs to persist the accessToken between page reloads and send it as:

```
Authorization: Bearer <token>
```

The application uses a centralized API client that automatically includes the Bearer token in the Authorization header for all requests when a token exists in storage.

## Decision

The project stores the accessToken in localStorage using the key `accessToken`.

This approach was selected for this course project because:

- **Simplicity**: localStorage provides a straightforward API for storing and retrieving strings without requiring additional backend configuration or cookie management.
- **SPA architecture**: As a single-page application, localStorage allows the client to maintain authentication state across page reloads without server-side session management.
- **Development context**: For a course project, localStorage enables rapid development and testing without needing to configure httpOnly cookie settings, CORS credentials, or server-side cookie infrastructure.

The implementation uses a dedicated `tokenStorage` module (`src/shared/auth/tokenStorage.ts`) that exports three functions:
- `getAccessToken()`: Retrieves the token from localStorage
- `setAccessToken(token)`: Stores the token in localStorage
- `removeAccessToken()`: Removes the token from localStorage

## Alternatives Considered

### 1. localStorage (Chosen)

**Pros:**
- Simple client-side API
- No server-side configuration required
- Works across subdomains (with appropriate configuration)
- Easy to debug in browser dev tools

**Cons:**
- Vulnerable to XSS attacks
- Accessible to any JavaScript running in the origin
- No automatic expiration mechanism
- Not sent with requests by default (must be manually added to headers)

### 2. httpOnly Secure Cookie

**Pros:**
- Not accessible to JavaScript, mitigating XSS token theft
- Automatic inclusion in requests (no manual header management)
- Can have automatic expiration via `Expires` or `Max-Age` attributes
- Additional security attributes: `Secure`, `SameSite`

**Cons:**
- Requires server-side configuration to set cookies
- Requires CORS configuration with `credentials: 'include'` for cross-origin requests
- More complex to implement and test
- May not be feasible depending on backend API capabilities in the course context

## Security Considerations

### XSS Risk

localStorage token storage has a known security vulnerability: JavaScript running in the origin can potentially read localStorage. Therefore, an XSS vulnerability in the application could expose the access token to malicious scripts.

**Mitigation:**
- The application should implement input sanitization and output encoding to prevent XSS vulnerabilities.
- Content Security Policy (CSP) headers should be configured to restrict script sources.
- The access token should have a short expiration time on the server side to limit the window of opportunity if compromised.

### No JWT Decoding

The implementation does not decode JWTs on the client side. This is intentional because:

- The server is the source of truth for token validity
- Client-side decoding adds complexity without meaningful security benefit
- Token expiration and validation are handled server-side
- Avoids the risk of implementing incorrect validation logic

### No Client-Side Expiration

The implementation does not implement client-side token expiration logic because:

- The server validates token expiration on each request
- Client-side expiration could lead to synchronization issues
- The centralized 401 handler clears the token when the server indicates it is invalid
- This keeps the client simple and avoids race conditions

### Server as Source of Truth

The application relies entirely on the server for token validity:

- All API requests include the Bearer token
- The server validates the token and returns 401 if invalid or expired
- The client clears the token and user state on 401 responses
- Network errors and 5xx errors do not clear the session (only authentication failures do)

### Clearing Token on Authentication Failure

The token is cleared when:

- The server returns a 401 response (including TOKEN_EXPIRED)
- The user explicitly logs out via the SessionProvider's logout function
- The startup `/auth/me` check returns 401

This ensures that invalid tokens are not retained, but legitimate tokens are preserved during transient network issues.

## Consequences

### Benefits

- **Simplicity**: Easy to understand, implement, and debug
- **No server configuration**: Works with existing backend without cookie setup
- **Explicit control**: The application has direct control over token lifecycle
- **Development speed**: Faster to implement in a course project context
- **Testability**: Easy to manually inspect and modify tokens in browser dev tools during development

### Security Trade-offs

- **XSS vulnerability**: If an XSS vulnerability exists in the application, the access token can be stolen by malicious scripts
- **No automatic CSRF protection**: Unlike httpOnly cookies with SameSite attributes, localStorage tokens require manual CSRF protection (e.g., CSRF tokens, origin validation)
- **Manual header management**: The application must manually include the Authorization header in each request
- **Potential for token leakage**: Browser extensions or compromised third-party scripts could potentially access localStorage

### Operational Considerations

- Token persistence depends on browser settings (users may clear localStorage)
- Tokens are not shared across different browsers or devices
- Incognito/private browsing modes clear localStorage when the session ends
- The application must handle the case where localStorage is disabled or unavailable

