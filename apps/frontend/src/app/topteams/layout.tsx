import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top teams",
  description: "The teams that perform well in Kanaliiga"
};

export default function TopTeamsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-kanaliiga-orange font-headings">
        Top Teams
      </h1>
      {children}
    </div>
  );
}
