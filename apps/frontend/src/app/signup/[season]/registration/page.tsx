import { envConfig } from "@/configs/env";
import type { Metadata } from "next";
import { SignupForm } from "@/components/signup/signup-form";
import { SignupInfo } from "@/components/signup/signup-info";
import type { Season } from "@eggosystem/types";

type Props = {
  params: Promise<{ season: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;

  const result = await fetch(`${envConfig.BASE_URL}/api/seasons/${season}`);

  if (!result.ok) {
    return {
      title: "Failed to fetch season"
    };
  }
  const data = await result.json();
  return {
    title: `Registration form for ${data.full_name}`
  };
}

export default async function SignupPage({ params }: Props) {
  const { season } = await params;
  const result = await fetch(`${envConfig.BASE_URL}/api/seasons/${season}`);
  const data: Season = await result.json();
  return (
    <div>
      <h1 className="pb-4">Season registration</h1>
      <div className="flex flex-col-reverse lg:flex-row gap-y-4 md:gap-x-4">
        <div className="min-w-xxs sm:min-w-lg space-y-6">
          <SignupForm seasonId={season} platform={data.platform} />
        </div>

        <div className="min-w-xxs sm:min-w-sm space-y-6">
          <SignupInfo />
        </div>
      </div>
    </div>
  );
}
