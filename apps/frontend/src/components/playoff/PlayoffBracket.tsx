"use client";

import Link from "next/link";
import Image from "next/image";
import type { PlayoffBracketMatch } from "@eggosystem/types";
import {
  bracketMatchesToDisplaySlots,
  buildUpperBracketDisplaySlots,
  type PlayoffBracketSlotDisplay,
  type PlayoffUpperBracketWinner
} from "@/lib/playoff-upper-bracket-preview";
import { createNextUrl, createTeamLogoUrl, cn } from "@/lib/utils";

const GROUP_LABELS: Record<number, string> = {
  1: "Upper bracket",
  2: "Lower bracket",
  3: "Grand final"
};

/** Groups matches by group and round, sorted by round; matches within a round sorted by slot. */
function groupMatchesByGroupAndRound(
  matches: PlayoffBracketMatch[]
): Map<number, Map<number, PlayoffBracketMatch[]>> {
  const byGroup = new Map<number, Map<number, PlayoffBracketMatch[]>>();
  for (const m of matches) {
    if (!byGroup.has(m.group)) {
      byGroup.set(m.group, new Map());
    }
    const byRound = byGroup.get(m.group)!;
    const roundMatches = byRound.get(m.round) ?? [];
    roundMatches.push(m);
    byRound.set(m.round, roundMatches);
  }
  for (const byRound of byGroup.values()) {
    const sorted = new Map([...byRound.entries()].sort(([a], [b]) => a - b));
    byRound.clear();
    sorted.forEach((v, k) => byRound.set(k, v));
    for (const [, roundMatches] of byRound) {
      roundMatches.sort((a, b) => (a.slot ?? 999) - (b.slot ?? 999));
    }
  }
  return byGroup;
}

/**
 * Builds slot-indexed arrays per (group, round) for dynamic tree layout.
 * Upper R1 length = numR1Slots from API (e.g. 8 for 16-team bracket); other rounds inferred from data.
 */
function buildSlotsByGroupAndRound(
  byGroupAndRound: Map<number, Map<number, PlayoffBracketMatch[]>>,
  numR1Slots: number
): Map<number, Map<number, (PlayoffBracketMatch | null)[]>> {
  const out = new Map<number, Map<number, (PlayoffBracketMatch | null)[]>>();
  for (const [group, byRound] of byGroupAndRound) {
    const roundsOut = new Map<number, (PlayoffBracketMatch | null)[]>();
    for (const [round, roundMatches] of byRound) {
      const isUpperR1 = group === 1 && round === 1;
      const inferredSlots =
        roundMatches.length > 0
          ? Math.max(
              ...roundMatches.map((m) => (m.slot ?? 0) + 1),
              roundMatches.length
            )
          : 1;
      const slotCount =
        isUpperR1 && numR1Slots > 0 ? numR1Slots : inferredSlots;
      const slots: (PlayoffBracketMatch | null)[] = Array.from(
        { length: slotCount },
        () => null
      );
      for (const m of roundMatches) {
        const i = m.slot ?? 0;
        if (i >= 0 && i < slotCount) slots[i] = m;
      }

      roundsOut.set(round, slots);
    }
    out.set(group, roundsOut);
  }
  return out;
}

