import _ from "lodash";
import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { RecentMatches } from "@/components/matches/RecentMatches";

export const metadata: Metadata = createPageMetadata({
  title: "Recent matches",
  description: "Recent matches played in Kanaliiga"
});

export default function AllMatches() {
  return <RecentMatches />;
}
