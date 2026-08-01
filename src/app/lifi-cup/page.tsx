import type { Metadata } from "next";
import { LeagueApp } from "@/components/league-app";

export const metadata: Metadata = {
  title: "LIFI Cup",
  description: "Fixture, resultados y planteles disponibles de LIFI Cup.",
};

export default function LifiCupPage() {
  return <LeagueApp competition="cup" />;
}
