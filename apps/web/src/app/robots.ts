import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/animals", "/enclosures", "/admin", "/settings", "/feedback", "/verify", "/auth"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
