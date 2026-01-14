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

## 📋 REST API Best Practices

### Explicit Resource Identifiers

**Always use explicit resource identifiers** (e.g., `season_id`, `team_id`, `player_id`) in API endpoints rather than inferring resources from "active" states or other implicit conditions.

**✅ Good - Explicit Identifier**:

```typescript
// URL parameter
POST /api/v1/dashboard/registration/season/:season_id/bulk-approve

// Request body
POST /api/v1/dashboard/registration/approved
{
  "season_id": 17,
  "teamId": 123,
  ...
}
```

**❌ Bad - Implicit "Active" State**:

```typescript
// Don't infer season from "active" state
POST / api / v1 / dashboard / registration / bulk - approve;
// Backend tries to find "active season" - creates implicit dependencies
```

### Why Explicit Identifiers?

1. **Multi-Organizer Support**: Explicit identifiers allow the system to work with multiple organizers without ambiguity
2. **Testability**: Explicit parameters make endpoints easier to test with specific scenarios
3. **Clarity**: API consumers know exactly which resource they're operating on
4. **REST Compliance**: Follows REST principles where resources are identified by unique identifiers
5. **No Implicit Dependencies**: Avoids hidden dependencies on database state or time-based conditions

### Resource Inference Pattern

When you have a resource identifier (e.g., `season_id`), you can infer related data:

```typescript
// ✅ Good: Use season_id to fetch related data
const seasonId = Number(req.params.season_id);
const season = await getSeasonById(seasonId);
// Now you have: app_id, game_id, organizer_id, platform, etc.
```

### Deprecated Patterns

The following patterns are **deprecated** and should not be used in new code:

- `getActiveSignupOrActiveSeasonForAppId()` - Use explicit `season_id` instead
- `getActiveOrLatestSeasonForAppId()` - Use explicit `season_id` instead
- `getActiveSeasonForAppId()` - Use explicit `season_id` instead
- `getActiveSignupSeasonForAppId()` - Use explicit `season_id` instead

**Migration Path**: Update endpoints to require `season_id` as a URL parameter or in the request body, then use that identifier to fetch season details and related information.

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
