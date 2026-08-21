"use client";

import { CalendarDays, Clock3, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ClubMark } from "@/components/club-mark";
import { groupMatchesByRound, scheduledWeek } from "@/lib/fixtures";
import type { Match, MatchEvent, Player } from "@/types/domain";
import styles from "@/components/fixture-list.module.css";

export function FixtureList({ matches, editable }: { matches: Match[]; players?: Player[]; editable?: (match: Match) => React.ReactNode }) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (!selectedMatch) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedMatch(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedMatch]);

  if (!matches.length) return <div className="empty-state"><CalendarDays /><h3>Aún no hay partidos</h3><p>La información se publicará cuando esté confirmada.</p></div>;

  return <>
    <div className="rounds">{groupMatchesByRound(matches).map(([round, roundMatches]) => (
      <section className="round" key={round} aria-labelledby={`fecha-${round}`}>
        <div className="round-title"><span /><h3 id={`fecha-${round}`}>{roundMatches[0]?.roundLabel ?? `Fecha ${round}`}</h3><span /></div>
        <div className="match-grid">{roundMatches.map((match) => editable ? editable(match) : (
          <button type="button" className={styles.clickableCard} key={match.id} onClick={() => setSelectedMatch(match)} aria-label={`Ver detalle de ${match.home} contra ${match.away}`}>
            <MatchCard match={match} />
          </button>
        ))}</div>
      </section>
    ))}</div>
    {selectedMatch && <MatchDetail match={selectedMatch} onClose={() => setSelectedMatch(null)} />}
  </>;
}

export function MatchCard({ match }: { match: Match }) {
  const played = match.status === "played" && match.homeScore !== null && match.awayScore !== null;
  const hasPenalties = match.homePenalties != null && match.awayPenalties != null;
  const dateLabel = match.date ?? scheduledWeek(match) ?? "Por definir";
  return (
    <article className="match-card">
      <div className="match-teams">
        <div><span className="mark-shell"><ClubMark name={match.home} size={50} /></span><strong>{match.home}</strong></div>
        <div className="score" aria-label={played ? `${match.homeScore} a ${match.awayScore}${hasPenalties ? `, penales ${match.homePenalties} a ${match.awayPenalties}` : ""}` : "Partido programado"}>
          {played ? <><b>{match.homeScore}{hasPenalties ? ` (${match.homePenalties})` : ""}</b><span>–</span><b>{hasPenalties ? `(${match.awayPenalties}) ` : ""}{match.awayScore}</b></> : <span>VS</span>}
        </div>
        <div><span className="mark-shell"><ClubMark name={match.away} size={50} /></span><strong>{match.away}</strong></div>
      </div>
      <dl className="match-meta">
        <div><CalendarDays /><dt className="sr-only">Fecha</dt><dd>{dateLabel}</dd></div>
        <div><Clock3 /><dt className="sr-only">Hora</dt><dd>{match.time ?? "Por definir"}</dd></div>
        <div><MapPin /><dt className="sr-only">Cancha</dt><dd>{match.venue ?? "Por definir"}</dd></div>
      </dl>
    </article>
  );
}

function MatchDetail({ match, onClose }: { match: Match; onClose: () => void }) {
  const played = match.status === "played" && match.homeScore !== null && match.awayScore !== null;
  const hasPenalties = match.homePenalties != null && match.awayPenalties != null;
  const events = match.events ?? [];
  const dateLabel = match.date ?? scheduledWeek(match) ?? "Por definir";

  return <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-label={`Detalle de ${match.home} contra ${match.away}`}>
      <div className={styles.header}><span>{match.roundLabel ?? `Fecha ${match.round}`} · Información del partido</span><button className={styles.close} type="button" onClick={onClose} aria-label="Cerrar detalle"><X /></button></div>
      <div className={styles.scoreboard}>
        <div className={styles.team}><span className="mark-shell large"><ClubMark name={match.home} size={72} /></span><strong>{match.home}</strong></div>
        <div className={styles.bigScore}>{played ? <><b>{match.homeScore}</b><span>–</span><b>{match.awayScore}</b></> : <span>VS</span>}</div>
        <div className={styles.team}><span className="mark-shell large"><ClubMark name={match.away} size={72} /></span><strong>{match.away}</strong></div>
      </div>
      {hasPenalties && <div className={styles.meta}><div><strong>Penales:</strong>&nbsp; {match.home} {match.homePenalties}–{match.awayPenalties} {match.away}</div></div>}
      <div className={styles.meta}>
        <div><CalendarDays /> {dateLabel}</div>
        <div><Clock3 /> {match.time ?? "Por definir"}</div>
        <div><MapPin /> {match.venue ?? "Por definir"}</div>
      </div>
      <div className={styles.section}>
        <h4>Goles y tarjetas</h4>
        {events.length ? <div className={styles.eventList}>{events.map((event) => <EventRow key={event.id} event={event} />)}</div> : <p className={styles.empty}>Aún no hay goleadores/as o tarjetas individualizados para este partido.</p>}
      </div>
    </section>
  </div>;
}

function EventRow({ event }: { event: MatchEvent }) {
  const label = event.type === "goal" ? "Gol" : event.type === "yellow-card" ? "Tarjeta amarilla" : "Tarjeta roja";
  const icon = event.type === "goal" ? "⚽" : event.type === "yellow-card" ? "🟨" : "🟥";
  return <div className={styles.event}><span className={styles.eventIcon} aria-hidden="true">{icon}</span><div><strong>{event.player}</strong><small>{label} · {event.team}</small></div><span className={styles.minute}>{typeof event.minute === "number" ? `${event.minute}′` : ""}</span></div>;
}
