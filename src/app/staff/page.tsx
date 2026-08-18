import type { Metadata } from "next";
import { StaffMatchManager } from "@/components/staff-match-manager";

export const metadata: Metadata = { title: "Panel Staff", robots: { index: false, follow: false } };

export default function StaffPage() {
  return <StaffMatchManager />;
}
