import { PlatformDashboard } from "@/components/platform/dashboard";
import "@/components/platform/platform.css";
export const metadata = {
  title: "Administración de ligas",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <PlatformDashboard />;
}
