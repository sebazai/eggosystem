"use client";

import { Suspense } from "react";

export default function OrganizationContainer({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <title>Recent matches - Kanahub</title>
      <h1>Recent matches</h1>
      <div>{children}</div>
    </Suspense>
  );
}
