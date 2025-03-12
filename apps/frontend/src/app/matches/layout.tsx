import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Recent matches - Kanahub"
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <h1>Recent matches</h1>
      <div>{children}</div>
    </div>
  );
}
