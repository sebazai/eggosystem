import { envConfig } from "@/configs/env";
import { SignupForm } from "@/components/signup/SignupForm";
import { SignupInfo } from "@/components/signup/SignupInfo";
import type { SeasonDetails } from "@eggosystem/types";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type React from "react";
import { RedirectType, redirect } from "next/navigation";

type SignupPageProps = {
  params: Promise<{ season: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata: Metadata = {
  title: "Season registration"
};

const SignupContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <div className="flex flex-col-reverse lg:flex-row gap-y-4 md:gap-x-4">
        <div className="sm:min-w-xl space-y-6">{children}</div>

        <div className="sm:max-w-3xl space-y-6">
          <SignupInfo />
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
  const data: SeasonDetails = await result.json();

  // Check if user is already a captain or co-captain for this season

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (token) {
    const myRegRes = await fetch(
      `${envConfig.API_URL}/api/v1/registrations/season/${season}/my-registration`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: "no-store"
      }
    );
    if (myRegRes.ok) {
      const myReg = await myRegRes.json();
      if (myReg.teamId) {
        redirect(
          `/seasons/${season}/signup/team/${myReg.teamId}/edit`,
          RedirectType.replace
        );
      }
    }
  }

  // See if saved draft
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const draftExists = await fetch(
      `${envConfig.API_URL}/api/v1/registrations/season/${data.id}/draft`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (draftExists.ok) {
      const draft = await draftExists.json();
      return (
        <SignupContainer>
          <SignupForm
            seasonId={season}
            platform={data.platform}
            draft={draft}
          />
        </SignupContainer>
      );
    }
    return (
      <SignupContainer>
        <SignupForm seasonId={season} platform={data.platform} />
      </SignupContainer>
    );
  } catch (err) {
    console.error("Error loading draft", err);
  }

  // Normal
  return (
    <SignupContainer>
      <SignupForm seasonId={season} platform={data.platform} />
    </SignupContainer>
  );
}
