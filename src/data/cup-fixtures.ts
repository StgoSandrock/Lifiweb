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
  // PRE PEQUE
  "cup-2026-pre-peque-f1-p1": [0, 8],
  "cup-2026-pre-peque-f1-p3": [3, 2],
  "cup-2026-pre-peque-f1-p4": [3, 4],
  "cup-2026-pre-peque-f2-p1": [1, 3],
  "cup-2026-pre-peque-f2-p4": [2, 1],
  "cup-2026-pre-peque-f3-p1": [3, 5],
  "cup-2026-pre-peque-f3-p2": [6, 0],
  "cup-2026-pre-peque-f3-p3": [3, 2],
  "cup-2026-pre-peque-f4-p1": [0, 16],
  "cup-2026-pre-peque-f4-p3": [1, 2],
  "cup-2026-pre-peque-f7-p1": [6, 3],
  "cup-2026-pre-peque-f8-p2": [7, 3],
    "cup-2026-pre-peque-f6-p3": [1, 4],
  "cup-2026-pre-peque-f4-p2": [5, 1],
  // PEQUE
  "cup-2026-peque-f1-p1": [2, 2],
  "cup-2026-peque-f1-p2": [4, 2],
  "cup-2026-peque-f1-p3": [3, 2],
  "cup-2026-peque-f2-p2": [4, 0],
  "cup-2026-peque-f2-p4": [4, 2],
  "cup-2026-peque-f2-p5": [0, 2],
  "cup-2026-peque-f3-p1": [8, 2],
  "cup-2026-peque-f3-p2": [1, 1],
  "cup-2026-peque-f3-p3": [6, 3],
  "cup-2026-peque-f3-p5": [1, 0],
  "cup-2026-peque-f4-p1": [12, 2],
  "cup-2026-peque-f4-p2": [0, 1],
  "cup-2026-peque-f4-p3": [1, 0],
  "cup-2026-peque-f4-p4": [6, 2],
  "cup-2026-peque-f4-p5": [4, 1],
  "cup-2026-peque-f7-p3": [1, 0],
  "cup-2026-peque-f8-p1": [12, 2],
  "cup-2026-peque-f8-p2": [2, 3],
    "cup-2026-peque-f5-p3": [3, 3],
    "cup-2026-peque-f6-p1": [2, 10],
  "cup-2026-peque-f2-p1": [5, 0],
  // MINI
  "cup-2026-mini-f1-p3": [3, 2],
  "cup-2026-mini-f1-p4": [1, 2],
  "cup-2026-mini-f2-p2": [3, 3],
  "cup-2026-mini-f2-p3": [2, 0],
  "cup-2026-mini-f2-p4": [1, 0],
  "cup-2026-mini-f3-p1": [1, 1],
  "cup-2026-mini-f3-p4": [2, 0],
  "cup-2026-mini-f4-p1": [11, 3],
  "cup-2026-mini-f4-p2": [3, 1],
  "cup-2026-mini-f4-p3": [2, 1],
  "cup-2026-mini-f5-p2": [3, 11],
  "cup-2026-mini-f5-p4": [0, 2],
  "cup-2026-mini-f6-p4": [1, 1],
  "cup-2026-mini-f7-p4": [5, 2],
  "cup-2026-mini-f8-p1": [4, 2],
  "cup-2026-mini-f9-p3": [0, 9],
  "cup-2026-mini-f9-p4": [2, 3],
    "cup-2026-mini-f2-p1": [3, 3],
  "cup-2026-mini-f5-p1": [5, 0],
  "cup-2026-mini-f7-p3": [0, 4],
  // INFANTIL
  "cup-2026-infantil-f1-p1": [1, 1],
  "cup-2026-infantil-f1-p2": [3, 0],
  "cup-2026-infantil-f2-p1": [0, 1],
  "cup-2026-infantil-f2-p2": [5, 2],
  "cup-2026-infantil-f3-p2": [0, 1],
  "cup-2026-infantil-f4-p1": [3, 1],
  "cup-2026-infantil-f4-p2": [0, 3],
  "cup-2026-infantil-f6-p2": [1, 0],
};

