import { envConfig } from "@/configs/env";
import type { Season } from "@eggosystem/types";
import { SignupEditForm } from "@/components/signup/signup-edit-form";

type TeamSignupEditPage = {
  params: Promise<{ season: string; teamId: string }>;
};

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
        <div className="min-w-xxs sm:min-w-xl space-y-6">
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
