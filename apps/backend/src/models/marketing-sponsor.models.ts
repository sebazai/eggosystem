import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import { InternalServerError } from "../utils/errors";
import type {
  GroupedPublicSponsors,
  MarketingSponsorAdminRow,
  MarketingSponsorTier,
  PublicMarketingSponsor
} from "@eggosystem/types";

function isMarketingSponsorTier(value: string): value is MarketingSponsorTier {
  return (
    value === "game_wide" ||
    value === "main_partner" ||
    value === "supporting_organization"
  );
}

function mapPublicRow(r: {
  id: number;
  display_name: string;
  external_url: string | null;
  display_order: number;
  image_phash: string | null;
  footer_image_phash: string | null;
}): PublicMarketingSponsor {
  return {
    id: r.id,
    display_name: r.display_name,
    external_url: r.external_url,
    display_order: r.display_order,
    image_phash: r.image_phash,
    footer_image_phash: r.footer_image_phash
  };
}

async function listEnabledPublicSponsorsByTier(
  tier: MarketingSponsorTier
): Promise<PublicMarketingSponsor[]> {
  const rows = await runQuery<
    Array<{
      id: number;
      display_name: string;
      external_url: string | null;
      display_order: number;
      image_phash: string | null;
      footer_image_phash: string | null;
    }>
  >(
    `SELECT id, display_name, external_url, display_order, image_phash, footer_image_phash
     FROM MarketingSponsors
     WHERE tier = ? AND enabled = 1
     ORDER BY display_order ASC, id ASC`,
    [tier]
  );
  return rows.map(mapPublicRow);
}

export async function loadGroupedPublicSponsors(): Promise<GroupedPublicSponsors> {
  const [main_partners, supporting_organizations] = await Promise.all([
    listEnabledPublicSponsorsByTier("main_partner"),
    listEnabledPublicSponsorsByTier("supporting_organization")
  ]);
  return {
    game_wide_sponsors: [],
    main_partners,
    supporting_organizations
  };
}

export async function listEnabledGameWidePublicSponsorsForGameId(
  gameId: number
): Promise<PublicMarketingSponsor[]> {
  const rows = await runQuery<
    Array<{
      id: number;
      display_name: string;
      external_url: string | null;
      display_order: number;
      image_phash: string | null;
      footer_image_phash: string | null;
    }>
  >(
    `SELECT id, display_name, external_url, display_order, image_phash, footer_image_phash
     FROM MarketingSponsors
     WHERE tier = 'game_wide' AND enabled = 1 AND game_id = ?
     ORDER BY display_order ASC, id ASC`,
    [gameId]
  );
  return rows.map(mapPublicRow);
}

export async function listAllMarketingSponsorsAdmin(): Promise<
  MarketingSponsorAdminRow[]
> {
  const rows = await runQuery<
    Array<{
      id: number;
      tier: string;
      game_id: number | null;
      game_abbreviation: string | null;
      display_name: string;
      external_url: string | null;
      display_order: number;
      image_phash: string | null;
      footer_image_phash: string | null;
      enabled: boolean | 0 | 1;
      created_at: Date;
      updated_at: Date;
    }>
  >(
    `SELECT ms.id, ms.tier, ms.game_id, g.abbreviation AS game_abbreviation,
            ms.display_name, ms.external_url, ms.display_order, ms.image_phash,
            ms.footer_image_phash, ms.enabled, ms.created_at, ms.updated_at
     FROM MarketingSponsors ms
     LEFT JOIN Games g ON ms.game_id = g.id
     ORDER BY ms.tier ASC, ms.game_id ASC, ms.display_order ASC, ms.id ASC`
  );

  const toIso = (d: Date | string) =>
    d instanceof Date ? d.toISOString() : String(d);

  return rows.map((r) => {
    if (!isMarketingSponsorTier(r.tier)) {
      throw new InternalServerError(
        `Invalid sponsor tier in database: ${r.tier}`
      );
    }
    return {
      id: r.id,
      tier: r.tier,
      game_id: r.game_id,
      game_abbreviation: r.game_abbreviation,
      display_name: r.display_name,
      external_url: r.external_url,
      display_order: r.display_order,
      image_phash: r.image_phash,
      footer_image_phash: r.footer_image_phash,
      enabled: Boolean(r.enabled),
      created_at: toIso(r.created_at),
      updated_at: toIso(r.updated_at)
    };
  });
}

export async function getMarketingSponsorAdminById(
  id: number
): Promise<MarketingSponsorAdminRow | undefined> {
  const rows = await runQuery<
    Array<{
      id: number;
      tier: string;
      game_id: number | null;
      game_abbreviation: string | null;
      display_name: string;
      external_url: string | null;
      display_order: number;
      image_phash: string | null;
      footer_image_phash: string | null;
      enabled: boolean | 0 | 1;
      created_at: Date;
      updated_at: Date;
    }>
  >(
    `SELECT ms.id, ms.tier, ms.game_id, g.abbreviation AS game_abbreviation,
            ms.display_name, ms.external_url, ms.display_order, ms.image_phash,
            ms.footer_image_phash, ms.enabled, ms.created_at, ms.updated_at
     FROM MarketingSponsors ms
     LEFT JOIN Games g ON ms.game_id = g.id
     WHERE ms.id = ?
     LIMIT 1`,
    [id]
  );
  const r = rows[0];
  if (!r) {
    return undefined;
  }
  const toIso = (d: Date | string) =>
    d instanceof Date ? d.toISOString() : String(d);
  if (!isMarketingSponsorTier(r.tier)) {
    throw new InternalServerError(
      `Invalid sponsor tier in database: ${r.tier}`
    );
  }
  return {
    id: r.id,
    tier: r.tier,
    game_id: r.game_id,
    game_abbreviation: r.game_abbreviation,
    display_name: r.display_name,
    external_url: r.external_url,
    display_order: r.display_order,
    image_phash: r.image_phash,
    footer_image_phash: r.footer_image_phash,
    enabled: Boolean(r.enabled),
    created_at: toIso(r.created_at),
    updated_at: toIso(r.updated_at)
  };
}

