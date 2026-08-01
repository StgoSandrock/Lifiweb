import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const assets = {
  israelita: require("../../assets/clubs/israelita.png"),
  espanol: require("../../assets/clubs/espanol.png"),
  manquehue: require("../../assets/clubs/manquehue.png"),
  palestino: require("../../assets/clubs/palestino.png"),
  bianconero: require("../../assets/clubs/bianconero.png"),
  italiano: require("../../assets/clubs/italiano.png"),
  lif: require("../../assets/clubs/lif.png"),
  ultimate: require("../../assets/clubs/ultimate.png"),
  croata: require("../../assets/clubs/croata.avif"),
  inter: require("../../assets/clubs/inter.png"),
} as const;

export function ClubCrest({ clubId, clubName, size = 42 }: { clubId?: string; clubName: string; size?: number }) {
  const source = clubId && clubId in assets ? assets[clubId as keyof typeof assets] : null;
  if (!source) {
    const initials = clubName.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("");
    return <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}><Text style={[styles.initials, { fontSize: size * 0.3 }]}>{initials}</Text></View>;
  }
  return <Image source={source} contentFit="contain" style={{ width: size, height: size }} accessibilityLabel={`Escudo de ${clubName}`} />;
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", backgroundColor: colors.blue100, justifyContent: "center" },
  initials: { color: colors.navy800, fontWeight: "900" },
});
