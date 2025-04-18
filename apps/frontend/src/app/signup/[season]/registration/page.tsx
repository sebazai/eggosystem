import { envConfig } from "@/configs/env";
import { SignupForm } from "@/components/signup/signup-form";
import { SignupInfo } from "@/components/signup/signup-info";
import type { Season } from "@eggosystem/types";

type SignupPageProps = {
  params: Promise<{ season: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SignupPage({ params }: SignupPageProps) {
  const { season } = await params;
  const result = await fetch(`${envConfig.API_URL}/api/v1/seasons/${season}`);
  const data: Season = await result.json();
  return (
    <div>
      <h1 className="pb-4">Season registration</h1>
      <div className="flex flex-col-reverse lg:flex-row gap-y-4 md:gap-x-4">
        <div className="min-w-xxs sm:min-w-xl space-y-6">
          <SignupForm seasonId={season} platform={data.platform} />
        </div>

        <div className="min-w-xxs sm:max-w-xl space-y-6">
          <SignupInfo />
        </div>
      </div>
    </div>
  );
}
