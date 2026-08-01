import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifi.cl";
  return { rules: { userAgent: "*", allow: "/", disallow: "/staff" }, sitemap: `${base}/sitemap.xml` };
}
