"use client";

import { useEffect, useRef } from "react";

export function ScrollFade() {
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-fade]"));
    if (!elements.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    elements.forEach((element) => element.classList.add("scroll-fade-ready"));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.target.classList.toggle("scroll-fade-visible", entry.isIntersecting)),
      { rootMargin: "-9% 0px -9% 0px", threshold: 0.08 },
    );
    elements.forEach((element) => observer.observe(element));
    const updateVeil = () => veilRef.current?.classList.toggle("is-scrolled", window.scrollY > 36);
    updateVeil();
    window.addEventListener("scroll", updateVeil, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", updateVeil); };
  }, []);

  return <div ref={veilRef} className="scroll-fade-veil" aria-hidden="true"><span /><span /></div>;
}
