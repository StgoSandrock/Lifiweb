import Link from "next/link";

export default function NotFound() {
  return <main className="route-state"><strong>404</strong><h1>Fuera de juego</h1><p>La página que buscas no existe.</p><Link className="primary-button" href="/">Volver al inicio</Link></main>;
}
