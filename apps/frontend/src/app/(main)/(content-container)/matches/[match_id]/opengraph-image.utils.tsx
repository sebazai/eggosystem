import { ImageResponse } from "next/og";
import { getMatchInfo } from "./utils";
import { createNextUrl, createTeamLogoUrl } from "@/lib/utils";
import { envConfig } from "@/configs/env";
import type { MatchInfo } from "@eggosystem/types";

const KANALIIGA_OG_IMAGE_PATH = "/images/kanaliiga/opengraph-image.png";
/** Kanaliiga orange — #f29209 / hsl(35, 93%, 49%) */
const KANALIIGA_ORANGE = "#f29209";

export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630
};

function getKanaliigaLogoUrl(): string {
  const path = createNextUrl(KANALIIGA_OG_IMAGE_PATH);
  return new URL(path, envConfig.BASE_URL).href;
}

function VsLabel() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 48,
        fontWeight: 700,
        color: KANALIIGA_ORANGE
      }}
    >
      vs
    </div>
  );
}

function LogoOrFallback({
  logoUrl,
  teamName,
  size: logoSize,
  fallbackLogoUrl
}: {
  logoUrl: string;
  teamName: string;
  size: number;
  fallbackLogoUrl: string;
}) {
  const hasLogo = Boolean(logoUrl);
  const src = hasLogo ? logoUrl : fallbackLogoUrl;

  return (
    <img
      src={src}
      alt={hasLogo ? "" : `${teamName} (Kanaliiga)`}
      width={logoSize}
      height={logoSize}
      style={{
        objectFit: "contain",
        borderRadius: 12
      }}
    />
  );
}

function NotFoundResponse() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        fontSize: 32,
        color: "#94a3b8"
      }}
    >
      Match not found
    </div>,
    { ...OG_IMAGE_SIZE }
  );
}

/**
 * Build the shared match Open Graph image (team logos + vs) for both
 * /matches/[match_id] and /matches/[match_id]/games/[match_game_id].
 */
export async function createMatchOgImageResponse(
  matchId: number
): Promise<ImageResponse> {
  if (isNaN(matchId)) {
    return NotFoundResponse();
  }

  let result: MatchInfo | null;
  try {
    result = await getMatchInfo<MatchInfo>(matchId);
  } catch {
    result = null;
  }

  if (!result) {
    return NotFoundResponse();
  }

  const teams = Object.values(result.teams);
  const team1 = teams[0];
  const team2 = teams[1];

  if (!team1 || !team2) {
    return NotFoundResponse();
  }

  const logoSize = 300;
  const team1LogoUrl = team1.logo ? createTeamLogoUrl(team1.logo) : "";
  const team2LogoUrl = team2.logo ? createTeamLogoUrl(team2.logo) : "";
  const kanaliigaLogoUrl = getKanaliigaLogoUrl();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        padding: 48
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: 1000,
          gap: 48
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1
          }}
        >
          <LogoOrFallback
            logoUrl={team1LogoUrl}
            teamName={team1.name}
            size={logoSize}
            fallbackLogoUrl={kanaliigaLogoUrl}
          />
          <span
            style={{
              marginTop: 16,
              fontSize: 28,
              fontWeight: 700,
              color: "#f8fafc",
              textAlign: "center",
              maxWidth: 280,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              lineHeight: 1.25
            }}
          >
            {team1.name}
          </span>
        </div>

        <VsLabel />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1
          }}
        >
          <LogoOrFallback
            logoUrl={team2LogoUrl}
            teamName={team2.name}
            size={logoSize}
            fallbackLogoUrl={kanaliigaLogoUrl}
          />
          <span
            style={{
              marginTop: 16,
              fontSize: 28,
              fontWeight: 700,
              color: "#f8fafc",
              textAlign: "center",
              maxWidth: 280,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              lineHeight: 1.25
            }}
          >
            {team2.name}
          </span>
        </div>
      </div>
    </div>,
    { ...OG_IMAGE_SIZE }
  );
}
