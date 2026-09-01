import { categoriesForCompetition, CLUBS, CUP_CLUBS_BY_CATEGORY, SEASON } from "@shared/config/league";
import { calculateStandings } from "@shared/lib/standings";
import { foldText, getClub } from "@shared/lib/text";
import type { CategoryId, Club, Competition } from "@shared/types/domain";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLeagueData } from "../data-context";
import { colors, radius } from "../theme";
import { ClubsView } from "./clubs-view";
import { FixtureView } from "./fixture-view";
import { StandingsView } from "./standings-view";
import { Brand, CategoryPicker, DataStatus, SectionTitle, SegmentedControl } from "./ui";

type ViewMode = "standings" | "fixture" | "clubs";

const sections = [
  { value: "standings" as const, label: "Posiciones", icon: "stats-chart-outline" as const },
  { value: "fixture" as const, label: "Fixture", icon: "calendar-outline" as const },
  { value: "clubs" as const, label: "Clubes", icon: "shield-outline" as const },
];

export function CompetitionScreen({ competition }: { competition: Competition }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matches, players, status, error } = useLeagueData();
  const [category, setCategory] = useState<CategoryId>(competition === "lff" ? "superior" : competition === "cup" ? "mini" : "pre-peque");
  const [view, setView] = useState<ViewMode>("standings");
  const filteredMatches = useMemo(() => matches.filter((match) => match.competition === competition && match.category === category), [matches, competition, category]);
  const filteredPlayers = useMemo(() => players.filter((player) => player.competition === competition && player.category === category), [players, competition, category]);
  const competitionMatches = useMemo(() => matches.filter((match) => match.competition === competition), [matches, competition]);
  const clubs = useMemo<readonly Club[]>(() => {
    if (competition === "league") return CLUBS;
    const names = [...new Set([
      ...filteredMatches.flatMap((match) => [match.home, match.away]),
      ...filteredPlayers.map((player) => player.club),
      ...(CUP_CLUBS_BY_CATEGORY[category] ?? []).map((club) => club.name),
    ])].sort((a, b) => a.localeCompare(b, "es"));
    return names.map((name) => getClub(name) ?? { id: `cup-${foldText(name).replace(/\s+/g, "-")}`, name, aliases: [], logo: "" });
  }, [category, competition, filteredMatches, filteredPlayers]);
  const standings = useMemo(() => calculateStandings(filteredMatches, clubs), [filteredMatches, clubs]);
  const categories = categoriesForCompetition(competition);
  const categoryInfo = categories.find((item) => item.id === category);
  const openClub = (clubId: string) => router.push({ pathname: "/club/[clubId]", params: { clubId, competition, category } });

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <LinearGradient colors={[colors.navy950, colors.navy800]} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Volver al inicio"><Ionicons name="arrow-back" size={22} color={colors.white} /></Pressable>
        <Brand compact />
        <Pressable onPress={() => router.push("/staff")} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Acceso Staff"><Ionicons name="shield-checkmark-outline" size={22} color={colors.white} /></Pressable>
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.kicker}>{competition === "league" ? `TEMPORADA ${SEASON} · TORNEO CLAUSURA` : "COMPETENCIA LIFI"}</Text>
        <Text style={styles.title}>LIFI <Text>{competition === "league" ? "Liga" : "Cup"}</Text></Text>
        <Text style={styles.description}>{competition === "league" ? "Fixture, posiciones y planteles oficiales de la Liga de Fútbol Infantil." : "Fixture, resultados y planteles vigentes de LIFI Cup."}</Text>
      </View>
      <View style={styles.metrics}>
        <Metric value={competition === "league" ? "9" : String(new Set(competitionMatches.map((match) => match.roundLabel ?? match.round)).size || "—")} label="fechas" />
        <Metric value={competition === "league" ? "10" : String(new Set(competitionMatches.flatMap((match) => [match.home, match.away])).size || "—")} label="clubes" />
        <Metric value={competition === "league" ? "225" : String(competitionMatches.length || "—")} label="partidos" />
      </View>
    </LinearGradient>

    <View style={styles.body}>
      <DataStatus status={status} error={error} />
      <View style={styles.block}><Text style={styles.controlLabel}>CATEGORÍA</Text><CategoryPicker value={category} items={categories} onChange={setCategory} /></View>
      <SegmentedControl value={view} options={sections} onChange={setView} accessibilityLabel="Sección deportiva" />
      <SectionTitle eyebrow={`${competition === "league" ? "Liga LIFI" : "LIFI Cup"} · ${categoryInfo?.name}`} title={view === "standings" ? "Tabla de posiciones" : view === "fixture" ? "Fixture oficial" : "Clubes y planteles"} detail={view === "standings" ? "PJ, PG, PE, PP, GF, GC, DG y puntos calculados desde resultados oficiales." : undefined} />
      {view === "standings" ? <StandingsView standings={standings} onClub={openClub} /> : view === "fixture" ? <FixtureView matches={filteredMatches} /> : <ClubsView clubs={clubs} players={filteredPlayers} onClub={openClub} />}
    </View>
  </ScrollView>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1 },
  content: { paddingBottom: 42 },
  hero: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, gap: 26, paddingBottom: 24, paddingHorizontal: 18 },
  topbar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  iconButton: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 18, height: 44, justifyContent: "center", width: 44 },
  heroCopy: { gap: 8 },
  kicker: { color: colors.yellow, fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: colors.white, fontSize: 42, fontStyle: "italic", fontWeight: "900", letterSpacing: -2 },
  description: { color: "#C7D5EA", fontSize: 14, lineHeight: 21, maxWidth: 500 },
  metrics: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)", borderRadius: radius.md, borderWidth: 1, flexDirection: "row", paddingVertical: 13 },
  metric: { alignItems: "center", borderRightColor: "rgba(255,255,255,0.12)", borderRightWidth: 1, flex: 1 },
  metricValue: { color: colors.white, fontSize: 20, fontWeight: "900" },
  metricLabel: { color: "#AFC1DB", fontSize: 10, fontWeight: "700", marginTop: 2 },
  body: { gap: 18, paddingHorizontal: 16, paddingTop: 18 },
  block: { gap: 8 },
  controlLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
});
