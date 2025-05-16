import { envConfig } from "@/configs/env";
import type { Metadata } from "next";

export function createPageMetadata({ title, description }: Partial<Metadata>) {
  return {
    title,
    description,
    applicationName: "Kanahub by Kanaliiga",
    metadataBase: new URL(envConfig.BASE_URL)
  } satisfies Metadata;
}
