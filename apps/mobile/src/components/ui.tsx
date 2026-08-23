import { Ionicons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, radius } from "../theme";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <View style={styles.brand}><Text style={[styles.brandTitle, compact && styles.brandTitleCompact]}>LIFI<Text style={styles.brandDot}>.</Text></Text>{!compact && <Text style={styles.brandSubtitle}>Liga de Fútbol Infantil</Text>}</View>;
}

export function Pill({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "yellow" | "green" }) {
  const toneStyle = tone === "yellow" ? styles.pillYellow : tone === "green" ? styles.pillGreen : styles.pillBlue;
  return <View style={[styles.pill, toneStyle]}><Text style={styles.pillText}>{children}</Text></View>;
}

export function SectionTitle({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return <View style={styles.heading}><Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text><Text style={styles.headingTitle}>{title}</Text>{detail ? <Text style={styles.headingDetail}>{detail}</Text> : null}</View>;
}

export function SegmentedControl<T extends string>({ value, options, onChange, accessibilityLabel }: { value: T; options: readonly { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[]; onChange: (value: T) => void; accessibilityLabel: string }) {
  return <View style={styles.segmented} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>{options.map((option) => {
    const active = option.value === value;
    return <Pressable key={option.value} onPress={() => onChange(option.value)} accessibilityRole="tab" accessibilityState={{ selected: active }} style={({ pressed }) => [styles.segment, active && styles.segmentActive, pressed && styles.pressed]}>{option.icon ? <Ionicons name={option.icon} size={17} color={active ? colors.white : colors.muted} /> : null}<Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text></Pressable>;
  })}</View>;
}

export function CategoryPicker<T extends string>({ value, items, onChange }: { value: T; items: readonly { id: T; name: string; birthYears: string }[]; onChange: (value: T) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{items.map((item) => {
    const active = item.id === value;
    return <Pressable key={item.id} onPress={() => onChange(item.id)} accessibilityRole="button" accessibilityState={{ selected: active }} style={({ pressed }) => [styles.category, active && styles.categoryActive, pressed && styles.pressed]}><Text style={[styles.categoryName, active && styles.categoryNameActive]}>{item.name}</Text><Text style={[styles.categoryYears, active && styles.categoryYearsActive]}>{item.birthYears}</Text></Pressable>;
  })}</ScrollView>;
}

export function EmptyState({ icon = "information-circle-outline", title, body }: { icon?: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name={icon} size={26} color={colors.blue500} /></View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></View>;
}

export function DataStatus({ status, error }: { status: "loading" | "live" | "fallback"; error: string | null }) {
  if (status === "loading") return <View style={styles.status}><ActivityIndicator color={colors.blue500} /><Text style={styles.statusText}>Sincronizando información oficial…</Text></View>;
  if (status === "fallback") return <View style={[styles.status, styles.statusWarning]}><Ionicons name="cloud-offline-outline" size={19} color={colors.warning} /><Text style={[styles.statusText, styles.statusWarningText]}>{error}</Text></View>;
  return <View style={[styles.status, styles.statusLive]}><View style={styles.liveDot} /><Text style={[styles.statusText, styles.statusLiveText]}>Firebase conectado · información actualizada</Text></View>;
}

export function PrimaryButton({ label, icon, onPress, disabled = false, style }: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean; style?: ViewStyle }) {
  return <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.primaryButton, style, pressed && styles.pressed, disabled && styles.disabled]}>{icon ? <Ionicons name={icon} size={19} color={colors.navy950} /> : null}<Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  brand: { gap: 2 },
  brandTitle: { color: colors.white, fontSize: 48, fontStyle: "italic", fontWeight: "900", letterSpacing: -3 },
  brandTitleCompact: { fontSize: 28, letterSpacing: -1.5 },
  brandDot: { color: colors.yellow },
  brandSubtitle: { color: "#C7D5EA", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  pill: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  pillBlue: { backgroundColor: "rgba(255,255,255,0.12)" },
  pillYellow: { backgroundColor: colors.yellowSoft },
  pillGreen: { backgroundColor: colors.successSoft },
  pillText: { color: colors.ink, fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  heading: { gap: 5 },
  eyebrow: { color: colors.blue500, fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  headingTitle: { color: colors.ink, fontSize: 27, fontWeight: "900", letterSpacing: -0.8 },
  headingDetail: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  segmented: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", padding: 4 },
  segment: { alignItems: "center", borderRadius: 12, flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 44, paddingHorizontal: 8 },
  segmentActive: { backgroundColor: colors.navy800 },
  segmentText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  segmentTextActive: { color: colors.white },
  pressed: { opacity: 0.72 },
  categories: { gap: 10, paddingRight: 18 },
  category: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, minWidth: 112, paddingHorizontal: 14, paddingVertical: 11 },
  categoryActive: { backgroundColor: colors.navy800, borderColor: colors.navy800 },
  categoryName: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  categoryNameActive: { color: colors.white },
  categoryYears: { color: colors.muted, fontSize: 11, marginTop: 2 },
  categoryYearsActive: { color: "#C7D5EA" },
  empty: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: 8, padding: 28 },
  emptyIcon: { alignItems: "center", backgroundColor: colors.blue100, borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: "900", textAlign: "center" },
  emptyBody: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  status: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: "row", gap: 9, paddingHorizontal: 13, paddingVertical: 11 },
  statusWarning: { backgroundColor: colors.warningSoft, borderColor: "#F1D48D" },
  statusLive: { backgroundColor: colors.successSoft, borderColor: "#B9E2C8" },
  statusText: { color: colors.muted, flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  statusWarningText: { color: colors.warning },
  statusLiveText: { color: colors.success },
  liveDot: { backgroundColor: colors.success, borderRadius: 4, height: 8, width: 8 },
  primaryButton: { alignItems: "center", backgroundColor: colors.yellow, borderRadius: 14, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 50, paddingHorizontal: 18 },
  primaryButtonText: { color: colors.navy950, fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.5 },
});
