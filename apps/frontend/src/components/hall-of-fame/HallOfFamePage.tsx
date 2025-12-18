"use client";

import React from "react";
import { TrophyIcon, Building2, Users, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { useSearchParams, useRouter } from "next/navigation";
import { useHallOfFame } from "@/hooks/data/useHallOfFame";
import { CardContainer } from "@/components/layout/CardContainer";
import { ContentContainer } from "@/components/layout/ContentContainer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type {
  HallOfFameCategory,
  HallOfFameOrganization,
  HallOfFameTeam,
  HallOfFamePlayer,
  TrophyGroup
} from "@eggosystem/types";
import {
  createTeamLogoUrl,
  createOrgLogoUrl,
  createAvatarUrl
} from "@/lib/utils";
import { envConfig } from "@/configs/env";

const categories: {
  value: HallOfFameCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "organizations",
    label: "Organizations",
    icon: <Building2 className="h-4 w-4" />
  },
  { value: "teams", label: "Teams", icon: <Users className="h-4 w-4" /> },
  { value: "players", label: "Players", icon: <User className="h-4 w-4" /> }
];

const getTrophyImageUrl = (phash: string): string => {
  return `${envConfig.IMAGE_SERVICE_URL}/images/by-hash/phash/${phash}`;
};

// Display a single trophy group with its actual image
const TrophyGroupBadge = ({ trophy }: { trophy: TrophyGroup }) => {
  if (trophy.count === 0) return null;

  const imageUrl = getTrophyImageUrl(trophy.image_phash);

  return (
    <div
      className="flex items-center gap-1"
      title={`${trophy.count}x ${trophy.trophy_name}`}
    >
      <div className="w-6 h-6 relative">
        <Image
          src={imageUrl}
          alt={trophy.trophy_name}
          width={24}
          height={24}
          className="object-contain"
          unoptimized
        />
      </div>
      <span className="text-sm font-medium">{trophy.count}</span>
    </div>
  );
};

// Display all trophy groups for an entity
const TrophyGroupDisplay = ({ trophies }: { trophies: TrophyGroup[] }) => {
  if (!trophies || trophies.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {trophies.map((trophy, index) => (
        <TrophyGroupBadge
          key={`${trophy.image_phash}-${index}`}
          trophy={trophy}
        />
      ))}
    </div>
  );
};

const RankBadge = ({ rank }: { rank: number }) => {
  const getBadgeStyle = () => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-amber-500 text-black";
      case 2:
        return "bg-gradient-to-r from-slate-300 to-slate-400 text-black";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-700 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div
      className={clsx(
        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
        getBadgeStyle()
      )}
    >
      {rank}
    </div>
  );
};

const OrganizationRow = ({
  org,
  rank
}: {
  org: HallOfFameOrganization;
  rank: number;
}) => {
  const logoUrl = org.organization_logo
    ? createOrgLogoUrl(org.organization_logo)
    : null;

  return (
    <Link
      href={`/organizations/${org.organization_id}`}
      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg"
    >
      <RankBadge rank={rank} />
      {logoUrl && (
        <Image
          src={logoUrl}
          alt={org.organization_name}
          width={40}
          height={40}
          className="rounded"
          unoptimized
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{org.organization_name}</p>
      </div>
      <div className="flex items-center gap-4">
        <TrophyGroupDisplay trophies={org.trophies} />
        <div className="w-16 text-right font-bold text-lg">
          {org.total_points}p
        </div>
      </div>
    </Link>
  );
};

const TeamRow = ({ team, rank }: { team: HallOfFameTeam; rank: number }) => {
  const logoUrl = team.team_logo ? createTeamLogoUrl(team.team_logo) : null;

  return (
    <Link
      href={`/teams/${team.team_id}`}
      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg"
    >
      <RankBadge rank={rank} />
      {logoUrl && (
        <Image
          src={logoUrl}
          alt={team.team_name}
          width={40}
          height={40}
          className="rounded"
          unoptimized
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{team.team_name}</p>
        {team.organization_name && (
          <p className="text-xs text-muted-foreground truncate">
            {team.organization_name}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <TrophyGroupDisplay trophies={team.trophies} />
        <div className="w-16 text-right font-bold text-lg">
          {team.total_points}p
        </div>
      </div>
    </Link>
  );
};

const PlayerRow = ({
  player,
  rank
}: {
  player: HallOfFamePlayer;
  rank: number;
}) => {
  const avatarUrl = player.avatar ? createAvatarUrl(player.avatar) : null;

  return (
    <Link
      href={`/players/${player.steam_id}`}
      className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-lg"
    >
      <RankBadge rank={rank} />
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={player.player_name}
          width={40}
          height={40}
          className="rounded-full"
          unoptimized
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{player.player_name}</p>
      </div>
      <div className="flex items-center gap-4">
        <TrophyGroupDisplay trophies={player.trophies} />
        <div className="w-16 text-right font-bold text-lg">
          {player.total_points}p
        </div>
      </div>
    </Link>
  );
};

export const HallOfFamePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get category from URL params, default to "organizations"
  const categoryParam = searchParams.get("category");
  const category: HallOfFameCategory =
    categoryParam &&
    ["organizations", "teams", "players"].includes(categoryParam)
      ? (categoryParam as HallOfFameCategory)
      : "organizations";

  const { data, isLoading, error } = useHallOfFame(category);

  const setCategory = (newCategory: HallOfFameCategory) => {
    const params = new URLSearchParams();
    params.set("category", newCategory);
    router.push(`/hall-of-fame?${params.toString()}`);
  };

  if (error) {
    return (
      <ContentContainer>Failed to load Hall of Fame data</ContentContainer>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl mb-2 flex items-center gap-3">
            <TrophyIcon className="h-8 w-8 text-yellow-400" />
            Hall of Fame
          </h1>
          <p className="text-sm text-muted-foreground">
            Celebrating the most decorated organizations, teams, and players in
            Kanaliiga history.
            <br />
            <span className="text-xs">
              Points: 🥇 Gold = 3p, 🥈 Silver = 2p, 🥉 Bronze = 1p
            </span>
          </p>
        </div>

        <Select
          value={category}
          onValueChange={(value) => setCategory(value as HallOfFameCategory)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  {cat.icon}
                  {cat.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CardContainer classNames="p-2 md:p-4">
        {isLoading ? (
          <ContentContainer classNames="min-h-[30vh]">
            Loading...
          </ContentContainer>
        ) : !data || data.length === 0 ? (
          <ContentContainer classNames="min-h-[30vh]">
            No trophy data available for this category.
          </ContentContainer>
        ) : (
          <div className="divide-y divide-border">
            {category === "organizations" &&
              (data as HallOfFameOrganization[]).map((org, index) => (
                <OrganizationRow
                  key={org.organization_id}
                  org={org}
                  rank={index + 1}
                />
              ))}
            {category === "teams" &&
              (data as HallOfFameTeam[]).map((team, index) => (
                <TeamRow key={team.team_id} team={team} rank={index + 1} />
              ))}
            {category === "players" &&
              (data as HallOfFamePlayer[]).map((player, index) => (
                <PlayerRow
                  key={player.steam_id}
                  player={player}
                  rank={index + 1}
                />
              ))}
          </div>
        )}
      </CardContainer>
    </div>
  );
};
