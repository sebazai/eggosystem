"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { KanaLeaderboardEntry, KanaTier } from "@eggosystem/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { CardContainer } from "@/components/layout/CardContainer";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { TableSkeleton } from "@/components/loading";
import { useAuth } from "@/context/AuthContext";
import { useKanaLeaderboard } from "@/hooks/data/useKanaLeaderboard";
import { cn } from "@/lib/utils";
import {
  DEFAULT_KANA_TIER,
  KANA_TIER_OPTION_GROUPS,
  isKanaTier
} from "./kana-tier-options";

const KanaLeaderboardRow = React.memo(
  ({
    entry,
    isCurrentUser
  }: {
    entry: KanaLeaderboardEntry;
    isCurrentUser: boolean;
  }) => (
    <TableRow
      data-testid="kana-leaderboard-row"
      className={cn(
        "transition-colors hover:bg-accent/50",
        isCurrentUser && "bg-kanaliiga-orange/10 font-semibold"
      )}
    >
      <TableCell className="font-medium tabular-nums">
        #{entry.position}
      </TableCell>
      <TableCell>
        <Link
          href={`/players/${entry.steam_id}`}
          className="hover:text-kanaliiga-orange underline-offset-4 hover:underline"
        >
          {entry.nickname}
        </Link>
        {isCurrentUser && (
          <Badge variant="outline" className="ml-2 text-xs">
            You
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">
        {entry.kana_elo.toLocaleString()}
      </TableCell>
    </TableRow>
  )
);

KanaLeaderboardRow.displayName = "KanaLeaderboardRow";

export const KanaLeaderboardPage = () => {
  const [tier, setTier] = useState<KanaTier>(DEFAULT_KANA_TIER);
  const { entries, isLoading, isValidating, isError, retry } =
    useKanaLeaderboard(tier);
  const { user } = useAuth();
  const currentUserSteamId = user?.provider_id;

  const isFetching = isLoading || isValidating;

  return (
    <div>
      <h1 className="text-3xl mb-4">Kana Elo Leaderboard</h1>
      <p className="text-sm text-muted-foreground mb-4">
        The top 50 players by live kana elo. Pick a kana rank to see who sits in
        that tier — each row keeps its global top-50 position.
      </p>

      <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center">
        <Label htmlFor="kana-tier" className="text-sm font-medium">
          Kana Rank
        </Label>
        <Select
          value={tier}
          onValueChange={(value) => {
            if (isKanaTier(value)) {
              setTier(value);
            }
          }}
        >
          <SelectTrigger
            id="kana-tier"
            className="w-[220px]"
            aria-label="Kana rank"
          >
            <SelectValue placeholder="Select a kana rank" />
          </SelectTrigger>
          <SelectContent>
            {KANA_TIER_OPTION_GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CardContainer classNames="p-2 md:p-4">
        {isFetching && (
          <TableSkeleton rows={10} columns={3} showHeader={false} />
        )}

        {!isFetching && isError && (
          <ContentContainer classNames="min-h-[30vh] flex-col gap-4">
            <p className="text-destructive">
              Failed to load the kana leaderboard.
            </p>
            <Button variant="outline" onClick={retry}>
              Try Again
            </Button>
          </ContentContainer>
        )}

        {!isFetching && !isError && entries && entries.length === 0 && (
          <ContentContainer classNames="min-h-[30vh]">
            No top-50 player is currently in this tier.
          </ContentContainer>
        )}

        {!isFetching && !isError && entries && entries.length > 0 && (
          <Table data-testid="kana-leaderboard-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Position</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Kana Elo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <KanaLeaderboardRow
                  key={entry.steam_id}
                  entry={entry}
                  isCurrentUser={
                    currentUserSteamId !== undefined &&
                    currentUserSteamId === entry.steam_id
                  }
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContainer>
    </div>
  );
};
