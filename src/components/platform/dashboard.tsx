"use client";
import Link from "next/link";
import {
  onAuthStateChanged,
  sendEmailVerification,
  signOut,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebase/client";
import { isStaffUser } from "@/lib/firebase/staff";
import {
  createOrganization,
  updateOrganization,
  entityPath,
  getArchive,
  importArchive,
  membership,
  organization,
  saveEntity,
  saveMember,
  watch,
} from "@/lib/platform/store";
import {
  matchesCsv,
  parseArchive,
  type Archive,
  type Fixture,
  type Member,
  type Organization,
  type RosterPlayer,
  type Season,
  type Team,
  type Tournament,
  type Versioned,
} from "@/lib/platform/model";
import { PlatformAuth } from "./auth";
import { CategorySelect, Field, Form, MatchForm } from "./forms";

function download(name: string, content: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const text = (data: FormData, key: string) => String(data.get(key) ?? "");
export function PlatformDashboard() {
  const [user, setUser] = useState<User | null>(null),
    [checking, setChecking] = useState(true),
    [canCreate, setCanCreate] = useState(false),
    [org, setOrg] = useState("");
  const [message, setMessage] = useState("");
  useEffect(
    () =>
      onAuthStateChanged(firebaseAuth, (candidate) => {
        setUser(candidate);
        setChecking(false);
        setCanCreate(false);
        if (candidate?.emailVerified)
          isStaffUser(candidate)
            .then(setCanCreate)
            .catch(() => setCanCreate(false));
      }),
    [],
  );
  return (
    <main className="platform">
      <nav className="platform-actions">
        <Link href="/">Lifiweb</Link>
        <a href="/staff">Staff LIFI actual</a>
        <a href="/privacidad">Privacidad</a>
        {user && (
          <button className="subtle" onClick={() => signOut(firebaseAuth)}>
            Cerrar sesión
          </button>
        )}
      </nav>
      <header className="platform-hero">
        <p>Administración de ligas</p>
        <h1>Tu liga, temporada a temporada.</h1>
        <p>
          Organiza torneos, equipos y resultados con acceso por responsabilidad.
        </p>
      </header>
      {checking ? (
        <p>Verificando sesión…</p>
      ) : !user ? (
        <PlatformAuth />
      ) : !user.emailVerified ? (
        <section className="platform-card">
          <h2>Verifica tu correo</h2>
          <p>Revisa el enlace de verificación y vuelve a ingresar.</p>
          <button
            onClick={async () => {
              try {
                await sendEmailVerification(user);
                setMessage("Correo de verificación enviado.");
              } catch {
                setMessage("No se pudo enviar. Inténtalo más tarde.");
              }
            }}
          >
            Reenviar verificación
          </button>
        </section>
      ) : (
        <>
          <Form
            title="Abrir una liga"
            submit={async (data) => {
              setOrg(text(data, "org").trim().toLowerCase());
            }}
          >
            <Field name="org" label="Identificador de liga" value={org} />
          </Form>
          {canCreate && (
            <details className="platform-card">
              <summary>Crear una liga</summary>
              <Form
                title="Datos de la liga"
                submit={async (data) => {
                  const id = text(data, "id");
                  await createOrganization({
                    id,
                    name: text(data, "name"),
                    contactEmail: text(data, "email"),
                    color: text(data, "color"),
                    ownerUid: user.uid,
                  });
                  setOrg(id);
                }}
              >
                <Field
                  name="id"
                  label="Identificador único (ejemplo: liga-del-sur)"
                />
                <Field name="name" label="Nombre" />
                <Field
                  name="email"
                  label="Correo público para solicitudes y correcciones"
                  type="email"
                />
                <Field
                  name="color"
                  label="Color de la liga"
                  type="color"
                  value="#126551"
                />
              </Form>
            </details>
          )}
          {org && <LeagueAdmin key={`${org}-${user.uid}`} org={org} />}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </main>
  );
}
function LeagueAdmin({ org }: { org: string }) {
  const [league, setLeague] = useState<Organization | null>(null),
    [member, setMember] = useState<Member | null>(null),
    [error, setError] = useState("");
  const [seasons, setSeasons] = useState<Versioned<Season>[]>([]),
    [tournaments, setTournaments] = useState<Versioned<Tournament>[]>([]),
    [selected, setSelected] = useState("");
  useEffect(() => {
    let live = true;
    const offs: (() => void)[] = [];
    Promise.all([organization(org), membership(org)])
      .then(([o, m]) => {
        if (!live) return;
        if (o?.ownerUid === firebaseAuth.currentUser?.uid)
          m = {
            email: firebaseAuth.currentUser?.email ?? "",
            role: "admin",
            teamId: "",
            active: true,
          };
        if (!o || !m?.active) {
          setError(
            "No tienes acceso activo a esta liga. Solicita al administrador que habilite tu correo.",
          );
          return;
        }
        setLeague(o);
        setMember(m);
        offs.push(
          watch<Versioned<Season>>(
            entityPath(org, "seasons"),
            setSeasons,
            (e) => setError(e.message),
          ),
          watch<Versioned<Tournament>>(
            entityPath(org, "tournaments"),
            setTournaments,
            (e) => setError(e.message),
          ),
        );
      })
      .catch(() => {
        if (live)
          setError(
            "No se pudo abrir la liga. Comprueba el identificador y la conexión.",
          );
      });
    return () => {
      live = false;
      offs.forEach((off) => off());
    };
  }, [org]);
  const admin = member?.role === "admin",
    tournament = tournaments.find((t) => t.id === selected) ?? tournaments[0];
  if (!league || !member)
    return <p role="status">{error || "Abriendo liga…"}</p>;
  return (
    <>
      <header className="platform-heading">
        <div>
          <h2>{league.name}</h2>
          <p>
            Tu acceso:{" "}
            {
              {
                admin: "Administrador",
                editor: "Editor de resultados",
                club: "Encargado de club",
              }[member.role]
            }
          </p>
        </div>
        <a href={`/organizacion/${org}`} target="_blank" rel="noreferrer">
          Ver página pública ↗
        </a>
      </header>
      {error && <p role="alert">{error}</p>}
      {admin && (
        <details className="platform-card">
          <summary>Identidad y contacto de la liga</summary>
          <Form
            title="Información pública"
            submit={async (d) => {
              const next = {
                ...league,
                name: text(d, "name"),
                contactEmail: text(d, "email"),
                color: text(d, "color"),
                logoUrl: text(d, "logoUrl"),
              };
              await updateOrganization(next);
              setLeague(next);
            }}
          >
            <Field name="name" label="Nombre de la liga" value={league.name} />
            <Field
              name="email"
              label="Correo público"
              type="email"
              value={league.contactEmail}
            />
            <Field
              name="color"
              label="Color"
              type="color"
              value={league.color}
            />
            <Field
              name="logoUrl"
              label="Dirección HTTPS del logo"
              type="url"
              value={league.logoUrl ?? ""}
              required={false}
            />
          </Form>
        </details>
      )}
      {admin && (
        <div className="platform-grid">
          <Form
            title="Nueva temporada"
            submit={async (d) =>
              saveEntity(
                org,
                "seasons",
                { id: text(d, "id"), name: text(d, "name"), archived: false },
                null,
              )
            }
          >
            <Field name="id" label="Identificador (ejemplo: apertura-2027)" />
            <Field name="name" label="Nombre de temporada" />
          </Form>
          <Form
            title="Nuevo torneo"
            disabled={!seasons.some((s) => !s.archived)}
            submit={async (d) =>
              saveEntity(
                org,
                "tournaments",
                {
                  id: text(d, "id"),
                  seasonId: text(d, "seasonId"),
                  name: text(d, "name"),
                  categories: text(d, "categories")
                    .split(",")
                    .map((s) => s.trim()),
                  winPoints: Number(d.get("win")),
                  drawPoints: Number(d.get("draw")),
                  lossPoints: Number(d.get("loss")),
                  published: false,
                },
                null,
              )
            }
          >
            <Field name="id" label="Identificador de torneo" />
            <Field name="name" label="Nombre de torneo" />
            <label>
              Temporada
              <select name="seasonId">
                {seasons
                  .filter((s) => !s.archived)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <Field name="categories" label="Categorías separadas por coma" />
            <div className="platform-grid">
              <Field
                name="win"
                label="Puntos victoria"
                type="number"
                value={3}
              />
              <Field
                name="draw"
                label="Puntos empate"
                type="number"
                value={1}
              />
              <Field
                name="loss"
                label="Puntos derrota"
                type="number"
                value={0}
              />
            </div>
          </Form>
        </div>
      )}
      {admin && (
        <details className="platform-card">
          <summary>Temporadas y archivo</summary>
          {seasons.map((s) => (
            <div className="platform-row" key={s.id}>
              <span>
                {s.name} · {s.archived ? "Archivada" : "Abierta"}
              </span>
              <button
                onClick={async () => {
                  try {
                    await saveEntity(
                      org,
                      "seasons",
                      { ...s, archived: !s.archived },
                      s.version,
                    );
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                {s.archived ? "Reabrir" : "Archivar"}
              </button>
            </div>
          ))}
          <p>
            Las temporadas archivadas conservan su información y bloquean la
            edición de equipos, jugadores y partidos.
          </p>
        </details>
      )}
      <label>
        Torneo
        <select
          value={tournament?.id ?? ""}
          onChange={(e) => setSelected(e.target.value)}
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.published ? "Publicado" : "Borrador"}
            </option>
          ))}
        </select>
      </label>
      {tournament ? (
        <TournamentAdmin
          key={tournament.id}
          org={org}
          tournament={tournament}
          member={member}
          archived={
            seasons.find((s) => s.id === tournament.seasonId)?.archived ?? true
          }
        />
      ) : (
        <p>Crea una temporada y su primer torneo para comenzar.</p>
      )}
      {admin && (
        <>
          <Members org={org} />
          <Audit org={org} />
        </>
      )}
    </>
  );
}
function TournamentAdmin({
  org,
  tournament,
  member,
  archived,
}: {
  org: string;
  tournament: Versioned<Tournament>;
  member: Member;
  archived: boolean;
}) {
  const [teams, setTeams] = useState<Versioned<Team>[]>([]),
    [matches, setMatches] = useState<Versioned<Fixture>[]>([]),
    [players, setPlayers] = useState<Versioned<RosterPlayer>[]>([]),
    [error, setError] = useState("");
  const [editing, setEditing] = useState<Versioned<Fixture> | "new" | null>(
      null,
    ),
    [preview, setPreview] = useState<Archive | null>(null),
    [busy, setBusy] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Versioned<Team> | null>(null),
    [editingPlayer, setEditingPlayer] =
      useState<Versioned<RosterPlayer> | null>(null);
  const admin = member.role === "admin",
    editor = admin || member.role === "editor";
  useEffect(() => {
    const fail = () =>
      setError(
        "No se pudieron cargar todos los datos. Revisa la conexión antes de editar.",
      );
    const offs = [
      watch<Versioned<Team>>(
        entityPath(org, "teams", tournament.id),
        setTeams,
        fail,
      ),
      watch<Versioned<Fixture>>(
        entityPath(org, "matches", tournament.id),
        setMatches,
        fail,
      ),
    ];
    offs.push(
      watch<Versioned<RosterPlayer>>(
        entityPath(org, "players", tournament.id),
        setPlayers,
        fail,
        false,
        member.role === "club" ? member.teamId : undefined,
      ),
    );
    return () => offs.forEach((off) => off());
  }, [org, tournament.id, member.role, member.teamId]);
  const names = new Map(teams.map((t) => [t.id, t.name]));
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h2>{tournament.name}</h2>
      {archived && <p>Temporada archivada. Reábrela para editar.</p>}
      {error && (
        <p role="alert" className="platform-error">
          {error}
        </p>
      )}
      {admin && (
        <div className="platform-actions">
          <button
            disabled={busy}
            onClick={() =>
              action(() =>
                saveEntity(
                  org,
                  "tournaments",
                  { ...tournament, published: !tournament.published },
                  tournament.version,
                ),
              )
            }
          >
            {tournament.published
              ? "Retirar de la página pública"
              : "Publicar torneo"}
          </button>
          <button
            disabled={busy}
            onClick={() =>
              action(async () => {
                download(
                  `${org}-${tournament.id}.json`,
                  JSON.stringify(await getArchive(org, tournament.id), null, 2),
                );
              })
            }
          >
            Exportar torneo JSON
          </button>
          <button
            onClick={() =>
              download(
                `${tournament.id}.csv`,
                matchesCsv(matches, teams),
                "text/csv;charset=utf-8",
              )
            }
          >
            Exportar resultados CSV
          </button>
        </div>
      )}
      {admin && (
        <details className="platform-card">
          <summary>Nombre y puntuación</summary>
          <Form
            title="Configuración del torneo"
            submit={async (d) =>
              saveEntity(
                org,
                "tournaments",
                {
                  ...tournament,
                  name: text(d, "name"),
                  winPoints: Number(d.get("win")),
                  drawPoints: Number(d.get("draw")),
                  lossPoints: Number(d.get("loss")),
                },
                tournament.version,
              )
            }
          >
            <Field name="name" label="Nombre" value={tournament.name} />
            <Field
              name="win"
              label="Puntos victoria"
              type="number"
              value={tournament.winPoints}
            />
            <Field
              name="draw"
              label="Puntos empate"
              type="number"
              value={tournament.drawPoints}
            />
            <Field
              name="loss"
              label="Puntos derrota"
              type="number"
              value={tournament.lossPoints}
            />
            <p>
              Cambiar puntos recalcula la tabla pública. Las categorías se fijan
              al crear el torneo.
            </p>
          </Form>
        </details>
      )}
      {admin && (
        <details className="platform-card">
          <summary>Importar o recuperar un torneo</summary>
          <p>
            Selecciona una exportación JSON de esta liga (máximo 2 MB). Se
            creará un borrador nuevo; el original se conserva. No incluye
            accesos ni historial de auditoría.
          </p>
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Archivo de torneo"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(null);
              if (f)
                void action(async () => {
                  if (f.size > 2_000_000)
                    throw new Error("El archivo supera 2 MB.");
                  setPreview(parseArchive(await f.text(), org));
                });
            }}
          />
          {preview && (
            <div>
              <p>
                {preview.tournament.name}: {preview.teams.length} equipos,{" "}
                {preview.matches.length} partidos y {preview.players.length}{" "}
                jugadores.
              </p>
              <button
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    const id = await importArchive(org, preview);
                    setPreview(null);
                    setError(
                      `Importación completada: ${id}. Selecciona el borrador para revisarlo.`,
                    );
                  })
                }
              >
                Confirmar importación como borrador
              </button>
            </div>
          )}
        </details>
      )}
      {admin && !archived && (
        <Form
          key={editingTeam?.id ?? "new-team"}
          title={editingTeam ? "Editar equipo" : "Agregar equipo"}
          submit={async (d) => {
            await saveEntity(
              org,
              "teams",
              {
                id: editingTeam?.id ?? text(d, "id"),
                name: text(d, "name"),
                category: editingTeam?.category ?? text(d, "category"),
                deleted: editingTeam?.deleted ?? false,
              },
              editingTeam?.version ?? null,
              tournament.id,
            );
            setEditingTeam(null);
          }}
        >
          {!editingTeam && (
            <Field
              name="id"
              label="Identificador de equipo (único en la liga)"
            />
          )}
          <Field
            name="name"
            label="Nombre del equipo"
            value={editingTeam?.name}
          />
          {editingTeam ? (
            <p>Categoría: {editingTeam.category}</p>
          ) : (
            <CategorySelect tournament={tournament} />
          )}
          {editingTeam && (
            <button
              type="button"
              className="subtle"
              onClick={() => setEditingTeam(null)}
            >
              Cancelar edición
            </button>
          )}
        </Form>
      )}
      <h3>Equipos</h3>
      <div className="platform-list">
        {teams.map((t) => (
          <div className="platform-row" key={t.id}>
            <span>
              {t.name} · {t.category} {t.deleted && "· Retirado"}
            </span>
            {admin && !archived && (
              <button onClick={() => setEditingTeam(t)}>Editar equipo</button>
            )}
            {admin && !archived && (
              <button
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    if (
                      !t.deleted &&
                      matches.some(
                        (m) =>
                          !m.deleted && (m.home === t.id || m.away === t.id),
                      )
                    )
                      throw new Error(
                        "Retira primero los partidos del equipo para conservar la coherencia del torneo.",
                      );
                    await saveEntity(
                      org,
                      "teams",
                      { ...t, deleted: !t.deleted },
                      t.version,
                      tournament.id,
                    );
                  })
                }
              >
                {t.deleted ? "Restaurar" : "Retirar"}
              </button>
            )}
          </div>
        ))}
      </div>
      <h3>Partidos</h3>
      {editor && !archived && (
        <button onClick={() => setEditing("new")}>Nuevo partido</button>
      )}
      {editing && !archived && (
        <MatchForm
          key={editing === "new" ? "new" : editing.id}
          tournament={tournament}
          teams={teams}
          match={editing === "new" ? undefined : editing}
          save={(data, v) => saveEntity(org, "matches", data, v, tournament.id)}
          close={() => setEditing(null)}
        />
      )}
      <div className="platform-list">
        {[...matches]
          .sort((a, b) => a.round - b.round)
          .map((m) => (
            <div className="platform-row" key={m.id}>
              <span>
                F{m.round} · {m.category} · {names.get(m.home)}{" "}
                {m.status === "played" ? `${m.homeScore}–${m.awayScore}` : "vs"}{" "}
                {names.get(m.away)} {m.deleted && "· Retirado"}
                <small>
                  {m.date} {m.time} · {m.venue}
                </small>
              </span>
              {editor && !archived && (
                <div className="platform-actions">
                  <button onClick={() => setEditing(m)}>Editar</button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      action(() =>
                        saveEntity(
                          org,
                          "matches",
                          { ...m, deleted: !m.deleted },
                          m.version,
                          tournament.id,
                        ),
                      )
                    }
                  >
                    {m.deleted ? "Restaurar" : "Retirar"}
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>
      {(admin || member.role === "club") && !archived && (
        <Form
          key={editingPlayer?.id ?? "new-player"}
          title={editingPlayer ? "Editar jugador" : "Registrar jugador"}
          submit={async (d) => {
            const teamId = text(d, "teamId"),
              team = teams.find((t) => t.id === teamId);
            if (!team) throw new Error("Selecciona un equipo.");
            await saveEntity(
              org,
              "players",
              {
                id: editingPlayer?.id ?? `player-${crypto.randomUUID()}`,
                name: text(d, "name"),
                teamId,
                category: team.category,
                published: d.get("published") === "on",
                deleted: false,
              },
              editingPlayer?.version ?? null,
              tournament.id,
            );
            setEditingPlayer(null);
          }}
        >
          <Field
            name="name"
            label="Nombre deportivo autorizado"
            value={editingPlayer?.name}
          />
          <label>
            Equipo
            <select name="teamId" defaultValue={editingPlayer?.teamId}>
              {teams
                .filter((t) => !t.deleted && (admin || t.id === member.teamId))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.category}
                  </option>
                ))}
            </select>
          </label>
          <label className="platform-check">
            <input
              type="checkbox"
              name="published"
              defaultChecked={editingPlayer?.published ?? false}
            />{" "}
            Confirmo que la liga cuenta con autorización para publicar este
            nombre.
          </label>
          <p>
            Sin marcar, el registro permanece privado. No ingreses documentos de
            identidad, contactos ni datos de salud.
          </p>
          {editingPlayer && (
            <button
              type="button"
              className="subtle"
              onClick={() => setEditingPlayer(null)}
            >
              Cancelar edición
            </button>
          )}
        </Form>
      )}
      {
        <>
          <h3>Jugadores</h3>
          {players.map((p) => (
            <div className="platform-row" key={p.id}>
              <span>
                {p.name} · {names.get(p.teamId)} ·{" "}
                {p.deleted ? "Retirado" : p.published ? "Público" : "Privado"}
              </span>
              {(admin || member.role === "club") && !archived && (
                <button onClick={() => setEditingPlayer(p)}>
                  Editar jugador
                </button>
              )}
              {(admin || member.role === "club") && !archived && (
                <button
                  disabled={busy}
                  onClick={() =>
                    action(() =>
                      saveEntity(
                        org,
                        "players",
                        { ...p, deleted: !p.deleted, published: false },
                        p.version,
                        tournament.id,
                      ),
                    )
                  }
                >
                  {p.deleted ? "Restaurar como privado" : "Retirar publicación"}
                </button>
              )}
            </div>
          ))}
        </>
      }
    </>
  );
}
function Members({ org }: { org: string }) {
  const [members, setMembers] = useState<Member[]>([]),
    [error, setError] = useState("");
  useEffect(
    () =>
      watch<Member>(`organizations/${org}/members`, setMembers, () =>
        setError("No se pudieron cargar los accesos."),
      ),
    [org],
  );
  return (
    <details className="platform-card">
      <summary>Personas y permisos</summary>
      <p>
        La persona debe crear y verificar su cuenta con el mismo correo. No se
        envían invitaciones automáticamente.
      </p>
      <Form
        title="Asignar o modificar acceso"
        submit={async (d) =>
          saveMember(org, {
            email: text(d, "email"),
            role: text(d, "role") as Member["role"],
            teamId: text(d, "teamId"),
            active: true,
          })
        }
      >
        <Field name="email" label="Correo de la persona" type="email" />
        <label>
          Responsabilidad
          <select name="role">
            <option value="editor">Editor de resultados</option>
            <option value="club">Encargado de club</option>
            <option value="admin">Administrador de liga</option>
          </select>
        </label>
        <Field
          name="teamId"
          label="Identificador del equipo (obligatorio para encargado de club)"
          required={false}
        />
      </Form>
      {members.map((m) => (
        <div className="platform-row" key={m.email}>
          <span>
            {m.email} · {m.role} · {m.active ? "Activo" : "Revocado"}
          </span>
          <button
            onClick={async () => {
              try {
                await saveMember(org, { ...m, active: !m.active });
              } catch (e) {
                setError(String(e));
              }
            }}
          >
            {m.active ? "Revocar" : "Reactivar"}
          </button>
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
function Audit({ org }: { org: string }) {
  const [rows, setRows] = useState<
      {
        id: string;
        path: string;
        actor: string;
        version: number;
        at?: { seconds: number };
      }[]
    >([]),
    [error, setError] = useState("");
  useEffect(
    () =>
      watch<{
        id: string;
        path: string;
        actor: string;
        version: number;
        at?: { seconds: number };
      }>(`organizations/${org}/audits`, setRows, () =>
        setError("No se pudo cargar el historial."),
      ),
    [org],
  );
  return (
    <details className="platform-card">
      <summary>Historial de cambios</summary>
      <p>
        Registro de cambios de datos, con autor y versión. Las retiradas son
        reversibles desde cada listado.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="platform-table">
        <table>
          <thead>
            <tr>
              <th>Registro</th>
              <th>Versión</th>
              <th>Fecha</th>
              <th>Autor (UID)</th>
            </tr>
          </thead>
          <tbody>
            {[...rows]
              .sort((a, b) => (b.at?.seconds ?? 0) - (a.at?.seconds ?? 0))
              .slice(0, 100)
              .map((r) => (
                <tr key={r.id}>
                  <td>{r.path.split("/").slice(-2).join(" / ")}</td>
                  <td>{r.version}</td>
                  <td>
                    {r.at
                      ? new Date(r.at.seconds * 1000).toLocaleString("es-CL")
                      : "Guardando"}
                  </td>
                  <td>{r.actor}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
