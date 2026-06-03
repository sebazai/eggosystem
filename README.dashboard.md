# Dashboard Security Guide

This document outlines the comprehensive security measures, authentication patterns, and authorization controls for the Kanaliiga dashboard system.

## 🔐 Security Architecture Overview

The dashboard implements a **multi-layered security approach** with both frontend and backend protection:

1. **Frontend Protection**: `WithRoleProtection` component with role-based access control
2. **Backend Authentication**: JWT-based authentication with `authenticateJWT` middleware
3. **Backend Authorization**: Permission-based access control with `checkPermissions` middleware
4. **Route Protection**: All dashboard routes require authentication and appropriate permissions

## 🛡️ Frontend Security

### WithRoleProtection Component

**CRITICAL**: All dashboard components must be wrapped with `WithRoleProtection` to prevent unauthorized access.

**Location**: `apps/frontend/src/components/dashboard/WithRoleProtection.tsx`

**Usage Pattern**:

```tsx
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";

export default function DashboardPage() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div>{/* Dashboard content */}</div>
    </WithRoleProtection>
  );
}
```

**Layout-Level Protection**:

```tsx
// apps/frontend/src/app/(admin)/layout.tsx
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AuthProvider>
          <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
            <main>{children}</main>
          </WithRoleProtection>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Component Behavior**:

- **No user**: Shows login prompt with Steam login button
- **Unauthorized user**: Shows "403 Forbidden" message
- **Authorized user**: Renders protected content

### Frontend Security Requirements

1. **Always use `WithRoleProtection`** for dashboard components
2. **Specify appropriate roles** for each component/page
3. **Test role-based access** in component tests
4. **Handle loading states** gracefully during authentication checks

## 🔒 Backend Security

### Authentication Middleware

**All dashboard routes require JWT authentication** via `authenticateJWT` middleware:

```typescript
// apps/backend/src/routes/index.ts
v1Router.use("/dashboard", corsMiddleware, authenticateJWT, dashboardRouter);
```

**Authentication Flow**:

1. **JWT Token Validation**: Verifies access token from cookies or Authorization header
2. **User Context**: Attaches authenticated user to `req.auth`
3. **Error Handling**: Returns 401 for invalid/missing tokens

### Authorization Middleware

**All dashboard routes use `checkPermissions` middleware** for fine-grained access control:

```typescript
import { checkPermissions } from "../../../middlewares/auth.middleware";

