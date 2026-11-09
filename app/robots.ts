import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/i18n/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The API has nothing to index, and the admin area is for OUAQT staff
      // only. The phone app, the account and the payment page stay open to
      // crawlers on purpose: they say noindex, and a crawler has to read the
      // page to see it. Blocked here, they could still be listed bare.
      disallow: ["/api/", "/admin"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
