import { envConfig } from "@/configs/env";
import { SignupFormWithDraft } from "@/components/signup/SignupFormWithDraft";
import { SignupInfo } from "@/components/signup/SignupInfo";
import type { SeasonDetails } from "@eggosystem/types";
import type { Metadata } from "next";
import type React from "react";

type SignupPageProps = {
  params: Promise<{ season: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata: Metadata = {
  title: "Season registration"
};

const SignupContainer = ({
  children,
  seasonDetails
}: {
  children: React.ReactNode;
  seasonDetails: SeasonDetails;
}) => {
  return (
    <div>
      <div className="flex flex-col-reverse lg:flex-row gap-y-4 md:gap-x-4">
        <div className="sm:min-w-xl space-y-6">{children}</div>

        <div className="sm:max-w-3xl space-y-6">
          <SignupInfo seasonDetails={seasonDetails} />
        </div>
      </div>
    </div>
  );
};

export default async function SignupPage({ params }: SignupPageProps) {
  const { season } = await params;

  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  if (!result.ok) {
    throw new Error("Failed to fetch season details");
  }

  const data: SeasonDetails = await result.json();

  return (
    <SignupContainer seasonDetails={data}>
      <SignupFormWithDraft seasonId={season} platform={data.platform} />
    </SignupContainer>
  );
}
