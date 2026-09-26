# Carga de resultados y recuperación

## Arquitectura confirmada

Firestore es la fuente de verdad de Lifiweb. Los partidos viven en
`artifacts/{artifactId}/public/data/partidos`; el ID visible en la aplicación es el ID real del documento.
Los jugadores viven en la colección `jugadores`. La tabla de posiciones se deriva en el cliente a partir
de los partidos jugados, por lo que no existe una segunda tabla que pueda quedar desincronizada.

## Flujo Staff

1. Elegir competencia y categoría.
2. Abrir **Partidos**, buscar el encuentro y pulsar **Abrir marcador**.
3. Usar **+ Gol** o **−** para corregir. Cada gol admite un jugador del plantel correspondiente o
   **Sin asignar**.
4. Pulsar **Guardar resultado**. El mensaje de éxito se muestra solamente después de la confirmación de
   Firestore. Ante un error el editor conserva los cambios locales para reintentar.

El guardado usa una transacción: marcador, estado, eventos de gol, versión y auditoría se confirman juntos.
La versión implementa concurrencia optimista. Si dos personas abren el mismo partido, la segunda no puede
sobrescribir silenciosamente la edición ya confirmada; debe cerrar y volver a abrir el encuentro actualizado.

Cada edición crea un documento inmutable en
`artifacts/{artifactId}/private/data/matchAudits` con usuario, fecha de servidor, versión, valor anterior y
nuevo valor. Sólo Staff puede leer este historial y nadie puede editarlo o borrarlo desde la aplicación.

## Modelo y fuente única

`goalEvents` es una lista embebida en cada partido. Cada elemento contiene un ID, lado (`home`/`away`) y,
de forma opcional, `playerId` y `playerName`. El marcador siempre se calcula contando esos eventos. Los goles
por jugador se recalculan desde los eventos actuales, no mediante incrementos acumulativos; quitar o cambiar
un gol corrige automáticamente las estadísticas sin duplicarlas.

Las asistencias, tarjetas y partidos jugados mantienen por ahora su flujo existente porque el formulario
rápido no captura esos eventos. Cuando una categoría empieza a usar eventos de gol, el campo manual de goles
del jugador queda deshabilitado en Staff.

## Migración sin pérdida

No se ejecuta una migración masiva. Un partido histórico que sólo tenga `golesL` y `golesV` se abre con la
misma cantidad de eventos **Sin asignar**. Su primer guardado escribe `goalEvents` y `version` conservando el
ID original. Las categorías que todavía no contienen partidos con eventos siguen mostrando sus estadísticas
históricas, de modo que el despliegue no borra ni reinicia datos.

Los fixtures incluidos en el código se usan únicamente como respaldo cuando Firestore no contiene ningún
partido de esa competencia. En particular, los partidos LFF de Firestore ya no son reemplazados por fixtures
locales. Los despliegues de Next.js/Vercel no ejecutan escrituras de datos.

## Seguridad y despliegue

Desplegar las reglas junto al código:

```bash
npx firebase-tools use lifiwebapp
npx firebase-tools deploy --only firestore:rules
pnpm qa:security
```

Las reglas públicas permiten lectura, pero requieren usuario autenticado, correo verificado y rol Staff para
escribir. Los resultados deben tener marcador coherente con el número de eventos y aumentar exactamente una
versión. Los seeds o scripts futuros deben ser idempotentes, ejecutarse manualmente y crear únicamente datos
ausentes; nunca deben formar parte del inicio ni del despliegue de producción.

## Backups y recuperación

Recomendación operativa:

- Activar PITR para disponer de versiones a nivel de minuto de los últimos siete días.
- Configurar una copia programada diaria o semanal según el presupuesto y la retención requerida.
- Para retención más larga, programar exportaciones administradas a un bucket de Cloud Storage distinto del
  contenido público de la app.
- Probar periódicamente una restauración en una base nueva antes de necesitarla en producción.

PITR y las exportaciones administradas requieren facturación habilitada y tienen costos de almacenamiento y
operaciones. No se activan desde este repositorio porque son una decisión administrativa del proyecto. La
restauración debe hacerse primero en una base nueva y validarse; no importar a producción a ciegas.

## Verificación local

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Las pruebas cubren 0–0 a 3–2, goleadores opcionales y mixtos, corrección, resultados históricos, recálculo sin
doble conteo y rechazo de una versión concurrente.
