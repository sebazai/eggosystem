import type { UserFullPayload } from "@eggosystem/types";

/**
 * Check if user has any of the required roles for captains access
 */
export const hasCaptainsAccess = (user: UserFullPayload | null): boolean => {
  if (!user || !user.roles) return false;

  const requiredRoles = ["admin", "captain", "helpdesk"];
  return user.roles.some((role) => requiredRoles.includes(role));
};

/**
 * Get user's highest role for display purposes
 */
export const getUserHighestRole = (
  user: UserFullPayload | null
): string | null => {
  if (!user || !user.roles) return null;

  const roleHierarchy = ["admin", "helpdesk", "captain"];

  for (const role of roleHierarchy) {
    if (user.roles.includes(role)) {
      return role;
    }
  }

  return user.roles[0] || null;
};

/**
 * Check if user has caster role
 */
export const hasCasterAccess = (user: UserFullPayload | null): boolean => {
  if (!user || !user.roles) return false;

  return user.roles.includes("caster");
};
