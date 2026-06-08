import type { Season, SeasonPlatform } from "@eggosystem/types";

const CS2_GAME_ID = 1;
const KANALIIGA_ORGANIZER_ID = 1;

export interface SeasonPageLink {
  title: string;
  href: string;
  isExternal?: boolean;
}

type SeasonLinkContext = {
  id: number;
  platform: SeasonPlatform;
  /** YYYY-MM-DD date of the first match; sets the calendar's initial view date. */
  first_match_date?: string | null;
  /** When undefined (e.g. current-season nav), defaults to true (show the link). */
  has_standings?: boolean;
  /** When undefined (e.g. current-season nav), defaults to true (show the link). */
  has_fantasy?: boolean;
  /** When undefined (e.g. current-season nav), defaults to true (show the link). */
  has_playoff?: boolean;
  /** When undefined (e.g. current-season nav), defaults to true (show the link). */
  has_captains?: boolean;
};

export function formatSeasonDisplayLabel(fullName: string): string {
  const trimmedName = fullName.trim();
  return trimmedName.length > 0 ? trimmedName : "Season";
}

export function getSeasonPageLinks(
  season: SeasonLinkContext
): SeasonPageLink[] {
  const { id, platform } = season;
  const calendarHref = season.first_match_date
    ? `/seasons/${id}/calendar?date=${season.first_match_date}`
    : `/seasons/${id}/calendar`;
  const has_standings = season.has_standings ?? true;
  const has_fantasy = season.has_fantasy ?? true;
  const has_playoff = season.has_playoff ?? true;
  const has_captains = season.has_captains ?? true;

  const links: SeasonPageLink[] = [];

  if (has_standings) {
    links.push({
      title: "Standings",
      href: `/seasons/${id}/standings`
    });
  }

  links.push({
    title: "Calendar",
    href: calendarHref
  });

  if (has_playoff) {
    links.push({
      title: "Playoff Bracket",
      href: `/seasons/${id}/leagues/1/playoff`
    });
  }

  if (has_captains) {
    links.push({
      title: "Captains",
      href: `/seasons/${id}/captains`
    });
  }

  if (platform === "faceit") {
    links.push({
      title: "Faceit Links",
      href: `/seasons/${id}/faceit-links`
    });
  }

  if (has_fantasy) {
    links.push(
      {
        title: "Fantasy League",
        href: `/seasons/${id}/fantasy`
      },
      {
        title: "Fantasy Leaderboard",
        href: `/seasons/${id}/fantasy/leaderboard`
      }
    );
  }

  return links;
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

export function getPastCs2Seasons<T extends Season>(
  seasons: T[],
  now = new Date()
): T[] {
  return seasons
    .filter(isCs2KanaliigaSeason)
    .filter((season) => isPastSeason(season, now))
    .sort((a, b) => b.id - a.id);
}
