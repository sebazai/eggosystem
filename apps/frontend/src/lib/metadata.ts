import { envConfig } from "@/configs/env";
import type { Metadata } from "next";
import { createNextUrl } from "./utils";

export function createPageMetadata({ title, description }: Partial<Metadata>) {
  return {
    title,
    description: description ?? "Kanaliiga esports platform",
    applicationName: "Kanahub by Kanaliiga",
    metadataBase: new URL(envConfig.BASE_URL),
    openGraph: {
      type: "website",
      title: title ?? "Kanahub",
      description: description ?? "Kanaliiga esports platform",
      url: new URL(envConfig.BASE_URL),
      images: [createNextUrl("/images/kanaliiga/opengraph-image.png")],
      siteName: "Kanahub by Kanaliiga"
    }
  } satisfies Metadata;
}
