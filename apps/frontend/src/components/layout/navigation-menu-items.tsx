import { ExternalLink } from "lucide-react";
import type { JSX } from "react";
import {
  formatSeasonDisplayLabel,
  getSeasonPageLinks
} from "@/lib/season-utils";
import { convertSeasonToS } from "@/lib/utils";
import type { ActiveSignupOrSeasonForAppId } from "@eggosystem/types";

export interface MenuItemLink {
  title: string;
  url: string;
  hasFilters: boolean;
  isExternal?: boolean;
  icon?: JSX.Element;
  items?: MenuItemLink[];
}

export type MenuItem = MenuItemLink;

export interface RegisterCta {
  title: string;
  url: string;
}

const PAST_SEASONS_LINK: MenuItemLink = {
  title: "Past Seasons",
  url: "/past-seasons",
  hasFilters: false
};

const MATCH_HISTORY_LINK: MenuItemLink = {
  title: "Match History",
  url: "/matches",
  hasFilters: true
};

function mapSeasonPageLinksToMenuItems(
  season: ActiveSignupOrSeasonForAppId
): MenuItemLink[] {
  const seasonId = season.season_id;
  return getSeasonPageLinks({
    id: seasonId,
    platform: season.platform
  }).flatMap((link) => {
    if (link.title === "Fantasy Leaderboard") {
      return [];
    }

    if (link.title === "Fantasy League") {
      return [
        {
          title: "Fantasy League",
          url: link.href,
          hasFilters: false,
          items: [
            {
              title: "Draft",
              url: `/seasons/${seasonId}/fantasy`,
              hasFilters: false
            },
            {
              title: "Leaderboard",
              url: `/seasons/${seasonId}/fantasy/leaderboard`,
              hasFilters: false
            },
            {
              title: "Price History",
              url: `/seasons/${seasonId}/fantasy/price-history`,
              hasFilters: false
            },
            {
              title: "Top Players",
              url: `/seasons/${seasonId}/fantasy/top-players`,
              hasFilters: false
            }
          ]
        }
      ];
    }

    if (link.isExternal) {
      return [
        {
          title: link.title,
          url: link.href,
          hasFilters: false,
          isExternal: true,
          icon: <ExternalLink className="h-4 w-4" />
        }
      ];
    }

    return [
      {
        title: link.title,
        url: link.href,
        hasFilters: false
      }
    ];
  });
}

function buildActiveSeasonMenuItems(
  signupOrActiveSeason: ActiveSignupOrSeasonForAppId,
  options?: { includeRegister?: boolean }
): MenuItemLink[] {
  const seasonId = signupOrActiveSeason.season_id;
  const items: MenuItemLink[] = [];

  if (options?.includeRegister) {
    items.push({
      title: "Register",
      url: `/seasons/${seasonId}/signup`,
      hasFilters: false
    });
  }

  items.push(
    {
      title: "Standings",
      url: `/seasons/${seasonId}/standings`,
      hasFilters: false
    },
    ...mapSeasonPageLinksToMenuItems(signupOrActiveSeason).filter(
      (item) => item.title !== "Standings"
    ),
    PAST_SEASONS_LINK
  );

  return items;
}

function isSignupStillOpen(
  signupOrActiveSeason: ActiveSignupOrSeasonForAppId,
  now: Date
): boolean {
  if (!signupOrActiveSeason.signup_end_date) {
    return false;
  }

  return new Date(signupOrActiveSeason.signup_end_date) >= now;
}

function isInSignupPeriod(
  signupOrActiveSeason: ActiveSignupOrSeasonForAppId,
  now: Date
): boolean {
  const signupStartDate = signupOrActiveSeason.signup_start_date
    ? new Date(signupOrActiveSeason.signup_start_date)
    : null;
  const signupEndDate = signupOrActiveSeason.signup_end_date
    ? new Date(signupOrActiveSeason.signup_end_date)
    : null;
  const startDate = new Date(signupOrActiveSeason.start_date);

  return Boolean(
    signupStartDate &&
    signupEndDate &&
    now >= signupStartDate &&
    now <= signupEndDate &&
    now < startDate
  );
}

