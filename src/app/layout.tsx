import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lifi.cl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "LIFI · Liga Infantil de Fútbol Interestadios", template: "%s · LIFI" },
  description: "Fixture, posiciones, resultados y planteles oficiales del Torneo Clausura 2026 de LIFI.",
  applicationName: "LIFI",
  keywords: ["LIFI", "fútbol infantil", "Liga Interestadios", "Clausura 2026", "Santiago"],
  openGraph: {
    title: "LIFI · Clausura 2026",
    description: "Fixture, posiciones y planteles oficiales de la Liga Infantil de Fútbol Interestadios.",
    type: "website",
    locale: "es_CL",
    siteName: "LIFI",
    images: [{ url: "/lifi-logo.svg", width: 512, height: 512, alt: "Logo de LIFI" }],
  },
  icons: { icon: "/lifi-logo.svg", apple: "/lifi-logo.svg" },
};

export const viewport: Viewport = { themeColor: "#071a35", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
