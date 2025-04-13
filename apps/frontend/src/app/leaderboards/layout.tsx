import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Player statistics and rankings in Kanaliiga"
};

export default function LeaderboardsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-kanaliiga-orange font-headings">
        Leaderboards
      </h1>
      {children}
    </div>
  );
}
