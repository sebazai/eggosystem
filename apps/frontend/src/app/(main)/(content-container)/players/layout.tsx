import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Players", template: "%s | Kanahub by Kanaliiga" },
  description: "Kanaliiga statistics and esports platform",
  applicationName: "Kanahub by Kanaliiga"
};

export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
