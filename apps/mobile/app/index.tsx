import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Brand } from "../src/components/ui";
import { colors, radius, shadow } from "../src/theme";

const competitions = [
  {
    id: "league" as const,
    title: "LIFI Liga",
    kicker: "CLAUSURA 2026",
    description: "Posiciones, nueve fechas, fixture oficial, clubes y planteles.",
    colors: ["#174A8D", "#0B2852"] as const,
    icon: "trophy-outline" as const,
  },
  {
    id: "cup" as const,
    title: "LIFI Cup",
    kicker: "COMPETENCIA LIFI",
    description: "Fixture, resultados y la información vigente disponible.",
    colors: ["#8C6810", "#4E3908"] as const,
    icon: "football-outline" as const,
  },
];

export default function LobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 }]} showsVerticalScrollIndicator={false}>
    <View style={styles.topbar}>
      <View style={styles.season}><Ionicons name="sparkles" size={15} color={colors.yellow} /><Text style={styles.seasonText}>TEMPORADA 2026</Text></View>
      <Pressable onPress={() => router.push("/staff")} style={({ pressed }) => [styles.staff, pressed && styles.pressed]} accessibilityRole="button"><Ionicons name="shield-checkmark-outline" size={18} color={colors.white} /><Text style={styles.staffText}>Staff</Text></Pressable>
    </View>

    <View style={styles.brandBlock}>
      <View style={styles.brandMark}><Text style={styles.brandMarkText}>L</Text></View>
      <Brand />
      <Text style={styles.intro}>Toda la información oficial de la liga, ahora también en tu teléfono.</Text>
    </View>

    <View style={styles.cards} accessibilityLabel="Selecciona una competencia">
      {competitions.map((competition) => <Pressable key={competition.id} onPress={() => router.push({ pathname: "/competition/[competition]", params: { competition: competition.id } })} style={({ pressed }) => [styles.cardShell, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Abrir ${competition.title}`}>
        <LinearGradient colors={competition.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.cardIcon}><Ionicons name={competition.icon} size={27} color={colors.yellow} /></View>
          <Text style={styles.cardKicker}>{competition.kicker}</Text>
          <Text style={styles.cardTitle}>{competition.title}</Text>
          <Text style={styles.cardDescription}>{competition.description}</Text>
          <View style={styles.cardAction}><Text style={styles.cardActionText}>INGRESAR</Text><Ionicons name="arrow-forward" size={17} color={colors.navy950} /></View>
          <Ionicons name={competition.icon} size={142} color="rgba(255,255,255,0.045)" style={styles.watermark} />
        </LinearGradient>
      </Pressable>)}
    </View>

    <View style={styles.footer}><View style={styles.footerLine} /><Text style={styles.footerText}>Santiago de Chile · Información oficial en actualización</Text></View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.navy950, flex: 1 },
  content: { flexGrow: 1, gap: 34, paddingHorizontal: 18 },
  topbar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  season: { alignItems: "center", flexDirection: "row", gap: 7 },
  seasonText: { color: "#AFC1DB", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  staff: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.pill, flexDirection: "row", gap: 7, minHeight: 44, paddingHorizontal: 15 },
  staffText: { color: colors.white, fontSize: 12, fontWeight: "800" },
  brandBlock: { gap: 12, marginTop: 20 },
  brandMark: { alignItems: "center", backgroundColor: colors.navy800, borderColor: "rgba(255,255,255,0.12)", borderRadius: 24, borderWidth: 1, height: 76, justifyContent: "center", transform: [{ rotate: "-4deg" }], width: 76 },
  brandMarkText: { color: colors.white, fontSize: 39, fontStyle: "italic", fontWeight: "900" },
  intro: { color: "#91A6C5", fontSize: 14, lineHeight: 21, maxWidth: 430 },
  cards: { gap: 14 },
  cardShell: { ...shadow, borderRadius: radius.lg },
  card: { borderColor: "rgba(255,255,255,0.12)", borderRadius: radius.lg, borderWidth: 1, minHeight: 228, overflow: "hidden", padding: 20 },
  cardIcon: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.11)", borderRadius: 18, height: 48, justifyContent: "center", marginBottom: 22, width: 48 },
  cardKicker: { color: colors.yellow, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  cardTitle: { color: colors.white, fontSize: 29, fontStyle: "italic", fontWeight: "900", letterSpacing: -1, marginTop: 5 },
  cardDescription: { color: "#C7D5EA", fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 265 },
  cardAction: { alignItems: "center", alignSelf: "flex-start", backgroundColor: colors.yellow, borderRadius: radius.pill, flexDirection: "row", gap: 8, marginTop: 18, paddingHorizontal: 13, paddingVertical: 8 },
  cardActionText: { color: colors.navy950, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  watermark: { bottom: -28, position: "absolute", right: -22 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  footer: { alignItems: "center", gap: 12, marginTop: "auto" },
  footerLine: { backgroundColor: "rgba(255,255,255,0.12)", height: 1, width: "100%" },
  footerText: { color: "#778CA9", fontSize: 10, textAlign: "center" },
});
