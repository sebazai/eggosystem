/**
 * Role permission matrix defining which roles can manage which other roles
 * Higher roles can manage lower roles, but not vice versa
 * Add these to database later to the roles table so we dont need to hardcode them
 */

const ROLE_HIERARCHY = {
  superadmin: 200, // For future implementation - highest role that can manage admin roles
  admin: 100,
  helpdesk: 50,
  caster: 10,
  captain: 10,
  "co-captain": 10
} as const;

export type RoleName = keyof typeof ROLE_HIERARCHY;

/**
 * Check if a user with the given role can manage another role
 * @param userRole The role of the user trying to perform the action
 * @param targetRole The role being added/removed
 * @returns true if the user can manage the target role
 */
export function canManageRole(userRole: string, targetRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as RoleName] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole as RoleName] || 0;

  // Users can only manage roles with lower hierarchy levels
  // Users cannot manage their own role level or higher
  return userLevel > targetLevel;
}

/**
 * Get all roles that a user can manage
 * @param userRole The role of the user
 * @returns Array of role names that the user can manage
 */
export function getManageableRoles(userRole: string): string[] {
  const userLevel = ROLE_HIERARCHY[userRole as RoleName] || 0;

  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level < userLevel)
    .map(([role, _]) => role);
}

/**
 * Validate if a role name is valid
 * @param roleName The role name to validate
 * @returns true if the role is valid
 */
export function isValidRole(roleName: string): roleName is RoleName {
  return roleName in ROLE_HIERARCHY;
}
