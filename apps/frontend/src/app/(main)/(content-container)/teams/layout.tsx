import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: { default: "Teams", template: "%s | Kanahub by Kanaliiga" },
  description: "List of all teams that have participated in Kanaliiga"
});

export default function TeamsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
