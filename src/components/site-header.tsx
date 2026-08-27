"use client";

import Image from "next/image";
import Link from "next/link";
import { Home, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { LFF_LOGO_DATA_URL } from "@/config/lff-logo";
import type { Competition } from "@/types/domain";

type View = "standings" | "fixture" | "clubs";

export function SiteHeader({ competition, onNavigate }: { competition?: Competition; onNavigate?: (view: View) => void }) {
  const [open, setOpen] = useState(false);
  const basePath = competition === "cup" ? "/lifi-cup" : competition === "lff" ? "/lff" : "/liga";
  const brand = competition === "lff"
    ? { logo: LFF_LOGO_DATA_URL, name: "LFF", description: "Liga Femenina" }
    : competition === "cup"
      ? { logo: "/lifi-cup-logo.jpeg", name: "LIFI Cup", description: "Competencia LIFI" }
      : { logo: "/lifi-logo.jpeg", name: "LIFI", description: "Liga de Fútbol Infantil" };
  const navigate = (view: View) => { onNavigate?.(view); setOpen(false); };
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label={`${brand.name}, página principal`}>
        <Image className="lifi-logo-round" src={brand.logo} alt={`Logo de ${brand.name}`} width={52} height={52} priority unoptimized={competition === "lff"} />
        <span><strong>{brand.name}</strong><small>{brand.description}</small></span>
      </Link>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="main-nav" aria-label={open ? "Cerrar menú" : "Abrir menú"}>
        {open ? <X /> : <Menu />}
      </button>
      <nav id="main-nav" className={open ? "main-nav is-open" : "main-nav"} aria-label="Navegación principal">
        <Link className="home-link" href="/" onClick={() => setOpen(false)}><Home size={16} /> Competencias</Link>
        {competition && <div className="header-competition-switch" aria-label="Cambiar competencia"><Link className={competition === "league" ? "active" : ""} href="/liga">Liga</Link><Link className={competition === "cup" ? "active" : ""} href="/lifi-cup">Cup</Link><Link className={competition === "lff" ? "active" : ""} href="/lff">LFF</Link></div>}
        <a href={`${basePath}#posiciones`} onClick={() => navigate("standings")}>Posiciones</a>
        <a href={`${basePath}#fixture`} onClick={() => navigate("fixture")}>Fixture</a>
        {competition && competition !== "cup" && <a href={`${basePath}#historia`} onClick={() => setOpen(false)}>Historia</a>}
        <a href={`${basePath}#clubes`} onClick={() => navigate("clubs")}>{competition === "lff" ? "Equipos" : "Clubes"}</a>
        <Link className="staff-link" href="/staff"><ShieldCheck size={17} /> Staff</Link>
      </nav>
    </header>
  );
}
