import Image from "next/image";
import { getClub } from "@/lib/text";

export function ClubMark({ name, size = 48 }: { name: string; size?: number }) {
  const club = getClub(name);
  if (!club) return <span className="club-fallback" aria-hidden="true">{name.slice(0, 3)}</span>;
  return (
    <Image
      className="club-logo"
      src={club.logo}
      alt={`Escudo de ${club.name}`}
      width={size}
      height={size}
      sizes={`${size}px`}
    />
  );
}
