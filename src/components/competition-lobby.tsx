"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useSyncExternalStore } from "react";

type LastCompetition = "league" | "cup" | null;

const cards = [
  {
    id: "league" as const,
    href: "/liga",
    title: "LIFI Liga",
    kicker: "Clausura 2026",
    description: "Posiciones, nueve fechas, fixture oficial, clubes y planteles.",
    className: "league-card",
  },
  {
    id: "cup" as const,
    href: "/lifi-cup",
    title: "LIFI Cup",
    kicker: "Competencia LIFI",
    description: "Consulta el fixture, resultados y la información vigente disponible.",
    className: "cup-card",
  },
];

export function CompetitionLobby() {
  const lastCompetition = useSyncExternalStore<LastCompetition>(
    (onChange) => { window.addEventListener("storage", onChange); return () => window.removeEventListener("storage", onChange); },
    () => {
    const stored = window.localStorage.getItem("lifi:last-competition");
      return stored === "league" || stored === "cup" ? stored : null;
    },
    () => null,
  );

  return (
    <main className="competition-lobby">
      <div className="lobby-grid" aria-hidden="true" />
      <header className="lobby-topbar">
        <span className="season-pill"><Sparkles /> Temporada 2026</span>
        <Link className="lobby-staff" href="/staff"><ShieldCheck /> Acceso Staff</Link>
      </header>

      <section className="lobby-content" aria-labelledby="lobby-title">
        <div className="lobby-brand">
          <Image src="/lifi-logo.svg" alt="Escudo de LIFI" width={116} height={116} priority />
          <div>
            <h1 id="lobby-title">LIFI</h1>
            <p>Liga Infantil de Fútbol Interestadios</p>
          </div>
        </div>

        <div className="competition-cards" aria-label="Selecciona una competencia">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.href}
              className={`competition-card ${card.className}`}
              onClick={() => window.localStorage.setItem("lifi:last-competition", card.id)}
            >
              <span className="competition-card-icon"><Trophy /></span>
              <span className="competition-card-copy">
                <span className="competition-kicker">{card.kicker}</span>
                <strong>{card.title}</strong>
                <small>{card.description}</small>
              </span>
              <span className="competition-arrow" aria-hidden="true"><ArrowRight /></span>
              {lastCompetition === card.id && <span className="last-visit">Última visita</span>}
            </Link>
          ))}
        </div>
        <p className="lobby-hint">Elige una competencia para ver su información oficial.</p>
      </section>
    </main>
  );
}
