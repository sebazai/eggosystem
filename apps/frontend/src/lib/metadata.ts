import { envConfig } from "@/configs/env";
import type { Metadata } from "next";
import { createNextUrl } from "./utils";

export function createPageMetadata({
  title,
  description,
  openGraph
}: Partial<Metadata>) {
  return {
    title,
    description:
      description ??
      "Corporate esports league – matches, teams, and stats | Kanahub",
    applicationName: "Kanahub by Kanaliiga",
    metadataBase: new URL(envConfig.BASE_URL),
    openGraph: {
      type: "website",
      title: title ?? "Kanahub",
      description:
        description ??
        "Corporate esports league – matches, teams, and stats | Kanahub",
      url: new URL(envConfig.BASE_URL),
      images: [createNextUrl("/images/kanaliiga/opengraph-image.png")],
      siteName: "Kanahub by Kanaliiga",
      ...openGraph
    }
  } satisfies Metadata;
}
