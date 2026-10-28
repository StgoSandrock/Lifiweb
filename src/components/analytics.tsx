"use client";
import { Analytics } from "@vercel/analytics/next";
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        if (
          url.pathname.startsWith("/staff") ||
          url.pathname.startsWith("/gestion")
        )
          return null;
        url.search = "";
        url.hash = "";
        return { ...event, url: url.toString() };
      }}
    />
  );
}
