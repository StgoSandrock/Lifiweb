"use client";

import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { CATEGORIES, CLUBS, LFF_CLUBS } from "@/config/league";
import { getSupabaseClient } from "@/lib/supabase/client";
import { loadLeagueCatalog } from "@/lib/supabase/public-data";
import type { Club, Competition } from "@/types/domain";

type CatalogClub = Club & { competitions: Competition[] };

const fallbackClubs: CatalogClub[] = [
  ...CLUBS.map((club) => ({ ...club, competitions: ["league", "cup"] as Competition[] })),
  ...LFF_CLUBS.map((club) => ({ ...club, competitions: ["lff"] as Competition[] })),
];

export function useLeagueCatalog() {
  const [clubs, setClubs] = useState<CatalogClub[]>(fallbackClubs);
  const [categories, setCategories] = useState(CATEGORIES);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    let channel: RealtimeChannel | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refresh = async () => {
      try {
        const catalog = await loadLeagueCatalog();
        if (!active) return;
        setClubs(catalog.clubs);
        setCategories(catalog.categories);
        setLive(true);
      } catch {
        if (!active) return;
        setClubs(fallbackClubs);
        setCategories(CATEGORIES);
        setLive(false);
      }
    };

    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 150);
    };

    try {
      const client = getSupabaseClient();
      channel = client.channel("public-league-catalog")
        .on("postgres_changes", { event: "*", schema: "public", table: "clubs" }, scheduleRefresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "club_competitions" }, scheduleRefresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, scheduleRefresh)
        .subscribe();
      void refresh();
    } catch {
      void refresh();
    }

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      if (channel) void getSupabaseClient().removeChannel(channel);
    };
  }, []);

  return useMemo(() => ({ clubs, categories, live }), [clubs, categories, live]);
}
