import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LeagueDataProvider } from "../src/data-context";
import { colors } from "../src/theme";

export default function RootLayout() {
  return <GestureHandlerRootView style={{ flex: 1 }}>
    <LeagueDataProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: "slide_from_right" }} />
    </LeagueDataProvider>
  </GestureHandlerRootView>;
}
