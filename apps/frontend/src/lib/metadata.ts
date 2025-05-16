import type { Metadata } from "next";

export function createPageMetadata({ title, description }: Partial<Metadata>) {
  return {
    title,
    description,
    applicationName: "Kanahub by Kanaliiga"
  } satisfies Metadata;
}
