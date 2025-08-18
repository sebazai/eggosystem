import type { Metadata } from "next";
import { envConfig } from "@/configs/env";
import type { SeasonDetails } from "@eggosystem/types";
import { createPageMetadata } from "@/lib/metadata";
import CalendarPage from "@/components/calendar/CalendarPage";

type CalendarPage = {
  params: Promise<{ season: string }>;
};

export async function generateMetadata({
  params
}: CalendarPage): Promise<Metadata> {
  const { season } = await params;

  const result = await fetch(
    `${envConfig.API_URL}/api/v1/seasons/${season}/details`
  );

  const data: SeasonDetails = await result.json();

  if (result.ok) {
    return createPageMetadata({
      title: `Match calendar for ${data.full_name}`
    });
  }
  return createPageMetadata({
    title: `Match calendar for season`
  });
}

export default async function Calendar({ params }: CalendarPage) {
  const { season } = await params;
  return <CalendarPage seasonId={season} />;
}
