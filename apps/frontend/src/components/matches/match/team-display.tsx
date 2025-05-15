"use client";

import { NextImageFallback } from "@/components/layout/image-with-fallback";
import { createTeamLogoUrl } from "@/lib/utils";
import type { MatchTeamInfo } from "@eggosystem/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function TeamDisplay({
  team,
  logoRight = false
}: {
  team: MatchTeamInfo;
  logoRight?: boolean;
}) {
  const search = useSearchParams();
  const searchParams = search.size !== 0 ? search.toString() : "";

  const logo = (
    <div className="relative w-10 h-10 md:w-12 md:h-12">
      <NextImageFallback
        src={createTeamLogoUrl(team.logo)}
        alt={`${team.name} logo`}
        fill
        className="object-contain"
      />
    </div>
  );

  const nameAndRank = (
    <div className="flex flex-col">
      <span className="uppercase font-extrabold text-white text-lg md:text-xl leading-tight">
        {team.name}
      </span>
      <span className="text-[0.65rem] text-zinc-400 mt-1">
        Ranking #{team.rank}
      </span>
    </div>
  );

  return (
    <Link
      href={{
        pathname: `/teams/${team.id}`,
        query: searchParams
      }}
      className="flex items-center gap-2 md:gap-3 px-0 py-0 h-full"
    >
      {logoRight ? (
        <>
          {nameAndRank}
          {logo}
        </>
      ) : (
        <>
          {logo}
          {nameAndRank}
        </>
      )}
    </Link>
  );
}
