---
name: error-handling
description: General error handling patterns and RFC 7807 compliance
---

# Error Handling Constraints

## RFC 7807 Compliance

All errors are automatically formatted as Problem Details (RFC 7807) with `type`, `title`, `status`, `detail`, and `instance` fields.

## When to Use Try/Catch

**Rule**: Use try/catch only when you need `finally` cleanup, such as database transactions.

```typescript
// ✅ Good - Database transaction with cleanup
export const updateSignupForSeason = async (
  season: SeasonDetails,
  teamId: number,
  formData: SignupFormValues
) => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();
    const data = await handleSignupFormForSeasonUpdate(
      season.id,
      teamId,
      formData,
      connection
    );
    await connection.commit();
    return data;
  } catch (error) {
    await connection.rollback();
    throw error; // Let it bubble up to express-error-handler
  } finally {
    connection.release();
  }
};
```

## Testing Error Scenarios

Use `await expect().rejects.toThrow()` for error scenarios in tests.

## Summary

- **Try/Catch**: Only for database transactions with cleanup
- **RFC 7807**: All errors automatically formatted as Problem Details
- **Testing**: Use `await expect().rejects.toThrow()` for error scenarios
