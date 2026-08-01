import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifi.cl";
  const lastModified = new Date();
  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/liga`, lastModified, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/lifi-cup`, lastModified, changeFrequency: "daily", priority: 0.8 },
  ];
}
