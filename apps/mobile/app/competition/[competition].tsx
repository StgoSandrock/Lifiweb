import type { Competition } from "@shared/types/domain";
import { Redirect, useLocalSearchParams } from "expo-router";
import { CompetitionScreen } from "../../src/components/competition-screen";

export default function CompetitionRoute() {
  const { competition } = useLocalSearchParams<{ competition: string }>();
  if (competition !== "league" && competition !== "cup") return <Redirect href="/" />;
  return <CompetitionScreen competition={competition as Competition} />;
}
