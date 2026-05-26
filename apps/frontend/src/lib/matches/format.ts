type StageInput = {
  stage: number;
  match_group: number | null;
  match_round: number | null;
};

export function stageLabel(m: StageInput): string {
  if (m.stage === 1) {
    return `Group ${m.match_group ?? "?"} · Round ${m.match_round ?? "?"}`;
  }
  if (m.match_group === 3) return "Grand Final";
  const bracket = m.match_group === 2 ? "Lower Bracket" : "Upper Bracket";
  return `${bracket} · Round ${m.match_round ?? "?"}`;
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
