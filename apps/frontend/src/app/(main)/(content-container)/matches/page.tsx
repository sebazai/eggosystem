import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { MatchesView } from "@/components/matches/MatchesView";

export const metadata: Metadata = createPageMetadata({
  title: "Recent matches",
  description: "Recent matches played in Kanaliiga"
});

export default function AllMatches() {
  return <MatchesView />;
}
