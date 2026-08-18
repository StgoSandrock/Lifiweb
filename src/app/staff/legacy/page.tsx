import type { Metadata } from "next";
import { StaffDashboard } from "@/components/staff-dashboard";

export const metadata: Metadata = { title: "Staff · Jugadores y fotos", robots: { index: false, follow: false } };

export default function LegacyStaffPage() {
  return <StaffDashboard />;
}
