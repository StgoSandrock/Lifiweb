"use client";

import type { User } from "@supabase/supabase-js";
import { AlertTriangle, CheckCircle2, LoaderCircle, LogOut, Plus, Save, ShieldCheck, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { useLeagueCatalog } from "@/hooks/use-league-catalog";
import { useLeagueData } from "@/hooks/use-league-data";
import { deleteMatch, isStaffUser, observeStaffUser, saveMatch, signInStaff, signOutStaff } from "@/lib/supabase/staff";
import type { Category, CategoryId, Club, Competition, Match } from "@/types/domain";

type Notice = { kind: "success" | "error"; message: string } | null;
type CatalogClub = Club & { competitions: Competition[] };

function emptyMatch(competition: Competition, category: CategoryId, order: number): Match {
  return {
    id: crypto.randomUUID(),
    tournament: "clausura",
    competition,
    category,
    round: 1,
    order,
    home: "",
    away: "",
    homeScore: null,
    awayScore: null,
    status: "scheduled",
    date: null,
    time: null,
    venue: null,
  };
}

function categoriesForCompetition(categories: Category[], competition: Competition) {
  return competition === "lff"
    ? categories.filter((item) => item.id === "superior")
    : categories.filter((item) => item.id !== "superior");
}

export function StaffMatchManager() {
  const { matches, status, error: dataError } = useLeagueData();
  const { clubs: catalogClubs, categories } = useLeagueCatalog();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [competition, setCompetition] = useState<Competition>("league");
  const [category, setCategory] = useState<CategoryId>("pre-peque");
  const [creating, setCreating] = useState<Match | null>(null);

  useEffect(() => observeStaffUser(async (candidate) => {
    setUser(candidate && await isStaffUser(candidate) ? candidate : null);
    setChecking(false);
  }), []);

  const availableCategories = categoriesForCompetition(categories, competition);
  const clubs = useMemo(
    () => catalogClubs.filter((club) => club.competitions.includes(competition)),
    [catalogClubs, competition],
  );
  const selectedMatches = useMemo(() => matches
    .filter((match) => match.competition === competition && match.category === category)
    .sort((a, b) => a.round - b.round || a.order - b.order), [matches, competition, category]);

  if (checking) return <main className="route-state"><LoaderCircle className="spin" /><h1>Verificando sesión Staff…</h1></main>;
  if (!user) return <StaffLogin />;

  return <><SiteHeader /><main className="staff-page">
    <header className="staff-heading">
      <div><p className="eyebrow"><span /> Administración Supabase</p><h1>Partidos y fixture</h1><p>Crea, edita o elimina partidos sin modificar GitHub ni volver a desplegar la web.</p></div>
      <div className="form-actions"><Link className="secondary-button" href="/staff/legacy">Jugadores, fotos, clubes y categorías</Link><button className="secondary-button" type="button" onClick={() => signOutStaff()}><LogOut /> Cerrar sesión</button></div>
    </header>

    {notice && <div className={`notice ${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 /> : <AlertTriangle />}<span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Cerrar mensaje"><X /></button></div>}
    {dataError && <div className="notice error"><AlertTriangle /><span>Supabase no está disponible. Los cambios están bloqueados y la web está usando el respaldo local.</span></div>}

    <div className="staff-toolbar">
      <div className="field"><label htmlFor="match-admin-competition">Competencia</label><select id="match-admin-competition" value={competition} onChange={(event) => { const next = event.target.value as Competition; setCompetition(next); setCategory(next === "lff" ? "superior" : "pre-peque"); setCreating(null); }}><option value="league">Liga · Clausura</option><option value="cup">LIFI Cup</option><option value="lff">LFF</option></select></div>
      <div className="field"><label htmlFor="match-admin-category">Categoría</label><select id="match-admin-category" value={category} onChange={(event) => { setCategory(event.target.value as CategoryId); setCreating(null); }}>{availableCategories.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.birthYears}</option>)}</select></div>
      <button className="primary-button" type="button" disabled={status !== "live" || clubs.length < 2} onClick={() => setCreating(emptyMatch(competition, category, selectedMatches.length + 1))}><Plus /> Crear partido</button>
      <span className={`data-status ${status}`}>{status === "live" ? "Supabase conectado" : "Datos de respaldo"}</span>
    </div>

    {creating && <section className="player-form-panel"><h2>Nuevo partido</h2><MatchForm match={creating} clubs={clubs} user={user} disabled={status !== "live"} isNew notify={setNotice} done={() => setCreating(null)} /></section>}

    <section className="player-list-panel">
      <div className="player-list-heading"><div><h2>Fixture editable</h2><p>{selectedMatches.length} partidos en esta categoría</p></div></div>
      {selectedMatches.length ? <div className="staff-player-list">{selectedMatches.map((match) => <MatchRow key={match.id} match={match} clubs={clubs} user={user} disabled={status !== "live"} notify={setNotice} />)}</div> : <div className="empty-state"><AlertTriangle /><h3>No hay partidos cargados</h3><p>Usa “Crear partido” para cargar el fixture directamente en Supabase.</p></div>}
    </section>
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
  return <main className="login-page"><Link className="login-brand" href="/">LIFI<span>.</span></Link><form className="login-card" onSubmit={submit}><span className="login-icon"><ShieldCheck /></span><p className="eyebrow"><span /> Área privada</p><h1>Acceso Staff</h1><p>Usa una cuenta autorizada mediante Supabase Auth.</p><div className="field"><label htmlFor="staff-email">Correo electrónico</label><input id="staff-email" name="email" type="email" autoComplete="username" required /></div><div className="field"><label htmlFor="staff-password">Contraseña</label><input id="staff-password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div>{message && <p className="form-error" role="alert">{message}</p>}<button className="primary-button full" type="submit" disabled={submitting}>{submitting ? <><LoaderCircle className="spin" /> Verificando…</> : <>Ingresar <ShieldCheck /></>}</button></form></main>;
}

function MatchRow({ match, clubs, user, disabled, notify }: { match: Match; clubs: CatalogClub[]; user: User; disabled: boolean; notify: (notice: Notice) => void }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (editing) return <article><MatchForm match={match} clubs={clubs} user={user} disabled={disabled} notify={notify} done={() => setEditing(false)} /></article>;
  return <article><button className="player-main" type="button" onClick={() => setEditing(true)}><span>{match.round}</span><span><strong>{match.home} vs {match.away}</strong><small>{match.date ?? "Fecha por definir"} · {match.time ?? "Hora por definir"} · {match.venue ?? "Cancha por definir"}</small></span></button><dl><div><dt>Estado</dt><dd>{match.status === "played" ? `${match.homeScore}-${match.awayScore}` : match.status}</dd></div><div><dt>Orden</dt><dd>{match.order}</dd></div></dl><button className="icon-danger" type="button" disabled={disabled || deleting} onClick={async () => { if (!window.confirm(`¿Eliminar ${match.home} vs ${match.away}?`)) return; setDeleting(true); try { await deleteMatch(match.id, user); notify({ kind: "success", message: "Partido eliminado de Supabase." }); } catch (error) { notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible eliminar el partido." }); } finally { setDeleting(false); } }} aria-label={`Eliminar ${match.home} vs ${match.away}`}><Trash2 /></button></article>;
}

function MatchForm({ match, clubs, user, disabled, notify, done, isNew = false }: { match: Match; clubs: CatalogClub[]; user: User; disabled: boolean; notify: (notice: Notice) => void; done: () => void; isNew?: boolean }) {
  const [draft, setDraft] = useState(match);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Match>(key: K, value: Match[K]) => setDraft((current) => ({ ...current, [key]: value }));
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || disabled) return;
    if (!draft.home || !draft.away || draft.home === draft.away) {
      notify({ kind: "error", message: "Selecciona dos clubes distintos." });
      return;
    }
    setSaving(true);
    try {
      await saveMatch(draft, user);
      notify({ kind: "success", message: `${draft.home} vs ${draft.away} guardado en Supabase.` });
      done();
    } catch (error) {
      notify({ kind: "error", message: error instanceof Error ? error.message : "No fue posible guardar el partido." });
    } finally { setSaving(false); }
  }
  return <form className="match-editor" onSubmit={submit}><header><strong>{isNew ? "Crear partido" : draft.home || "Local"}</strong><span>vs</span><strong>{draft.away || "Visita"}</strong></header><div className="editor-grid">
    <div className="field"><label>Local</label><select required value={draft.home} onChange={(event) => set("home", event.target.value)}><option value="">Seleccionar</option>{clubs.map((club) => <option key={club.id} value={club.name}>{club.name}</option>)}</select></div>
    <div className="field"><label>Visita</label><select required value={draft.away} onChange={(event) => set("away", event.target.value)}><option value="">Seleccionar</option>{clubs.map((club) => <option key={club.id} value={club.name}>{club.name}</option>)}</select></div>
    <div className="field"><label>Jornada</label><input type="number" min="1" max="99" value={draft.round} onChange={(event) => set("round", Number(event.target.value))} /></div>
    <div className="field"><label>Orden</label><input type="number" min="0" value={draft.order} onChange={(event) => set("order", Number(event.target.value))} /></div>
    <div className="field"><label>Fecha</label><input type="date" value={draft.date ?? ""} onChange={(event) => set("date", event.target.value || null)} /></div>
    <div className="field"><label>Hora</label><input type="time" value={draft.time ?? ""} onChange={(event) => set("time", event.target.value || null)} /></div>
    <div className="field span-2"><label>Cancha</label><input value={draft.venue ?? ""} placeholder="Por definir" onChange={(event) => set("venue", event.target.value || null)} /></div>
    <div className="field"><label>Estado</label><select value={draft.status} onChange={(event) => { const next = event.target.value as Match["status"]; setDraft((current) => ({ ...current, status: next, homeScore: next === "played" ? current.homeScore ?? 0 : null, awayScore: next === "played" ? current.awayScore ?? 0 : null })); }}><option value="scheduled">Programado</option><option value="played">Jugado</option><option value="postponed">Postergado</option><option value="cancelled">Cancelado</option></select></div>
    <div className="score-inputs"><div className="field"><label>Goles local</label><input type="number" min="0" max="99" disabled={draft.status !== "played"} value={draft.homeScore ?? ""} onChange={(event) => set("homeScore", event.target.value === "" ? null : Number(event.target.value))} /></div><div className="field"><label>Goles visita</label><input type="number" min="0" max="99" disabled={draft.status !== "played"} value={draft.awayScore ?? ""} onChange={(event) => set("awayScore", event.target.value === "" ? null : Number(event.target.value))} /></div></div>
  </div><div className="form-actions"><button className="secondary-button" type="button" onClick={done}>Cancelar</button><button className="save-button" type="submit" disabled={disabled || saving}>{saving ? <LoaderCircle className="spin" /> : <Save />} {saving ? "Guardando…" : "Guardar"}</button></div></form>;
}
