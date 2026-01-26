---
name: type-safety
description: Type safety constraints and patterns for TypeScript code
---

# Type Safety Constraints

**Type:** Strict rule

## Prohibited Practices

**❌ DO NOT** use the `as` keyword for type casting in most situations:

```typescript
// ❌ BAD: Unsafe type casting
const userData = JSON.parse(response.body) as UserData;

// ❌ BAD: Double casting to bypass TypeScript safety
const id = userInput as unknown as number;
```

**❌ DO NOT** use `@ts-ignore` or `@ts-nocheck` to bypass type checking.

## Required Practices

### Use the `satisfies` Operator

**✅ DO** use the `satisfies` operator to validate type conformance:

```typescript
// ✅ GOOD: Validates type conformance while preserving inferred types
const config = {
  endpoint: "/api/users",
  maxRetries: 3,
  timeout: 5000
} satisfies ApiConfig;
```

### Use Type Guards

**✅ DO** use type guards to narrow types safely:

```typescript
// ✅ GOOD: Type guard function
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === "object" && data !== null && "id" in data && "name" in data
  );
}
```

### Create Separate Types for Raw and Processed Data

**✅ DO** create separate interfaces for raw and processed data:

```typescript
// For parsed application data (post-transformation)
export interface TeamSortterValues {
  team_id: number;
  team_name: string;
  top5_values: number[]; // Typed as array
}

// For raw database results (pre-transformation)
export interface TeamSortterValuesRaw extends Omit<
  TeamSortterValues,
  "top5_values"
> {
  top5_values: string; // Typed as string from database
}
```

## Limited Exceptions

Type assertions may be allowed in limited circumstances, but **MUST** be accompanied by comments explaining why they're necessary:

1. **Working with external libraries** with incomplete type definitions
2. **Component props with default values** in React
3. **DOM APIs** that TypeScript doesn't fully type

## Summary

- **Never** use unsafe type casting with `as` without validation
- **Always** validate data before assuming its type
- **Use** `satisfies` operator to validate type conformance
- **Create** separate interfaces for raw and processed data
- **Write** type guards for runtime type checking
- **Document** any necessary exceptions with comments