function buildSlotsFromLayout(params: {
  matches: PlayoffBracketMatch[];
  layout: {
    groups: Array<{
      group: number;
      rounds: Array<{
        round: number;
        slots: Array<{ match_id: number; external_match_id?: string } | null>;
      }>;
    }>;
  };
}): Map<number, Map<number, (PlayoffBracketMatch | null)[]>> {
  const { matches, layout } = params;
  const byMatchId = new Map<number, PlayoffBracketMatch>();
  const byExternalId = new Map<string, PlayoffBracketMatch>();
  for (const m of matches) {
    if (m.match_id > 0) byMatchId.set(m.match_id, m);
    if (m.external_match_id) byExternalId.set(m.external_match_id, m);
  }

  const out = new Map<number, Map<number, (PlayoffBracketMatch | null)[]>>();
  for (const group of layout.groups) {
    const byRound = new Map<number, (PlayoffBracketMatch | null)[]>();
    for (const round of group.rounds) {
      const slots: (PlayoffBracketMatch | null)[] = round.slots.map((ref) => {
        if (!ref) return null;
        const byId = ref.match_id > 0 ? byMatchId.get(ref.match_id) : undefined;
        if (byId) return byId;
        if (ref.external_match_id) {
          return byExternalId.get(ref.external_match_id) ?? null;
        }
        return null;
      });
      byRound.set(round.round, slots);
    }
    out.set(group.group, byRound);
  }
  return out;
}

function toDisplaySlotsByGroup(
  slotsByGroupAndRound: Map<number, Map<number, (PlayoffBracketMatch | null)[]>>
): Map<number, Map<number, PlayoffBracketSlotDisplay[]>> {
  const out = new Map<number, Map<number, PlayoffBracketSlotDisplay[]>>();
  for (const [group, byRound] of slotsByGroupAndRound) {
    if (group === 1) {
      out.set(group, buildUpperBracketDisplaySlots(byRound));
      continue;
    }
    const converted = new Map<number, PlayoffBracketSlotDisplay[]>();
    for (const [round, slots] of byRound) {
      converted.set(round, bracketMatchesToDisplaySlots(slots));
    }
    out.set(group, converted);
  }
  return out;
}

function MatchCard({ match }: { match: PlayoffBracketMatch }) {
  const isBye = match.team2_id === null;
  const isFinished = match.status === "FINISHED";
  const team1Wins =
    isFinished && (isBye || match.team1_score > (match.team2_score ?? 0));
  const team2Wins =
    !isBye && isFinished && (match.team2_score ?? 0) > match.team1_score;
  const scoreText = isFinished
    ? `${match.team1_score}-${match.team2_score ?? 0}`
    : "TBD";
  const team2DisplayName = match.team2_name ?? "Bye";
  const href =
    match.match_id > 0 ? createNextUrl(`/matches/${match.match_id}`) : null;
  const isTeam2Known = match.team2_id != null && match.team2_name != null;
  const cardClassName =
    "block w-full min-w-[220px] max-w-full rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const content = (
    <div className="flex flex-col p-2 sm:p-3">
      <div
        className={cn(
          "flex items-center gap-2 rounded px-2 py-1.5",
          team1Wins && "border-l-4 border-green-500 bg-green-500/20"
        )}
      >
        {match.team1_logo ? (
          <Image
            src={createTeamLogoUrl(match.team1_logo)}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded object-contain"
          />
        ) : (
          <span className="h-6 w-6 shrink-0" aria-hidden />
        )}
        <span className="truncate text-sm font-medium">
          {match.seed1 != null ? `#${match.seed1} ` : ""}
          {match.team1_name || "TBD"}
        </span>
      </div>
      <div className="flex items-center justify-center py-1 text-xs font-medium text-muted-foreground">
        {scoreText}
      </div>
      <div
        className={cn(
          "flex items-center gap-2 rounded px-2 py-1.5",
          team2Wins && "border-l-4 border-green-500 bg-green-500/20"
        )}
      >
        {match.team2_logo ? (
          <Image
            src={createTeamLogoUrl(match.team2_logo)}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded object-contain"
          />
        ) : (
          <span className="h-6 w-6 shrink-0" aria-hidden />
        )}
        <span
          className={cn(
            "truncate text-sm font-medium",
            !isTeam2Known && "text-muted-foreground"
          )}
        >
          {match.seed2 != null ? `#${match.seed2} ` : ""}
          {team2DisplayName}
        </span>
      </div>
    </div>
  );

  return href != null ? (
    <Link
      href={href}
      className={cardClassName}
      aria-label={`Match: ${match.team1_name} vs ${team2DisplayName}, ${scoreText}`}
    >
      {content}
    </Link>
  ) : (
    <div
      className={cardClassName}
      aria-label={`Match: ${match.team1_name} vs ${team2DisplayName}, ${scoreText}`}
    >
      {content}
    </div>
  );
}

