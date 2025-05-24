import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NODE_ENV === "production";

  return isProduction
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
