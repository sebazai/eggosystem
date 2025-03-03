"use client";

export default function OrganizationContainer({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <title>Recent matches - Kanahub</title>
      <h1>Recent matches</h1>
      <div>{children}</div>
    </div>
  );
}
