import type { CategoryId, Match } from "@/types/domain";

const WEEK_BY_ROUND: Readonly<Record<number, string>> = {
  "1": "Semana del 31 de agosto de 2026",
  "2": "Semana del 7 de septiembre de 2026",
  "3": "Semana del 21 de septiembre de 2026",
  "4": "Semana del 28 de septiembre de 2026",
  "5": "Semana del 5 de octubre de 2026",
  "6": "Semana del 12 de octubre de 2026",
  "7": "Semana del 19 de octubre de 2026",
  "8": "Semana del 26 de octubre de 2026",
  "9": "Semana del 2 de noviembre de 2026"
};

const CUP_RESULT_OVERRIDES: Readonly<Record<string, readonly [number, number]>> = {
  "cup-2026-peque-f1-p5": [4, 0],
  "cup-2026-mini-f5-p4": [1, 1],
};

function cupRound(
  category: CategoryId,
  roundNumber: number,
  pairs: readonly (readonly [string, string])[],
): Match[] {
  return pairs.map(([home, away], index) => {
    const id = "cup-2026-" + category + "-f" + roundNumber + "-p" + (index + 1);
    const result = CUP_RESULT_OVERRIDES[id];

    return {
      id,
      tournament: "clausura",
      competition: "cup",
      category,
      round: roundNumber,
      order: index + 1,
      home,
      away,
      homeScore: result?.[0] ?? null,
      awayScore: result?.[1] ?? null,
      status: result ? "played" : "scheduled",
      date: WEEK_BY_ROUND[roundNumber] ?? null,
      time: null,
      venue: null,
    };
  });
}

export const CUP_FIXTURES: Match[] = [
  ...cupRound("pre-peque", 1, [["D Rojos","USS"],["Estadio Israelita","F Albo"],["Club Manquehue","Club Palestino"],["Barnechea","Alumni"]]),
  ...cupRound("pre-peque", 2, [["USS","C Club"],["F Albo","D Rojos"],["Club Palestino","Estadio Israelita"],["Alumni","Club Manquehue"]]),
  ...cupRound("pre-peque", 3, [["C Club","F Albo"],["D Rojos","Club Palestino"],["Estadio Israelita","Alumni"],["Club Manquehue","Barnechea"]]),
  ...cupRound("pre-peque", 4, [["Club Palestino","C Club"],["Alumni","D Rojos"],["Barnechea","Estadio Israelita"],["F Albo","USS"]]),
  ...cupRound("pre-peque", 5, [["C Club","Alumni"],["D Rojos","Barnechea"],["Estadio Israelita","Club Manquehue"],["USS","Club Palestino"]]),
  ...cupRound("pre-peque", 6, [["Barnechea","C Club"],["Club Manquehue","D Rojos"],["Alumni","USS"],["Club Palestino","F Albo"]]),
  ...cupRound("pre-peque", 7, [["C Club","Club Manquehue"],["D Rojos","Estadio Israelita"],["USS","Barnechea"],["F Albo","Alumni"]]),
  ...cupRound("pre-peque", 8, [["Estadio Israelita","C Club"],["Club Manquehue","USS"],["Barnechea","F Albo"],["Alumni","Club Palestino"]]),
  ...cupRound("pre-peque", 9, [["C Club","D Rojos"],["USS","Estadio Israelita"],["F Albo","Club Manquehue"],["Club Palestino","Barnechea"]]),
  ...cupRound("peque", 1, [["Estadio Israelita","Alumni"],["Stadio Italiano","C Club"],["Club Manquehue","USS"],["Estadio Español","Club Palestino"],["Barnechea","D Rojos"]]),
  ...cupRound("peque", 2, [["Alumni","D Rojos"],["Club Palestino","Barnechea"],["USS","Estadio Español"],["C Club","Club Manquehue"],["Estadio Israelita","Stadio Italiano"]]),
  ...cupRound("peque", 3, [["Stadio Italiano","Alumni"],["Club Manquehue","Estadio Israelita"],["Estadio Español","C Club"],["Barnechea","USS"],["D Rojos","Club Palestino"]]),
  ...cupRound("peque", 4, [["Alumni","Club Palestino"],["USS","D Rojos"],["C Club","Barnechea"],["Estadio Israelita","Estadio Español"],["Stadio Italiano","Club Manquehue"]]),
  ...cupRound("peque", 5, [["Club Manquehue","Alumni"],["Estadio Español","Stadio Italiano"],["Barnechea","Estadio Israelita"],["D Rojos","C Club"],["Club Palestino","USS"]]),
  ...cupRound("peque", 6, [["Alumni","USS"],["C Club","Club Palestino"],["Estadio Israelita","D Rojos"],["Stadio Italiano","Barnechea"],["Club Manquehue","Estadio Español"]]),
  ...cupRound("peque", 7, [["Estadio Español","Alumni"],["Barnechea","Club Manquehue"],["D Rojos","Stadio Italiano"],["Club Palestino","Estadio Israelita"],["USS","C Club"]]),
  ...cupRound("peque", 8, [["Alumni","C Club"],["Estadio Israelita","USS"],["Stadio Italiano","Club Palestino"],["Club Manquehue","D Rojos"],["Estadio Español","Barnechea"]]),
  ...cupRound("peque", 9, [["Barnechea","Alumni"],["D Rojos","Estadio Español"],["Club Palestino","Club Manquehue"],["USS","Stadio Italiano"],["C Club","Estadio Israelita"]]),
  ...cupRound("mini", 1, [["USS","C Club"],["Alumni","Barnechea"],["Club Manquehue","D Rojos"],["Ultimate S.A.","Club Palestino"]]),
  ...cupRound("mini", 2, [["C Club","Club Palestino"],["D Rojos","Ultimate S.A."],["Barnechea","Club Manquehue"],["USS","Alumni"]]),
  ...cupRound("mini", 3, [["Alumni","C Club"],["Club Manquehue","USS"],["Ultimate S.A.","Barnechea"],["Club Palestino","D Rojos"]]),
  ...cupRound("mini", 4, [["C Club","D Rojos"],["Barnechea","Club Palestino"],["USS","Ultimate S.A."],["Alumni","Club Manquehue"]]),
  ...cupRound("mini", 5, [["Club Manquehue","C Club"],["Ultimate S.A.","Alumni"],["Club Palestino","USS"],["D Rojos","Barnechea"]]),
  ...cupRound("mini", 6, [["C Club","Barnechea"],["USS","D Rojos"],["Alumni","Club Palestino"],["Club Manquehue","Ultimate S.A."]]),
  ...cupRound("mini", 7, [["Ultimate S.A.","C Club"],["Club Palestino","Club Manquehue"],["D Rojos","Alumni"],["Barnechea","USS"]]),
  ...cupRound("infantil", 1, [["Barnechea","D Rojos"],["Club Manquehue","USS"]]),
  ...cupRound("infantil", 2, [["D Rojos","USS"],["Barnechea","Club Manquehue"]]),
  ...cupRound("infantil", 3, [["Club Manquehue","D Rojos"],["USS","Barnechea"]]),
  ...cupRound("infantil", 4, [["D Rojos","Barnechea"],["USS","Club Manquehue"]]),
  ...cupRound("infantil", 5, [["USS","D Rojos"],["Club Manquehue","Barnechea"]]),
  ...cupRound("infantil", 6, [["D Rojos","Club Manquehue"],["Barnechea","USS"]]),
];
