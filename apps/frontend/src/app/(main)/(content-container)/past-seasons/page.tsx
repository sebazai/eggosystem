import { PastSeasonsPage } from "@/components/past-seasons/PastSeasonsPage";
import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: "Past Seasons",
  description: "Browse previous CS2 seasons in Kanaliiga"
});

export default function PastSeasons() {
  return <PastSeasonsPage />;
}
