"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { organization, watch, entityPath } from "@/lib/platform/store";
import {
  standings,
  type Fixture,
  type Team,
  type Tournament,
  type Organization,
  type RosterPlayer,
} from "@/lib/platform/model";

export function PublicBoard({ org }: { org: string }) {
  const [league, setLeague] = useState<Organization | null>(null),
    [tournaments, setTournaments] = useState<Tournament[]>([]),
    [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    organization(org)
      .then((value) => {
        if (alive) {
          setLeague(value);
          if (!value) setError("Liga no encontrada.");
        }
      })
      .catch(() => {
        if (alive) setError("No pudimos cargar la liga.");
      });
    const off = watch<Tournament>(
      entityPath(org, "tournaments"),
      setTournaments,
      () => setError("No pudimos cargar los torneos."),
      true,
    );
    return () => {
      alive = false;
      off();
    };
  }, [org]);
  const tournament =
    tournaments.find((t) => t.id === selected) ?? tournaments[0];
  return (
    <main
      className="platform"
      style={
        { "--league-color": league?.color ?? "#126551" } as React.CSSProperties
      }
    >
      <Link href="/">Lifiweb</Link>
      <header className="platform-hero">
        {league?.logoUrl?.startsWith("https://") && (
          <Image
            src={league.logoUrl}
            alt={`Logo de ${league.name}`}
            width={80}
            height={80}
            unoptimized
            referrerPolicy="no-referrer"
          />
        )}
        <p>Resultados oficiales</p>
        <h1>{league?.name ?? "Liga"}</h1>
      </header>
      {error && <p role="alert">{error}</p>}
      <label>
        Torneo
        <select
          value={tournament?.id ?? ""}
          onChange={(e) => setSelected(e.target.value)}
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      {tournament ? (
        <TournamentBoard
          key={tournament.id}
          org={org}
          tournament={tournament}
        />
      ) : (
        <p>No hay torneos publicados.</p>
      )}
      {league && (
        <footer>
          <p>
            Correcciones o retiro de información:{" "}
            <a href={`mailto:${league.contactEmail}`}>{league.contactEmail}</a>
          </p>
          <a href="/privacidad">Privacidad y uso de datos</a>
        </footer>
      )}
    </main>
  );
}
function TournamentBoard({
  org,
  tournament,
}: {
  org: string;
  tournament: Tournament;
}) {
  const [teams, setTeams] = useState<Team[]>([]),
    [matches, setMatches] = useState<Fixture[]>([]),
    [players, setPlayers] = useState<RosterPlayer[]>([]),
    [error, setError] = useState("");
  const [category, setCategory] = useState(tournament.categories[0]);
  useEffect(() => {
    const fail = () =>
      setError("No se pudo actualizar la información. Intenta recargar.");
    const a = watch<Team>(
        entityPath(org, "teams", tournament.id),
        setTeams,
        fail,
      ),
      b = watch<Fixture>(
        entityPath(org, "matches", tournament.id),
        setMatches,
        fail,
      ),
      c = watch<RosterPlayer>(
        entityPath(org, "players", tournament.id),
        setPlayers,
        fail,
        true,
      );
    return () => {
      a();
      b();
      c();
    };
  }, [org, tournament.id]);
  const names = new Map(teams.map((t) => [t.id, t.name]));
  return (
    <>
      <label>
        Categoría
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {tournament.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      <h2>Posiciones</h2>
      <p>
        Victoria: {tournament.winPoints} · Empate: {tournament.drawPoints} ·
        Derrota: {tournament.lossPoints}. Desempate: diferencia de goles y goles
        a favor.
      </p>
      <div className="platform-table">
        <table>
          <thead>
            <tr>
              {["Equipo", "PJ", "PG", "PE", "PP", "GF", "GC", "DG", "PTS"].map(
                (h) => (
                  <th key={h}>{h}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {standings(
              tournament,
              teams.filter((t) => t.category === category),
              matches,
            ).map((r) => (
              <tr key={r.id}>
                <th>{r.name}</th>
                {[
                  r.played,
                  r.won,
                  r.drawn,
                  r.lost,
                  r.gf,
                  r.ga,
                  r.gf - r.ga,
                  r.points,
                ].map((n, i) => (
                  <td key={i}>{n}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Calendario y resultados</h2>
      <details className="platform-card">
        <summary>Planteles publicados</summary>
        {players
          .filter((p) => !p.deleted && p.category === category)
          .map((p) => (
            <p key={p.id}>
              {p.name} · {names.get(p.teamId)}
            </p>
          ))}
      </details>
      <div className="platform-list">
        {matches
          .filter((m) => !m.deleted && m.category === category)
          .sort((a, b) => a.round - b.round || a.date.localeCompare(b.date))
          .map((m) => (
            <article key={m.id}>
              <small>
                Fecha {m.round} · {m.date || "Día por definir"} {m.time} ·{" "}
                {m.venue || "Sede por definir"}
              </small>
              <h3>
                {names.get(m.home) ?? m.home}{" "}
                <strong>
                  {m.status === "played"
                    ? `${m.homeScore} – ${m.awayScore}`
                    : "vs"}
                </strong>{" "}
                {names.get(m.away) ?? m.away}
              </h3>
              <span>
                {
                  {
                    scheduled: "Programado",
                    played: "Jugado",
                    postponed: "Postergado",
                    cancelled: "Cancelado",
                  }[m.status]
                }
              </span>
            </article>
          ))}
      </div>
    </>
  );
}
