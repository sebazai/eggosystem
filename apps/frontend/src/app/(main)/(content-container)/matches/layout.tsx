import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Recent matches", template: "%s | Kanahub by Kanaliiga" },
  description: "Recent matches played in Kanaliiga"
};

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  return <div>{children}</div>;
}
