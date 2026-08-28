import Image from "next/image";

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
        <header className="lifi-history-heading">
          <p>Historia de LIFI</p>
          <h2 id="lifi-history-title">Formando jugadores desde 1985</h2>
          <div className="lifi-history-heading-meta" aria-label="Datos principales de LIFI">
            <span>41 años de trayectoria</span>
            <span>Cinco categorías</span>
            <span>Santiago de Chile</span>
          </div>
        </header>

        <div className="lifi-history-introduction">
          <figure className="lifi-history-lead-image">
            <Image
              src="/history/lifi-inicios.jpeg"
              alt="Profesores y dirigentes de LIFI reunidos junto a una cancha"
              fill
              sizes="(max-width: 900px) 100vw, 54vw"
            />
            <figcaption>Una jornada de los primeros años de la Liga de Fútbol Infantil.</figcaption>
          </figure>

          <div className="lifi-history-intro-copy">
            <p className="lifi-history-year">1985</p>
            <h3>Los primeros partidos</h3>
            <p>
              La Liga de Fútbol Infantil comenzó a gestarse por iniciativa de un grupo de
              profesores amigos. Al principio organizaron partidos amistosos entre las
              instituciones y colegios donde trabajaban.
            </p>
            <p>
              Esos encuentros dieron origen a una competencia que, con el paso de los años,
              sumó nuevas categorías, clubes y generaciones de jugadores.
            </p>
          </div>
        </div>

        <div className="lifi-history-founders">
          <div className="lifi-history-founders-copy">
            <p className="lifi-history-label">Los fundadores</p>
            <h3>Personas e instituciones que dieron el primer paso</h3>
            <p>
              El desarrollo inicial fue posible gracias al trabajo de profesores vinculados
              a empresas, colegios y clubes deportivos de Santiago.
            </p>
          </div>

          <div className="lifi-history-founders-lists">
            <div>
              <h4>Profesores impulsores</h4>
              <ul>{foundingTeachers.map((name) => <li key={name}>{name}</li>)}</ul>
            </div>
            <div>
              <h4>Empresas e instituciones</h4>
              <ul>{foundingOrganizations.map((name) => <li key={name}>{name}</li>)}</ul>
            </div>
            <div>
              <h4>Colegios y clubes</h4>
              <ul>{foundingClubs.map((name) => <li key={name}>{name}</li>)}</ul>
            </div>
          </div>
        </div>

        <div className="lifi-history-timeline" aria-label="Etapas de la historia de LIFI">
          <article>
            <p>Los inicios</p>
            <h3>Amistosos entre instituciones</h3>
            <p>Los profesores organizaron los primeros encuentros en los lugares donde trabajaban.</p>
          </article>
          <article>
            <p>El crecimiento</p>
            <h3>Una liga con cinco categorías</h3>
            <p>
              La organización incorporó inscripciones, carnés y las categorías Pre-Peque,
              Peque, Mini, Infantil e Intermedia.
            </p>
          </article>
          <article>
            <p>LIFI Cup</p>
            <h3>Más minutos para competir</h3>
            <p>
              La copa nació como una competencia paralela para ampliar la participación y el
              rodaje de los jugadores.
            </p>
          </article>
          <article>
            <p>En la actualidad</p>
            <h3>Una organización que se reúne cada lunes</h3>
            <p>
              Los delegados revisan cada fecha, comparten observaciones y resuelven los
              requerimientos de la liga.
            </p>
          </article>
        </div>

        <div className="lifi-history-gallery" aria-label="Fotografías de la historia de LIFI">
          <figure>
            <Image
              src="/history/lifi-premiacion.jpeg"
              alt="Dirigentes de LIFI junto a los trofeos de una premiación"
              fill
              sizes="(max-width: 768px) 100vw, 56vw"
            />
            <figcaption>Una ceremonia de premiación de LIFI.</figcaption>
          </figure>
          <figure>
            <Image
              src="/history/lifi-trofeos.jpeg"
              alt="Copas preparadas para una premiación de LIFI"
              fill
              sizes="(max-width: 768px) 100vw, 38vw"
            />
            <figcaption>Trofeos de distintas temporadas.</figcaption>
          </figure>
        </div>

        <div className="lifi-history-legacy">
          <p className="lifi-history-label">El legado</p>
          <h3>Una historia que continúa en la cancha</h3>
          <div className="lifi-history-legacy-columns">
            <div>
              <h4>Jugadores que llegaron al profesionalismo</h4>
              <p>{professionalPlayers.join(", ")}, entre otros.</p>
            </div>
            <div>
              <h4>Entrenadores y figuras del fútbol profesional</h4>
              <p>{footballFigures.join(", ")}.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
