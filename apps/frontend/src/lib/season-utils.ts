import type { Season } from "@eggosystem/types";

const CS2_GAME_ID = 1;
const KANALIIGA_ORGANIZER_ID = 1;

const SEASON_SCHEDULE_URL = "https://kanaliiga.fi/pelit/counter-strike-2";

export interface SeasonPageLink {
  title: string;
  href: string;
  isExternal?: boolean;
}

export function formatSeasonDisplayLabel(fullName: string): string {
  const trimmedName = fullName.trim();
  return trimmedName.length > 0 ? trimmedName : "Season";
}

export function getSeasonPageLinks(seasonId: number): SeasonPageLink[] {
  return [
    {
      title: "Standings",
      href: `/seasons/${seasonId}/standings`
    },
    {
      title: "Calendar",
      href: `/seasons/${seasonId}/calendar`
    },
    {
      title: "Playoff Bracket",
      href: `/seasons/${seasonId}/leagues/1/playoff`
    },
    {
      title: "Captains",
      href: `/seasons/${seasonId}/captains`
    },
    {
      title: "Schedule",
      href: SEASON_SCHEDULE_URL,
      isExternal: true
    },
    {
      title: "Faceit Links",
      href: `/seasons/${seasonId}/faceit-links`
    },
    {
      title: "Fantasy League",
      href: `/seasons/${seasonId}/fantasy`
    },
    {
      title: "Fantasy Leaderboard",
      href: `/seasons/${seasonId}/fantasy/leaderboard`
    }
  ];
}

function isCs2KanaliigaSeason(season: Season): boolean {
  return (
    season.game_id === CS2_GAME_ID &&
    season.organizer_id === KANALIIGA_ORGANIZER_ID
  );
}

function isCurrentSeason(season: Season, now = new Date()): boolean {
  const startDate = new Date(season.start_date);
  const endDate = season.end_date ? new Date(season.end_date) : null;

  return startDate <= now && (endDate === null || endDate >= now);
}

function isUpcomingSeason(season: Season, now = new Date()): boolean {
  return new Date(season.start_date) > now;
}

export function isPastSeason(season: Season, now = new Date()): boolean {
  return !isCurrentSeason(season, now) && !isUpcomingSeason(season, now);
}

export function getPastCs2Seasons(
  seasons: Season[],
  now = new Date()
): Season[] {
  return seasons
    .filter(isCs2KanaliigaSeason)
    .filter((season) => isPastSeason(season, now))
    .sort((a, b) => b.id - a.id);
}
