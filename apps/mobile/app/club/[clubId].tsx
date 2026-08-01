import { CATEGORIES, CLUBS } from "@shared/config/league";
import { foldText } from "@shared/lib/text";
import type { CategoryId, Competition } from "@shared/types/domain";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClubCrest } from "../../src/components/club-crest";
import { EmptyState } from "../../src/components/ui";
import { useLeagueData } from "../../src/data-context";
import { colors, radius } from "../../src/theme";

export default function ClubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ clubId: string; competition?: string; category?: string }>();
  const { players, matches } = useLeagueData();
  const competition: Competition = params.competition === "cup" ? "cup" : "league";
  const category = CATEGORIES.some((item) => item.id === params.category) ? params.category as CategoryId : competition === "cup" ? "mini" : "pre-peque";
  const names = useMemo(() => [...new Set([
    ...players.filter((player) => player.competition === competition).map((player) => player.club),
    ...matches.filter((match) => match.competition === competition).flatMap((match) => [match.home, match.away]),
  ])], [players, matches, competition]);
  const canonical = CLUBS.find((club) => club.id === params.clubId);
  const clubName = canonical?.name ?? names.find((name) => `cup-${foldText(name).replace(/\s+/g, "-")}` === params.clubId) ?? "Club";
  const roster = players.filter((player) => player.competition === competition && player.category === category && player.club === clubName).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const categoryName = CATEGORIES.find((item) => item.id === category)?.name;

  return <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
    <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="arrow-back" size={22} color={colors.white} /></Pressable>
      <View style={styles.crest}><ClubCrest clubId={canonical?.id} clubName={clubName} size={92} /></View>
      <Text style={styles.eyebrow}>PLANTEL OFICIAL · {categoryName?.toUpperCase()}</Text>
      <Text style={styles.title}>{clubName}</Text>
      <Text style={styles.subtitle}>{roster.length ? `${roster.length} jugadores registrados` : "Plantel por publicar"}</Text>
    </View>
    <View style={styles.body}>{roster.length ? roster.map((player) => <View key={player.id} style={styles.player}>
      <View style={styles.initials}><Text style={styles.initialsText}>{player.name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("")}</Text></View>
      <View style={styles.playerCopy}><Text style={styles.playerName}>{player.name}</Text><Text style={styles.position}>{player.position}</Text></View>
      <View style={styles.stats}><PlayerStat label="PJ" value={player.appearances} /><PlayerStat label="G" value={player.goals} /><PlayerStat label="A" value={player.assists} /></View>
    </View>) : <EmptyState icon="people-outline" title="Plantel por publicar" body="No hay una nómina pública cargada para este club y categoría." />}</View>
  </ScrollView>;
}

function PlayerStat({ label, value }: { label: string; value: number }) {
  return <View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1 },
  hero: { alignItems: "center", backgroundColor: colors.navy900, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 28, paddingHorizontal: 18 },
  back: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 18, height: 44, justifyContent: "center", width: 44 },
  crest: { alignItems: "center", backgroundColor: colors.white, borderRadius: 30, height: 112, justifyContent: "center", marginBottom: 16, width: 112 },
  eyebrow: { color: colors.yellow, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: colors.white, fontSize: 28, fontWeight: "900", marginTop: 5, textAlign: "center" },
  subtitle: { color: "#AFC1DB", fontSize: 13, marginTop: 5 },
  body: { gap: 10, padding: 16 },
  player: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 80, padding: 12 },
  initials: { alignItems: "center", backgroundColor: colors.navy800, borderRadius: 20, height: 44, justifyContent: "center", width: 44 },
  initialsText: { color: colors.white, fontSize: 12, fontWeight: "900" },
  playerCopy: { flex: 1 },
  playerName: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  position: { color: colors.muted, fontSize: 12, marginTop: 3 },
  stats: { flexDirection: "row", gap: 10 },
  statValue: { color: colors.ink, fontSize: 14, fontWeight: "900", textAlign: "center" },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: "800", marginTop: 1, textAlign: "center" },
});
