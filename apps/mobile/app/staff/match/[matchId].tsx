import type { Match, MatchStatus } from "@shared/types/domain";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { FormField, StaffHeader } from "../../../src/components/staff-shell";
import { PrimaryButton } from "../../../src/components/ui";
import { useLeagueData } from "../../../src/data-context";
import { saveMatch } from "../../../src/services/staff";
import { useStaffAuth } from "../../../src/staff-auth";
import { colors, radius } from "../../../src/theme";

const statuses: readonly { value: MatchStatus; label: string }[] = [
  { value: "scheduled", label: "Programado" },
  { value: "played", label: "Jugado" },
  { value: "postponed", label: "Postergado" },
  { value: "cancelled", label: "Cancelado" },
];

export default function MatchEditorScreen() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user, checking } = useStaffAuth();
  const { matches, status } = useLeagueData();
  const match = matches.find((item) => item.id === matchId);
  const [draft, setDraft] = useState<Match | null>(match ?? null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (match) setDraft(match); }, [match]);
  if (checking) return <View style={styles.center}><ActivityIndicator color={colors.blue500} /></View>;
  if (!user) return <Redirect href="/staff" />;
  if (!draft) return <View style={styles.center}><Text style={styles.notFound}>Partido no encontrado.</Text><PrimaryButton label="Volver" onPress={() => router.back()} /></View>;
  const set = <K extends keyof Match>(key: K, value: Match[K]) => setDraft((current) => current ? { ...current, [key]: value } : current);
  const setStatus = (next: MatchStatus) => setDraft((current) => current ? { ...current, status: next, homeScore: next === "played" ? current.homeScore : null, awayScore: next === "played" ? current.awayScore : null } : current);
  const submit = async () => {
    if (saving || status !== "live") return;
    setSaving(true);
    try {
      await saveMatch(draft, user);
      Alert.alert("Partido guardado", `${draft.home} vs ${draft.away} fue actualizado correctamente.`, [{ text: "Aceptar", onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Revisa los datos e inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
    <StaffHeader title="Editar partido" />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.matchup}><Team name={draft.home} role="LOCAL" /><View style={styles.vs}><Text style={styles.vsText}>VS</Text></View><Team name={draft.away} role="VISITA" /></View>
      <FormField label="Estado del partido"><View style={styles.statuses}>{statuses.map((item) => <Pressable key={item.value} onPress={() => setStatus(item.value)} style={[styles.status, draft.status === item.value && styles.statusActive]} accessibilityState={{ selected: draft.status === item.value }}><Text style={[styles.statusText, draft.status === item.value && styles.statusTextActive]}>{item.label}</Text></Pressable>)}</View></FormField>
      <View style={styles.twoColumns}>
        <FormField label="Fecha" hint="Formato AAAA-MM-DD" style={styles.column}><TextInput value={draft.date ?? ""} onChangeText={(value) => set("date", value || null)} placeholder="Por definir" placeholderTextColor="#8794A8" style={styles.input} accessibilityLabel="Fecha del partido" /></FormField>
        <FormField label="Hora" hint="Formato HH:MM" style={styles.column}><TextInput value={draft.time ?? ""} onChangeText={(value) => set("time", value || null)} placeholder="Por definir" placeholderTextColor="#8794A8" style={styles.input} accessibilityLabel="Hora del partido" /></FormField>
      </View>
      <FormField label="Cancha"><TextInput value={draft.venue ?? ""} onChangeText={(value) => set("venue", value || null)} placeholder="Por definir" placeholderTextColor="#8794A8" style={styles.input} accessibilityLabel="Cancha" /></FormField>
      <View style={styles.twoColumns}>
        <FormField label={`Goles · ${draft.home}`} style={styles.column}><TextInput value={draft.homeScore === null ? "" : String(draft.homeScore)} onChangeText={(value) => set("homeScore", value === "" ? null : Number(value))} editable={draft.status === "played"} keyboardType="number-pad" placeholder="—" placeholderTextColor="#8794A8" style={[styles.input, draft.status !== "played" && styles.inputDisabled]} accessibilityLabel="Goles local" /></FormField>
        <FormField label={`Goles · ${draft.away}`} style={styles.column}><TextInput value={draft.awayScore === null ? "" : String(draft.awayScore)} onChangeText={(value) => set("awayScore", value === "" ? null : Number(value))} editable={draft.status === "played"} keyboardType="number-pad" placeholder="—" placeholderTextColor="#8794A8" style={[styles.input, draft.status !== "played" && styles.inputDisabled]} accessibilityLabel="Goles visita" /></FormField>
      </View>
      <View style={styles.notice}><Ionicons name="information-circle-outline" size={20} color={colors.blue500} /><Text style={styles.noticeText}>Un 0–0 cuenta solamente cuando el estado es “Jugado”. Los partidos programados se guardan sin marcador.</Text></View>
      <PrimaryButton label={saving ? "Guardando…" : "Guardar partido"} icon="save-outline" onPress={submit} disabled={saving || status !== "live"} />
    </ScrollView>
  </KeyboardAvoidingView>;
}

function Team({ name, role }: { name: string; role: string }) {
  return <View style={styles.team}><Text style={styles.role}>{role}</Text><Text style={styles.teamName}>{name}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1 },
  center: { alignItems: "center", backgroundColor: colors.canvas, flex: 1, gap: 16, justifyContent: "center", padding: 20 },
  notFound: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  content: { gap: 18, padding: 16, paddingBottom: 44 },
  matchup: { alignItems: "stretch", backgroundColor: colors.navy800, borderRadius: radius.lg, flexDirection: "row", minHeight: 112, padding: 16 },
  team: { flex: 1, justifyContent: "center" },
  role: { color: colors.yellow, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  teamName: { color: colors.white, fontSize: 16, fontWeight: "900", lineHeight: 21, marginTop: 5 },
  vs: { alignItems: "center", justifyContent: "center", width: 42 },
  vsText: { color: "#AFC1DB", fontSize: 11, fontWeight: "900" },
  statuses: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  status: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, minHeight: 42, paddingHorizontal: 13, paddingVertical: 11 },
  statusActive: { backgroundColor: colors.navy800, borderColor: colors.navy800 },
  statusText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  statusTextActive: { color: colors.white },
  twoColumns: { flexDirection: "row", gap: 10 },
  column: { flex: 1 },
  input: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: 13, borderWidth: 1, color: colors.ink, fontSize: 14, minHeight: 50, paddingHorizontal: 13 },
  inputDisabled: { backgroundColor: "#E8EDF3", color: colors.muted },
  notice: { alignItems: "flex-start", backgroundColor: colors.blue100, borderRadius: radius.md, flexDirection: "row", gap: 9, padding: 13 },
  noticeText: { color: colors.ink, flex: 1, fontSize: 12, lineHeight: 18 },
});
