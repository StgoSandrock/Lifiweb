"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return <main className="route-state"><h1>No pudimos cargar esta sección</h1><p>Revisa tu conexión e inténtalo nuevamente.</p><button className="primary-button" onClick={reset}>Reintentar</button></main>;
}
