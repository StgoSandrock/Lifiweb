import Image from "next/image";
import { Award, Goal, ShieldCheck } from "lucide-react";

const tournaments = [
  {
    name: "Apertura 2026",
    silver: "Palestino B",
    gold: ["Country Club A", "Stadio Italiano", "Club Manquehue"],
    scorer: "Paula Jaque · Equipo Médico",
    goalkeeper: "Yasmin Hum · Club Manquehue",
    goalkeeperLabel: "Mejor arquera",
  },
  {
    name: "Apertura 2025",
    silver: "Estadio Italiano",
    gold: ["Country Club A", "Club Manquehue", "Equipo Médico"],
    scorer: "Paula Jaque · Equipo Médico",
    goalkeeper: "María Ignacia Quezada · Club Manquehue",
    goalkeeperLabel: "Valla menos batida",
  },
  {
    name: "Clausura 2025",
    silver: "Palestino A",
    gold: ["Manquehue", "Equipo Médico", "Country Club A"],
    scorer: "Paula Jaque · Equipo Médico",
    goalkeeper: "Emilia Díaz · Country Club A",
    goalkeeperLabel: "Valla menos batida",
  },
];

export function LffHistory() {
  return (
    <section className="lff-history" id="historia" aria-labelledby="lff-history-title">
      <div className="lff-history-image">
        <Image src="/lff/trofeos.jpeg" alt="Trofeos de la Liga Femenina LFF" fill sizes="(max-width: 900px) 100vw, 48vw" />
      </div>
      <div className="lff-history-copy">
        <p className="eyebrow"><span /> Historia LFF</p>
        <h2 id="lff-history-title">Una liga que reconoce a sus protagonistas</h2>
        <p className="lff-history-intro">La historia de LFF reconoce las copas de Oro y Plata, el rendimiento colectivo, a la goleadora y a la mejor arquera de cada torneo.</p>
        <div className="lff-history-tournaments">
          {tournaments.map((tournament) => (
            <article key={tournament.name}>
              <h3><Award /> {tournament.name}</h3>
              <dl>
                <div><dt>Copa de Plata</dt><dd>1º {tournament.silver}</dd></div>
                <div><dt>Copa de Oro</dt><dd>{tournament.gold.map((club, index) => <span key={club}>{index + 1}º {club}</span>)}</dd></div>
                <div><dt><Goal /> Goleadora</dt><dd>{tournament.scorer}</dd></div>
                <div><dt><ShieldCheck /> {tournament.goalkeeperLabel}</dt><dd>{tournament.goalkeeper}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
