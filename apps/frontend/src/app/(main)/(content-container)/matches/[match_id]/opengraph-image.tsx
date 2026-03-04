import { ImageResponse } from "next/og";
import { getMatchInfo } from "./utils";
import { createTeamLogoUrl } from "@/lib/utils";
import type { MatchInfo } from "@eggosystem/types";

export const alt = "Match";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

function ThunderboltIcon() {
  const segmentWidth = 14;
  const topHeight = 72;
  const bottomHeight = 72;
  const color = "#f97316";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: 80,
        height: 160
      }}
    >
      {/* Top diagonal: lightning bolt upper part */}
      <div
        style={{
          width: segmentWidth,
          height: topHeight,
          backgroundColor: color,
          transform: "rotate(-35deg)",
          marginBottom: -20
        }}
      />
      {/* Bottom diagonal: lightning bolt lower part */}
      <div
        style={{
          width: segmentWidth,
          height: bottomHeight,
          backgroundColor: color,
          transform: "rotate(35deg)",
          marginTop: -20
        }}
      />
    </div>
  );
}

function LogoOrFallback({
  logoUrl,
  teamName,
  size: logoSize
}: {
  logoUrl: string;
  teamName: string;
  size: number;
}) {
  const hasLogo = Boolean(logoUrl);

  if (hasLogo) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={logoSize}
        height={logoSize}
        style={{
          objectFit: "contain",
          borderRadius: 12
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: logoSize,
        height: logoSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1f2937",
        borderRadius: 12,
        fontSize: Math.round(logoSize * 0.35),
        fontWeight: 700,
        color: "#f97316"
      }}
    >
      {teamName.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default async function Image({
  params
}: {
  params: Promise<{ match_id: string }>;
}) {
  const { match_id } = await params;
  const matchId = parseInt(match_id, 10);
  if (isNaN(matchId)) {
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
      { ...size }
    );
  }

  let result: MatchInfo | null;
  try {
    result = await getMatchInfo<MatchInfo>(matchId);
  } catch {
    result = null;
  }

  if (!result) {
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
      { ...size }
    );
  }

  const teams = Object.values(result.teams);
  const team1 = teams[0];
  const team2 = teams[1];

  if (!team1 || !team2) {
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
      { ...size }
    );
  }

  const logoSize = 300;
  const team1LogoUrl = team1.logo ? createTeamLogoUrl(team1.logo) : "";
  const team2LogoUrl = team2.logo ? createTeamLogoUrl(team2.logo) : "";

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
              whiteSpace: "nowrap"
            }}
          >
            {team1.name}
          </span>
        </div>

        <ThunderboltIcon />

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
              whiteSpace: "nowrap"
            }}
          >
            {team2.name}
          </span>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
