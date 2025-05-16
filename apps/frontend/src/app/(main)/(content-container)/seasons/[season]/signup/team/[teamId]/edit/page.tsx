import { envConfig } from "@/configs/env";
import type { Season, SeasonDetails, Team } from "@eggosystem/types";
import { SignupEditForm } from "@/components/signup/signup-edit-form";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

type TeamSignupEditPage = {
  params: Promise<{ season: string; teamId: string }>;
};

export async function generateMetadata({
  params
}: TeamSignupEditPage): Promise<Metadata> {
  const { season, teamId } = await params;

  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const teamResult = await fetch(`${envConfig.API_URL}/api/v1/teams/${teamId}`);

  const data: SeasonDetails = await result.json();
  const teamData: Team = await teamResult.json();
  if (result.ok && teamResult.ok) {
    return createPageMetadata({
      title: `Edit team ${teamData.name} for ${data.full_name}`
    });
  }
  if (result.ok && !teamResult.ok) {
    return createPageMetadata({
      title: `Team edit for ${data.full_name}`
    });
  }
  return createPageMetadata({
    title: `Team edit for season`
  });
}

export default async function TeamSignupEditPage({
  params
}: TeamSignupEditPage) {
  const { season, teamId } = await params;
  const seasonResult = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}`
  );
  const data: Season = await seasonResult.json();
  return (
    <div>
      <div className="flex flex-col-reverse lg:flex-row gap-y-4 md:gap-x-4">
        <div className="sm:min-w-xl space-y-6">
          <SignupEditForm
            seasonId={season}
            teamId={teamId}
            platform={data.platform}
          />
        </div>
      </div>
    </div>
  );
}