function PreviewTeamRow({ side }: { side: PlayoffUpperBracketWinner | null }) {
  if (!side) {
    return (
      <div className="flex items-center gap-2 rounded px-2 py-1.5">
        <span className="h-6 w-6 shrink-0" aria-hidden />
        <span className="truncate text-sm font-medium text-muted-foreground">
          TBD
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded px-2 py-1.5">
      {side.team_logo ? (
        <Image
          src={createTeamLogoUrl(side.team_logo)}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 rounded object-contain"
        />
      ) : (
        <span className="h-6 w-6 shrink-0" aria-hidden />
      )}
      <span className="truncate text-sm font-medium">
        {side.seed != null ? `#${side.seed} ` : ""}
        {side.team_name}
      </span>
    </div>
  );
}

function PredictedMatchCard({
  team1,
  team2
}: {
  team1: PlayoffUpperBracketWinner | null;
  team2: PlayoffUpperBracketWinner | null;
}) {
  const label1 = team1?.team_name ?? "TBD";
  const label2 = team2?.team_name ?? "TBD";
  const cardClassName =
    "w-full min-w-[220px] max-w-full rounded-lg border border-dashed border-muted-foreground/50 bg-muted/15 p-2 text-card-foreground shadow-sm sm:p-3";

  return (
    <div
      className={cardClassName}
      aria-label={`Preview: ${label1} vs ${label2}, match not yet created`}
    >
      <div className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Preview
      </div>
      <div className="flex flex-col">
        <PreviewTeamRow side={team1} />
        <div className="flex items-center justify-center py-1 text-xs font-medium text-muted-foreground">
          —
        </div>
        <PreviewTeamRow side={team2} />
      </div>
    </div>
  );
}

const ROUND_COLUMN_WIDTH = "min-w-[220px] w-[220px]";
/** One row must fit one match card (padding + 2 team rows + score). Round 2+ span multiple rows. */
const SLOT_HEIGHT_PX = 116;

function EmptySlotCard() {
  return (
    <div
      className="min-h-[80px] w-full min-w-[220px] max-w-full rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20"
      aria-hidden
    >
      <div className="flex flex-col items-center justify-center gap-1 p-3 text-xs text-muted-foreground">
        <span>TBD</span>
      </div>
    </div>
  );
}

function slotDisplayKey(
  slot: PlayoffBracketSlotDisplay,
  roundNum: number,
  index: number
): string {
  if (slot.kind === "match") {
    return (
      slot.match.external_match_id ??
      `match-${slot.match.group}-${slot.match.round}-${index}`
    );
  }
  if (slot.kind === "preview") {
    const a = slot.team1?.team_id ?? "x";
    const b = slot.team2?.team_id ?? "y";
    return `preview-${roundNum}-${index}-${String(a)}-${String(b)}`;
  }
  return `empty-${roundNum}-${index}`;
}

function RoundColumn({
  roundNum,
  slots,
  sectionMaxSlots
}: {
  roundNum: number;
  slots: PlayoffBracketSlotDisplay[];
  sectionMaxSlots: number;
}) {
  const baseHeight = sectionMaxSlots > 0 ? sectionMaxSlots * SLOT_HEIGHT_PX : 0;
  const slotCount = slots.length;
  const rowSpan =
    baseHeight > 0 && slotCount > 0
      ? Math.max(1, Math.floor(sectionMaxSlots / slotCount))
      : 1;

  return (
    <div className={cn("flex shrink-0 flex-col", ROUND_COLUMN_WIDTH)}>
      <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Round {roundNum}
      </h3>
      <div
        className="grid w-full"
        style={{
          gridTemplateRows: `repeat(${sectionMaxSlots}, ${SLOT_HEIGHT_PX}px)`,
          minHeight: baseHeight
        }}
      >
        {slots.map((slot, index) => {
          const startRow = index * rowSpan + 1;
          return (
            <div
              key={slotDisplayKey(slot, roundNum, index)}
              className="flex items-center justify-center"
              style={{
                gridRow: `${startRow} / span ${rowSpan}`
              }}
            >
              {slot.kind === "match" ? (
                <MatchCard match={slot.match} />
              ) : slot.kind === "preview" ? (
                <PredictedMatchCard team1={slot.team1} team2={slot.team2} />
              ) : (
                <EmptySlotCard />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ROUND_GAP = "gap-6";

function BracketSection({
  group,
  slotsByRound,
  leftOffset
}: {
  group: number;
  slotsByRound: Map<number, PlayoffBracketSlotDisplay[]>;
  leftOffset?: boolean;
}) {
  const rounds = [...slotsByRound.entries()].sort(([a], [b]) => a - b);
  const label = GROUP_LABELS[group] ?? `Group ${group}`;
  const maxSlotsInSection =
    rounds.length > 0
      ? Math.max(...rounds.map(([, slots]) => slots.length))
      : 0;

  return (
    <section
      aria-labelledby={`playoff-${group}-heading`}
      className={cn("w-full min-w-0", leftOffset && "pl-[220px] sm:pl-[220px]")}
    >
      <h2
        id={`playoff-${group}-heading`}
        className="mb-4 text-sm font-bold uppercase tracking-wider text-kanaliiga-orange"
      >
        {label}
      </h2>
      <div className={cn("flex overflow-x-auto pb-2", ROUND_GAP)}>
        {rounds.map(([roundNum, slots]) => (
          <RoundColumn
            key={`${group}-${roundNum}`}
            roundNum={roundNum}
            slots={slots}
            sectionMaxSlots={maxSlotsInSection}
          />
        ))}
      </div>
    </section>
  );
}

export function PlayoffBracket({
  matches,
  bracket
}: {
  matches: PlayoffBracketMatch[];
  bracket?: {
    numR1Slots: number;
    bracketSize?: number;
    layout?: {
      groups: Array<{
        group: number;
        rounds: Array<{
          round: number;
          slots: Array<{ match_id: number; external_match_id?: string } | null>;
        }>;
      }>;
    };
  };
}) {
  const slotsByGroupAndRound =
    bracket?.layout != null
      ? buildSlotsFromLayout({ matches, layout: bracket.layout })
      : buildSlotsByGroupAndRound(
          groupMatchesByGroupAndRound(matches),
          bracket?.numR1Slots ?? 0
        );

  const displayByGroup = toDisplaySlotsByGroup(slotsByGroupAndRound);

  const upper = displayByGroup.get(1);
  const lower = displayByGroup.get(2);
  const grandFinal = displayByGroup.get(3);
  const lowerMinRound = lower && lower.size > 0 ? Math.min(...lower.keys()) : 2;
  const indentLower = lowerMinRound >= 2;

  return (
    <div className="flex w-full flex-col gap-10">
      <div className="grid w-full min-w-0 grid-cols-1 gap-10 lg:grid-cols-[1fr_auto] lg:gap-8">
        <div className="min-w-0">
          {upper && <BracketSection group={1} slotsByRound={upper} />}
        </div>
        {grandFinal && (
          <div className={cn("min-w-0", ROUND_COLUMN_WIDTH)}>
            <BracketSection group={3} slotsByRound={grandFinal} />
          </div>
        )}
      </div>

      {lower && (
        <div className="w-full min-w-0">
          <BracketSection
            group={2}
            slotsByRound={lower}
            leftOffset={indentLower}
          />
        </div>
      )}
    </div>
  );
}
