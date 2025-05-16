import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: { default: "Players", template: "%s | Kanahub by Kanaliiga" },
  description: "Kanaliiga statistics and esports platform"
});

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
