"use client";

import Image from "next/image";
import Link from "next/link";
import { Home, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import type { Competition } from "@/types/domain";

type View = "standings" | "fixture" | "clubs";

export function SiteHeader({ competition, onNavigate }: { competition?: Competition; onNavigate?: (view: View) => void }) {
  const [open, setOpen] = useState(false);
  const basePath = competition === "cup" ? "/lifi-cup" : "/liga";
  const navigate = (view: View) => { onNavigate?.(view); setOpen(false); };
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="LIFI, página principal">
        <Image src="/lifi-logo.svg" alt="Logo de LIFI" width={52} height={52} priority />
        <span><strong>LIFI</strong><small>Liga Infantil de Fútbol Interestadios</small></span>
      </Link>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="main-nav" aria-label={open ? "Cerrar menú" : "Abrir menú"}>
        {open ? <X /> : <Menu />}
      </button>
      <nav id="main-nav" className={open ? "main-nav is-open" : "main-nav"} aria-label="Navegación principal">
        <Link className="home-link" href="/" onClick={() => setOpen(false)}><Home size={16} /> Competencias</Link>
        {competition && <div className="header-competition-switch" aria-label="Cambiar competencia"><Link className={competition === "league" ? "active" : ""} href="/liga">Liga</Link><Link className={competition === "cup" ? "active" : ""} href="/lifi-cup">Cup</Link></div>}
        <a href={`${basePath}#posiciones`} onClick={() => navigate("standings")}>Posiciones</a>
        <a href={`${basePath}#fixture`} onClick={() => navigate("fixture")}>Fixture</a>
        <a href={`${basePath}#clubes`} onClick={() => navigate("clubs")}>Clubes</a>
        <Link className="staff-link" href="/staff"><ShieldCheck size={17} /> Staff</Link>
      </nav>
    </header>
  );
}
