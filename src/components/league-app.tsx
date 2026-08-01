"use client";

import { ArrowRight, BarChart3, CalendarRange, ChevronLeft, CircleAlert, LoaderCircle, Trophy, UsersRound, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORIES, CLUBS, SEASON } from "@/config/league";
import { FixtureList } from "@/components/fixture-list";
import { ClubMark } from "@/components/club-mark";
import { StandingsTable } from "@/components/standings-table";
import { SiteHeader } from "@/components/site-header";
import { calculateStandings } from "@/lib/standings";
import { useLeagueData } from "@/hooks/use-league-data";
import type { CategoryId, Competition } from "@/types/domain";

type View = "standings" | "fixture" | "clubs";

export function LeagueApp() {
  const { matches, players, status, error } = useLeagueData();
  const [competition, setCompetition] = useState<Competition>("league");
  const [category, setCategory] = useState<CategoryId>("pre-peque");
  const [view, setView] = useState<View>("standings");
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const hasCup = matches.some((match) => match.competition === "cup");
  const filteredMatches = useMemo(() => matches.filter((match) => match.competition === competition && match.category === category), [matches, competition, category]);
  const filteredPlayers = useMemo(() => players.filter((player) => player.competition === competition && player.category === category), [players, competition, category]);
  const standings = useMemo(() => calculateStandings(filteredMatches), [filteredMatches]);
  const scorers = useMemo(() => [...filteredPlayers].filter((player) => player.goals > 0).sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name, "es")).slice(0, 5), [filteredPlayers]);

  function selectCompetition(value: Competition) {
    setCompetition(value);
    setSelectedClub(null);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Temporada {SEASON} · Torneo Clausura</p>
            <h1>La cancha donde <em>crecen</em> los equipos.</h1>
            <p>Fixture, posiciones y planteles oficiales de la Liga Infantil de Fútbol Interestadios.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#fixture" onClick={() => setView("fixture")}>Ver fixture <ArrowRight /></a>
              <a className="secondary-button" href="#posiciones" onClick={() => setView("standings")}>Tabla de posiciones</a>
            </div>
          </div>
          <div className="hero-scoreboard" aria-label="Resumen de la Liga">
            <div className="scoreboard-top"><span>Clausura 2026</span><span className={status === "live" ? "live-dot" : "sync-dot"}>{status === "live" ? "En vivo" : "Sincronizando"}</span></div>
            <strong>9</strong><p>fechas por categoría</p>
            <div className="scoreboard-stats"><span><b>10</b> clubes</span><span><b>5</b> categorías</span><span><b>225</b> partidos</span></div>
          </div>
        </section>

        {error && <div className="connection-alert" role="status"><WifiOff /><span><strong>Modo respaldo</strong>{error}</span></div>}
        {status === "loading" && <div className="loading-line" role="status"><LoaderCircle /> Cargando información oficial…</div>}

        <section className="league-controls" aria-label="Filtros de competencia">
          <div className="competition-switch" role="group" aria-label="Competencia">
            <button type="button" className={competition === "league" ? "active" : ""} onClick={() => selectCompetition("league")}><Trophy /> Liga · Clausura</button>
            {hasCup && <button type="button" className={competition === "cup" ? "active" : ""} onClick={() => selectCompetition("cup")}><Trophy /> LIFI Cup</button>}
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

          {view === "standings" && <div className="two-column"><StandingsTable standings={standings} onClub={(club) => { setSelectedClub(club); setView("clubs"); }} /><aside className="scorers"><p className="eyebrow"><span /> Goleadores</p><h3>Máximos anotadores</h3>{scorers.length ? <ol>{scorers.map((player, index) => <li key={player.id}><b>{index + 1}</b><span><strong>{player.name}</strong><small>{player.club}</small></span><em>{player.goals}</em></li>)}</ol> : <div className="mini-empty"><CircleAlert /><p>Las estadísticas comenzarán cuando existan resultados oficiales.</p></div>}</aside></div>}
          {view === "fixture" && <FixtureList matches={filteredMatches} />}
          {view === "clubs" && <ClubRosters players={filteredPlayers} selectedClub={selectedClub} onSelect={setSelectedClub} />}
        </section>
      </main>
      <footer className="site-footer"><div><ImageLogo /><p>Liga Infantil de Fútbol Interestadios · Santiago de Chile</p></div><p>Temporada {SEASON} · Información oficial en actualización</p></footer>
    </>
  );
}

function ClubRosters({ players, selectedClub, onSelect }: { players: ReturnType<typeof useLeagueData>["players"]; selectedClub: string | null; onSelect: (club: string | null) => void }) {
  if (selectedClub) {
    const roster = players.filter((player) => player.club === selectedClub).sort((a, b) => a.name.localeCompare(b.name, "es"));
    return <div className="roster-view"><button className="back-button" type="button" onClick={() => onSelect(null)}><ChevronLeft /> Volver a clubes</button><div className="roster-hero"><span className="mark-shell large"><ClubMark name={selectedClub} size={78} /></span><div><p>Plantel oficial</p><h3>{selectedClub}</h3><span>{roster.length} jugadores registrados</span></div></div>{roster.length ? <div className="roster-grid">{roster.map((player) => <article key={player.id}><div className="player-number">{player.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div><h4>{player.name}</h4><p>{player.position}</p></div><dl><div><dt>PJ</dt><dd>{player.appearances}</dd></div><div><dt>G</dt><dd>{player.goals}</dd></div><div><dt>A</dt><dd>{player.assists}</dd></div></dl></article>)}</div> : <div className="empty-state"><UsersRound /><h3>Plantel por publicar</h3><p>No hay una nómina pública cargada para este club y categoría.</p></div>}</div>;
  }
  return <div className="club-grid">{CLUBS.map((club) => { const count = players.filter((player) => player.club === club.name).length; return <button type="button" key={club.id} onClick={() => onSelect(club.name)}><span className="mark-shell large"><ClubMark name={club.name} size={70} /></span><span><strong>{club.name}</strong><small>{count ? `${count} jugadores` : "Plantel por publicar"}</small></span><ArrowRight /></button>; })}</div>;
}

function ImageLogo() {
  return <span className="footer-brand">LIFI<span>.</span></span>;
}
