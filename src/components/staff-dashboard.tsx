"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import { AlertTriangle, Camera, CheckCircle2, LoaderCircle, LogOut, Save, Search, ShieldCheck, Trash2, Upload, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FixtureList } from "@/components/fixture-list";
import { SiteHeader } from "@/components/site-header";
import { useLeagueData } from "@/hooks/use-league-data";
import {
  deletePlayer,
  deleteTeamPhoto,
  isStaffUser,
  loadStaffCatalog,
  observeStaffUser,
  saveCategory,
  saveClub,
  saveMatch,
  savePlayer,
  signInStaff,
  signOutStaff,
  uploadTeamPhotos,
  type StaffCategory,
  type StaffClub,
} from "@/lib/supabase/staff";
import { foldText } from "@/lib/text";
import type { CategoryId, Competition, Match, Player, TeamPhoto } from "@/types/domain";

type Notice = { kind: "success" | "error"; message: string } | null;
type Section = "matches" | "players" | "photos" | "clubs" | "categories";

export function StaffDashboard() {
  const { matches, players, photos, status, error: dataError } = useLeagueData();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [category, setCategory] = useState<CategoryId>("pre-peque");
  const [competition, setCompetition] = useState<Competition>("league");
  const [section, setSection] = useState<Section>("matches");
  const [clubs, setClubs] = useState<StaffClub[]>([]);
  const [categories, setCategories] = useState<StaffCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const refreshCatalog = useCallback(async (currentUser: User) => {
    setCatalogLoading(true);
    try {
      const catalog = await loadStaffCatalog(currentUser);
      setClubs(catalog.clubs);
      setCategories(catalog.categories);
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "No fue posible cargar el catálogo de Supabase." });
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => observeStaffUser(async (candidate) => {
    const authorized = candidate && await isStaffUser(candidate) ? candidate : null;
    setUser(authorized);
    setChecking(false);
    if (authorized) void refreshCatalog(authorized);
  }), [refreshCatalog]);

  if (checking) return <main className="route-state"><LoaderCircle className="spin" /><h1>Verificando sesión Staff…</h1></main>;
  if (!user) return <StaffLogin />;

  const competitionClubs = clubs.filter((club) => club.competitions.includes(competition));
  const competitionCategories = categories.filter((item) => item.active && (competition === "lff" ? item.id === "superior" : item.id !== "superior"));
  const selectedMatches = matches.filter((match) => match.category === category && match.competition === competition);
  const selectedPlayers = players.filter((player) => player.category === category && player.competition === competition);
  const selectedPhotos = photos.filter((photo) => photo.category === category && photo.competition === competition);

  return <><SiteHeader /><main className="staff-page">
    <header className="staff-heading"><div><p className="eyebrow"><span /> Acceso autorizado</p><h1>Panel Staff</h1><p>Administra la información oficial directamente en Supabase.</p></div><button className="secondary-button" type="button" onClick={() => signOutStaff()}><LogOut /> Cerrar sesión</button></header>
    {notice && <div className={`notice ${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 /> : <AlertTriangle />}<span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Cerrar mensaje"><X /></button></div>}
    {dataError && <div className="notice error"><AlertTriangle /><span>Supabase no está disponible. La edición está deshabilitada y la web está usando el respaldo local.</span></div>}
    <div className="staff-toolbar">
      {(section === "matches" || section === "players" || section === "photos") && <>
        <div className="field"><label htmlFor="staff-competition">Competencia</label><select id="staff-competition" value={competition} onChange={(event) => { const next = event.target.value as Competition; setCompetition(next); setCategory(next === "lff" ? "superior" : "pre-peque"); }}><option value="league">Liga · Clausura</option><option value="cup">LIFI Cup</option><option value="lff">LFF · Liga Femenina</option></select></div>
        <div className="field"><label htmlFor="staff-category">Categoría</label><select id="staff-category" value={category} onChange={(event) => setCategory(event.target.value as CategoryId)}>{competitionCategories.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.birthYears}</option>)}</select></div>
      </>}
      <div className="staff-section-tabs" role="tablist">
        {(["matches", "players", "photos", "clubs", "categories"] as Section[]).map((item) => <button key={item} role="tab" aria-selected={section === item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{item === "matches" ? "Partidos" : item === "players" ? "Jugadores" : item === "photos" ? "Fotos" : item === "clubs" ? "Clubes" : "Categorías"}</button>)}
      </div>
      <span className={`data-status ${status}`}>{status === "live" ? "Supabase conectado" : "Datos de respaldo"}</span>
    </div>
    {catalogLoading ? <div className="route-state"><LoaderCircle className="spin" /><p>Cargando catálogo…</p></div> :
      section === "matches" ? <FixtureList matches={selectedMatches} editable={(match) => <MatchEditor key={match.id} match={match} user={user} disabled={status !== "live"} notify={setNotice} />} /> :
      section === "players" ? <PlayerManager players={selectedPlayers} clubs={competitionClubs} category={category} competition={competition} user={user} disabled={status !== "live"} notify={setNotice} /> :
      section === "photos" ? <PhotoManager photos={selectedPhotos} clubs={competitionClubs} category={category} competition={competition} user={user} disabled={status !== "live"} notify={setNotice} /> :
      section === "clubs" ? <ClubManager clubs={clubs} user={user} disabled={status !== "live"} notify={setNotice} changed={() => refreshCatalog(user)} /> :
      <CategoryManager categories={categories} user={user} disabled={status !== "live"} notify={setNotice} changed={() => refreshCatalog(user)} />}
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
  return <main className="login-page"><Link className="login-brand" href="/">LIFI<span>.</span></Link><form className="login-card" onSubmit={submit}><span className="login-icon"><ShieldCheck /></span><p className="eyebrow"><span /> Área privada</p><h1>Acceso Staff</h1><p>Usa una cuenta autorizada mediante Supabase Auth.</p><div className="field"><label htmlFor="staff-email">Correo electrónico</label><input id="staff-email" name="email" type="email" autoComplete="username" required /></div><div className="field"><label htmlFor="staff-password">Contraseña</label><input id="staff-password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div>{message && <p className="form-error" role="alert">{message}</p>}<button className="primary-button full" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" /> Verificando…</> : <>Ingresar <ShieldCheck /></>}</button><small>La autorización se valida con Supabase Auth y las políticas RLS de la base.</small></form></main>;
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

function PlayerManager({ players, clubs, category, competition, user, disabled, notify }: { players: Player[]; clubs: StaffClub[]; category: CategoryId; competition: Competition; user: User; disabled: boolean; notify: (notice: Notice) => void }) {
  const [query, setQuery] = useState("");
  const [club, setClub] = useState("");
  const [editing, setEditing] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState<Player | null>(null);
  const filtered = players.filter((player) => (!club || player.club === club) && foldText(player.name).includes(foldText(query)));
  return <div className="player-manager"><section className="player-form-panel"><h2>{editing ? "Editar jugador" : "Agregar jugador"}</h2><PlayerForm key={editing?.id ?? `${category}-${competition}`} player={editing} players={players} clubs={clubs} category={category} competition={competition} user={user} disabled={disabled} notify={notify} done={() => setEditing(null)} /></section><section className="player-list-panel"><div className="player-list-heading"><div><h2>Plantel</h2><p>{filtered.length} jugadores visibles</p></div><div className="list-filters"><label><span className="sr-only">Buscar jugador</span><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jugador…" /></label><select aria-label="Filtrar por club" value={club} onChange={(event) => setClub(event.target.value)}><option value="">Todos los clubes</option>{clubs.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div></div><div className="staff-player-list">{filtered.map((player) => <article key={player.id}><button className="player-main" type="button" onClick={() => setEditing(player)}><span>{player.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span><strong>{player.name}</strong><small>{player.club} · {player.position}</small></span></button><dl><div><dt>PJ</dt><dd>{player.appearances}</dd></div><div><dt>G</dt><dd>{player.goals}</dd></div><div><dt>A</dt><dd>{player.assists}</dd></div></dl><button className="icon-danger" type="button" onClick={() => setDeleting(player)} aria-label={`Eliminar a ${player.name}`}><Trash2 /></button></article>)}</div></section>{deleting && <ConfirmDelete player={deleting} onCancel={() => setDeleting(null)} onConfirm={async () => { try { await deletePlayer(deleting.id, user); notify({ kind: "success", message: `${deleting.name} fue eliminado.` }); setDeleting(null); } catch { notify({ kind: "error", message: "No fue posible eliminar el jugador." }); } }} />}</div>;
}

function PlayerForm({ player, players, clubs, category, competition, user, disabled, notify, done }: { player: Player | null; players: Player[]; clubs: StaffClub[]; category: CategoryId; competition: Competition; user: User; disabled: boolean; notify: (notice: Notice) => void; done: () => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || disabled) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name")).trim();
    const club = String(data.get("club"));
    const duplicate = players.find((candidate) => candidate.id !== player?.id && foldText(candidate.name) === foldText(name) && candidate.club === club);
    if (duplicate) { notify({ kind: "error", message: "Ya existe un jugador con el mismo nombre, club y categoría." }); return; }
    setSaving(true);
    try { await savePlayer({ id: player?.id, name, club, position: String(data.get("position")), category, competition, goals: Number(data.get("goals")), assists: Number(data.get("assists")), appearances: Number(data.get("appearances")), yellowCards: Number(data.get("yellowCards")), redCards: Number(data.get("redCards")) }, user); notify({ kind: "success", message: `${name} fue guardado correctamente.` }); form.reset(); done(); }
    catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible guardar el jugador." }); }
    finally { setSaving(false); }
  }
  return <form className="player-form" onSubmit={submit}><div className="field"><label htmlFor="player-name">Nombre completo</label><input id="player-name" name="name" defaultValue={player?.name} required /></div><div className="field"><label htmlFor="player-club">Club</label><select id="player-club" name="club" defaultValue={player?.club} required><option value="">Seleccionar club</option>{clubs.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div><div className="field"><label htmlFor="player-position">Posición</label><input id="player-position" name="position" defaultValue={player?.position ?? "Jugador"} required /></div><div className="stat-fields">{[["appearances", "PJ", player?.appearances], ["goals", "Goles", player?.goals], ["assists", "Asist.", player?.assists], ["yellowCards", "TA", player?.yellowCards], ["redCards", "TR", player?.redCards]].map(([name, label, value]) => <div className="field" key={String(name)}><label htmlFor={`player-${name}`}>{label}</label><input id={`player-${name}`} name={String(name)} type="number" min="0" defaultValue={Number(value ?? 0)} required /></div>)}</div><div className="form-actions">{player && <button className="secondary-button" type="button" onClick={done}>Cancelar</button>}<button className="primary-button" type="submit" disabled={disabled || saving}>{saving ? <LoaderCircle className="spin" /> : <UserPlus />} {player ? "Guardar cambios" : "Crear jugador"}</button></div></form>;
}

function PhotoManager({ photos, clubs, category, competition, user, disabled, notify }: { photos: TeamPhoto[]; clubs: StaffClub[]; category: CategoryId; competition: Competition; user: User; disabled: boolean; notify: (notice: Notice) => void }) {
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

function ClubManager({ clubs, user, disabled, notify, changed }: { clubs: StaffClub[]; user: User; disabled: boolean; notify: (notice: Notice) => void; changed: () => Promise<void> }) {
  const [editing, setEditing] = useState<StaffClub | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const competitions = (["league", "cup", "lff"] as Competition[]).filter((item) => data.get(item) === "on");
    setSaving(true);
    try {
      await saveClub({ id: editing?.id, name: String(data.get("name")), aliases: String(data.get("aliases") ?? "").split(","), logo: String(data.get("logo") ?? ""), competitions, active: true }, user);
      notify({ kind: "success", message: `${String(data.get("name"))} guardado en Supabase.` });
      setEditing(null);
      form.reset();
      await changed();
    } catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible guardar el club." }); }
    finally { setSaving(false); }
  }
  return <div className="player-manager"><section className="player-form-panel"><h2>{editing ? "Editar club" : "Agregar club"}</h2><form className="player-form" key={editing?.id ?? "new-club"} onSubmit={submit}><div className="field"><label htmlFor="club-name">Nombre</label><input id="club-name" name="name" defaultValue={editing?.name} required /></div><div className="field"><label htmlFor="club-aliases">Alias separados por coma</label><input id="club-aliases" name="aliases" defaultValue={editing?.aliases.join(", ")} /></div><div className="field"><label htmlFor="club-logo">Ruta o URL del logo</label><input id="club-logo" name="logo" defaultValue={editing?.logo} /></div><fieldset><legend>Competencias</legend>{(["league", "cup", "lff"] as Competition[]).map((item) => <label key={item}><input type="checkbox" name={item} defaultChecked={editing?.competitions.includes(item) ?? item === "league"} /> {item === "league" ? "Liga" : item === "cup" ? "LIFI Cup" : "LFF"}</label>)}</fieldset><p className="form-help">Por seguridad, guardar agrega asociaciones de competencia; no borra asociaciones existentes ni datos históricos.</p><div className="form-actions">{editing && <button className="secondary-button" type="button" onClick={() => setEditing(null)}>Cancelar</button>}<button className="primary-button" type="submit" disabled={disabled || saving}>{saving ? <LoaderCircle className="spin" /> : <Save />} Guardar club</button></div></form></section><section className="player-list-panel"><div className="player-list-heading"><div><h2>Clubes</h2><p>{clubs.length} registrados</p></div></div><div className="staff-player-list">{clubs.map((club) => <article key={club.id}><button className="player-main" type="button" onClick={() => setEditing(club)}><span>{club.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span><strong>{club.name}</strong><small>{club.competitions.join(" · ")}</small></span></button></article>)}</div></section></div>;
}

function CategoryManager({ categories, user, disabled, notify, changed }: { categories: StaffCategory[]; user: User; disabled: boolean; notify: (notice: Notice) => void; changed: () => Promise<void> }) {
  return <div className="player-list-panel"><div className="player-list-heading"><div><h2>Categorías</h2><p>Edita nombre, años, orden y visibilidad sin modificar código.</p></div></div><div className="staff-player-list">{categories.map((category) => <CategoryEditor key={category.id} category={category} user={user} disabled={disabled} notify={notify} changed={changed} />)}</div></div>;
}

function CategoryEditor({ category, user, disabled, notify, changed }: { category: StaffCategory; user: User; disabled: boolean; notify: (notice: Notice) => void; changed: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await saveCategory({ id: category.id, name: String(data.get("name")), birthYears: String(data.get("birthYears")), sortOrder: Number(data.get("sortOrder")), active: data.get("active") === "on" }, user);
      notify({ kind: "success", message: `${String(data.get("name"))} actualizada.` });
      await changed();
    } catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible guardar la categoría." }); }
    finally { setSaving(false); }
  }
  return <form className="player-form" onSubmit={submit}><strong>{category.id}</strong><div className="field"><label>Nombre</label><input name="name" defaultValue={category.name} required /></div><div className="field"><label>Años / descripción</label><input name="birthYears" defaultValue={category.birthYears} required /></div><div className="field"><label>Orden</label><input name="sortOrder" type="number" min="0" defaultValue={category.sortOrder} required /></div><label><input name="active" type="checkbox" defaultChecked={category.active} /> Visible</label><button className="save-button" type="submit" disabled={disabled || saving}>{saving ? <LoaderCircle className="spin" /> : <Save />} Guardar</button></form>;
}

function ConfirmDelete({ player, onCancel, onConfirm }: { player: Player; onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onCancel]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description"><span><Trash2 /></span><h2 id="delete-title">Eliminar jugador</h2><p id="delete-description">Esta acción eliminará a <strong>{player.name}</strong> de Supabase. La migración original seguirá respaldada por su snapshot y manifiesto.</p><div><button ref={cancelRef} className="secondary-button" type="button" onClick={onCancel}>Cancelar</button><button className="danger-button" type="button" onClick={onConfirm}>Sí, eliminar</button></div></div></div>;
}
