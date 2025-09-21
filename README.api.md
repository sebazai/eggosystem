# Backend API Documentation

This document provides essential patterns and architecture for the Kanaliiga backend API.

## 🏗️ API Architecture

- **Base URL**: `http://localhost:3001/api/v1` (dev) / `https://api.kanaliiga.fi/api/v1` (prod)
- **Versioning**: URL path versioning (`/api/v1/`)
- **Error Format**: RFC 7807 Problem Details specification

## 🔐 Authentication & Authorization

### Authentication Methods

#### 1. JWT Authentication

**Primary authentication method** for user-facing endpoints.

**Headers**:

```
Authorization: Bearer <jwt_token>
```

**Cookie**:

```
access_token=<jwt_token>
```

**Middleware**: `authenticateJWT`

#### 2. API Key Authentication

**Service-to-service authentication** for internal operations.

**Headers**:

```
x-api-key: <api_key>
```

**Middleware**: `createApiKeyValidator(process.env.BACKEND_SERVICE_API_KEY)`

#### 3. Hybrid Authentication

**Combined JWT + API Key** for flexible access control.

**Middleware**: `checkApiKeyOrJWT`

### Authorization Patterns

#### 1. Role-Based Access Control (RBAC)

```typescript
checkPermissions({
  fallbackRoles: ["admin", "helpdesk"]
});
```

#### 2. Static Permissions

```typescript
checkPermissions({
  staticPermissions: ["read:dashboard", "write:seasons"]
});
```

#### 3. Dynamic Permissions

```typescript
checkPermissions({
  role: "season",
  action: "manage",
  paramKeys: ["season_id"]
});
// Creates: "season:manage:season-123"
```

## 🛣️ API Endpoints

**Route Structure**: RESTful endpoints following `/api/v1/{resource}` pattern

**Main Route Groups**:

- `/auth` - Authentication (Steam, JWT)
- `/players` - Player data and statistics
- `/teams` - Team information and stats
- `/matches` - Match data and results
- `/seasons` - Season management
- `/organizations` - Organization data
- `/filters` - Advanced filtering with query parameters
- `/dashboard` - Admin/helpdesk protected routes
- `/accounts` - User account management
- `/faceit` - FaceIT integration
- `/elo` - ELO system (API key protected)
- `/registrations` - Team registration
- `/calendar` - Event management
- `/casters` - Caster information

**Query Parameters** (for filter endpoints):

- `season_ids`, `league_ids`, `team_ids`, `stages`, `map_ids` (comma-separated)

## 🔧 Middleware

### Authentication

- `authenticateJWT` - JWT token validation (cookies/headers)
- `createApiKeyValidator` - API key validation for service-to-service
- `checkApiKeyOrJWT` - Flexible JWT + API key authentication

### Authorization

- `checkPermissions` - Database-backed permissions with role fallbacks
- `checkJWTPermissions` - Stateless JWT token permission checking

### Utility

- `corsMiddleware` - CORS handling
- `parseQueryFilterParams` - Query parameter parsing/validation
- `cacheResponseMiddleware` - Response caching with TTL
- `validateNumericParams` - Numeric parameter validation

## 🚨 Error Handling

**Error Types**: 401 (Unauthorized), 403 (Forbidden), 400 (Bad Request), 404 (Not Found), 500 (Internal Server Error)

**Format**: RFC 7807 Problem Details specification with `type`, `title`, `status`, `detail`, `instance` fields

## 🔒 Security Best Practices

- **HTTPS in production**, JWT validation, secure API keys
- **Principle of least privilege** with role/permission-based access control
- **Input validation**, rate limiting, CORS configuration
- **Comprehensive testing** with dedicated `auth.test.ts` files

## 🧪 Testing

**Authentication Testing**: Create dedicated `auth.test.ts` files for comprehensive auth testing (401, 403, 200 responses)

**API Testing**: Test endpoints with proper authentication and authorization patterns

## 📊 Performance

**Caching**: Response caching, database query caching, cache invalidation

**Database**: Indexed queries, connection pooling, query optimization, pagination

## 🔗 Related Documentation

- [Dashboard Security](README.dashboard.md) - Dashboard-specific security patterns
- [Testing Strategy](README.testing.md) - API testing patterns and best practices
- [Database Schema](README.database.md) - Database structure and relationships
- [Frontend Development](README.frontend.md) - Frontend API integration patterns
