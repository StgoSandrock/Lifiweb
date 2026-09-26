import Image from "next/image";
import { getClub } from "@/lib/text";
import type { Club } from "@/types/domain";

export function ClubMark({ name, size = 48, club: suppliedClub }: { name: string; size?: number; club?: Club }) {
  const club = suppliedClub ?? getClub(name);
  if (!club?.logo) return <span className="club-fallback" aria-hidden="true">{name.split(" ").map((part) => part[0]).slice(0, 3).join("")}</span>;
  return (
    <Image
      className={`club-logo${club.id === "diablos-rojos" ? " club-logo--crop" : ""}`}
      src={club.logo}
      alt={`Escudo de ${club.name}`}
      width={size}
      height={size}
      sizes={`${size}px`}
    />
  );
}
