import type { Metadata } from "next";
import { LeagueApp } from "@/components/league-app";

export const metadata: Metadata = {
  title: "LIFI Liga · Clausura 2026",
  description: "Posiciones, fixture, planteles e historia oficial de LIFI Liga para el Torneo Clausura 2026.",
};

export default function LigaPage() {
  return <LeagueApp competition="league" />;
}
