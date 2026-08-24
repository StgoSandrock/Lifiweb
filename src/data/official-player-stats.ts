import type { CategoryId, Player } from "@/types/domain";

type OfficialStat = {
  name: string;
  club: string;
  category: CategoryId;
  goals?: number;
  yellowCards?: number;
  redCards?: number;
};

const OFFICIAL_STATS: OfficialStat[] = [
  { name: "Gaspar Silva", club: "Estadio Español", category: "pre-peque", goals: 1 },
  { name: "Iñaki Pavlovic Varela", club: "Estadio Español", category: "pre-peque", goals: 3 },
  { name: "Martin Espejo Del Canto", club: "Estadio Español", category: "pre-peque", goals: 1 },
  { name: "Agustín Molina", club: "Estadio Español", category: "pre-peque", goals: 1 },
  { name: "Aarón Brady", club: "Estadio Israelita", category: "pre-peque", goals: 1 },
  { name: "Lucas Hazon", club: "Estadio Israelita", category: "pre-peque", goals: 1 },
  { name: "Federico Soriano", club: "Estadio Español", category: "peque", goals: 2 },
  { name: "Íñigo Muñoz", club: "Estadio Español", category: "peque", goals: 1 },
  { name: "Antón Matas", club: "Estadio Español", category: "peque", goals: 1 },
  { name: "Matías Asaro", club: "Estadio Israelita", category: "peque", goals: 1 },
  { name: "Pedro Trujillo Urzua", club: "Estadio Español", category: "mini", goals: 2 },
  { name: "Benjamin Martínez Guimpert", club: "Estadio Español", category: "mini", goals: 1 },
  { name: "Sebastián Vega", club: "Estadio Español", category: "mini", goals: 1 },
  { name: "Benjamín Stern", club: "Estadio Israelita", category: "mini", goals: 1, yellowCards: 2, redCards: 1 },
  { name: "Rodrigo Alvo", club: "Estadio Israelita", category: "infantil", goals: 1 },
  { name: "Martín Chami", club: "Estadio Israelita", category: "infantil", goals: 1 },
  { name: "Pablo Brenner", club: "Estadio Israelita", category: "intermedia", goals: 2, yellowCards: 1 },
  { name: "Sebastian Farias Landa", club: "Estadio Español", category: "intermedia", yellowCards: 1 },
  { name: "Benjamín Balon", club: "Estadio Israelita", category: "intermedia", yellowCards: 1 },
  { name: "Thomas Waltzer", club: "Estadio Croata", category: "pre-peque", goals: 1 },
  { name: "Thomas Lang", club: "Estadio Croata", category: "pre-peque", goals: 1 },
  { name: "Santiago Monsalves", club: "Estadio Croata", category: "pre-peque", goals: 1 },
  { name: "Ignacio Salgado", club: "Inter", category: "pre-peque", goals: 1 },
  { name: "Luka Vucina", club: "Estadio Croata", category: "peque", goals: 4 },
  { name: "Matías Vera", club: "Estadio Croata", category: "peque", goals: 2 },
  { name: "Lucas Waltzer", club: "Estadio Croata", category: "peque", goals: 2 },
  { name: "Sasha Yung", club: "Estadio Croata", category: "peque", goals: 2 },
  { name: "Mateo Salgado", club: "Inter", category: "peque", goals: 2 },
  { name: "Matías Gahona", club: "Estadio Croata", category: "mini", goals: 1 },
  { name: "Samuel Prieto", club: "Estadio Croata", category: "mini", goals: 1 },
  { name: "Kai Marmoria", club: "Estadio Croata", category: "mini", goals: 1 },
  { name: "Agustín Agliati", club: "Estadio Croata", category: "infantil", goals: 1 },
  { name: "Enzo Palavecino", club: "Estadio Croata", category: "intermedia", goals: 4 },
  { name: "Ivo Vucina", club: "Estadio Croata", category: "intermedia", goals: 1 },
  { name: "Clemente Ballesteros", club: "Estadio Croata", category: "intermedia", goals: 1 },
  { name: "Benjamín Urrutia", club: "Estadio Croata", category: "intermedia", goals: 1 },
  { name: "Jose Antonio Garreton Gorostegui", club: "Club Manquehue", category: "intermedia", goals: 2 },
  { name: "Lorenzo Quaas", club: "Club Manquehue", category: "intermedia", goals: 1 },
];

export const OFFICIAL_PLAYER_STATS: Player[] = OFFICIAL_STATS.map((stat, index) => ({
  id: `official-stat-${index + 1}`,
  name: stat.name,
  position: "Jugador",
  club: stat.club,
  category: stat.category,
  competition: "league",
  goals: stat.goals ?? 0,
  assists: 0,
  appearances: 0,
  yellowCards: stat.yellowCards ?? 0,
  redCards: stat.redCards ?? 0,
}));
