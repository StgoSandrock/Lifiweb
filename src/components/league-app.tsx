"use client";

import { ArrowRight, BarChart3, CalendarRange, ChevronLeft, CircleAlert, LoaderCircle, Trophy, UsersRound, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, CLUBS, SEASON } from "@/config/league";
import { FixtureList } from "@/components/fixture-list";
import { ClubMark } from "@/components/club-mark";
import { StandingsTable } from "@/components/standings-table";
import { SiteHeader } from "@/components/site-header";
import { calculateStandings } from "@/lib/standings";
import { foldText } from "@/lib/text";
import { useLeagueData } from "@/hooks/use-league-data";
import type { CategoryId, Club, Competition } from "@/types/domain";

type View = "standings" | "fixture" | "clubs";

export function LeagueApp({ competition }: { competition: Competition }) {
  const { matches, players, status, error } = useLeagueData();
  const [category, setCategory] = useState<CategoryId>("pre-peque");
  const [view, setView] = useState<View>("standings");
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const filteredMatches = useMemo(() => matches.filter((match) => match.competition === competition && match.category === category), [matches, competition, category]);
  const filteredPlayers = useMemo(() => players.filter((player) => player.competition === competition && player.category === category), [players, competition, category]);
  const visibleClubs = useMemo(() => {
    if (competition === "league") return CLUBS;
    const names = [...new Set([...filteredMatches.flatMap((match) => [match.home, match.away]), ...filteredPlayers.map((player) => player.club)])].sort((a, b) => a.localeCompare(b, "es"));
    return names.map((name) => CLUBS.find((club) => club.name === name) ?? { id: `cup-${foldText(name).replace(/\s+/g, "-")}`, name, aliases: [], logo: "" });
  }, [competition, filteredMatches, filteredPlayers]);
  const standings = useMemo(() => calculateStandings(filteredMatches, visibleClubs), [filteredMatches, visibleClubs]);
  const scorers = useMemo(() => [...filteredPlayers].filter((player) => player.goals > 0).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, "es")).slice(0, 5), [filteredPlayers]);
  const competitionMatches = useMemo(() => matches.filter((match) => match.competition === competition), [matches, competition]);
  const roundCount = new Set(competitionMatches.filter((match) => !match.roundLabel).map((match) => match.round)).size;
  const categoryCount = new Set(competitionMatches.map((match) => match.category)).size;

  useEffect(() => {
    window.localStorage.setItem("lifi:last-competition", competition);
  }, [competition]);

  return (
    <>
      <SiteHeader competition={competition} onNavigate={(nextView) => { setView(nextView); setSelectedClub(null); }} />
      <main className="competition-page">
        <section className="hero route-enter">
          <div className="hero-copy">
            <p className="eyebrow"><span /> {competition === "league" ? `Temporada ${SEASON} · Torneo Clausura` : "Competencia LIFI"}</p>
            <h1>LIFI <em>{competition === "league" ? "Liga" : "Cup"}</em></h1>
            <p>{competition === "league" ? "Fixture, posiciones y planteles oficiales de la Liga Infantil de Fútbol Interestadios." : "Fixture, resultados y planteles disponibles de LIFI Cup, sin completar información que aún no haya sido publicada."}</p>
            <div className="hero-actions">
              <a className="primary-button" href="#fixture" onClick={() => setView("fixture")}>Ver fixture <ArrowRight /></a>
              <a className="secondary-button" href="#posiciones" onClick={() => setView("standings")}>Tabla de posiciones</a>
            </div>
          </div>
          <div className="hero-scoreboard" aria-label={`Resumen de ${competition === "league" ? "LIFI Liga" : "LIFI Cup"}`}>
            <div className="scoreboard-top"><span>{competition === "league" ? "Clausura 2026" : "LIFI Cup"}</span><span className={status === "live" ? "live-dot" : "sync-dot"}>{status === "live" ? "Actualizado" : "Sincronizando"}</span></div>
            <strong>{competition === "league" ? 9 : roundCount || "—"}</strong><p>{competition === "league" ? "fechas por categoría" : "fechas publicadas"}</p>
            <div className="scoreboard-stats"><span><b>{competition === "league" ? 10 : new Set(competitionMatches.flatMap((match) => [match.home, match.away])).size || "—"}</b> clubes</span><span><b>{competition === "league" ? 5 : categoryCount || "—"}</b> categorías</span><span><b>{competition === "league" ? 225 : competitionMatches.length || "—"}</b> partidos</span></div>
          </div>
        </section>

        {error && <div className="connection-alert" role="status"><WifiOff /><span><strong>Modo respaldo</strong>{error}</span></div>}
        {status === "loading" && <div className="loading-line" role="status"><LoaderCircle /> Cargando información oficial…</div>}

        <section className="league-controls" aria-label="Filtros de competencia">
          <div className="competition-switch" aria-label="Competencia">
            <Link className={competition === "league" ? "active" : ""} href="/liga"><Trophy /> Liga · Clausura</Link>
            <Link className={competition === "cup" ? "active" : ""} href="/lifi-cup"><Trophy /> LIFI Cup</Link>
          </div>
          <div className="category-tabs" role="group" aria-label="Categoría">
            {CATEGORIES.map((item) => <button key={item.id} type="button" className={category === item.id ? "active" : ""} onClick={() => { setCategory(item.id); setSelectedClub(null); }}><span>{item.name}</span><small>{item.birthYears}</small></button>)}
          </div>
        </section>

        <section className="content-section" id={view === "fixture" ? "fixture" : view === "clubs" ? "clubes" : "posiciones"}>
          <div className="section-heading">
            <div><p className="eyebrow"><span /> {competition === "league" ? "Liga LIFI" : "LIFI Cup"} · {CATEGORIES.find((item) => item.id === category)?.name}</p><h2>{view === "standings" ? "Tabla de posiciones" : view === "fixture" ? "Fixture oficial" : "Clubes y planteles"}</h2></div>
            <div className="view-tabs" role="tablist" aria-label="Sección deportiva">
              <button role="tab" aria-selected={view === "standings"} className={view === "standings" ? "active" : ""} onClick={() => setView("standings")}><BarChart3 /> Posiciones</button>
              <button role="tab" aria-selected={view === "fixture"} className={view === "fixture" ? "active" : ""} onClick={() => setView("fixture")}><CalendarRange /> Fixture</button>
              <button role="tab" aria-selected={view === "clubs"} className={view === "clubs" ? "active" : ""} onClick={() => setView("clubs")}><UsersRound /> Clubes</button>
            </div>
          </div>

          {view === "standings" && (standings.length ? <div className="two-column"><StandingsTable standings={standings} onClub={(club) => { setSelectedClub(club); setView("clubs"); }} /><aside className="scorers"><p className="eyebrow"><span /> Goleadores</p><h3>Máximos anotadores</h3>{scorers.length ? <ol>{scorers.map((player, index) => <li key={player.id}><b>{index + 1}</b><span><strong>{player.name}</strong><small>{player.club}</small></span><em>{player.goals}</em></li>)}</ol> : <div className="mini-empty"><CircleAlert /><p>Las estadísticas comenzarán cuando existan resultados oficiales.</p></div>}</aside></div> : <div className="empty-state"><CircleAlert /><h3>Tabla aún no publicada</h3><p>Mostraremos las posiciones cuando existan clubes y partidos confirmados para esta categoría.</p></div>)}
          {view === "fixture" && <FixtureList matches={filteredMatches} />}
          {view === "clubs" && <ClubRosters clubs={visibleClubs} players={filteredPlayers} selectedClub={selectedClub} onSelect={setSelectedClub} />}
        </section>
      </main>
      <footer className="site-footer"><div><ImageLogo /><p>Liga Infantil de Fútbol Interestadios · Santiago de Chile</p></div><p>Temporada {SEASON} · Información oficial en actualización</p></footer>
    </>
  );
}

