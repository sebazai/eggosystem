"use client";
import { Suspense } from "react";

export default function MatchContainer({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <title>Matches - Kanahub</title>
      <div
        id="sticky-header"
        className="sticky top-[var(--nav-height)] z-30 text-2xl font-bold backdrop-blur-xs"
      >
        <h1>Matches</h1>
      </div>
      <div className="py-6">{children}</div>
    </Suspense>
  );
}
