import { CATEGORIES } from "@shared/config/league";
import { foldText } from "@shared/lib/text";
import type { CategoryId, Competition } from "@shared/types/domain";
import { Ionicons } from "@expo/vector-icons";
import type { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CategoryPicker, DataStatus, PrimaryButton, SegmentedControl } from "../../src/components/ui";
import { StaffHeader } from "../../src/components/staff-shell";
import { FixtureView } from "../../src/components/fixture-view";
import { useLeagueData } from "../../src/data-context";
import { deletePlayer, signInStaff, signOutStaff } from "../../src/services/staff";
import { useStaffAuth } from "../../src/staff-auth";
import { colors, radius } from "../../src/theme";

type StaffSection = "matches" | "players";

export default function StaffScreen() {
  const { user, checking } = useStaffAuth();
  if (checking) return <LoadingStaff />;
  if (!user) return <StaffLogin />;
  return <StaffDashboard user={user} />;
}

function LoadingStaff() {
  return <View style={styles.loading}><ActivityIndicator size="large" color={colors.yellow} /><Text style={styles.loadingText}>Verificando sesión Staff…</Text></View>;
}

function StaffLogin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async () => {
    if (submitting || !email.trim() || password.length < 8) return;
    setSubmitting(true);
    setMessage("");
    try {
      await signInStaff(email, password);
    } catch (error) {
      const code = (error as FirebaseError)?.code;
      setMessage(code === "auth/operation-not-allowed" ? "El acceso Email/Password aún no está habilitado en Firebase Authentication." : error instanceof Error && !code ? error.message : "No pudimos iniciar sesión. Verifica tus credenciales y tu rol Staff.");
    } finally {
      setSubmitting(false);
    }
  };
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.loginScreen}>
    <ScrollView contentContainerStyle={[styles.loginContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} style={styles.loginBack} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="arrow-back" size={22} color={colors.white} /></Pressable>
      <View style={styles.loginIntro}><Ionicons name="shield-checkmark" size={44} color={colors.yellow} /><Text style={styles.loginKicker}>ÁREA PRIVADA</Text><Text style={styles.loginTitle}>Acceso Staff</Text><Text style={styles.loginDescription}>Usa una cuenta autorizada mediante Firebase Authentication. La app nunca guarda tu contraseña.</Text></View>
      <View style={styles.loginCard}>
        <Text style={styles.fieldLabel}>Correo electrónico</Text>
        <TextInput value={email} onChangeText={setEmail} accessibilityLabel="Correo electrónico" keyboardType="email-address" autoCapitalize="none" autoComplete="email" style={styles.input} placeholder="nombre@correo.cl" placeholderTextColor="#8794A8" />
        <Text style={styles.fieldLabel}>Contraseña</Text>
        <TextInput value={password} onChangeText={setPassword} accessibilityLabel="Contraseña" secureTextEntry autoCapitalize="none" autoComplete="current-password" style={styles.input} placeholder="Mínimo 8 caracteres" placeholderTextColor="#8794A8" />
        {message ? <View style={styles.error}><Ionicons name="alert-circle-outline" size={18} color={colors.danger} /><Text style={styles.errorText}>{message}</Text></View> : null}
        <PrimaryButton label={submitting ? "Verificando…" : "Ingresar"} icon="shield-checkmark-outline" onPress={submit} disabled={submitting || !email.trim() || password.length < 8} />
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

function StaffDashboard({ user }: { user: User }) {
  const router = useRouter();
  const { matches, players, status, error } = useLeagueData();
  const [competition, setCompetition] = useState<Competition>("league");
  const [category, setCategory] = useState<CategoryId>("pre-peque");
  const [section, setSection] = useState<StaffSection>("matches");
  const [query, setQuery] = useState("");
  const filteredMatches = matches.filter((match) => match.competition === competition && match.category === category);
  const filteredPlayers = useMemo(() => players.filter((player) => player.competition === competition && player.category === category && foldText(player.name).includes(foldText(query))).sort((a, b) => a.name.localeCompare(b.name, "es")), [players, competition, category, query]);
  const remove = (playerId: string, playerName: string) => Alert.alert("Eliminar jugador", `Esta acción eliminará a ${playerName} de Firestore.`, [
    { text: "Cancelar", style: "cancel" },
    { text: "Eliminar", style: "destructive", onPress: async () => {
      try { await deletePlayer(playerId, user); }
      catch { Alert.alert("No se pudo eliminar", "Verifica tu conexión y permisos Staff."); }
    } },
  ]);

  return <View style={styles.dashboard}>
    <StaffHeader title="Panel Staff" action={<Pressable onPress={() => signOutStaff()} style={styles.logout} accessibilityLabel="Cerrar sesión"><Ionicons name="log-out-outline" size={22} color={colors.white} /></Pressable>} />
    <ScrollView contentContainerStyle={styles.dashboardContent} keyboardShouldPersistTaps="handled">
      <View><Text style={styles.dashboardKicker}>ACCESO AUTORIZADO</Text><Text style={styles.dashboardTitle}>Gestión deportiva</Text><Text style={styles.dashboardDescription}>Actualiza información oficial con validaciones y registro de auditoría.</Text></View>
      <DataStatus status={status} error={error} />
      <SegmentedControl value={competition} options={[{ value: "league", label: "Liga · Clausura", icon: "trophy-outline" }, { value: "cup", label: "LIFI Cup", icon: "football-outline" }]} onChange={(value) => { setCompetition(value); if (value === "cup") setCategory("mini"); }} accessibilityLabel="Competencia" />
      <CategoryPicker value={category} items={CATEGORIES} onChange={setCategory} />
      <SegmentedControl value={section} options={[{ value: "matches", label: "Partidos", icon: "calendar-outline" }, { value: "players", label: "Jugadores", icon: "people-outline" }]} onChange={setSection} accessibilityLabel="Tipo de información" />
      {section === "matches" ? <FixtureView matches={filteredMatches} onMatch={(matchId) => router.push({ pathname: "/staff/match/[matchId]", params: { matchId } })} /> : <View style={styles.playerSection}>
        <View style={styles.search}><Ionicons name="search" size={19} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} style={styles.searchInput} placeholder="Buscar jugador…" placeholderTextColor="#8794A8" accessibilityLabel="Buscar jugador" /></View>
        <PrimaryButton label="Agregar jugador" icon="person-add-outline" onPress={() => router.push({ pathname: "/staff/player/[playerId]", params: { playerId: "new", competition, category } })} disabled={status !== "live"} />
        {filteredPlayers.map((player) => <View key={player.id} style={styles.playerRow}>
          <Pressable style={styles.playerMain} onPress={() => router.push({ pathname: "/staff/player/[playerId]", params: { playerId: player.id } })} accessibilityRole="button"><View style={styles.playerInitials}><Text style={styles.playerInitialsText}>{player.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</Text></View><View style={styles.playerCopy}><Text style={styles.playerName}>{player.name}</Text><Text style={styles.playerMeta}>{player.club} · {player.position}</Text></View></Pressable>
          <Pressable onPress={() => remove(player.id, player.name)} style={styles.delete} accessibilityLabel={`Eliminar a ${player.name}`}><Ionicons name="trash-outline" size={20} color={colors.danger} /></Pressable>
        </View>)}
      </View>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", backgroundColor: colors.navy950, flex: 1, gap: 14, justifyContent: "center" },
  loadingText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  loginScreen: { backgroundColor: colors.navy950, flex: 1 },
  loginContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20 },
  loginBack: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 18, height: 44, justifyContent: "center", left: 20, position: "absolute", top: 54, width: 44 },
  loginIntro: { alignItems: "center", gap: 7, marginBottom: 24 },
  loginKicker: { color: colors.yellow, fontSize: 10, fontWeight: "900", letterSpacing: 1.3, marginTop: 8 },
  loginTitle: { color: colors.white, fontSize: 32, fontWeight: "900" },
  loginDescription: { color: "#AFC1DB", fontSize: 13, lineHeight: 19, maxWidth: 360, textAlign: "center" },
  loginCard: { backgroundColor: colors.white, borderRadius: radius.lg, gap: 9, padding: 18 },
  fieldLabel: { color: colors.ink, fontSize: 12, fontWeight: "900", marginTop: 4 },
  input: { backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: 13, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 50, paddingHorizontal: 14 },
  error: { alignItems: "flex-start", backgroundColor: colors.dangerSoft, borderRadius: 12, flexDirection: "row", gap: 8, padding: 11 },
  errorText: { color: colors.danger, flex: 1, fontSize: 12, lineHeight: 17 },
  dashboard: { backgroundColor: colors.canvas, flex: 1 },
  logout: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 18, height: 44, justifyContent: "center", width: 44 },
  dashboardContent: { gap: 17, padding: 16, paddingBottom: 44 },
  dashboardKicker: { color: colors.blue500, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  dashboardTitle: { color: colors.ink, fontSize: 27, fontWeight: "900", marginTop: 4 },
  dashboardDescription: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  playerSection: { gap: 10 },
  search: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 8, paddingHorizontal: 13 },
  searchInput: { color: colors.ink, flex: 1, minHeight: 48 },
  playerRow: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", padding: 10 },
  playerMain: { alignItems: "center", flex: 1, flexDirection: "row", gap: 10 },
  playerInitials: { alignItems: "center", backgroundColor: colors.navy800, borderRadius: 18, height: 40, justifyContent: "center", width: 40 },
  playerInitialsText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  playerCopy: { flex: 1 },
  playerName: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  playerMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  delete: { alignItems: "center", backgroundColor: colors.dangerSoft, borderRadius: 12, height: 40, justifyContent: "center", width: 40 },
});
