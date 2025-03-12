import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Organizations - Kanahub"
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <h1>Organizations</h1>
      <div>{children}</div>
    </div>
  );
}