const CUP_MATCH_DETAILS: Readonly<Record<string, Partial<Pick<Match, "date" | "time" | "venue">>>> = {
  "cup-2026-mini-f7-p3": {
    date: "Miércoles 21 de octubre de 2026",
  },
  "cup-2026-pre-peque-f4-p2": {
    date: "Jueves 22 de octubre de 2026",
  },
  "cup-2026-peque-f2-p1": {
    date: "Jueves 22 de octubre de 2026",
  },
  "cup-2026-mini-f5-p1": {
    date: "Jueves 22 de octubre de 2026",
  },

  "cup-2026-peque-f5-p3": {
    date: "Viernes 16 de octubre de 2026",
    time: "17:30",
    venue: "Estadio Israelita",
  },
  "cup-2026-pre-peque-f6-p3": {
    date: "Viernes 16 de octubre de 2026",
    time: "17:00",
    venue: "USS",
  },
  "cup-2026-mini-f9-p4": {
    date: "Viernes 16 de octubre de 2026",
    time: "17:30",
    venue: "San Carlos",
  },
  "cup-2026-peque-f6-p1": {
    date: "Viernes 16 de octubre de 2026",
    time: "18:15",
    venue: "USS",
  },
  "cup-2026-mini-f2-p1": {
    date: "Viernes 16 de octubre de 2026",
    time: "18:15",
    venue: "USS",
  },
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
      ...(CUP_MATCH_DETAILS[id] ?? {}),
    };
  });
}

