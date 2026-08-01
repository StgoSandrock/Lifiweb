import { z } from "zod";
import { CATEGORY_IDS } from "@/config/league";

const category = z.enum(CATEGORY_IDS as [typeof CATEGORY_IDS[number], ...typeof CATEGORY_IDS]);
const optionalText = z.string().trim().max(120).nullable();

export const matchInputSchema = z.object({
  id: z.string().min(1),
  category,
  round: z.number().int().min(1).max(99),
  home: z.string().trim().min(1).max(80),
  away: z.string().trim().min(1).max(80),
  status: z.enum(["scheduled", "played", "postponed", "cancelled"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  venue: optionalText,
  homeScore: z.number().int().min(0).max(99).nullable(),
  awayScore: z.number().int().min(0).max(99).nullable(),
}).superRefine((match, context) => {
  if (match.home === match.away) context.addIssue({ code: "custom", path: ["away"], message: "Local y visita deben ser distintos" });
  if (match.status === "played" && (match.homeScore === null || match.awayScore === null)) {
    context.addIssue({ code: "custom", path: ["homeScore"], message: "Un partido jugado requiere ambos marcadores" });
  }
  if (match.status !== "played" && (match.homeScore !== null || match.awayScore !== null)) {
    context.addIssue({ code: "custom", path: ["homeScore"], message: "Un partido pendiente no debe tener marcador" });
  }
});

export const playerInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(100),
  position: z.string().trim().min(2).max(50),
  club: z.string().trim().min(1).max(80),
  category,
  competition: z.enum(["league", "cup"]),
  goals: z.number().int().min(0).max(999).default(0),
  assists: z.number().int().min(0).max(999).default(0),
  appearances: z.number().int().min(0).max(99).default(0),
  yellowCards: z.number().int().min(0).max(99).default(0),
  redCards: z.number().int().min(0).max(99).default(0),
});
