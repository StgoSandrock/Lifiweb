import type { Metadata } from "next";
import { StaffDashboard } from "@/components/staff-dashboard";

export const metadata: Metadata = { title: "Panel Staff", robots: { index: false, follow: false } };

export default function StaffPage() {
  return <StaffDashboard />;
}
