/**
 * Builds a permission scope string in a consistent order.
 *
 * This ensures that permission scopes are always built in the same order,
 * regardless of the order that paramKeys are specified in middleware.
 *
 * The canonical order is:
 * 1. season_id
 * 2. team_id
 * 3. Other IDs in alphabetical order
 *
 * @param params - The route parameters object (e.g., req.params)
 * @param paramKeys - Array of parameter keys to include in scope
 * @returns Scope string (e.g., "season-1:team-2")
 *
 * @example
 * buildPermissionScope({ season_id: "1", team_id: "2" }, ["team_id", "season_id"])
 * // Returns: "season-1:team-2" (automatically reordered)
 */
export function buildPermissionScope(
  params: Record<string, string | undefined>,
  paramKeys: string[]
): string {
  // Define canonical order for known keys
  const orderPriority: Record<string, number> = {
    season_id: 1,
    team_id: 2
  };

  // Sort paramKeys according to canonical order
  const sortedKeys = [...paramKeys].sort((a, b) => {
    const priorityA = orderPriority[a] ?? 1000; // Unknown keys go to end
    const priorityB = orderPriority[b] ?? 1000;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // If same priority (both unknown), sort alphabetically
    return a.localeCompare(b);
  });

  // Build scope parts in sorted order
  const scopeParts = sortedKeys.map((key) => {
    const value = params[key];
    if (!value) {
      throw new Error(`Missing route param: ${key}`);
    }
    // key = "season_id" -> scope part = "season-<id>"
    return key.replace("_id", "") + "-" + value;
  });

  return scopeParts.join(":");
}

/**
 * Builds a complete permission string with optional role.
 *
 * @param action - The permission action (e.g., "edit-registration")
 * @param params - The route parameters object
 * @param paramKeys - Array of parameter keys to include in scope
 * @param role - Optional role name (if omitted, builds direct permission)
 * @returns Permission string (e.g., "captain:edit-registration:season-1:team-2" or "edit-registration:season-1:team-2")
 */
export function buildPermissionString(
  action: string,
  params: Record<string, string | undefined>,
  paramKeys: string[],
  role?: string
): string {
  const scope = buildPermissionScope(params, paramKeys);

  if (role) {
    return `${role}:${action}:${scope}`;
  }

  return `${action}:${scope}`;
}
