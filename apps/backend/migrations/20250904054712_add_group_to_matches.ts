import type { Knex } from "knex";

interface Data {
  date: string;
  match_id: string;
  demo_url: string[];
}

interface Response {
  items: Array<{
    match_id: string;
    status: string;
    scheduled_at: number;
    demo_url: string[];
  }>;
}

const generateYMD = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Get matches from a Faceit championship/league
const getFaceitMatchesForFaceitLeague = async (
  leagueId: string
): Promise<Data[]> => {
  const FACEIT_API_TOKEN = process.env.FACEIT_API_KEY;
  if (!FACEIT_API_TOKEN) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  const webURL = `https://open.faceit.com/data/v4/championships/${leagueId}/matches`;

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${FACEIT_API_TOKEN}`,
    "User-Agent": "Kanaliiga-Eggosystem/1.0"
  };

  // Manual URL construction with params since fetch doesn't support params directly
  const urlWithParams = `${webURL}?type=past&limit=100`;
  const finalResponse = await fetch(urlWithParams, { headers });

  if (!finalResponse.ok) {
    throw new Error(
      `Faceit API returned ${finalResponse.status}: ${finalResponse.statusText}`
    );
  }

  const data: Response = await finalResponse.json();

  // Filter finished matches and map to required format
  const matches = data.items;
  const finishedMatches = matches.filter(
    (match) => match.status === "FINISHED"
  );

  const matchData: Data[] = finishedMatches.map((match) => ({
    date: generateYMD(match.scheduled_at),
    match_id: match.match_id,
    demo_url: match.demo_url || []
  }));

  return matchData;
};

export async function up(knex: Knex): Promise<void> {
  const seasonLeagueExternalIds = await knex("SeasonLeagueExternalIds").select(
    "*"
  );
  for (const seasonLeagueExternalId of seasonLeagueExternalIds) {
    const matches = await getFaceitMatchesForFaceitLeague(
      seasonLeagueExternalId.external_id
    );

    for (const match of matches) {
      await knex("Matches")
        .where("external_match_room_id", match.match_id)
        .update({ group: seasonLeagueExternalId.manual_group });
    }
  }
}

export async function down(_knex: Knex): Promise<void> {
  // NO-OP
}
