import type { Standing } from "@shared/types/domain";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";
import { ClubCrest } from "./club-crest";
import { EmptyState } from "./ui";

export function StandingsView({ standings, onClub }: { standings: Standing[]; onClub: (clubId: string) => void }) {
  if (!standings.length) return <EmptyState title="Tabla aún no publicada" body="Mostraremos las posiciones cuando existan clubes y partidos confirmados para esta categoría." />;

  return <View style={styles.card}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.headerText, styles.position]}>#</Text>
          <Text style={[styles.headerText, styles.club]}>CLUB</Text>
          {columns.map((column) => <Text key={column} style={[styles.headerText, styles.stat]}>{column}</Text>)}
        </View>
        {standings.map((standing, index) => <Pressable key={standing.club.id} onPress={() => onClub(standing.club.id)} accessibilityRole="button" accessibilityLabel={`Ver plantel de ${standing.club.name}`} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.position}><View style={[styles.rank, index < 3 && styles.rankTop]}><Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>{index + 1}</Text></View></View>
          <View style={[styles.club, styles.clubCell]}><ClubCrest clubId={standing.club.id} clubName={standing.club.name} size={34} /><Text numberOfLines={2} style={styles.clubName}>{standing.club.name}</Text></View>
          <Text style={styles.stat}>{standing.played}</Text>
          <Text style={styles.stat}>{standing.won}</Text>
          <Text style={styles.stat}>{standing.drawn}</Text>
          <Text style={styles.stat}>{standing.lost}</Text>
          <Text style={styles.stat}>{standing.goalsFor}</Text>
          <Text style={styles.stat}>{standing.goalsAgainst}</Text>
          <Text style={styles.stat}>{standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}</Text>
          <Text style={[styles.stat, styles.points]}>{standing.points}</Text>
        </Pressable>)}
      </View>
    </ScrollView>
    <Text style={styles.hint}>Desliza lateralmente para ver todas las estadísticas.</Text>
  </View>;
}

const columns = ["PJ", "PG", "PE", "PP", "GF", "GC", "DG", "PTS"];

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, overflow: "hidden" },
  row: { alignItems: "center", borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: "row", minHeight: 62, paddingHorizontal: 12 },
  headerRow: { backgroundColor: colors.navy900, minHeight: 45 },
  headerText: { color: "#BFCDE2", fontSize: 10, fontWeight: "900" },
  position: { alignItems: "center", justifyContent: "center", width: 42 },
  club: { width: 190 },
  stat: { color: colors.ink, fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "700", textAlign: "center", width: 45 },
  clubCell: { alignItems: "center", flexDirection: "row", gap: 10 },
  clubName: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: "900", lineHeight: 17 },
  rank: { alignItems: "center", backgroundColor: colors.canvas, borderRadius: 13, height: 26, justifyContent: "center", width: 26 },
  rankTop: { backgroundColor: colors.yellowSoft },
  rankText: { color: colors.muted, fontSize: 12, fontWeight: "900" },
  rankTextTop: { color: colors.warning },
  points: { color: colors.blue500, fontWeight: "900" },
  pressed: { backgroundColor: colors.blue100 },
  hint: { color: colors.muted, fontSize: 11, paddingHorizontal: 14, paddingVertical: 11, textAlign: "center" },
});
