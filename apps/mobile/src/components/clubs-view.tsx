import type { Club, Player } from "@shared/types/domain";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";
import { ClubCrest } from "./club-crest";
import { EmptyState } from "./ui";

export function ClubsView({ clubs, players, onClub }: { clubs: readonly Club[]; players: Player[]; onClub: (clubId: string) => void }) {
  if (!clubs.length) return <EmptyState icon="shield-outline" title="Clubes por publicar" body="Todavía no hay clubes confirmados para esta categoría." />;
  return <View style={styles.grid}>{clubs.map((club) => {
    const count = players.filter((player) => player.club === club.name).length;
    return <Pressable key={club.id} onPress={() => onClub(club.id)} style={({ pressed }) => [styles.club, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Ver plantel de ${club.name}`}>
      <View style={styles.crest}><ClubCrest clubId={club.id} clubName={club.name} size={64} /></View>
      <View style={styles.copy}><Text style={styles.name}>{club.name}</Text><Text style={styles.count}>{count ? `${count} jugadores` : "Plantel por publicar"}</Text></View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>;
  })}</View>;
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  club: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: 13, minHeight: 92, padding: 13 },
  crest: { alignItems: "center", backgroundColor: colors.canvas, borderRadius: 20, height: 66, justifyContent: "center", width: 66 },
  copy: { flex: 1, gap: 3 },
  name: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  count: { color: colors.muted, fontSize: 12 },
  pressed: { backgroundColor: colors.blue100 },
});
