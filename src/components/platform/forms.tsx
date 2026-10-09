"use client";
import { useState, type ReactNode } from "react";
import type {
  Fixture,
  Team,
  Tournament,
  Versioned,
} from "@/lib/platform/model";

export function Form({
  title,
  children,
  submit,
  disabled = false,
}: {
  title: string;
  children: ReactNode;
  submit: (data: FormData) => Promise<void>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="platform-card">
      <h2>{title}</h2>
      <form
        aria-label={title}
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setBusy(true);
          setError("");
          try {
            await submit(new FormData(form));
            form.reset();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "No se pudo guardar.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={disabled || busy}>
          {children}
          <button type="submit" aria-label={`Guardar: ${title}`}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </fieldset>
        {error && (
          <p className="platform-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
export function Field({
  name,
  label,
  type = "text",
  value,
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  value?: string | number;
  required?: boolean;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        maxLength={type === "text" ? 120 : undefined}
      />
    </label>
  );
}
export function CategorySelect({ tournament }: { tournament: Tournament }) {
  return (
    <label>
      Categoría
      <select name="category">
        {tournament.categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </label>
  );
}
export function MatchForm({
  tournament,
  teams,
  match,
  save,
  close,
}: {
  tournament: Tournament;
  teams: Team[];
  match?: Versioned<Fixture>;
  save: (data: Fixture, version: number | null) => Promise<void>;
  close: () => void;
}) {
  const [category, setCategory] = useState(
    match?.category ?? tournament.categories[0],
  );
  return (
    <Form
      title={match ? "Editar partido" : "Nuevo partido"}
      submit={async (data) => {
        const status = String(data.get("status")) as Fixture["status"];
        if (
          status === "played" &&
          (data.get("homeScore") === "" || data.get("awayScore") === "")
        )
          throw new Error(
            "Ingresa los dos marcadores. Cero es un resultado válido.",
          );
        await save(
          {
            id: match?.id ?? `match-${crypto.randomUUID()}`,
            category,
            home: String(data.get("home")),
            away: String(data.get("away")),
            round: Number(data.get("round")),
            date: String(data.get("date")),
            time: String(data.get("time")),
            venue: String(data.get("venue")),
            status,
            homeScore:
              status === "played" ? Number(data.get("homeScore")) : null,
            awayScore:
              status === "played" ? Number(data.get("awayScore")) : null,
            deleted: match?.deleted ?? false,
          },
          match?.version ?? null,
        );
        close();
      }}
    >
      <label>
        Categoría
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {tournament.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      {["home", "away"].map((side, i) => (
        <label key={side}>
          {i ? "Visita" : "Local"}
          <select
            name={side}
            defaultValue={match?.[side as "home" | "away"]}
            required
          >
            <option value="">Selecciona un equipo</option>
            {teams
              .filter((t) => t.category === category && !t.deleted)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>
      ))}
      <Field
        name="round"
        label="Fecha Nº"
        type="number"
        value={match?.round ?? 1}
      />
      <Field
        name="date"
        label="Día"
        type="date"
        value={match?.date}
        required={false}
      />
      <Field
        name="time"
        label="Hora"
        type="time"
        value={match?.time}
        required={false}
      />
      <Field name="venue" label="Sede" value={match?.venue} required={false} />
      <label>
        Estado
        <select name="status" defaultValue={match?.status ?? "scheduled"}>
          <option value="scheduled">Programado</option>
          <option value="played">Jugado</option>
          <option value="postponed">Postergado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </label>
      <Field
        name="homeScore"
        label="Goles local"
        type="number"
        value={match?.homeScore ?? ""}
        required={false}
      />
      <Field
        name="awayScore"
        label="Goles visita"
        type="number"
        value={match?.awayScore ?? ""}
        required={false}
      />
      <button type="button" className="subtle" onClick={close}>
        Cancelar
      </button>
    </Form>
  );
}
