export interface RegistrationDraftRaw {
  organizationId?: number;
  teamId?: number;
  newOrganization?: {
    name?: string;
    website?: string;
    organization_code?: string;
    image_data?: string;
    image_filename?: string;
  };
  newTeam?: {
    name?: string;
    image_data?: string;
    image_filename?: string;
  };
  teamExternalId?: string;
  captainHasReadTermAndConditions: boolean;
  players: Array<{
    accountId: number;
    steamId: string;
    nickname: string;
    captain?: boolean;
    coCaptain?: boolean;
  }>;
}

// Type guard for RegistrationDraftRaw
export function isRegistrationDraftRaw(
  obj: unknown
): obj is RegistrationDraftRaw {
  if (typeof obj !== "object" || obj === null) return false;
  const d = obj as Record<string, unknown>;
  const allowedRootKeys = [
    "organizationId",
    "teamId",
    "newOrganization",
    "newTeam",
    "teamExternalId",
    "captainHasReadTermAndConditions",
    "players"
  ];
  if (Object.keys(d).some((k) => !allowedRootKeys.includes(k))) return false;
  if ("organizationId" in d && typeof d.organizationId !== "number")
    return false;
  if ("teamId" in d && typeof d.teamId !== "number") return false;
  if (typeof d.captainHasReadTermAndConditions !== "boolean") return false;
  if (!Array.isArray(d.players)) return false;
  for (const p of d.players) {
    if (typeof p !== "object" || p === null) return false;
    const player = p as Record<string, unknown>;
    const allowedPlayerKeys = [
      "accountId",
      "steamId",
      "nickname",
      "captain",
      "coCaptain"
    ];
    if (Object.keys(player).some((k) => !allowedPlayerKeys.includes(k)))
      return false;
    if (typeof player.accountId !== "number") return false;
    if (typeof player.steamId !== "string" || player.steamId.length > 100)
      return false;
    if (typeof player.nickname !== "string" || player.nickname.length > 100)
      return false;
    if ("captain" in player && typeof player.captain !== "boolean")
      return false;
    if ("coCaptain" in player && typeof player.coCaptain !== "boolean")
      return false;
  }
  if (d.newOrganization !== undefined) {
    if (typeof d.newOrganization !== "object" || d.newOrganization === null)
      return false;
    const org = d.newOrganization as Record<string, unknown>;
    const allowedOrgKeys = [
      "name",
      "website",
      "organization_code",
      "image_data",
      "image_filename"
    ];
    if (Object.keys(org).some((k) => !allowedOrgKeys.includes(k))) return false;
    // Allow partial data - only validate fields that are present
    if (
      "name" in org &&
      (typeof org.name !== "string" || org.name.length > 100)
    )
      return false;
    if (
      "website" in org &&
      (typeof org.website !== "string" || org.website.length > 100)
    )
      return false;
    if (
      "organization_code" in org &&
      (typeof org.organization_code !== "string" ||
        org.organization_code.length > 100)
    )
      return false;
    if ("image_data" in org && typeof org.image_data !== "string") return false;
    if (
      "image_filename" in org &&
      (typeof org.image_filename !== "string" ||
        org.image_filename.length > 255)
    )
      return false;
  }
  if (d.newTeam !== undefined) {
    if (typeof d.newTeam !== "object" || d.newTeam === null) return false;
    const team = d.newTeam as Record<string, unknown>;
    const allowedTeamKeys = ["name", "image_data", "image_filename"];
    if (Object.keys(team).some((k) => !allowedTeamKeys.includes(k)))
      return false;
    if (
      "name" in team &&
      (typeof team.name !== "string" || team.name.length > 100)
    )
      return false;
    if ("image_data" in team && typeof team.image_data !== "string")
      return false;
    if (
      "image_filename" in team &&
      (typeof team.image_filename !== "string" ||
        team.image_filename.length > 255)
    )
      return false;
  }
  if (
    d.teamExternalId !== undefined &&
    (typeof d.teamExternalId !== "string" || d.teamExternalId.length > 100)
  )
    return false;
  return true;
}