function isSeasonLive(
  signupOrActiveSeason: ActiveSignupOrSeasonForAppId,
  now: Date
): boolean {
  const startDate = new Date(signupOrActiveSeason.start_date);
  const endDate = signupOrActiveSeason.end_date
    ? new Date(signupOrActiveSeason.end_date)
    : null;

  return startDate <= now && (endDate === null || endDate >= now);
}

export function getRegisterCta(
  signupOrActiveSeason?: ActiveSignupOrSeasonForAppId
): RegisterCta | null {
  if (!signupOrActiveSeason?.full_name) {
    return null;
  }

  const now = new Date();
  const seasonLabel = convertSeasonToS(signupOrActiveSeason.full_name);
  const signupUrl = `/seasons/${signupOrActiveSeason.season_id}/signup`;

  if (isInSignupPeriod(signupOrActiveSeason, now)) {
    return {
      title: `Register ${seasonLabel}`,
      url: signupUrl
    };
  }

  if (
    isSeasonLive(signupOrActiveSeason, now) &&
    isSignupStillOpen(signupOrActiveSeason, now)
  ) {
    return {
      title: "Register",
      url: signupUrl
    };
  }

  return null;
}

export function getSeasonMenuItem(
  signupOrActiveSeason?: ActiveSignupOrSeasonForAppId
): MenuItem {
  const now = new Date();

  if (signupOrActiveSeason?.full_name) {
    const seasonId = signupOrActiveSeason.season_id;
    const seasonTitle = formatSeasonDisplayLabel(
      signupOrActiveSeason.full_name
    );
    const seasonLabel = convertSeasonToS(signupOrActiveSeason.full_name);

    if (isInSignupPeriod(signupOrActiveSeason, now)) {
      return {
        title: seasonTitle,
        url: "#",
        hasFilters: false,
        items: [
          {
            title: `Register ${seasonLabel}`,
            url: `/seasons/${seasonId}/signup`,
            hasFilters: false
          },
          PAST_SEASONS_LINK
        ]
      };
    }

    if (isSeasonLive(signupOrActiveSeason, now)) {
      return {
        title: seasonTitle,
        url: "#",
        hasFilters: false,
        items: buildActiveSeasonMenuItems(signupOrActiveSeason, {
          includeRegister: isSignupStillOpen(signupOrActiveSeason, now)
        })
      };
    }
  }

  return {
    title: "Season",
    url: "#",
    hasFilters: false,
    items: [PAST_SEASONS_LINK]
  };
}

export function getDefaultMenuItems(
  signupOrActiveSeason?: ActiveSignupOrSeasonForAppId
): {
  menu: MenuItem[];
  registerCta: RegisterCta | null;
} {
  return {
    menu: [
      {
        title: "Community",
        url: "#",
        hasFilters: false,
        items: [
          {
            title: "Organizations",
            url: "/organizations",
            hasFilters: false
          },
          {
            title: "Kanahautomo",
            url: "/kanahautomo",
            hasFilters: false
          },
          {
            title: "Browse Teams",
            url: "/teams",
            hasFilters: true
          },
          {
            title: "Browse Players",
            url: "/players",
            hasFilters: true
          }
        ]
      },
      getSeasonMenuItem(signupOrActiveSeason),
      {
        title: "Stats",
        url: "#",
        hasFilters: false,
        items: [
          MATCH_HISTORY_LINK,
          {
            title: "Player Leaderboards",
            url: "/leaderboards",
            hasFilters: true
          },
          {
            title: "Top Teams",
            url: "/topteams",
            hasFilters: true
          },
          {
            title: "Hall of Fame",
            url: "/hall-of-fame",
            hasFilters: false
          },
          {
            title: "Season Results",
            url: "/season-results",
            hasFilters: false
          }
        ]
      }
    ],
    registerCta: getRegisterCta(signupOrActiveSeason)
  };
}
