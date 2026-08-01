import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import { Brand } from "./ui";

export function StaffHeader({ title, action }: { title: string; action?: ReactNode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
    <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="arrow-back" size={22} color={colors.white} /></Pressable>
    <View style={styles.heading}><Brand compact /><Text style={styles.title}>{title}</Text></View>
    <View style={styles.action}>{action}</View>
  </View>;
}

export function FormField({ label, children, hint, style }: PropsWithChildren<{ label: string; hint?: string; style?: ViewStyle }>) {
  return <View style={[styles.field, style]}><Text style={styles.label}>{label}</Text>{children}{hint ? <Text style={styles.hint}>{hint}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  header: { alignItems: "center", backgroundColor: colors.navy900, flexDirection: "row", gap: 12, minHeight: 96, paddingBottom: 14, paddingHorizontal: 16 },
  back: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 18, height: 44, justifyContent: "center", width: 44 },
  heading: { flex: 1 },
  title: { color: "#AFC1DB", fontSize: 11, fontWeight: "800", letterSpacing: 0.4, marginTop: -2 },
  action: { minWidth: 44 },
  field: { gap: 7 },
  label: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 16 },
});
