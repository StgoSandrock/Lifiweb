# Operación de ligas

## Acceso

`/gestion` permite abrir una liga por su identificador. Una cuenta Staff LIFI verificada puede crear una organización; su creador queda como administrador. El administrador asigna acceso a correos verificados. Crear una cuenta por sí solo no concede permisos. No se envían invitaciones automáticamente.

- Administrador: temporadas, torneos, equipos, jugadores, resultados, miembros, exportación e importación.
- Editor: resultados y calendarios; no modifica permisos ni planteles.
- Encargado de club: plantel de su identificador de equipo, dentro de la liga asignada.
- Público: torneos publicados y jugadores con publicación autorizada. Los borradores y auditorías son privados.

Los datos nuevos viven en `organizations/{org}`. Las reglas verifican membresía por organización en cada operación. El permiso Staff de LIFI no concede lectura de datos privados de las nuevas ligas. La app móvil y los torneos LIFI existentes continúan usando el modelo legacy; no se migran automáticamente.

## Temporadas y torneos

Crear temporada, crear torneo y categorías, registrar equipos, agregar partidos y publicar. Las categorías y la temporada de un torneo quedan fijadas al crearlo para no dejar datos huérfanos. Victoria/empate/derrota se configuran al crear el torneo. Desempate: diferencia de goles, goles a favor, nombre. Las temporadas archivadas conservan su contenido y bloquean las escrituras deportivas.

Cada escritura deportiva exige versión y auditoría inmutable en la misma transacción. Un segundo editor con una versión antigua recibe un conflicto. Retirar un registro no lo borra: puede restaurarse. El historial conserva datos anteriores; una eliminación definitiva de datos personales requiere un procedimiento de administrador del servicio que abarque auditorías y respaldos.

## Exportación e importación

Resultados CSV compatible con Excel (celdas protegidas frente a fórmulas). Archivo JSON versionado con torneo, equipos, partidos y planteles. No incluye membresías, archivos multimedia, documentos legacy ni auditorías. No es un respaldo integral de Firestore.

La importación valida tamaño (2 MB), liga, identificadores, categorías y referencias. Límites por archivo: 100 equipos, 150 partidos y 150 jugadores. Siempre crea un torneo **nuevo y sin publicar**. Cada registro se confirma con auditoría; ante error permanece un borrador parcial identificado en el mensaje. El torneo original nunca se sobrescribe. Revisar el borrador y comparar conteos antes de publicar.

## Activaciones externas y verificación

1. Desplegar `firestore.rules` con `pnpm exec firebase deploy --only firestore:rules --project lifiwebapp` usando la cuenta propietaria. Ejecutar antes `pnpm test:rules` (Java 21). No se necesitan claves privadas en el repositorio.
2. Comprobar Authentication Email/Password, verificación de correo y dominios autorizados. El propietario debe tener Staff para crear la primera liga.
3. En Vercel, proyecto Lifiweb → Analytics → Enable. El componente está integrado, excluye administración y parámetros URL. Verificar tráfico después del despliegue; no se recuperan visitas previas.
4. Configurar respaldos administrados de Firestore, realizar una restauración en otra base y registrar fecha y resultado. El respaldo de base no incluye objetos de Storage ni cuentas Authentication.
5. Revisar notificaciones de fallos de GitHub Actions. `Production availability` comprueba rutas cada hora. `/api/health` indica salud web; **no afirma disponibilidad de Firestore**.
6. Configurar alertas de presupuesto en Google Cloud y límites/avisos de consumo de Vercel según presupuesto acordado. No se fija un gasto ni se activa facturación automáticamente.

Antes de operar con menores, cada organización debe definir el responsable, contacto, autorizaciones y conservación. No importar documentos personales, direcciones ni datos médicos. El texto `/privacidad` describe el funcionamiento, no sustituye las condiciones de la organización.

## Respaldo y recuperación de infraestructura

Guía oficial: https://firebase.google.com/docs/firestore/backups

Con una sesión autorizada de Google Cloud (comprobar proyecto antes de ejecutar):

```powershell
gcloud firestore backups schedules list --database='(default)' --project=lifiwebapp
gcloud firestore backups schedules create --database='(default)' --project=lifiwebapp --recurrence=daily --retention=7d
```

Crear una programación solo si no existe otra equivalente. La retención y costo deben corresponder a la política de la organización. Restaurar en una **base nueva** con la consola, comparar conteos y resultados y probar con un despliegue de ensayo antes de cambiar tráfico. No restaurar sobre producción. Documentar objetos de Storage y recuperación de cuentas por separado. La programación no queda activa por añadir este archivo.

## Validación de entrega

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:rules`. Las pruebas de reglas usan un proyecto `demo-` y no escriben en producción. Probar con dos ligas, usuarios distintos, un club limitado, borradores, retiro/restauración, conflicto de versión y exportación/importación.

`test:rules` inicia Authentication y Firestore locales, valida las reglas y ejecuta una recuperación real de JSON como torneo borrador. La prueba de integración se omite en `pnpm test` cuando no hay emuladores. El script `seed-local-platform.mjs` solo utiliza loopback y crea una cuenta desechable para comprobaciones visuales.

La web incorpora registros de errores de servidor sin cuerpos de solicitudes, cabeceras ni parámetros personales. Revisarlos en Vercel Logs; la detección de un fallo web no sustituye las alertas de cuota de Firestore ni una prueba de recuperación.