function ClubRosters({ clubs, players, selectedClub, onSelect }: { clubs: readonly Club[]; players: ReturnType<typeof useLeagueData>["players"]; selectedClub: string | null; onSelect: (club: string | null) => void }) {
  if (selectedClub) {
    const roster = players.filter((player) => player.club === selectedClub).sort((a, b) => a.name.localeCompare(b.name, "es"));
    return <div className="roster-view"><button className="back-button" type="button" onClick={() => onSelect(null)}><ChevronLeft /> Volver a clubes</button><div className="roster-hero"><span className="mark-shell large"><ClubMark name={selectedClub} size={78} /></span><div><p>Plantel oficial</p><h3>{selectedClub}</h3><span>{roster.length} jugadores registrados</span></div></div>{roster.length ? <div className="roster-grid">{roster.map((player) => <article key={player.id}><div className="player-number">{player.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div><h4>{player.name}</h4><p>{player.position}</p></div><dl><div><dt>PJ</dt><dd>{player.appearances}</dd></div><div><dt>G</dt><dd>{player.goals}</dd></div><div><dt>A</dt><dd>{player.assists}</dd></div></dl></article>)}</div> : <div className="empty-state"><UsersRound /><h3>Plantel por publicar</h3><p>No hay una nómina pública cargada para este club y categoría.</p></div>}</div>;
  }
  if (!clubs.length) return <div className="empty-state"><UsersRound /><h3>Clubes por publicar</h3><p>No hay clubes confirmados para esta categoría.</p></div>;
  return <div className="club-grid">{clubs.map((club) => { const count = players.filter((player) => player.club === club.name).length; return <button type="button" key={club.id} onClick={() => onSelect(club.name)}><span className="mark-shell large"><ClubMark name={club.name} size={70} /></span><span><strong>{club.name}</strong><small>{count ? `${count} jugadores` : "Plantel por publicar"}</small></span><ArrowRight /></button>; })}</div>;
}

function ImageLogo() {
  return <span className="footer-brand">LIFI<span>.</span></span>;
}