export const CUP_FIXTURES: Match[] = [
  ...cupRound("pre-peque", 1, [["USS","D Rojos"],["Estadio Israelita","F Albo"],["Club Manquehue","Club Palestino"],["Barnechea","Alumni"]]),
  ...cupRound("pre-peque", 2, [["USS","C Club"],["F Albo","D Rojos"],["Club Palestino","Estadio Israelita"],["Alumni","Club Manquehue"]]),
  ...cupRound("pre-peque", 3, [["C Club","F Albo"],["D Rojos","Club Palestino"],["Estadio Israelita","Alumni"],["Club Manquehue","Barnechea"]]),
  ...cupRound("pre-peque", 4, [["Club Palestino","C Club"],["Alumni","D Rojos"],["Barnechea","Estadio Israelita"],["F Albo","USS"]]),
  ...cupRound("pre-peque", 5, [["C Club","Alumni"],["D Rojos","Barnechea"],["Estadio Israelita","Club Manquehue"],["USS","Club Palestino"]]),
  ...cupRound("pre-peque", 6, [["Barnechea","C Club"],["Club Manquehue","D Rojos"],["USS","Alumni"],["Club Palestino","F Albo"]]),
  ...cupRound("pre-peque", 7, [["Club Manquehue","C Club"],["D Rojos","Estadio Israelita"],["USS","Barnechea"],["F Albo","Alumni"]]),
  ...cupRound("pre-peque", 8, [["Estadio Israelita","C Club"],["Club Manquehue","USS"],["Barnechea","F Albo"],["Alumni","Club Palestino"]]),
  ...cupRound("pre-peque", 9, [["C Club","D Rojos"],["USS","Estadio Israelita"],["F Albo","Club Manquehue"],["Club Palestino","Barnechea"]]),
  ...cupRound("peque", 1, [["Estadio Israelita","Alumni"],["Stadio Italiano","C Club"],["Club Manquehue","USS"],["Estadio Español","Club Palestino"],["Barnechea","D Rojos"]]),
  ...cupRound("peque", 2, [["Alumni","D Rojos"],["Barnechea","Club Palestino"],["USS","Estadio Español"],["Club Manquehue","C Club"],["Stadio Italiano","Estadio Israelita"]]),
  ...cupRound("peque", 3, [["Stadio Italiano","Alumni"],["Club Manquehue","Estadio Israelita"],["Estadio Español","C Club"],["Barnechea","USS"],["D Rojos","Club Palestino"]]),
  ...cupRound("peque", 4, [["Alumni","Club Palestino"],["USS","D Rojos"],["C Club","Barnechea"],["Estadio Israelita","Estadio Español"],["Stadio Italiano","Club Manquehue"]]),
  ...cupRound("peque", 5, [["Club Manquehue","Alumni"],["Estadio Español","Stadio Italiano"],["Estadio Israelita","Barnechea"],["D Rojos","C Club"],["Club Palestino","USS"]]),
  ...cupRound("peque", 6, [["USS","Alumni"],["C Club","Club Palestino"],["Estadio Israelita","D Rojos"],["Stadio Italiano","Barnechea"],["Club Manquehue","Estadio Español"]]),
  ...cupRound("peque", 7, [["Estadio Español","Alumni"],["Barnechea","Club Manquehue"],["D Rojos","Stadio Italiano"],["Club Palestino","Estadio Israelita"],["USS","C Club"]]),
  ...cupRound("peque", 8, [["Alumni","C Club"],["Estadio Israelita","USS"],["Stadio Italiano","Club Palestino"],["Club Manquehue","D Rojos"],["Estadio Español","Barnechea"]]),
  ...cupRound("peque", 9, [["Barnechea","Alumni"],["D Rojos","Estadio Español"],["Club Palestino","Club Manquehue"],["USS","Stadio Italiano"],["C Club","Estadio Israelita"]]),
  ...cupRound("mini", 1, [["Alumni B","USS"],["Barnechea","Club Manquehue"],["Club Palestino","Ultimate S.A."],["C Club","D Rojos"]]),
  ...cupRound("mini", 2, [["USS","Alumni A"],["Alumni B","Ultimate S.A."],["Barnechea","D Rojos"],["Club Palestino","C Club"]]),
  ...cupRound("mini", 3, [["Alumni A","Club Manquehue"],["USS","Ultimate S.A."],["Alumni B","C Club"],["Barnechea","Club Palestino"]]),
  ...cupRound("mini", 4, [["Alumni A","Ultimate S.A."],["Club Manquehue","D Rojos"],["USS","C Club"],["Alumni B","Barnechea"]]),
  ...cupRound("mini", 5, [["Alumni A","D Rojos"],["Ultimate S.A.","C Club"],["Club Manquehue","Club Palestino"],["USS","Barnechea"]]),
  ...cupRound("mini", 6, [["Alumni A","C Club"],["D Rojos","Club Palestino"],["Ultimate S.A.","Barnechea"],["Club Manquehue","Alumni B"]]),
  ...cupRound("mini", 7, [["Alumni A","Club Palestino"],["C Club","Barnechea"],["D Rojos","Alumni B"],["Club Manquehue","USS"]]),
  ...cupRound("mini", 8, [["Alumni A","Barnechea"],["Club Palestino","Alumni B"],["D Rojos","USS"],["Ultimate S.A.","Club Manquehue"]]),
  ...cupRound("mini", 9, [["Alumni A","Alumni B"],["Club Palestino","USS"],["C Club","Club Manquehue"],["Ultimate S.A.","D Rojos"]]),
  ...cupRound("infantil", 1, [["Barnechea","D Rojos"],["Club Manquehue","USS"]]),
  ...cupRound("infantil", 2, [["USS","D Rojos"],["Club Manquehue","Barnechea"]]),
  ...cupRound("infantil", 3, [["Club Manquehue","D Rojos"],["USS","Barnechea"]]),
  ...cupRound("infantil", 4, [["D Rojos","Barnechea"],["USS","Club Manquehue"]]),
  ...cupRound("infantil", 5, [["USS","D Rojos"],["Club Manquehue","Barnechea"]]),
  ...cupRound("infantil", 6, [["D Rojos","Club Manquehue"],["Barnechea","USS"]]),
];
