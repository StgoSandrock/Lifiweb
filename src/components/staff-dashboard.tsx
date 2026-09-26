"use client";

import type { User } from "firebase/auth";
import Image from "next/image";
import { AlertTriangle, Camera, CheckCircle2, LoaderCircle, LogOut, Minus, Plus, Search, ShieldCheck, Trash2, Upload, UserPlus, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { categoriesForCompetition, clubsForCompetition, CUP_CLUBS_BY_CATEGORY } from "@/config/league";
import { FixtureList, MatchCard } from "@/components/fixture-list";
import { SiteHeader } from "@/components/site-header";
import { useLeagueData } from "@/hooks/use-league-data";
import { deleteMatch, deletePlayer, deleteTeam, deleteTeamPhoto, isStaffUser, MatchConflictError, observeStaffUser, saveMatch, saveMatchResult, savePlayer, saveTeam, signInStaff, signOutStaff, uploadTeamPhotos } from "@/lib/firebase/staff";
import { addGoalEvent, assignGoalEvent, eventsForEditor, removeLastGoalEvent, scoreFromGoalEvents } from "@/lib/goal-events";
import { foldText } from "@/lib/text";
import type { CategoryId, Club, Competition, GoalEvent, GoalTeam, Match, Player, TeamPhoto, TeamRegistration } from "@/types/domain";

type Notice = { kind: "success" | "error"; message: string } | null;

export function StaffDashboard() {
  const { matches, players, photos, teams, status, error: dataError } = useLeagueData();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [category, setCategory] = useState<CategoryId>("pre-peque");
  const [competition, setCompetition] = useState<Competition>("league");
  const [section, setSection] = useState<"teams" | "matches" | "players" | "photos">("teams");

  useEffect(() => observeStaffUser(async (candidate) => {
    setUser(candidate && await isStaffUser(candidate) ? candidate : null);
    setChecking(false);
  }), []);

  if (checking) return <main className="route-state"><LoaderCircle className="spin" /><h1>Verificando sesión Staff…</h1></main>;
  if (!user) return <StaffLogin />;

  const selectedMatches = matches.filter((match) => match.category === category && match.competition === competition);
  const selectedPlayers = players.filter((player) => player.category === category && player.competition === competition);
  const selectedPhotos = photos.filter((photo) => photo.category === category && photo.competition === competition);
  const selectedTeams = teams.filter((team) => team.category === category && team.competition === competition).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "es"));
  const competitionClubs: readonly Club[] = selectedTeams.length ? selectedTeams.filter((team) => team.active) : competition === "cup" ? CUP_CLUBS_BY_CATEGORY[category] ?? [] : clubsForCompetition(competition);
  const competitionCategories = categoriesForCompetition(competition);

  return <><SiteHeader /><main className="staff-page">
    <header className="staff-heading"><div><p className="eyebrow"><span /> Acceso autorizado</p><h1>Panel Staff</h1><p>Actualiza información oficial con validaciones y registro de auditoría.</p></div><button className="secondary-button" type="button" onClick={() => signOutStaff()}><LogOut /> Cerrar sesión</button></header>
    {notice && <div className={`notice ${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 /> : <AlertTriangle />}<span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Cerrar mensaje"><X /></button></div>}
    {dataError && <div className="notice error"><AlertTriangle /><span>Firestore no está disponible. La edición está deshabilitada hasta recuperar la conexión.</span></div>}
    <div className="staff-toolbar">
      <div className="field"><label htmlFor="staff-competition">Competencia</label><select id="staff-competition" value={competition} onChange={(event) => { const nextCompetition = event.target.value as Competition; setCompetition(nextCompetition); setCategory(nextCompetition === "lff" ? "superior" : "pre-peque"); }}><option value="league">Liga · Clausura</option><option value="cup">LIFI Cup</option><option value="lff">LFF · Liga Femenina</option></select></div>
      <div className="field"><label htmlFor="staff-category">Categoría</label><select id="staff-category" value={category} onChange={(event) => setCategory(event.target.value as CategoryId)}>{competitionCategories.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.birthYears}</option>)}</select></div>
      <div className="staff-section-tabs" role="tablist"><button role="tab" aria-selected={section === "teams"} className={section === "teams" ? "active" : ""} onClick={() => setSection("teams")}>Equipos</button><button role="tab" aria-selected={section === "matches"} className={section === "matches" ? "active" : ""} onClick={() => setSection("matches")}>Partidos</button><button role="tab" aria-selected={section === "players"} className={section === "players" ? "active" : ""} onClick={() => setSection("players")}>Jugadores</button><button role="tab" aria-selected={section === "photos"} className={section === "photos" ? "active" : ""} onClick={() => setSection("photos")}>Fotos</button></div>
      <span className={`data-status ${status}`}>{status === "live" ? "Firebase conectado" : "Datos de respaldo"}</span>
    </div>
    {section === "teams" ? <TeamManager teams={selectedTeams} category={category} competition={competition} user={user} disabled={status !== "live"} notify={setNotice} /> : section === "matches" ? <MatchManager matches={selectedMatches} players={selectedPlayers} clubs={competitionClubs} category={category} competition={competition} user={user} disabled={status !== "live"} notify={setNotice} /> : section === "players" ? <PlayerManager players={selectedPlayers} clubs={competitionClubs} category={category} competition={competition} goalsDerived={selectedMatches.some((match) => match.usesGoalEvents)} user={user} disabled={status !== "live"} notify={setNotice} /> : <PhotoManager photos={selectedPhotos} clubs={competitionClubs} category={category} competition={competition} user={user} disabled={status !== "live"} notify={setNotice} />}
  </main></>;
}

function StaffLogin() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try { await signInStaff(String(data.get("email")), String(data.get("password"))); }
    catch { setMessage("No pudimos iniciar sesión. Verifica tus credenciales y el rol Staff."); }
    finally { setSubmitting(false); }
  }
  return <main className="login-page"><Link className="login-brand" href="/">LIFI<span>.</span></Link><form className="login-card" onSubmit={submit}><span className="login-icon"><ShieldCheck /></span><p className="eyebrow"><span /> Área privada</p><h1>Acceso Staff</h1><p>Usa una cuenta autorizada mediante Firebase Authentication.</p><div className="field"><label htmlFor="staff-email">Correo electrónico</label><input id="staff-email" name="email" type="email" autoComplete="username" required /></div><div className="field"><label htmlFor="staff-password">Contraseña</label><input id="staff-password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div>{message && <p className="form-error" role="alert">{message}</p>}<button className="primary-button full" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" /> Verificando…</> : <>Ingresar <ShieldCheck /></>}</button><small>La autorización se valida en Firebase y en las reglas de Firestore.</small></form></main>;
}

function TeamManager({ teams, category, competition, user, disabled, notify }: { teams: TeamRegistration[]; category: CategoryId; competition: Competition; user: User; disabled: boolean; notify: (notice: Notice) => void }) {
  const [editing, setEditing] = useState<TeamRegistration | null>(null);
  const [saving, setSaving] = useState(false);
  const defaults = competition === "cup" ? CUP_CLUBS_BY_CATEGORY[category] ?? [] : clubsForCompetition(competition);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || disabled) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name")).trim();
    if (teams.some((team) => team.id !== editing?.id && foldText(team.name) === foldText(name))) { notify({ kind: "error", message: "Ya existe un equipo con ese nombre en esta categoría." }); return; }
    setSaving(true);
    try {
      await saveTeam({ id: editing?.id, name, aliases: String(data.get("aliases") || "").split(",").map((item) => item.trim()).filter(Boolean), logo: editing?.logo ?? "", competition, category, active: data.get("active") === "on", order: Number(data.get("order")) }, user, (form.elements.namedItem("logo") as HTMLInputElement).files?.[0]);
      notify({ kind: "success", message: `${name} fue guardado correctamente.` });
      form.reset(); setEditing(null);
    } catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible guardar el equipo." }); }
    finally { setSaving(false); }
  }
  async function importDefaults() {
    if (saving || disabled) return;
    setSaving(true);
    try {
      for (const [index, club] of defaults.entries()) await saveTeam({ name: club.name, aliases: club.aliases, logo: club.logo, competition, category, active: true, order: index + 1 }, user);
      notify({ kind: "success", message: `${defaults.length} equipos base cargados. Ya puedes editarlos.` });
    } catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible cargar los equipos base." }); }
    finally { setSaving(false); }
  }
  return <div className="player-manager"><section className="player-form-panel"><h2>{editing ? "Editar equipo" : "Agregar equipo"}</h2><form className="player-form" key={editing?.id ?? `${competition}-${category}`} onSubmit={submit}><div className="field"><label htmlFor="team-name">Nombre oficial</label><input id="team-name" name="name" defaultValue={editing?.name} required /></div><div className="field"><label htmlFor="team-aliases">Alias (separados por coma)</label><input id="team-aliases" name="aliases" defaultValue={editing?.aliases.join(", ")} placeholder="Ej: CDM, Manquehue" /></div><div className="field"><label htmlFor="team-logo">Escudo</label><input id="team-logo" name="logo" type="file" accept="image/*" /></div><div className="field"><label htmlFor="team-order">Orden</label><input id="team-order" name="order" type="number" min="0" defaultValue={editing?.order ?? teams.length + 1} required /></div><label className="team-active"><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} /> Visible en el sitio</label><div className="form-actions">{editing && <button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancelar</button>}<button className="primary-button" type="submit" disabled={disabled || saving}>{saving ? <LoaderCircle className="spin" /> : <Plus />} Guardar equipo</button></div></form>{!teams.length && defaults.length > 0 && <button className="secondary-button full" type="button" disabled={disabled || saving} onClick={importDefaults}>Cargar equipos base de esta categoría</button>}</section><section className="player-list-panel"><div className="player-list-heading"><div><h2>Equipos inscritos</h2><p>{teams.length} configurados en Firebase</p></div></div>{teams.length ? <div className="staff-team-list">{teams.map((team) => <article key={team.id}><button className="player-main" type="button" onClick={() => setEditing(team)}><span><UsersRound /></span><span><strong>{team.name}</strong><small>{team.active ? "Visible" : "Oculto"} · orden {team.order}</small></span></button><button className="icon-danger" type="button" aria-label={`Eliminar ${team.name}`} onClick={async () => { if (!window.confirm(`¿Eliminar ${team.name} de esta categoría?`)) return; try { await deleteTeam(team, user); notify({ kind: "success", message: `${team.name} fue eliminado.` }); } catch { notify({ kind: "error", message: "No fue posible eliminar el equipo." }); } }}><Trash2 /></button></article>)}</div> : <div className="empty-state compact"><UsersRound /><h3>Sin configuración editable</h3><p>Carga la lista base o agrega el primer equipo.</p></div>}</section></div>;
}

function MatchManager({ matches, players, clubs, category, competition, user, disabled, notify }: { matches: Match[]; players: Player[]; clubs: readonly Club[]; category: CategoryId; competition: Competition; user: User; disabled: boolean; notify: (notice: Notice) => void }) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [query, setQuery] = useState("");
  const visibleMatches = matches.filter((match) => foldText(`${match.home} ${match.away} ${match.roundLabel ?? `fecha ${match.round}`}`).includes(foldText(query)));
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const home = String(data.get("home")); const away = String(data.get("away"));
    try {
      await saveMatch({ id: crypto.randomUUID(), tournament: "clausura", competition, category, round: Number(data.get("round")), order: matches.length + 1, home, away, homeScore: null, awayScore: null, status: "scheduled", date: null, time: null, venue: null }, user);
      notify({ kind: "success", message: `${home} vs ${away} fue creado.` }); form.reset(); setCreating(false);
    } catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible crear el partido." }); }
  }
  return <div className="match-manager"><div className="match-manager-actions"><label className="match-search"><Search /><span className="sr-only">Buscar partido</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar equipo o fecha…" /></label><button className="primary-button" type="button" onClick={() => setCreating((value) => !value)} disabled={disabled || clubs.length < 2}><Plus /> Nuevo partido</button></div>{creating && <form className="match-create-form" onSubmit={create}><div className="field"><label htmlFor="match-round">Fecha Nº</label><input id="match-round" name="round" type="number" min="1" max="99" defaultValue="1" required /></div><div className="field"><label htmlFor="match-home">Local</label><select id="match-home" name="home" required>{clubs.map((club) => <option key={club.id} value={club.name}>{club.name}</option>)}</select></div><div className="field"><label htmlFor="match-away">Visita</label><select id="match-away" name="away" required>{clubs.map((club) => <option key={club.id} value={club.name}>{club.name}</option>)}</select></div><button className="primary-button" type="submit">Crear</button></form>}<FixtureList matches={visibleMatches} editable={(match) => <StaffMatchCard key={match.id} match={match} disabled={disabled} onOpen={() => setEditing(match)} onDelete={async () => { if (!window.confirm(`¿Eliminar ${match.home} vs ${match.away}?`)) return; try { await deleteMatch(match.id, user); notify({ kind: "success", message: "Partido eliminado." }); } catch { notify({ kind: "error", message: "No fue posible eliminar el partido." }); } }} />} />{editing && <QuickResultEditor key={`${editing.id}-${editing.version ?? 0}`} match={editing} players={players} user={user} onClose={() => setEditing(null)} notify={notify} />}</div>;
}

function StaffMatchCard({ match, disabled, onOpen, onDelete }: { match: Match; disabled: boolean; onOpen: () => void; onDelete: () => void }) {
  return <div className="staff-match-card"><MatchCard match={match} /><div className="staff-match-actions"><button type="button" className="primary-button" onClick={onOpen} disabled={disabled}>Abrir marcador</button><button className="icon-danger" type="button" onClick={onDelete} disabled={disabled} aria-label={`Eliminar ${match.home} vs ${match.away}`}><Trash2 /></button></div></div>;
}

function QuickResultEditor({ match, players, user, onClose, notify }: { match: Match; players: Player[]; user: User; onClose: () => void; notify: (notice: Notice) => void }) {
  const [events, setEvents] = useState<GoalEvent[]>(() => eventsForEditor(match, players));
  const [saving, setSaving] = useState(false);
  const score = scoreFromGoalEvents(events);
  const rosters: Record<GoalTeam, Player[]> = {
    home: players.filter((player) => player.club === match.home).sort((a, b) => a.name.localeCompare(b.name, "es")),
    away: players.filter((player) => player.club === match.away).sort((a, b) => a.name.localeCompare(b.name, "es")),
  };
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose, saving]);
  function add(team: GoalTeam) { setEvents((current) => addGoalEvent(current, team, crypto.randomUUID())); }
  function remove(team: GoalTeam) { setEvents((current) => removeLastGoalEvent(current, team)); }
  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await saveMatchResult({ match, goalEvents: events, status: "played" }, user);
      notify({ kind: "success", message: `Resultado guardado: ${match.home} ${score.home} - ${score.away} ${match.away}.` });
      onClose();
    } catch (error) {
      notify({ kind: "error", message: error instanceof MatchConflictError ? error.message : "No se pudo guardar el resultado. Los cambios no fueron confirmados. Intenta nuevamente." });
    }
    finally { setSaving(false); }
  }
  return <div className="score-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}><section className="score-sheet" role="dialog" aria-modal="true" aria-labelledby="score-editor-title"><header><div><p className="eyebrow"><span /> Resultado final</p><h2 id="score-editor-title">Cargar marcador</h2><small>{match.roundLabel ?? `Fecha ${match.round}`} · {match.category}</small></div><button type="button" onClick={onClose} disabled={saving} aria-label="Cerrar editor"><X /></button></header><div className="score-editor-teams"><GoalTeamEditor team="home" name={match.home} score={score.home} events={events} roster={rosters.home} onAdd={() => add("home")} onRemove={() => remove("home")} onAssign={(eventId, player) => setEvents((current) => assignGoalEvent(current, eventId, player))} /><div className="score-divider">{score.home}<span>–</span>{score.away}</div><GoalTeamEditor team="away" name={match.away} score={score.away} events={events} roster={rosters.away} onAdd={() => add("away")} onRemove={() => remove("away")} onAssign={(eventId, player) => setEvents((current) => assignGoalEvent(current, eventId, player))} /></div><footer><p><CheckCircle2 /> El marcador y los goleadores se guardarán juntos en Firestore.</p><button className="primary-button score-save" type="button" onClick={save} disabled={saving}>{saving ? <><LoaderCircle className="spin" /> Guardando…</> : "Guardar resultado"}</button></footer></section></div>;
}

function GoalTeamEditor({ team, name, score, events, roster, onAdd, onRemove, onAssign }: { team: GoalTeam; name: string; score: number; events: GoalEvent[]; roster: Player[]; onAdd: () => void; onRemove: () => void; onAssign: (eventId: string, player: Player | null) => void }) {
  const teamEvents = events.filter((event) => event.team === team);
  return <section className="goal-team-editor"><h3>{name}</h3><strong>{score}</strong><div className="goal-stepper"><button type="button" onClick={onRemove} disabled={score === 0} aria-label={`Quitar gol a ${name}`}><Minus /></button><button type="button" className="goal-add" onClick={onAdd}><Plus /> Gol</button></div><div className="goal-event-list"><h4>Goles</h4>{teamEvents.length ? teamEvents.map((goal, index) => <label key={goal.id}><span>{index + 1}</span><select value={goal.playerId ?? ""} onChange={(event) => onAssign(goal.id, roster.find((player) => player.id === event.target.value) ?? null)} aria-label={`Goleador ${index + 1} de ${name}`}><option value="">Sin asignar</option>{roster.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label>) : <p>Ninguno</p>}</div></section>;
}

function PlayerManager({ players, clubs, category, competition, goalsDerived, user, disabled, notify }: { players: Player[]; clubs: ReturnType<typeof clubsForCompetition>; category: CategoryId; competition: Competition; goalsDerived: boolean; user: User; disabled: boolean; notify: (notice: Notice) => void }) {
  const [query, setQuery] = useState("");
  const [club, setClub] = useState("");
  const [editing, setEditing] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState<Player | null>(null);
  const filtered = players.filter((player) => (!club || player.club === club) && foldText(player.name).includes(foldText(query)));
  return <div className="player-manager"><section className="player-form-panel"><h2>{editing ? "Editar jugador" : "Agregar jugador"}</h2>{goalsDerived && <p className="form-hint">Los goles se calculan automáticamente desde los resultados.</p>}<PlayerForm key={editing?.id ?? `${category}-${competition}`} player={editing} players={players} clubs={clubs} category={category} competition={competition} goalsDerived={goalsDerived} user={user} disabled={disabled} notify={notify} done={() => setEditing(null)} /></section><section className="player-list-panel"><div className="player-list-heading"><div><h2>Plantel</h2><p>{filtered.length} jugadores visibles</p></div><div className="list-filters"><label><span className="sr-only">Buscar jugador</span><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jugador…" /></label><select aria-label="Filtrar por club" value={club} onChange={(event) => setClub(event.target.value)}><option value="">Todos los clubes</option>{clubs.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div></div><div className="staff-player-list">{filtered.map((player) => <article key={player.id}><button className="player-main" type="button" onClick={() => setEditing(player)}><span>{player.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span><strong>{player.name}</strong><small>{player.club} · {player.position}</small></span></button><dl><div><dt>PJ</dt><dd>{player.appearances}</dd></div><div><dt>G</dt><dd>{player.goals}</dd></div><div><dt>A</dt><dd>{player.assists}</dd></div></dl><button className="icon-danger" type="button" onClick={() => setDeleting(player)} aria-label={`Eliminar a ${player.name}`}><Trash2 /></button></article>)}</div></section>{deleting && <ConfirmDelete player={deleting} onCancel={() => setDeleting(null)} onConfirm={async () => { try { await deletePlayer(deleting.id, user); notify({ kind: "success", message: `${deleting.name} fue eliminado.` }); setDeleting(null); } catch { notify({ kind: "error", message: "No fue posible eliminar el jugador." }); } }} />}</div>;
}

function PlayerForm({ player, players, clubs, category, competition, goalsDerived, user, disabled, notify, done }: { player: Player | null; players: Player[]; clubs: ReturnType<typeof clubsForCompetition>; category: CategoryId; competition: Competition; goalsDerived: boolean; user: User; disabled: boolean; notify: (notice: Notice) => void; done: () => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || disabled) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name")).trim();
    const club = String(data.get("club"));
    const duplicate = players.find((candidate) => candidate.id !== player?.id && foldText(candidate.name) === foldText(name) && candidate.club === club);
    if (duplicate) { notify({ kind: "error", message: "Ya existe un jugador con el mismo nombre, club y categoría." }); return; }
    setSaving(true);
    try { await savePlayer({ id: player?.id, name, club, position: String(data.get("position")), category, competition, goals: goalsDerived ? (player?.goals ?? 0) : Number(data.get("goals")), assists: Number(data.get("assists")), appearances: Number(data.get("appearances")), yellowCards: Number(data.get("yellowCards")), redCards: Number(data.get("redCards")) }, user); notify({ kind: "success", message: `${name} fue guardado correctamente.` }); event.currentTarget.reset(); done(); }
    catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible guardar el jugador." }); }
    finally { setSaving(false); }
  }
  return <form className="player-form" onSubmit={submit}><div className="field"><label htmlFor="player-name">Nombre completo</label><input id="player-name" name="name" defaultValue={player?.name} required /></div><div className="field"><label htmlFor="player-club">Club</label><select id="player-club" name="club" defaultValue={player?.club} required><option value="">Seleccionar club</option>{clubs.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div><div className="field"><label htmlFor="player-position">Posición</label><input id="player-position" name="position" defaultValue={player?.position ?? "Jugador"} required /></div><div className="stat-fields">{[["appearances", "PJ", player?.appearances], ["goals", goalsDerived ? "Goles · auto" : "Goles", player?.goals], ["assists", "Asist.", player?.assists], ["yellowCards", "TA", player?.yellowCards], ["redCards", "TR", player?.redCards]].map(([name, label, value]) => <div className="field" key={String(name)}><label htmlFor={`player-${name}`}>{label}</label><input id={`player-${name}`} name={String(name)} type="number" min="0" defaultValue={Number(value ?? 0)} disabled={name === "goals" && goalsDerived} required /></div>)}</div><div className="form-actions">{player && <button className="secondary-button" type="button" onClick={done}>Cancelar</button>}<button className="primary-button" type="submit" disabled={disabled || saving}>{saving ? <LoaderCircle className="spin" /> : <UserPlus />} {player ? "Guardar cambios" : "Crear jugador"}</button></div></form>;
}

function PhotoManager({ photos, clubs, category, competition, user, disabled, notify }: { photos: TeamPhoto[]; clubs: ReturnType<typeof clubsForCompetition>; category: CategoryId; competition: Competition; user: User; disabled: boolean; notify: (notice: Notice) => void }) {
  const [club, setClub] = useState(clubs[0]?.name ?? "");
  const [uploading, setUploading] = useState(false);
  const activeClub = clubs.some((item) => item.name === club) ? club : clubs[0]?.name ?? "";
  const visible = photos.filter((photo) => photo.club === activeClub).sort((a, b) => a.order - b.order);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const files = Array.from((form.elements.namedItem("photos") as HTMLInputElement).files ?? []);
    setUploading(true);
    try { await uploadTeamPhotos({ files, competition, category, club: activeClub }, user); notify({ kind: "success", message: `${files.length} foto${files.length === 1 ? "" : "s"} subida${files.length === 1 ? "" : "s"} a ${activeClub}.` }); form.reset(); }
    catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible subir las fotos." }); }
    finally { setUploading(false); }
  }
  return <div className="photo-manager"><section className="photo-upload-panel"><span className="photo-panel-icon"><Camera /></span><div><h2>Galería del equipo</h2><p>Las fotos quedan vinculadas solamente a <strong>{activeClub}</strong> en esta categoría y competencia.</p></div><form onSubmit={submit}><div className="field"><label htmlFor="photo-club">Equipo</label><select id="photo-club" value={activeClub} onChange={(event) => setClub(event.target.value)}>{clubs.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div><div className="field"><label htmlFor="team-photos">Fotos (una o más)</label><input id="team-photos" name="photos" type="file" accept="image/*" multiple required /></div><button className="primary-button" type="submit" disabled={disabled || uploading || !activeClub}>{uploading ? <LoaderCircle className="spin" /> : <Upload />} {uploading ? "Subiendo…" : "Subir fotos"}</button></form></section><section className="photo-list-panel"><div><h2>Fotos publicadas</h2><p>{visible.length} foto{visible.length === 1 ? "" : "s"} para {activeClub}</p></div>{visible.length ? <div className="photo-admin-grid">{visible.map((photo, index) => <article key={photo.id}><div><Image src={photo.url} alt={`${activeClub}, foto ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 260px" /></div>{photo.storagePath.startsWith("static/") ? <span className="photo-seed-badge">Incluida</span> : <button className="icon-danger" type="button" aria-label={`Eliminar foto ${index + 1}`} onClick={async () => { try { await deleteTeamPhoto(photo, user); notify({ kind: "success", message: "Foto eliminada correctamente." }); } catch { notify({ kind: "error", message: "No fue posible eliminar la foto." }); } }}><Trash2 /></button>}</article>)}</div> : <div className="empty-state compact"><Camera /><h3>Galería vacía</h3><p>Sube la primera foto de este equipo para la categoría seleccionada.</p></div>}</section></div>;
}

function ConfirmDelete({ player, onCancel, onConfirm }: { player: Player; onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onCancel]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"><span><Trash2 /></span><h2 id="delete-title">Eliminar jugador</h2><p id="delete-description">Esta acción eliminará a <strong>{player.name}</strong> de Firestore. No se puede deshacer desde el panel.</p><div><button ref={cancelRef} className="secondary-button" type="button" onClick={onCancel}>Cancelar</button><button className="danger-button" type="button" onClick={onConfirm}>Sí, eliminar</button></div></div></div>;
}
