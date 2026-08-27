import Image from "next/image";
import {
  Building2,
  CalendarCheck2,
  GraduationCap,
  Medal,
  ShieldCheck,
  Trophy,
  UsersRound,
} from "lucide-react";

const foundingOrganizations = [
  "Unilever",
  "Asociación Chilena de Seguridad (ACHS)",
  "Banco Santander",
  "LAN Chile",
];

const foundingClubs = [
  "Colegio Latinoamericano",
  "Estadio Israelita",
  "Estadio Manquehue",
  "Estadio Español",
];

const foundingTeachers = [
  "Silvio Jara",
  "Mario Gutiérrez",
  "Claudio López",
  "Raúl Tolchinsky",
  "Víctor Kaempfe",
  "Enrique Gracet",
];

const categories = ["Pre-Peque", "Peque", "Mini", "Infantil", "Intermedia"];

const professionalPlayers = [
  "Sebastián Rosenthal",
  "José Luis “Coto” Sierra",
  "José Luis Sánchez",
  "Tito Bichara",
];

const footballFigures = [
  "Roberto Hernández",
  "Héctor Pinto",
  "Luis Hernán Carballo",
  "Jorge Pellicer",
  "Rubén Espinoza",
  "Lalo Vilches",
  "Fernando Astengo",
  "Mariano Puyol",
  "Cate Ibarra",
];

export function LifiHistory() {
  return (
    <section className="lifi-history" id="historia" aria-labelledby="lifi-history-title">
      <div className="lifi-history-shell">
        <div className="lifi-history-hero">
          <figure className="lifi-history-lead-image">
            <Image
              src="/history/lifi-inicios.jpeg"
              alt="Una jornada histórica de la Liga de Fútbol Infantil"
              fill
              sizes="(max-width: 900px) 100vw, 48vw"
            />
            <figcaption>Los primeros años de una liga construida en torno a la cancha.</figcaption>
          </figure>

          <div className="lifi-history-lead-copy">
            <p className="eyebrow"><span /> Historia LIFI</p>
            <h2 id="lifi-history-title">Más de cuatro décadas formando comunidad</h2>
            <p className="lifi-history-summary">
              La Liga de Fútbol Infantil comenzó a gestarse en 1985 por iniciativa de un grupo
              de profesores amigos. En sus inicios organizaron partidos amistosos entre las
              instituciones y colegios donde trabajaban. Esa idea sencilla se transformó, con
              el tiempo, en una gran liga de fútbol infantil.
            </p>
            <div className="lifi-history-milestones" aria-label="Hitos de LIFI">
              <div><strong>1985</strong><span>Año de origen</span></div>
              <div><strong>5</strong><span>Categorías actuales</span></div>
              <div><strong>+40</strong><span>Años de trayectoria</span></div>
            </div>
          </div>
        </div>

        <div className="lifi-history-origin">
          <article className="lifi-history-card">
            <span className="lifi-history-icon"><Building2 /></span>
            <div>
              <p className="lifi-history-kicker">Instituciones fundadoras</p>
              <h3>El punto de encuentro</h3>
              <p>
                Empresas, instituciones, colegios y clubes sociales o deportivos dieron vida
                a los primeros encuentros de la liga.
              </p>
              <div className="lifi-history-list-columns">
                <div>
                  <strong>Empresas e instituciones</strong>
                  <ul>{foundingOrganizations.map((name) => <li key={name}>{name}</li>)}</ul>
                </div>
                <div>
                  <strong>Colegios y clubes</strong>
                  <ul>{foundingClubs.map((name) => <li key={name}>{name}</li>)}</ul>
                </div>
              </div>
            </div>
          </article>

          <article className="lifi-history-card lifi-history-teachers">
            <span className="lifi-history-icon"><GraduationCap /></span>
            <div>
              <p className="lifi-history-kicker">Profesores impulsores</p>
              <h3>Quienes dieron el primer paso</h3>
              <p>
                La dedicación de este grupo fue decisiva para el desarrollo inicial de LIFI.
                Después de ellos, numerosos docentes y entrenadores continuaron fortaleciendo
                su estructura.
              </p>
              <ul className="lifi-history-name-grid">
                {foundingTeachers.map((name) => <li key={name}>{name}</li>)}
              </ul>
            </div>
          </article>
        </div>

        <div className="lifi-history-evolution">
          <div className="lifi-history-evolution-copy">
            <p className="lifi-history-kicker">Crecimiento y participación</p>
            <h3>De los amistosos a una competencia estructurada</h3>
            <p>
              Con el paso de los años, la organización incorporó procesos formales de
              inscripción, carnés de jugadores y categorías infantiles y juveniles. La
              categoría Pre-Peque fue la última en sumarse, al reconocer el potencial de los
              niños más pequeños y sus ganas de participar en la competencia.
            </p>
            <div className="lifi-history-categories" aria-label="Categorías LIFI">
              {categories.map((category) => <span key={category}>{category}</span>)}
            </div>
          </div>

          <article className="lifi-history-cup-card">
            <span><Trophy /></span>
            <p>LIFI Cup</p>
            <h3>Más espacio para competir y crecer</h3>
            <p>
              La LIFI Cup nació como una competencia paralela, inspirada en el formato de la
              Copa Chile, para dar mayor participación y rodaje a quienes tienen menos
              presencia en la competencia oficial.
            </p>
          </article>
        </div>

        <div className="lifi-history-legacy">
          <div className="lifi-history-gallery" aria-label="Galería histórica de LIFI">
            <figure>
              <Image
                src="/history/lifi-premiacion.jpeg"
                alt="Ceremonia de premiación de la Liga de Fútbol Infantil"
                fill
                sizes="(max-width: 768px) 100vw, 32vw"
              />
              <figcaption>Premiaciones que celebran el esfuerzo de cada temporada.</figcaption>
            </figure>
            <figure>
              <Image
                src="/history/lifi-trofeos.jpeg"
                alt="Trofeos preparados para una premiación de LIFI"
                fill
                sizes="(max-width: 768px) 100vw, 32vw"
              />
              <figcaption>Copas que representan años de competencia y compromiso.</figcaption>
            </figure>
          </div>

          <div className="lifi-history-legacy-copy">
            <p className="lifi-history-kicker">Un legado que trasciende la cancha</p>
            <h3>Una plataforma de desarrollo</h3>
            <p>
              Por la liga pasaron deportistas que llegaron al profesionalismo y reconocidas
              figuras que participaron en sus procesos técnicos.
            </p>
            <div className="lifi-history-people-group">
              <h4><Medal /> Jugadores que llegaron al profesionalismo</h4>
              <p>{professionalPlayers.join(", ")}, entre otros.</p>
            </div>
            <div className="lifi-history-people-group">
              <h4><UsersRound /> Entrenadores y figuras del fútbol profesional</h4>
              <p>{footballFigures.join(", ")}.</p>
            </div>
          </div>
        </div>

        <div className="lifi-history-commitment">
          <span><CalendarCheck2 /></span>
          <div>
            <p className="lifi-history-kicker">Organización y continuidad</p>
            <h3>Un trabajo que se renueva cada lunes</h3>
            <p>
              La permanencia de LIFI no es fruto del azar, sino de un trabajo profesional
              adaptado al desarrollo deportivo infantil. Cada lunes, los delegados de las
              instituciones se reúnen para evaluar la jornada del fin de semana, compartir
              observaciones y responder de inmediato a los requerimientos de la liga.
            </p>
          </div>
          <ShieldCheck aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
