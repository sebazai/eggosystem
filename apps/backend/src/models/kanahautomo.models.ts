import {
  type KanahautomoOrganizationStatus,
  type KanahautomoOrganizationStatusWithGameTypes
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection, type ResultSetHeader } from "mysql2/promise";

export const registerPlayerForKanahautomo = async (
  steamId: string,
  organizationId: number,
  acceptedTerms: boolean = false,
  connection?: PoolConnection
) => {
  return await runQuery<ResultSetHeader>(
    "INSERT INTO KanahautomoRegistrations (steam_id, organization_id, accepted_terms) VALUES (?, ?, ?)",
    [steamId, organizationId, acceptedTerms],
    connection
  );
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

export const getKanahautomoOrganizationStatusWithGameTypes = async () => {
  // Only include orgs with at least one registration with a gametype
  const organizationResults = await runQuery<
    Array<{
      organization_id: number;
      organization_name: string;
      total_registrations: number;
    }>
  >(
    `SELECT 
        o.id as organization_id, 
        o.name as organization_name, 
        COUNT(DISTINCT kr.id) as total_registrations
     FROM Organizations o
     INNER JOIN KanahautomoRegistrations kr ON o.id = kr.organization_id
     INNER JOIN KanahautomoRegistrationGameTypes krgt ON kr.id = krgt.kanahautomo_registration_id
     GROUP BY o.id, o.name
     ORDER BY o.name ASC`,
    []
  );

  // Then get game type counts for each organization
  const gameTypeResults = await runQuery<
    Array<{
      organization_id: number;
      game_type_id: number;
      count: number;
    }>
  >(
    `SELECT 
        kr.organization_id,
        krgt.game_type_id,
        COUNT(DISTINCT kr.id) as count
     FROM KanahautomoRegistrations kr
     JOIN KanahautomoRegistrationGameTypes krgt ON kr.id = krgt.kanahautomo_registration_id
     GROUP BY kr.organization_id, krgt.game_type_id
     ORDER BY kr.organization_id, krgt.game_type_id`,
    []
  );

  // Map game type IDs to frontend names
  const gameTypeMapping: Record<
    number,
    keyof KanahautomoOrganizationStatusWithGameTypes["game_type_counts"]
  > = {
    1: "cs", // CS2 Comp
    2: "csWingman", // CS2 Wingman
    3: "pubgDuo", // PUBG Duo
    4: "pubgSquad", // PUBG Squad
    5: "rocketLeague", // Rocket League Standard
    6: "dota" // Dota 2 Team Clash
  };

  // Combine the results
  const results: KanahautomoOrganizationStatusWithGameTypes[] =
    organizationResults.map((org) => {
      const gameTypeCounts = {
        cs: 0,
        csWingman: 0,
        pubgDuo: 0,
        pubgSquad: 0,
        rocketLeague: 0,
        dota: 0
      };

      // Fill in the counts for this organization
      gameTypeResults
        .filter((gt) => gt.organization_id === org.organization_id)
        .forEach((gt) => {
          const gameTypeKey = gameTypeMapping[gt.game_type_id];
          if (gameTypeKey) {
            gameTypeCounts[gameTypeKey] = gt.count;
          }
        });

      return {
        organization_id: org.organization_id,
        organization_name: org.organization_name,
        total_registrations: org.total_registrations,
        game_type_counts: gameTypeCounts
      };
    });

  return results;
};
