import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://linkly.com";

// Allows crawling of public pages while keeping the app, API and
// per-link/management routes out of search indexes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/stats/", "/unlock/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