router.use(
  "/seasons",
  checkPermissions({
    fallbackRoles: ["admin", "helpdesk"]
  }),
  seasonRouter
);
```

**Permission Types**:

1. **Static Permissions**: Direct permission strings (e.g., `"read:dashboard"`)
2. **Dynamic Permissions**: Role-based permissions with parameters
3. **Fallback Roles**: Default roles that bypass permission checks

## 👥 Role Hierarchy

### Role Levels

```typescript
// apps/backend/src/utils/role-permissions.ts
const ROLE_HIERARCHY = {
  superadmin: 200, // Future implementation - can manage admin roles
  admin: 100, // Full dashboard access
  helpdesk: 50, // Limited dashboard access
  caster: 10, // Casting-related permissions
  captain: 10, // Team management permissions
  "co-captain": 10 // Secondary team management
} as const;
```

### Role Capabilities

| Role         | Dashboard Access | Season Management | Player Management | Team Management | Role Management | Sortter Access |
| ------------ | ---------------- | ----------------- | ----------------- | --------------- | --------------- | -------------- |
| **admin**    | ✅ Full          | ✅ Full           | ✅ Full           | ✅ Full         | ✅ Full         | ✅ Full        |
| **helpdesk** | ✅ Limited       | ✅ Read/Write     | ✅ Read/Write     | ✅ Read/Write   | ✅ Read/Write   | ❌ No Access   |
| **caster**   | ❌ No Access     | ❌ No Access      | ❌ No Access      | ❌ No Access    | ❌ No Access    | ❌ No Access   |
| **captain**  | ❌ No Access     | ❌ No Access      | ❌ No Access      | ❌ No Access    | ❌ No Access    | ❌ No Access   |

## 🛣️ Route Protection Matrix

### Dashboard Routes and Required Permissions

| Route                             | Required Roles      | Special Permissions | Notes                                            |
| --------------------------------- | ------------------- | ------------------- | ------------------------------------------------ |
| `/dashboard/`                     | `admin`             | `read:dashboard`    | Dashboard root - admin only                      |
| `/dashboard/seasons`              | `admin`, `helpdesk` | -                   | Season management                                |
| `/dashboard/players`              | `admin`, `helpdesk` | -                   | Player validation and management                 |
| `/dashboard/teams`                | `admin`, `helpdesk` | -                   | Team management                                  |
| `/dashboard/organizations`        | `admin`, `helpdesk` | -                   | Organization management                          |
| `/dashboard/registration`         | `admin`, `helpdesk` | -                   | Registration management                          |
| `/dashboard/sortter`              | `admin`             | -                   | **Admin only** - team sorting                    |
| `/dashboard/matches`              | `admin`, `helpdesk` | -                   | Match management                                 |
| `/dashboard/role-management`      | `admin`, `helpdesk` | -                   | Role and permission management                   |
| `/dashboard/redis`                | `admin`, `helpdesk` | -                   | Redis cache management                           |
| `/dashboard/demos`                | `admin`, `helpdesk` | -                   | Demo file management                             |
| `/dashboard/season-league-mapper` | `admin`             | -                   | **Admin only** - map external leagues to seasons |
| `/dashboard/faceit-validation`    | `admin`, `helpdesk` | -                   | FACEIT roster validation                         |
| `/dashboard/email-verification`   | `admin`, `helpdesk` | -                   | Email verification tools                         |
| `/dashboard/caster-applications`  | `admin`, `helpdesk` | -                   | Caster application review                        |
| `/dashboard/playoff-seeds`        | `admin`, `helpdesk` | -                   | Playoff seeding                                  |
| `/dashboard/sponsors`             | `admin`             | -                   | **Admin only** - marketing sponsor management    |
| `/dashboard/newsletter`           | `admin`             | -                   | **Admin only** - newsletter management           |

### Special Access Controls

1. **Sortter Access**: Only `admin` role can access team sorting functionality
2. **Season League Mapper**: Only `admin` role can map external leagues to internal seasons
3. **Dashboard Root**: Requires `read:dashboard` permission or `admin` role
4. **Role Management**: Both `admin` and `helpdesk` can manage roles (with hierarchy restrictions)

## 🔧 Permission System

### Static Permissions

Direct permission strings that grant access:

```typescript
checkPermissions({
  staticPermissions: ["read:dashboard", "write:seasons"]
});
```

### Dynamic Permissions

Role-based permissions with route parameters:

```typescript
checkPermissions({
  role: "season",
  action: "manage",
  paramKeys: ["season_id"]
});
// Creates permission: "season:manage:season-123"
```

### Fallback Roles

Default roles that bypass permission checks:

```typescript
checkPermissions({
  fallbackRoles: ["admin", "helpdesk"]
});
```

## 🧪 Security Testing

### Authentication Testing

**CRITICAL**: Create dedicated `auth.test.ts` files for each router group to test authentication comprehensively.

**Location**: `apps/backend/src/routes/v1/dashboard/auth.test.ts`

**Test Scenarios**:

1. **Unauthenticated Access** (401 responses)
2. **Authenticated but Insufficient Permissions** (403 responses)
3. **Authenticated with Proper Roles** (200 responses)
4. **Role-based Access Control** (different roles, different access)

**Example Test Structure**:

```typescript
describe("Dashboard Routes Authentication Tests", () => {
  describe("Unauthenticated Access", () => {
    it("should return 401 for dashboard root without authentication", async () => {
      const response = await request(app).get("/api/v1/dashboard/").expect(401);

      expect(response.body).toMatchObject({
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Forbidden: Requires authentication"
      });
    });
  });

  describe("Authenticated with Admin Role", () => {
    it("should allow access to dashboard root with admin role", async () => {
      const response = await request(app)
        .get("/api/v1/dashboard/")
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body).toEqual({ OK: 200 });
    });
  });
});
```

### Frontend Security Testing

Test `WithRoleProtection` component behavior:

```typescript
import { render, screen } from "@testing-library/react";
import { WithRoleProtection } from "./WithRoleProtection";
import { MockAuthProvider } from "../test-utils/test-utils";

