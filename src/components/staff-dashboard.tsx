"use client";

import type { User } from "firebase/auth";
import { AlertTriangle, CheckCircle2, LoaderCircle, LogOut, Save, Search, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, CLUBS } from "@/config/league";
import { FixtureList } from "@/components/fixture-list";
import { SiteHeader } from "@/components/site-header";
import { useLeagueData } from "@/hooks/use-league-data";
import { deletePlayer, isStaffUser, observeStaffUser, saveMatch, savePlayer, signInStaff, signOutStaff } from "@/lib/firebase/staff";
import { foldText } from "@/lib/text";
import type { CategoryId, Competition, Match, Player } from "@/types/domain";

type Notice = { kind: "success" | "error"; message: string } | null;

export function StaffDashboard() {
  const { matches, players, status, error: dataError } = useLeagueData();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [category, setCategory] = useState<CategoryId>("pre-peque");
  const [competition, setCompetition] = useState<Competition>("league");
  const [section, setSection] = useState<"matches" | "players">("matches");

  useEffect(() => observeStaffUser(async (candidate) => {
    setUser(candidate && await isStaffUser(candidate) ? candidate : null);
    setChecking(false);
  }), []);

  if (checking) return <main className="route-state"><LoaderCircle className="spin" /><h1>Verificando sesión Staff…</h1></main>;
  if (!user) return <StaffLogin />;

  const selectedMatches = matches.filter((match) => match.category === category && match.competition === competition);
  const selectedPlayers = players.filter((player) => player.category === category && player.competition === competition);

  return <><SiteHeader /><main className="staff-page">
    <header className="staff-heading"><div><p className="eyebrow"><span /> Acceso autorizado</p><h1>Panel Staff</h1><p>Actualiza información oficial con validaciones y registro de auditoría.</p></div><button className="secondary-button" type="button" onClick={() => signOutStaff()}><LogOut /> Cerrar sesión</button></header>
    {notice && <div className={`notice ${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 /> : <AlertTriangle />}<span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Cerrar mensaje"><X /></button></div>}
    {dataError && <div className="notice error"><AlertTriangle /><span>Firestore no está disponible. La edición está deshabilitada hasta recuperar la conexión.</span></div>}
    <div className="staff-toolbar">
      <div className="field"><label htmlFor="staff-competition">Competencia</label><select id="staff-competition" value={competition} onChange={(event) => setCompetition(event.target.value as Competition)}><option value="league">Liga · Clausura</option>{matches.some((match) => match.competition === "cup") && <option value="cup">LIFI Cup</option>}</select></div>
      <div className="field"><label htmlFor="staff-category">Categoría</label><select id="staff-category" value={category} onChange={(event) => setCategory(event.target.value as CategoryId)}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.birthYears}</option>)}</select></div>
      <div className="staff-section-tabs" role="tablist"><button role="tab" aria-selected={section === "matches"} className={section === "matches" ? "active" : ""} onClick={() => setSection("matches")}>Partidos</button><button role="tab" aria-selected={section === "players"} className={section === "players" ? "active" : ""} onClick={() => setSection("players")}>Jugadores</button></div>
      <span className={`data-status ${status}`}>{status === "live" ? "Firebase conectado" : "Datos de respaldo"}</span>
    </div>
    {section === "matches" ? <FixtureList matches={selectedMatches} editable={(match) => <MatchEditor key={match.id} match={match} user={user} disabled={status !== "live"} notify={setNotice} />} /> : <PlayerManager players={selectedPlayers} category={category} competition={competition} user={user} disabled={status !== "live"} notify={setNotice} />}
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

function MatchEditor({ match, user, disabled, notify }: { match: Match; user: User; disabled: boolean; notify: (notice: Notice) => void }) {
  const [draft, setDraft] = useState(match);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Match>(key: K, value: Match[K]) => setDraft((current) => ({ ...current, [key]: value }));
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || disabled) return;
    setSaving(true);
    try { await saveMatch(draft, user); notify({ kind: "success", message: `${draft.home} vs ${draft.away} guardado correctamente.` }); }
    catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible guardar el partido." }); }
    finally { setSaving(false); }
  }
  return <form className="match-editor" onSubmit={submit}><header><strong>{draft.home}</strong><span>vs</span><strong>{draft.away}</strong></header><div className="editor-grid"><div className="field"><label htmlFor={`${draft.id}-date`}>Fecha</label><input id={`${draft.id}-date`} type="date" value={draft.date ?? ""} onChange={(event) => set("date", event.target.value || null)} /></div><div className="field"><label htmlFor={`${draft.id}-time`}>Hora</label><input id={`${draft.id}-time`} type="time" value={draft.time ?? ""} onChange={(event) => set("time", event.target.value || null)} /></div><div className="field span-2"><label htmlFor={`${draft.id}-venue`}>Cancha</label><input id={`${draft.id}-venue`} value={draft.venue ?? ""} placeholder="Por definir" onChange={(event) => set("venue", event.target.value || null)} /></div><div className="field"><label htmlFor={`${draft.id}-status`}>Estado</label><select id={`${draft.id}-status`} value={draft.status} onChange={(event) => { const value = event.target.value as Match["status"]; setDraft((current) => ({ ...current, status: value, homeScore: value === "played" ? current.homeScore : null, awayScore: value === "played" ? current.awayScore : null })); }}><option value="scheduled">Programado</option><option value="played">Jugado</option><option value="postponed">Postergado</option><option value="cancelled">Cancelado</option></select></div><div className="score-inputs"><div className="field"><label htmlFor={`${draft.id}-home-score`}>Goles local</label><input id={`${draft.id}-home-score`} type="number" min="0" max="99" disabled={draft.status !== "played"} value={draft.homeScore ?? ""} onChange={(event) => set("homeScore", event.target.value === "" ? null : Number(event.target.value))} /></div><div className="field"><label htmlFor={`${draft.id}-away-score`}>Goles visita</label><input id={`${draft.id}-away-score`} type="number" min="0" max="99" disabled={draft.status !== "played"} value={draft.awayScore ?? ""} onChange={(event) => set("awayScore", event.target.value === "" ? null : Number(event.target.value))} /></div></div></div><button className="save-button" type="submit" disabled={disabled || saving}>{saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? "Guardando…" : "Guardar partido"}</button></form>;
}

function PlayerManager({ players, category, competition, user, disabled, notify }: { players: Player[]; category: CategoryId; competition: Competition; user: User; disabled: boolean; notify: (notice: Notice) => void }) {
  const [query, setQuery] = useState("");
  const [club, setClub] = useState("");
  const [editing, setEditing] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState<Player | null>(null);
  const filtered = players.filter((player) => (!club || player.club === club) && foldText(player.name).includes(foldText(query)));
  return <div className="player-manager"><section className="player-form-panel"><h2>{editing ? "Editar jugador" : "Agregar jugador"}</h2><PlayerForm key={editing?.id ?? `${category}-${competition}`} player={editing} players={players} category={category} competition={competition} user={user} disabled={disabled} notify={notify} done={() => setEditing(null)} /></section><section className="player-list-panel"><div className="player-list-heading"><div><h2>Plantel</h2><p>{filtered.length} jugadores visibles</p></div><div className="list-filters"><label><span className="sr-only">Buscar jugador</span><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jugador…" /></label><select aria-label="Filtrar por club" value={club} onChange={(event) => setClub(event.target.value)}><option value="">Todos los clubes</option>{CLUBS.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div></div><div className="staff-player-list">{filtered.map((player) => <article key={player.id}><button className="player-main" type="button" onClick={() => setEditing(player)}><span>{player.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span><strong>{player.name}</strong><small>{player.club} · {player.position}</small></span></button><dl><div><dt>PJ</dt><dd>{player.appearances}</dd></div><div><dt>G</dt><dd>{player.goals}</dd></div><div><dt>A</dt><dd>{player.assists}</dd></div></dl><button className="icon-danger" type="button" onClick={() => setDeleting(player)} aria-label={`Eliminar a ${player.name}`}><Trash2 /></button></article>)}</div></section>{deleting && <ConfirmDelete player={deleting} onCancel={() => setDeleting(null)} onConfirm={async () => { try { await deletePlayer(deleting.id, user); notify({ kind: "success", message: `${deleting.name} fue eliminado.` }); setDeleting(null); } catch { notify({ kind: "error", message: "No fue posible eliminar el jugador." }); } }} />}</div>;
}

function PlayerForm({ player, players, category, competition, user, disabled, notify, done }: { player: Player | null; players: Player[]; category: CategoryId; competition: Competition; user: User; disabled: boolean; notify: (notice: Notice) => void; done: () => void }) {
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
    try { await savePlayer({ id: player?.id, name, club, position: String(data.get("position")), category, competition, goals: Number(data.get("goals")), assists: Number(data.get("assists")), appearances: Number(data.get("appearances")), yellowCards: Number(data.get("yellowCards")), redCards: Number(data.get("redCards")) }, user); notify({ kind: "success", message: `${name} fue guardado correctamente.` }); event.currentTarget.reset(); done(); }
    catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible guardar el jugador." }); }
    finally { setSaving(false); }
  }
  return <form className="player-form" onSubmit={submit}><div className="field"><label htmlFor="player-name">Nombre completo</label><input id="player-name" name="name" defaultValue={player?.name} required /></div><div className="field"><label htmlFor="player-club">Club</label><select id="player-club" name="club" defaultValue={player?.club} required><option value="">Seleccionar club</option>{CLUBS.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div><div className="field"><label htmlFor="player-position">Posición</label><input id="player-position" name="position" defaultValue={player?.position ?? "Jugador"} required /></div><div className="stat-fields">{[["appearances", "PJ", player?.appearances], ["goals", "Goles", player?.goals], ["assists", "Asist.", player?.assists], ["yellowCards", "TA", player?.yellowCards], ["redCards", "TR", player?.redCards]].map(([name, label, value]) => <div className="field" key={String(name)}><label htmlFor={`player-${name}`}>{label}</label><input id={`player-${name}`} name={String(name)} type="number" min="0" defaultValue={Number(value ?? 0)} required /></div>)}</div><div className="form-actions">{player && <button className="secondary-button" type="button" onClick={done}>Cancelar</button>}<button className="primary-button" type="submit" disabled={disabled || saving}>{saving ? <LoaderCircle className="spin" /> : <UserPlus />} {player ? "Guardar cambios" : "Crear jugador"}</button></div></form>;
}

function ConfirmDelete({ player, onCancel, onConfirm }: { player: Player; onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onCancel]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"><span><Trash2 /></span><h2 id="delete-title">Eliminar jugador</h2><p id="delete-description">Esta acción eliminará a <strong>{player.name}</strong> de Firestore. No se puede deshacer desde el panel.</p><div><button ref={cancelRef} className="secondary-button" type="button" onClick={onCancel}>Cancelar</button><button className="danger-button" type="button" onClick={onConfirm}>Sí, eliminar</button></div></div></div>;
}
