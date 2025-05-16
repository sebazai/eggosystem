import type { SeasonDetails } from "@eggosystem/types";
import type { Metadata } from "next";
import type React from "react";

import { envConfig } from "@/configs/env";
import { ContentContainer } from "@/components/layout/content-container";
import { createPageMetadata } from "@/lib/metadata";

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
  return createPageMetadata({
    title: {
      default: `Team registration for ${data.full_name}`,
      template: "%s | Kanahub by Kanaliiga"
    }
  });
}

export default async function Layout({ children, params }: LayoutProps) {
  const { season } = await params;
  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const serverTime = new Date().getTime();

  if (!result.ok) {
    if (result.status === 404) {
      return <ContentContainer>Season does not exist</ContentContainer>;
    }
    return <ContentContainer>Error fetching season</ContentContainer>;
  }

  const seasonDetails: SeasonDetails | undefined = await result.json();

  if (!seasonDetails) {
    return <ContentContainer>{"Season does not exist"}</ContentContainer>;
  }

  if (!seasonDetails.signup_start_date || !seasonDetails.signup_end_date) {
    return (
      <ContentContainer>
        Season sign up dates are not set. Please come back later.
      </ContentContainer>
    );
  }

  if (new Date(seasonDetails.signup_start_date).getTime() > serverTime) {
    return (
      <ContentContainer>
        {`Season sign up has not started yet. Please come back on ${new Date(seasonDetails.signup_start_date).toUTCString()}.`}
      </ContentContainer>
    );
  }

  if (new Date(seasonDetails.signup_end_date).getTime() < serverTime) {
    return (
      <ContentContainer>
        Season sign up has ended. Please wait for the next season.
      </ContentContainer>
    );
  }

  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Season registration</h1>
      {children}
    </div>
  );
}
