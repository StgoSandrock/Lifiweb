"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Newspaper, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useSyncExternalStore } from "react";
import { LFF_LOGO_DATA_URL } from "@/config/lff-logo";

type LastCompetition = "league" | "cup" | "lff" | null;

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
  {
    id: "lff" as const,
    href: "/lff",
    title: "LFF",
    kicker: "Liga Femenina",
    description: "Fixture, posiciones, equipos y galerías de cada categoría.",
    className: "lff-card",
    logo: LFF_LOGO_DATA_URL,
  },
];

export function CompetitionLobby() {
  const lastCompetition = useSyncExternalStore<LastCompetition>(
    (onChange) => { window.addEventListener("storage", onChange); return () => window.removeEventListener("storage", onChange); },
    () => {
    const stored = window.localStorage.getItem("lifi:last-competition");
      return stored === "league" || stored === "cup" || stored === "lff" ? stored : null;
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
          <Image src="/lifi-logo.png" alt="Escudo de LIFI" width={116} height={116} priority />
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
              <span className="competition-card-icon">{"logo" in card && card.logo ? <Image src={card.logo} alt="" width={48} height={48} /> : <Trophy />}</span>
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
        <section className="lobby-news" aria-labelledby="lobby-news-title">
          <article className="lobby-news-card">
            <div className="lobby-news-image">
              <Image src="/news/bienvenida-inter-lifi.jpeg" alt="Inter y Club Manquehue juntos tras su amistoso de categoría Intermedia" fill sizes="(max-width: 768px) 100vw, 48vw" />
            </div>
            <div className="lobby-news-copy">
              <span><Newspaper /> Noticias LIFI</span>
              <h2 id="lobby-news-title">¡Bienvenido, Inter!</h2>
              <p>Inter se suma a LIFI con un amistoso frente a la categoría Intermedia de Club Manquehue.</p>
              <Link href="/liga" onClick={() => window.localStorage.setItem("lifi:last-competition", "league")}>Ver la Liga <ArrowRight /></Link>
            </div>
          </article>
        </section>
        <p className="lobby-hint">Elige una competencia para ver su información oficial.</p>
      </section>
    </main>
  );
}
