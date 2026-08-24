import type { CategoryId, Player } from "@/types/domain";

type RosterAddition = {
  name: string;
  category: CategoryId;
};

const LIF_ROSTER_ADDITIONS: RosterAddition[] = [
  { name: "Ferran Andrés Fábrega", category: "pre-peque" },
  { name: "Martín Enrique Cuevas Valderrama", category: "pre-peque" },
  { name: "Clemente Lars Kerkhoff Vera", category: "peque" },
  { name: "Eythan Mateo Urbina Alarcón", category: "peque" },
  { name: "Pablo Benjamín Ibarra Muñoz", category: "peque" },
  { name: "Matías Ignacio Izeta Guerrero", category: "peque" },
  { name: "Facundo Alonso Araya Salazar", category: "peque" },
  { name: "Gael Patricio Bravo Altamirano", category: "mini" },
  { name: "Alonso Hernán Arias Arellano", category: "mini" },
  { name: "Diego Caniuqueo", category: "infantil" },
  { name: "Thomas Paul Vigneaux Muñoz", category: "infantil" },
  { name: "Enzo David Cortés Vidal", category: "infantil" },
  { name: "Vicente Alonso Cabezas Jadrijevic", category: "infantil" },
  { name: "Matías Gabriel Rivarola Grassi", category: "infantil" },
  { name: "Matías Julián Jelve Fuentes", category: "infantil" },
  { name: "Vincenzo Maturana Petersen", category: "infantil" },
  { name: "Ismael Canales", category: "infantil" },
  { name: "Fernando Chaban", category: "infantil" },
  { name: "Ian Gabriel Urriola Cortés", category: "intermedia" },
  { name: "Rodrigo Antonio Collado Orellana", category: "intermedia" },
  { name: "Haral Benjamín Güttler Varas", category: "intermedia" },
  { name: "Mateo Leonardo Gonzalez Lillo", category: "intermedia" },
  { name: "José Tomás Fuentes Figueroa", category: "intermedia" },
  { name: "Agustin Alonso Guerra Álvarez", category: "intermedia" },
  { name: "Yeremi Bastian Aedo Catalan", category: "intermedia" },
  { name: "Leonardo Madariaga Victor Luis Santana", category: "intermedia" },
  { name: "Abraham Francisco Cartes Moraga", category: "intermedia" },
  { name: "Mateo Ignacio Cartes Moraga", category: "intermedia" },
  { name: "Ignacio Torres", category: "intermedia" },
  { name: "Fabio Alonzo Betancourt Vera", category: "intermedia" },
];

export const OFFICIAL_ROSTER_PLAYERS: Player[] = LIF_ROSTER_ADDITIONS.map((player, index) => ({
  id: `official-roster-lif-${index + 1}`,
  name: player.name,
  position: "Jugador",
  club: "LIF",
  category: player.category,
  competition: "league",
  goals: 0,
  assists: 0,
  appearances: 0,
  yellowCards: 0,
  redCards: 0,
}));

export const REMOVED_ROSTER_PLAYERS = new Set([
  "league|intermedia|LIF|amaro andre avila pizarro",
]);
