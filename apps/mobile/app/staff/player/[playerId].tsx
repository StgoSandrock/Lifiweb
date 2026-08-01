import { CATEGORIES, CLUBS } from "@shared/config/league";
import { foldText } from "@shared/lib/text";
import type { CategoryId, Competition, Player } from "@shared/types/domain";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { FormField, StaffHeader } from "../../../src/components/staff-shell";
import { CategoryPicker, PrimaryButton, SegmentedControl } from "../../../src/components/ui";
import { useLeagueData } from "../../../src/data-context";
import { savePlayer } from "../../../src/services/staff";
import { useStaffAuth } from "../../../src/staff-auth";
import { colors, radius } from "../../../src/theme";

type PlayerDraft = Omit<Player, "id"> & { id?: string };
const emptyDraft = (competition: Competition, category: CategoryId): PlayerDraft => ({ name: "", position: "Jugador", club: "", category, competition, goals: 0, assists: 0, appearances: 0, yellowCards: 0, redCards: 0 });

export default function PlayerEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ playerId: string; competition?: string; category?: string }>();
  const { user, checking } = useStaffAuth();
  const { players, matches, status } = useLeagueData();
  const existing = players.find((item) => item.id === params.playerId);
  const initialCompetition: Competition = existing?.competition ?? (params.competition === "cup" ? "cup" : "league");
  const initialCategory: CategoryId = existing?.category ?? (CATEGORIES.some((item) => item.id === params.category) ? params.category as CategoryId : "pre-peque");
  const [draft, setDraft] = useState<PlayerDraft>(existing ?? emptyDraft(initialCompetition, initialCategory));
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (existing) setDraft(existing); }, [existing]);
  const clubNames = useMemo(() => [...new Set([
    ...CLUBS.map((club) => club.name),
    ...players.filter((player) => player.competition === draft.competition).map((player) => player.club),
    ...matches.filter((match) => match.competition === draft.competition).flatMap((match) => [match.home, match.away]),
  ])].sort((a, b) => a.localeCompare(b, "es")), [players, matches, draft.competition]);
  if (checking) return <View style={styles.center}><ActivityIndicator color={colors.blue500} /></View>;
  if (!user) return <Redirect href="/staff" />;
  const set = <K extends keyof PlayerDraft>(key: K, value: PlayerDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    if (saving || status !== "live") return;
    const duplicate = players.find((candidate) => candidate.id !== draft.id && candidate.competition === draft.competition && candidate.category === draft.category && candidate.club === draft.club && foldText(candidate.name) === foldText(draft.name));
    if (duplicate) return Alert.alert("Jugador duplicado", "Ya existe un jugador con el mismo nombre, club y categoría.");
    setSaving(true);
    try {
      await savePlayer(draft, user);
      Alert.alert("Jugador guardado", `${draft.name.trim()} fue guardado correctamente.`, [{ text: "Aceptar", onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Revisa los datos e inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
    <StaffHeader title={draft.id ? "Editar jugador" : "Agregar jugador"} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FormField label="Nombre completo"><TextInput value={draft.name} onChangeText={(value) => set("name", value)} style={styles.input} placeholder="Nombre y apellidos" placeholderTextColor="#8794A8" accessibilityLabel="Nombre completo" /></FormField>
      <FormField label="Posición"><TextInput value={draft.position} onChangeText={(value) => set("position", value)} style={styles.input} placeholder="Jugador" placeholderTextColor="#8794A8" accessibilityLabel="Posición" /></FormField>
      <FormField label="Competencia"><SegmentedControl value={draft.competition} options={[{ value: "league", label: "Liga · Clausura", icon: "trophy-outline" }, { value: "cup", label: "LIFI Cup", icon: "football-outline" }]} onChange={(value) => setDraft((current) => ({ ...current, competition: value, club: "" }))} accessibilityLabel="Competencia del jugador" /></FormField>
      <FormField label="Categoría"><CategoryPicker value={draft.category} items={CATEGORIES} onChange={(value) => set("category", value)} /></FormField>
      <FormField label="Club"><View style={styles.clubs}>{clubNames.map((club) => <Pressable key={club} onPress={() => set("club", club)} style={[styles.club, draft.club === club && styles.clubActive]} accessibilityState={{ selected: draft.club === club }}><Text style={[styles.clubText, draft.club === club && styles.clubTextActive]}>{club}</Text></Pressable>)}</View></FormField>
      <FormField label="Estadísticas"><View style={styles.stats}>
        <NumberField label="PJ" value={draft.appearances} onChange={(value) => set("appearances", value)} />
        <NumberField label="Goles" value={draft.goals} onChange={(value) => set("goals", value)} />
        <NumberField label="Asist." value={draft.assists} onChange={(value) => set("assists", value)} />
        <NumberField label="TA" value={draft.yellowCards} onChange={(value) => set("yellowCards", value)} />
        <NumberField label="TR" value={draft.redCards} onChange={(value) => set("redCards", value)} />
      </View></FormField>
      <PrimaryButton label={saving ? "Guardando…" : draft.id ? "Guardar cambios" : "Crear jugador"} icon="save-outline" onPress={submit} disabled={saving || status !== "live" || draft.name.trim().length < 2 || !draft.club} />
    </ScrollView>
  </KeyboardAvoidingView>;
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <View style={styles.numberField}><Text style={styles.numberLabel}>{label}</Text><TextInput value={String(value)} onChangeText={(next) => onChange(Math.max(0, Number(next.replace(/\D/g, "")) || 0))} keyboardType="number-pad" style={styles.numberInput} accessibilityLabel={label} /></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas, flex: 1 },
  center: { alignItems: "center", backgroundColor: colors.canvas, flex: 1, justifyContent: "center" },
  content: { gap: 18, padding: 16, paddingBottom: 44 },
  input: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: 13, borderWidth: 1, color: colors.ink, fontSize: 14, minHeight: 50, paddingHorizontal: 13 },
  clubs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  club: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  clubActive: { backgroundColor: colors.navy800, borderColor: colors.navy800 },
  clubText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  clubTextActive: { color: colors.white },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  numberField: { gap: 5, width: "18%" },
  numberLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", textAlign: "center" },
  numberInput: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 14, fontWeight: "900", minHeight: 48, textAlign: "center" },
});
