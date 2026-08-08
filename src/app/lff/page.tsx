import type { Metadata } from "next";
import { LeagueApp } from "@/components/league-app";

export const metadata: Metadata = {
  title: "LFF · Liga Femenina",
  description: "Fixture, posiciones, equipos y galerías oficiales de la Liga Femenina LFF.",
};

export default function LffPage() {
  return <LeagueApp competition="lff" />;
}
