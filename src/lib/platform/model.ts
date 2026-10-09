import { z } from "zod";

export const slug = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{2,59}$/,
    "Usa entre 3 y 60 letras minúsculas, números o guiones.",
  );
const label = z.string().trim().min(2).max(100);
export const organizationSchema = z.object({
  id: slug,
  name: label,
  contactEmail: z.email(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: z
    .union([
      z.literal(""),
      z
        .url()
        .max(2048)
        .refine(
          (url) => url.startsWith("https://"),
          "El logo debe usar HTTPS.",
        ),
    ])
    .optional(),
  ownerUid: z.string().min(1),
});
export const seasonSchema = z.object({
  id: slug,
  name: label,
  archived: z.boolean(),
});
export const tournamentSchema = z.object({
  id: slug,
  seasonId: slug,
  name: label,
  categories: z
    .array(label)
    .min(1)
    .max(20)
    .refine((a) => new Set(a).size === a.length, "No repitas categorías."),
  winPoints: z.number().int().min(0).max(10),
  drawPoints: z.number().int().min(0).max(10),
  lossPoints: z.number().int().min(0).max(10),
  published: z.boolean(),
});
export const teamSchema = z.object({
  id: slug,
  name: label,
  category: label,
  deleted: z.boolean().default(false),
});
export const fixtureSchema = z
  .object({
    id: slug,
    category: label,
    home: slug,
    away: slug,
    round: z.number().int().min(1).max(999),
    date: z.union([z.literal(""), z.iso.date()]),
    time: z.union([
      z.literal(""),
      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    ]),
    venue: z.string().trim().max(120),
    status: z.enum(["scheduled", "played", "postponed", "cancelled"]),
    homeScore: z.number().int().min(0).max(99).nullable(),
    awayScore: z.number().int().min(0).max(99).nullable(),
    deleted: z.boolean().default(false),
  })
  .refine((m) => m.home !== m.away, "Los equipos deben ser distintos.")
  .refine(
    (m) =>
      m.status === "played"
        ? m.homeScore !== null && m.awayScore !== null
        : m.homeScore === null && m.awayScore === null,
    "Solo un partido jugado puede tener marcador, y necesita ambos resultados.",
  );
export const playerSchema = z.object({
  id: slug,
  name: label,
  teamId: slug,
  category: label,
  published: z.boolean(),
  deleted: z.boolean().default(false),
});
export type Organization = z.infer<typeof organizationSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type Tournament = z.infer<typeof tournamentSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Fixture = z.infer<typeof fixtureSchema>;
export type RosterPlayer = z.infer<typeof playerSchema>;
export type Role = "admin" | "editor" | "club";
export type Member = {
  email: string;
  role: Role;
  teamId: string;
  active: boolean;
};
export type Versioned<T> = T & { version: number };
export const archiveSchema = z
  .object({
    format: z.literal("lifiweb-tournament"),
    version: z.literal(1),
    organizationId: slug,
    exportedAt: z.iso.datetime(),
    tournament: tournamentSchema,
    teams: z.array(teamSchema).max(100),
    matches: z.array(fixtureSchema).max(150),
    players: z.array(playerSchema).max(150),
  })
  .superRefine((data, ctx) => {
    for (const key of ["teams", "matches", "players"] as const) {
      if (new Set(data[key].map((x) => x.id)).size !== data[key].length)
        ctx.addIssue({
          code: "custom",
          message: `Identificadores duplicados en ${key}.`,
          path: [key],
        });
    }
    const teams = new Map(data.teams.map((t) => [t.id, t]));
    for (const team of data.teams)
      if (!data.tournament.categories.includes(team.category))
        ctx.addIssue({
          code: "custom",
          message: "Categoría de equipo no configurada.",
        });
    for (const match of data.matches)
      if (
        !data.tournament.categories.includes(match.category) ||
        [match.home, match.away].some(
          (id) =>
            teams.get(id)?.category !== match.category ||
            (!match.deleted && teams.get(id)?.deleted),
        )
      )
        ctx.addIssue({
          code: "custom",
          message: `Equipos o categoría inválidos en ${match.id}.`,
        });
    for (const player of data.players)
      if (teams.get(player.teamId)?.category !== player.category)
        ctx.addIssue({
          code: "custom",
          message: `Equipo inválido en ${player.id}.`,
        });
  });
export type Archive = z.infer<typeof archiveSchema>;

export function parseArchive(text: string, organizationId: string) {
  if (text.length > 2_000_000) throw new Error("El archivo supera 2 MB.");
  const data = archiveSchema.parse(JSON.parse(text));
  if (data.organizationId !== organizationId)
    throw new Error("El archivo pertenece a otra liga.");
  return data;
}

export function standings(
  tournament: Tournament,
  teams: Team[],
  matches: Fixture[],
) {
  const rows = teams
    .filter((t) => !t.deleted)
    .map((team) => ({
      ...team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
    }));
  const index = new Map(rows.map((row) => [row.id, row]));
  for (const match of matches.filter(
    (m) => !m.deleted && m.status === "played",
  )) {
    const h = index.get(match.home),
      a = index.get(match.away);
    if (
      !h ||
      !a ||
      h.category !== match.category ||
      a.category !== match.category ||
      match.homeScore === null ||
      match.awayScore === null
    )
      continue;
    h.played++;
    a.played++;
    h.gf += match.homeScore;
    h.ga += match.awayScore;
    a.gf += match.awayScore;
    a.ga += match.homeScore;
    if (match.homeScore === match.awayScore) {
      h.drawn++;
      a.drawn++;
      h.points += tournament.drawPoints;
      a.points += tournament.drawPoints;
    } else {
      const winner = match.homeScore > match.awayScore ? h : a,
        loser = winner === h ? a : h;
      winner.won++;
      loser.lost++;
      winner.points += tournament.winPoints;
      loser.points += tournament.lossPoints;
    }
  }
  return rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.gf - b.ga - (a.gf - a.ga) ||
      b.gf - a.gf ||
      a.name.localeCompare(b.name, "es"),
  );
}

export function csvCell(value: unknown) {
  return (
    '"' +
    String(value ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"'
  );
}
export function matchesCsv(matches: Fixture[], teams: Team[]) {
  const names = new Map(teams.map((t) => [t.id, t.name]));
  return (
    "\uFEFF" +
    [
      [
        "Categoría",
        "Fecha",
        "Local",
        "Visita",
        "Goles local",
        "Goles visita",
        "Día",
        "Hora",
        "Sede",
        "Estado",
      ],
      ...matches
        .filter((m) => !m.deleted)
        .map((m) => [
          m.category,
          m.round,
          names.get(m.home),
          names.get(m.away),
          m.homeScore,
          m.awayScore,
          m.date,
          m.time,
          m.venue,
          m.status,
        ]),
    ]
      .map((row) => row.map(csvCell).join(";"))
      .join("\r\n")
  );
}
