# Auditoría de modernización · 1 de agosto de 2026

## Fuente elegida

Se comparó `main` (`8a5e18a`, 31-07-2026) con el HTML adjunto. Ambos contenían 1.114 jugadores de respaldo y 225 partidos de Liga. Se eligió `main` porque incluía correcciones posteriores: `inter.png`, logos reales, fixture agrupado por fecha, desempate por goles a favor y eliminación de Fair Play. El adjunto revertía esas mejoras.

Firestore fue la fuente deportiva más completa:

- 10 clubes configurados.
- 5 categorías.
- 1.265 jugadores: 1.264 Liga y 1 LIFI Cup.
- 266 partidos: 225 Liga y 41 LIFI Cup.
- 45 partidos y 9 fechas en cada categoría de Liga.
- 0 jugadores duplicados según nombre normalizado + club + categoría + competencia.
- 0 partidos duplicados según competencia + categoría + fecha + equipos.
- 0 estadísticas precargadas y 0 partidos jugados.
- 0 referencias de datos a clubes antiguos y 0 partidos de Apertura.

El respaldo local conserva 1.114 jugadores y los 225 partidos de Liga. La aplicación lee Firestore en vivo y solo usa el respaldo si falla la conexión; nunca escribe datos faltantes durante la carga.

## Problemas encontrados

- Contraseña Staff visible en JavaScript.
- Autenticación anónima usada como autorización administrativa.
- Reglas actuales permitían escritura sin autenticación y con cuenta anónima; la prueba efímera confirmó ambas y limpió los documentos.
- Borrado y reescritura de jugadores/partidos dentro de listeners de carga.
- Posible reinicio masivo de estadísticas en una migración ejecutada desde el navegador.
- Fechas y horas ficticias al crear partidos.
- Categorías con rangos de nacimiento incorrectos.
- HTML monolítico de 348 KB con más de 2.300 líneas.
- Ausencia de reglas, pruebas, tipos, lint y configuración Vercel en el repositorio.

## Estado de migraciones

No se ejecutó ninguna migración sobre datos deportivos. La auditoría no encontró clubes antiguos ni duplicados en Firestore, por lo que migrar habría añadido riesgo sin beneficio. Los adaptadores mantienen alias idempotentes para lectura y la fuente única usa los nombres vigentes.

Las reglas nuevas están listas, pero deben desplegarse con una cuenta autorizada en Firebase antes de considerar cerrada la corrección de seguridad remota.
