type StageInput = {
  stage: number;
  match_group: number | null;
  match_round: number | null;
};

export function stageLabel(m: StageInput): string {
  if (m.stage === 1) {
    const parts: string[] = [];
    if (m.match_group != null) parts.push(`Group ${m.match_group}`);
    if (m.match_round != null) parts.push(`Week ${m.match_round}`);
    return parts.join(" · ");
  }
  if (m.match_group === 3) return "Grand Final";
  const bracket = m.match_group === 2 ? "Lower Bracket" : "Upper Bracket";
  return m.match_round != null ? `${bracket} · Week ${m.match_round}` : bracket;
}

export function stageKicker(stage: number): string {
  return stage === 1 ? "Regular Season" : "Playoff";
}

export function durationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function matchDurationMinutes(
  startTimestamp: string,
  endTimestamp: string | null
): number | null {
  if (!endTimestamp) return null;
  const diffMs =
    new Date(endTimestamp).getTime() - new Date(startTimestamp).getTime();
  return Math.round(diffMs / 60000);
}
