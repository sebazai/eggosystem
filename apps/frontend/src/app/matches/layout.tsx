import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recent matches",
  description: "Recent matches played in Kanaliiga"
};

interface LayoutProps {
  children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
  return <div>{children}</div>;
}