describe("WithRoleProtection", () => {
  it("should show login prompt for unauthenticated user", () => {
    render(
      <MockAuthProvider user={null}>
        <WithRoleProtection allowedRoles={["admin"]}>
          <div>Protected Content</div>
        </WithRoleProtection>
      </MockAuthProvider>
    );

    expect(screen.getByText("Authentication Required")).toBeInTheDocument();
  });

  it("should show 403 for unauthorized user", () => {
    render(
      <MockAuthProvider user={{ roles: ["user"] }}>
        <WithRoleProtection allowedRoles={["admin"]}>
          <div>Protected Content</div>
        </WithRoleProtection>
      </MockAuthProvider>
    );

    // The component renders "403" and "Forbidden" as separate elements
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(screen.getByText("Forbidden")).toBeInTheDocument();
  });

  it("should render content for authorized user", () => {
    render(
      <MockAuthProvider user={{ roles: ["admin"] }}>
        <WithRoleProtection allowedRoles={["admin"]}>
          <div>Protected Content</div>
        </WithRoleProtection>
      </MockAuthProvider>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
```

## 🚨 Security Best Practices

### Frontend Security

1. **Always wrap dashboard components** with `WithRoleProtection`
2. **Use appropriate role restrictions** - don't over-grant access
3. **Handle loading and error states** gracefully
4. **Test role-based access** in component tests
5. **Never trust frontend-only security** - backend validation is required

### Backend Security

1. **Always use `authenticateJWT`** for dashboard routes
2. **Always use `checkPermissions`** for authorization
3. **Test authentication comprehensively** in dedicated `auth.test.ts` files
4. **Use principle of least privilege** - grant minimum required permissions
5. **Validate permissions server-side** - never rely on frontend checks alone

### Route Security

1. **Protect all dashboard routes** with authentication middleware
2. **Use appropriate permission levels** for different functionalities
3. **Test all authentication scenarios** (401, 403, 200)
4. **Document permission requirements** clearly
5. **Regular security audits** of route protections

## 🔍 Security Monitoring

### Error Responses

All security violations return RFC 7807 compliant error responses:

```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Forbidden: Requires authentication"
}
```

### Logging

- **Authentication failures** are logged for security monitoring
- **Permission violations** are tracked for audit purposes
- **Role changes** are logged for compliance

## 🚀 Development Guidelines

### Adding New Dashboard Routes

1. **Add authentication middleware**:

   ```typescript
   router.use("/new-route", authenticateJWT, newRouteRouter);
   ```

2. **Add authorization middleware**:

   ```typescript
   router.use(
     "/new-route",
     checkPermissions({
       fallbackRoles: ["admin", "helpdesk"]
     }),
     newRouteRouter
   );
   ```

3. **Create authentication tests**:

   ```typescript
   // Create auth.test.ts file with comprehensive auth testing
   ```

4. **Add frontend protection**:
   ```tsx
   <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
     <NewRouteComponent />
   </WithRoleProtection>
   ```

### Security Checklist

- [ ] Route protected with `authenticateJWT` middleware
- [ ] Route protected with `checkPermissions` middleware
- [ ] Frontend component wrapped with `WithRoleProtection`
- [ ] Authentication tests created in `auth.test.ts`
- [ ] Frontend security tests written
- [ ] Appropriate role restrictions applied
- [ ] Error responses follow RFC 7807 format
- [ ] Security documentation updated

## 🔗 Related Documentation

- [Frontend Development](README.frontend.md) - Component patterns and responsive design
- [Testing](README.md#testing) — unit/integration (Jest) and E2E (Playwright) conventions
- [Backend API Documentation](README.api.md) - API security patterns
- [Database Schema](README.database.md) - Role and permission tables
