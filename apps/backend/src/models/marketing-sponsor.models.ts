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
}): PublicMarketingSponsor {
  return {
    id: r.id,
    display_name: r.display_name,
    external_url: r.external_url,
    display_order: r.display_order,
    image_phash: r.image_phash
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
    }>
  >(
    `SELECT id, display_name, external_url, display_order, image_phash
     FROM MarketingSponsors
     WHERE tier = ? AND enabled = 1
     ORDER BY display_order ASC, id ASC`,
    [tier]
  );
  return rows.map(mapPublicRow);
}

export async function loadGroupedPublicSponsors(): Promise<GroupedPublicSponsors> {
  const [game_wide_sponsors, main_partners, supporting_organizations] =
    await Promise.all([
      listEnabledPublicSponsorsByTier("game_wide"),
      listEnabledPublicSponsorsByTier("main_partner"),
      listEnabledPublicSponsorsByTier("supporting_organization")
    ]);
  return {
    game_wide_sponsors,
    main_partners,
    supporting_organizations
  };
}

export async function listAllMarketingSponsorsAdmin(): Promise<
  MarketingSponsorAdminRow[]
> {
  const rows = await runQuery<
    Array<{
      id: number;
      tier: string;
      display_name: string;
      external_url: string | null;
      display_order: number;
      image_phash: string | null;
      enabled: boolean | 0 | 1;
      created_at: Date;
      updated_at: Date;
    }>
  >(
    `SELECT id, tier, display_name, external_url, display_order, image_phash, enabled, created_at, updated_at
     FROM MarketingSponsors
     ORDER BY tier ASC, display_order ASC, id ASC`
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
      display_name: r.display_name,
      external_url: r.external_url,
      display_order: r.display_order,
      image_phash: r.image_phash,
      enabled: Boolean(r.enabled),
      created_at: toIso(r.created_at),
      updated_at: toIso(r.updated_at)
    };
  });
}

export async function insertMarketingSponsor(input: {
  tier: MarketingSponsorTier;
  display_name: string;
  external_url: string | null;
  display_order: number;
  image_phash: string | null;
}): Promise<number> {
  const connection = await getConnection();
  try {
    await runQuery(
      `INSERT INTO MarketingSponsors (tier, display_name, external_url, display_order, image_phash, enabled)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        input.tier,
        input.display_name,
        input.external_url,
        input.display_order,
        input.image_phash
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

export async function marketingSponsorExists(id: number): Promise<boolean> {
  const rows = await runQuery<Array<{ id: number }>>(
    "SELECT id FROM MarketingSponsors WHERE id = ? LIMIT 1",
    [id]
  );
  return rows.length > 0;
}

export async function updateMarketingSponsor(
  id: number,
  patch: {
    display_name?: string;
    external_url?: string | null;
    display_order?: number;
    image_phash?: string | null;
    enabled?: boolean;
    tier?: MarketingSponsorTier;
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
  if (patch.enabled !== undefined) {
    fields.push("enabled = ?");
    params.push(patch.enabled);
  }
  if (patch.tier !== undefined) {
    fields.push("tier = ?");
    params.push(patch.tier);
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
  tier: MarketingSponsorTier
): Promise<number> {
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
  orderedIds: number[]
): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    let order = 0;
    for (const id of orderedIds) {
      await runQuery(
        "UPDATE MarketingSponsors SET display_order = ? WHERE id = ? AND tier = ?",
        [order, id, tier],
        connection
      );
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
