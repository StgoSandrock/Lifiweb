import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { ClubMark } from "@/components/club-mark";
import { groupMatchesByRound, scheduledWeek } from "@/lib/fixtures";
import type { Match } from "@/types/domain";

export function FixtureList({ matches, editable }: { matches: Match[]; editable?: (match: Match) => React.ReactNode }) {
  if (!matches.length) return <div className="empty-state"><CalendarDays /><h3>Aún no hay partidos</h3><p>La información se publicará cuando esté confirmada.</p></div>;
  return <div className="rounds">{groupMatchesByRound(matches).map(([round, roundMatches]) => (
    <section className="round" key={round} aria-labelledby={`fecha-${round}`}>
      <div className="round-title"><span /><h3 id={`fecha-${round}`}>{roundMatches[0]?.roundLabel ?? `Fecha ${round}`}</h3><span /></div>
      <div className="match-grid">{roundMatches.map((match) => editable ? editable(match) : <MatchCard match={match} key={match.id} />)}</div>
    </section>
  ))}</div>;
}

export function MatchCard({ match }: { match: Match }) {
  const played = match.status === "played" && match.homeScore !== null && match.awayScore !== null;
  const dateLabel = match.date ?? scheduledWeek(match) ?? "Por definir";
  return (
    <article className="match-card">
      <div className="match-teams">
        <div><span className="mark-shell"><ClubMark name={match.home} size={50} /></span><strong>{match.home}</strong></div>
        <div className="score" aria-label={played ? `${match.homeScore} a ${match.awayScore}` : "Partido programado"}>
          {played ? <><b>{match.homeScore}</b><span>–</span><b>{match.awayScore}</b></> : <span>VS</span>}
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
