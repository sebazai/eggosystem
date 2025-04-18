import type { SeasonDetails } from "@eggosystem/types";
import type { Metadata } from "next";
import type React from "react";

import { envConfig } from "@/configs/env";
import { TheContainer } from "@/components/layout/the-container";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ season: string }>;
}

export async function generateMetadata({
  params
}: LayoutProps): Promise<Metadata> {
  const { season } = await params;

  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  if (!result.ok) {
    return {
      title: "Failed to fetch season"
    };
  }
  const data = await result.json();
  return {
    title: `Team registration for ${data.full_name}`
  };
}

export default async function Layout({ children, params }: LayoutProps) {
  const { season } = await params;
  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const serverTime = new Date().getTime();

  if (!result.ok) {
    if (result.status === 404) {
      return <TheContainer>Season does not exist</TheContainer>;
    }
    return <TheContainer>Error fetching season</TheContainer>;
  }

  const seasonDetails: SeasonDetails | undefined = await result.json();

  if (!seasonDetails) {
    return <TheContainer>{"Season does not exist"}</TheContainer>;
  }

  if (!seasonDetails.signup_start_date || !seasonDetails.signup_end_date) {
    return (
      <TheContainer>
        Season sign up dates are not set. Please come back later.
      </TheContainer>
    );
  }

  if (new Date(seasonDetails.signup_start_date).getTime() > serverTime) {
    return (
      <TheContainer>
        Season sign up has not started yet. Please come back later.
      </TheContainer>
    );
  }

  if (new Date(seasonDetails.signup_end_date).getTime() < serverTime) {
    return (
      <TheContainer>
        Season sign up has ended. Please wait for the next season.
      </TheContainer>
    );
  }

  return (
    <div className="min-h-fit pb-8 bg-card">
      <div className="max-w-[1400px] mx-auto p-2">{children}</div>
    </div>
  );
}
