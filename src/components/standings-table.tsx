import { ClubMark } from "@/components/club-mark";
import type { Standing } from "@/types/domain";

const stats = [
  ["played", "PJ"], ["won", "PG"], ["drawn", "PE"], ["lost", "PP"],
  ["goalsFor", "GF"], ["goalsAgainst", "GC"], ["goalDifference", "DG"], ["points", "PTS"],
] as const;

export function StandingsTable({ standings, onClub }: { standings: Standing[]; onClub: (club: string) => void }) {
  return (
    <div className="standings-wrap">
      <table className="standings-table">
        <caption className="sr-only">Tabla de posiciones del Torneo Clausura 2026</caption>
        <thead><tr><th>Pos.</th><th>Club</th>{stats.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{standings.map((row, index) => (
          <tr key={row.club.id}>
            <td data-label="Pos.">{index + 1}</td>
            <th scope="row">
              <button className="club-cell" type="button" onClick={() => onClub(row.club.name)}>
                <span className="mark-shell"><ClubMark name={row.club.name} size={42} /></span>
                <span>{row.club.name}</span>
              </button>
            </th>
            {stats.map(([key, label]) => <td key={key} data-label={label} className={key === "points" ? "points" : ""}>{row[key]}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
