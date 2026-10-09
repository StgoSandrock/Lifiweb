import { PublicBoard } from "@/components/platform/public-board";
import { slug } from "@/lib/platform/model";
import { notFound } from "next/navigation";
import "@/components/platform/platform.css";
export default async function Page({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  if (!slug.safeParse(org).success) notFound();
  return <PublicBoard org={org} />;
}
