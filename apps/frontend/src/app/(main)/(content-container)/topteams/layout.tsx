import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Top teams", template: "%s | Kanahub by Kanaliiga" },
  description: "The teams that perform well in Kanaliiga"
};

export default function TopTeamsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-3xl mb-4 md:mb-8">Top Teams</h1>
      {children}
    </div>
  );
}
