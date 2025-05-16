import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: { default: "Leaderboards", template: "%s | Kanahub by Kanaliiga" }
});

export default function LeaderboardsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Leaderboards</h1>
      {children}
    </div>
  );
}
