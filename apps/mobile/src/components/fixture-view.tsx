import { groupMatchesByRound } from "@shared/lib/fixtures";
import { getClub } from "@shared/lib/text";
import type { Match } from "@shared/types/domain";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow } from "../theme";
import { ClubCrest } from "./club-crest";
import { EmptyState } from "./ui";

export function FixtureView({ matches, onMatch }: { matches: Match[]; onMatch?: (matchId: string) => void }) {
  const groups = groupMatchesByRound(matches);
  if (!groups.length) return <EmptyState icon="calendar-outline" title="Fixture por publicar" body="Todavía no hay partidos confirmados para esta categoría." />;
  return <View style={styles.list}>{groups.map(([round, items]) => <View key={round} style={styles.round}>
    <View style={styles.roundHeader}><View style={styles.roundNumber}><Text>{round === 99 ? "—" : round}</Text></View><View><Text style={styles.roundTitle}>{round === 99 ? items[0]?.roundLabel ?? "Por definir" : `Fecha ${round}`}</Text><Text style={styles.roundDetail}>{items.length} partidos · orden oficial</Text></View></View>
    <View style={styles.matches}>{items.map((match) => <MatchCard key={match.id} match={match} onPress={onMatch ? () => onMatch(match.id) : undefined} />)}</View>
  </View>)}</View>;
}

function MatchCard({ match, onPress }: { match: Match; onPress?: () => void }) {
  const home = getClub(match.home);
  const away = getClub(match.away);
  const played = match.status === "played" && match.homeScore !== null && match.awayScore !== null;
  const status = match.status === "played" ? "Finalizado" : match.status === "postponed" ? "Postergado" : match.status === "cancelled" ? "Cancelado" : "Programado";
  return <Pressable accessibilityRole={onPress ? "button" : undefined} disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.match, onPress && styles.editable, pressed && styles.pressed]}>
    <View style={styles.meta}><Text style={[styles.status, played && styles.statusPlayed]}>{status.toUpperCase()}</Text><View style={styles.metaItem}><Ionicons name="calendar-outline" size={13} color={colors.muted} /><Text>{formatDate(match.date)}</Text></View><View style={styles.metaItem}><Ionicons name="time-outline" size={13} color={colors.muted} /><Text>{match.time ?? "Por definir"}</Text></View></View>
    <View style={styles.teams}>
      <View style={styles.team}><ClubCrest clubId={home?.id} clubName={match.home} size={40} /><Text numberOfLines={2} style={styles.teamName}>{match.home}</Text></View>
      <View style={styles.score}>{played ? <><Text style={styles.scoreValue}>{match.homeScore}</Text><Text style={styles.scoreSeparator}>–</Text><Text style={styles.scoreValue}>{match.awayScore}</Text></> : <Text style={styles.versus}>VS</Text>}</View>
      <View style={[styles.team, styles.teamAway]}><Text numberOfLines={2} style={[styles.teamName, styles.teamNameAway]}>{match.away}</Text><ClubCrest clubId={away?.id} clubName={match.away} size={40} /></View>
    </View>
    <View style={styles.venue}><Ionicons name="location-outline" size={15} color={colors.blue500} /><Text>{match.venue ?? "Por definir"}</Text>{onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}</View>
  </Pressable>;
}

function formatDate(value: string | null) {
  if (!value) return "Por definir";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(date);
}

const styles = StyleSheet.create({
  list: { gap: 22 },
  round: { gap: 11 },
  roundHeader: { alignItems: "center", flexDirection: "row", gap: 11 },
  roundNumber: { alignItems: "center", backgroundColor: colors.yellow, borderRadius: 16, height: 42, justifyContent: "center", width: 42 },
  roundTitle: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  roundDetail: { color: colors.muted, fontSize: 12, marginTop: 1 },
  matches: { gap: 10 },
  match: { ...shadow, backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  editable: { borderColor: "#AFC9EE" },
  pressed: { opacity: 0.75 },
  meta: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingVertical: 9 },
  status: { backgroundColor: colors.blue100, borderRadius: radius.pill, color: colors.blue500, fontSize: 9, fontWeight: "900", letterSpacing: 0.5, overflow: "hidden", paddingHorizontal: 8, paddingVertical: 5 },
  statusPlayed: { backgroundColor: colors.successSoft, color: colors.success },
  metaItem: { alignItems: "center", flexDirection: "row", gap: 4 },
  teams: { alignItems: "center", flexDirection: "row", paddingHorizontal: 13, paddingVertical: 14 },
  team: { alignItems: "center", flex: 1, gap: 8 },
  teamAway: { flexDirection: "row", justifyContent: "flex-end" },
  teamName: { color: colors.ink, flex: 1, fontSize: 12, fontWeight: "900", lineHeight: 16 },
  teamNameAway: { textAlign: "right" },
  score: { alignItems: "center", flexDirection: "row", justifyContent: "center", minWidth: 78 },
  scoreValue: { color: colors.ink, fontSize: 23, fontWeight: "900" },
  scoreSeparator: { color: colors.muted, fontWeight: "700", marginHorizontal: 7 },
  versus: { color: colors.muted, fontSize: 12, fontWeight: "900" },
  venue: { alignItems: "center", backgroundColor: colors.canvas, flexDirection: "row", gap: 6, minHeight: 42, paddingHorizontal: 13 },
});
