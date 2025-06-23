import { type KanahautomoOrganizationStatus } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";

export const registerPlayerForKanahautomo = async (
  steamId: string,
  organizationId: number,
  acceptedTerms: boolean = false,
  connection?: PoolConnection
) => {
  try {
    return await runQuery<{ insertId: number }>(
      "INSERT INTO KanahautomoRegistrations (steam_id, organization_id, accepted_terms) VALUES (?, ?, ?)",
      [steamId, organizationId, acceptedTerms],
      connection
    );
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "ER_DUP_ENTRY"
    ) {
      throw new Error(
        "Player is already registered for Kanahautomo in this organization"
      );
    }
    throw error;
  }
};

export const insertKanahautomoGameTypes = async (
  registrationId: number,
  gameTypes: {
    cs: boolean;
    pubgSquad: boolean;
    csWingman: boolean;
    pubgDuo: boolean;
    rocketLeague: boolean;
    dota: boolean;
  },
  connection?: PoolConnection
) => {
  // Map frontend gameTypes to database game_type_ids
  const gameTypeMapping = {
    cs: 1, // CS2 Comp
    csWingman: 2, // CS2 Wingman
    pubgDuo: 3, // PUBG Duo
    pubgSquad: 4, // PUBG Squad
    rocketLeague: 5, // Rocket League Standard
    dota: 6 // Dota 2 Team Clash
  };

  const selectedGameTypeIds = Object.entries(gameTypes)
    .filter(([_, isSelected]) => isSelected)
    .map(
      ([gameType, _]) =>
        gameTypeMapping[gameType as keyof typeof gameTypeMapping]
    );

  if (selectedGameTypeIds.length === 0) {
    throw new Error("At least one game type must be selected");
  }

  // Insert each selected game type
  for (const gameTypeId of selectedGameTypeIds) {
    await runQuery(
      "INSERT INTO KanahautomoRegistrationGameTypes (kanahautomo_registration_id, game_type_id) VALUES (?, ?)",
      [registrationId, gameTypeId],
      connection
    );
  }
};

export const getKanahautomoOrganizationStatus = async () => {
  const results = await runQuery<Array<KanahautomoOrganizationStatus>>(
    `SELECT o.id as organization_id, o.name as organization_name, COUNT(r.id) as count
     FROM Organizations o
     JOIN KanahautomoRegistrations r ON o.id = r.organization_id
     GROUP BY o.id, o.name
     ORDER BY o.name ASC`,
    []
  );
  return results;
};
