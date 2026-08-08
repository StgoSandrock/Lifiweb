"use client";

import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { TeamPhoto } from "@/types/domain";

export function TeamGallery({ club, photos }: { club: string; photos: TeamPhoto[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % photos.length), 5000);
    return () => window.clearInterval(timer);
  }, [photos.length]);

  if (!photos.length) return <section className="team-gallery empty"><Camera /><div><h4>Galería del equipo</h4><p>Las fotos de este equipo y categoría se publicarán aquí.</p></div></section>;
  const currentPhoto = active % photos.length;
  const previous = () => setActive((current) => (current - 1 + photos.length) % photos.length);
  const next = () => setActive((current) => (current + 1) % photos.length);
  return <section className="team-gallery" aria-label={`Galería de ${club}`}>
    <div className="gallery-stage">
      {photos.map((photo, index) => <Image key={photo.id} src={photo.url} alt={`${club}, foto ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 900px" className={index === currentPhoto ? "active" : ""} />)}
      {photos.length > 1 && <><button type="button" className="gallery-arrow previous" onClick={previous} aria-label="Foto anterior"><ChevronLeft /></button><button type="button" className="gallery-arrow next" onClick={next} aria-label="Foto siguiente"><ChevronRight /></button></>}
      <span className="gallery-count">{currentPhoto + 1} / {photos.length}</span>
    </div>
    {photos.length > 1 && <div className="gallery-dots">{photos.map((photo, index) => <button key={photo.id} type="button" className={index === currentPhoto ? "active" : ""} onClick={() => setActive(index)} aria-label={`Ver foto ${index + 1}`} />)}</div>}
  </section>;
}
