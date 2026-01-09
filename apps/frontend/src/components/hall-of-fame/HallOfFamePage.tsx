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
    <div className="flex items-center gap-3 flex-wrap">
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

// Generic row component for Hall of Fame entries
const HallOfFameRow = ({
  rank,
  href,
  imageElement,
  nameElement,
  trophies,
  totalPoints
}: {
  rank: number;
  href: string;
  imageElement: React.ReactNode;
  nameElement: React.ReactNode;
  trophies: TrophyGroup[];
  totalPoints: number;
}) => {
  return (
    <Link
      href={href}
      className="p-3 sm:p-4 hover:bg-muted/50 transition-colors rounded-lg"
    >
      {/* Mobile layout: stacked */}
      <div className="block sm:hidden">
        <div className="flex items-center gap-2">
          <RankBadge rank={rank} />
          {imageElement}
          <div className="flex-1 min-w-0">{nameElement}</div>
          <div className="font-bold text-base shrink-0">{totalPoints}p</div>
        </div>
        <div className="mt-2 ml-9">
          <TrophyGroupDisplay trophies={trophies} />
        </div>
      </div>

      {/* Desktop layout: horizontal */}
      <div className="hidden sm:flex items-center gap-4">
        <RankBadge rank={rank} />
        {imageElement}
        <div className="flex-1 min-w-0">{nameElement}</div>
        <div className="flex items-center gap-4">
          <TrophyGroupDisplay trophies={trophies} />
          <div className="w-16 text-right font-bold text-lg">
            {totalPoints}p
          </div>
        </div>
      </div>
    </Link>
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
    <HallOfFameRow
      rank={rank}
      href={`/organizations/${org.organization_id}`}
      imageElement={
        logoUrl ? (
          <Image
            src={logoUrl}
            alt={org.organization_name}
            width={32}
            height={32}
            className="rounded sm:w-10 sm:h-10"
            unoptimized
          />
        ) : null
      }
      nameElement={
        <span className="font-semibold truncate text-sm sm:text-base">
          {org.organization_name}
        </span>
      }
      trophies={org.trophies}
      totalPoints={org.total_points}
    />
  );
};

const TeamRow = ({ team, rank }: { team: HallOfFameTeam; rank: number }) => {
  const logoUrl = team.team_logo ? createTeamLogoUrl(team.team_logo) : null;

  return (
    <HallOfFameRow
      rank={rank}
      href={`/teams/${team.team_id}`}
      imageElement={
        logoUrl ? (
          <Image
            src={logoUrl}
            alt={team.team_name}
            width={32}
            height={32}
            className="rounded sm:w-10 sm:h-10"
            unoptimized
          />
        ) : null
      }
      nameElement={
        <div>
          <span className="font-semibold truncate text-sm sm:text-base block">
            {team.team_name}
          </span>
          {team.organization_name && (
            <span className="text-xs text-muted-foreground truncate block">
              {team.organization_name}
            </span>
          )}
        </div>
      }
      trophies={team.trophies}
      totalPoints={team.total_points}
    />
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
    <HallOfFameRow
      rank={rank}
      href={`/players/${player.steam_id}`}
      imageElement={
        avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={player.player_name}
            width={32}
            height={32}
            className="rounded-full sm:w-10 sm:h-10"
            unoptimized
          />
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </div>
        )
      }
      nameElement={
        <span className="font-semibold truncate text-sm sm:text-base">
          {player.player_name}
        </span>
      }
      trophies={player.trophies}
      totalPoints={player.total_points}
    />
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