export async function insertMarketingSponsor(input: {
  tier: MarketingSponsorTier;
  game_id?: number | null;
  display_name: string;
  external_url: string | null;
  display_order: number;
  image_phash: string | null;
  footer_image_phash?: string | null;
  /** New uploads default to hidden from the public site until an admin enables them */
  enabled?: boolean;
}): Promise<number> {
  const enabled = input.enabled ?? false;
  const footerPhash = input.footer_image_phash ?? null;
  const gameId = input.game_id ?? null;
  const connection = await getConnection();
  try {
    await runQuery(
      `INSERT INTO MarketingSponsors (tier, game_id, display_name, external_url, display_order, image_phash, footer_image_phash, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.tier,
        gameId,
        input.display_name,
        input.external_url,
        input.display_order,
        input.image_phash,
        footerPhash,
        enabled
      ],
      connection
    );
    const [row] = await runQuery<Array<{ id: number }>>(
      "SELECT LAST_INSERT_ID() AS id",
      [],
      connection
    );
    if (!row || !Number.isFinite(row.id)) {
      throw new InternalServerError("Failed to read new marketing sponsor id");
    }
    return row.id;
  } finally {
    connection.release();
  }
}

export async function updateMarketingSponsor(
  id: number,
  patch: {
    display_name?: string;
    external_url?: string | null;
    display_order?: number;
    image_phash?: string | null;
    footer_image_phash?: string | null;
    enabled?: boolean;
    tier?: MarketingSponsorTier;
    game_id?: number | null;
  }
): Promise<boolean> {
  const fields: string[] = [];
  const params: Array<string | number | boolean | null> = [];

  if (patch.display_name !== undefined) {
    fields.push("display_name = ?");
    params.push(patch.display_name);
  }
  if (patch.external_url !== undefined) {
    fields.push("external_url = ?");
    params.push(patch.external_url);
  }
  if (patch.display_order !== undefined) {
    fields.push("display_order = ?");
    params.push(patch.display_order);
  }
  if (patch.image_phash !== undefined) {
    fields.push("image_phash = ?");
    params.push(patch.image_phash);
  }
  if (patch.footer_image_phash !== undefined) {
    fields.push("footer_image_phash = ?");
    params.push(patch.footer_image_phash);
  }
  if (patch.enabled !== undefined) {
    fields.push("enabled = ?");
    params.push(patch.enabled);
  }
  if (patch.tier !== undefined) {
    fields.push("tier = ?");
    params.push(patch.tier);
  }
  if (patch.game_id !== undefined) {
    fields.push("game_id = ?");
    params.push(patch.game_id);
  }

  if (fields.length === 0) {
    return false;
  }

  params.push(id);
  const res = await runQuery<{ affectedRows: number }>(
    `UPDATE MarketingSponsors SET ${fields.join(", ")} WHERE id = ?`,
    params
  );
  return res.affectedRows > 0;
}

export async function deleteMarketingSponsor(id: number): Promise<boolean> {
  const res = await runQuery<{ affectedRows: number }>(
    "DELETE FROM MarketingSponsors WHERE id = ?",
    [id]
  );
  return res.affectedRows > 0;
}

export async function getNextDisplayOrderForTier(
  tier: MarketingSponsorTier,
  gameId?: number | null
): Promise<number> {
  if (tier === "game_wide") {
    if (gameId === undefined || gameId === null) {
      throw new InternalServerError(
        "gameId is required for getNextDisplayOrderForTier when tier is game_wide"
      );
    }
    const [row] = await runQuery<Array<{ m: number | null }>>(
      "SELECT MAX(display_order) AS m FROM MarketingSponsors WHERE tier = ? AND game_id = ?",
      [tier, gameId]
    );
    const max = row?.m;
    if (max === null || max === undefined) {
      return 0;
    }
    return max + 1;
  }
  const [row] = await runQuery<Array<{ m: number | null }>>(
    "SELECT MAX(display_order) AS m FROM MarketingSponsors WHERE tier = ?",
    [tier]
  );
  const max = row?.m;
  if (max === null || max === undefined) {
    return 0;
  }
  return max + 1;
}

export async function reorderMarketingSponsorsInTier(
  tier: MarketingSponsorTier,
  orderedIds: number[],
  gameIdForGameWide?: number | null
): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    let order = 0;
    for (const id of orderedIds) {
      if (tier === "game_wide") {
        if (gameIdForGameWide === undefined || gameIdForGameWide === null) {
          throw new InternalServerError(
            "gameIdForGameWide is required when reordering game_wide sponsors"
          );
        }
        await runQuery(
          "UPDATE MarketingSponsors SET display_order = ? WHERE id = ? AND tier = ? AND game_id = ?",
          [order, id, tier, gameIdForGameWide],
          connection
        );
      } else {
        await runQuery(
          "UPDATE MarketingSponsors SET display_order = ? WHERE id = ? AND tier = ?",
          [order, id, tier],
          connection
        );
      }
      order += 1;
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
