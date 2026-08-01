"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="LIFI, página principal">
        <Image src="/lifi-logo.png" alt="Logo de LIFI" width={52} height={52} priority />
        <span><strong>LIFI</strong><small>Liga Infantil de Fútbol Interestadios</small></span>
      </Link>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="main-nav" aria-label={open ? "Cerrar menú" : "Abrir menú"}>
        {open ? <X /> : <Menu />}
      </button>
      <nav id="main-nav" className={open ? "main-nav is-open" : "main-nav"} aria-label="Navegación principal">
        <a href="#posiciones" onClick={() => setOpen(false)}>Posiciones</a>
        <a href="#fixture" onClick={() => setOpen(false)}>Fixture</a>
        <a href="#clubes" onClick={() => setOpen(false)}>Clubes</a>
        <Link className="staff-link" href="/staff"><ShieldCheck size={17} /> Staff</Link>
      </nav>
    </header>
  );
}
