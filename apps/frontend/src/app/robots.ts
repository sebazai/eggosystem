import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === "production";
  const isHubDev = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  return isProduction && !isHubDev.includes("hubdev")
    ? {
        rules: {
          userAgent: "*",
          allow: "/"
        }
      }
    : {
        rules: {
          userAgent: "*",
          disallow: "/"
        }
      };
}
