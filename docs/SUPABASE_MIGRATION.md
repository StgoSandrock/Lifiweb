# Migración de Lifiweb a Supabase

## Objetivo

Mover el contenido editable de Lifiweb fuera del código y convertir Supabase en la fuente de datos del sistema, sin perder información existente.

La regla de corte es estricta: **no se elimina Firebase, Firestore ni los JSON locales hasta que Supabase haya sido poblado y la verificación de IDs termine correctamente.**

## Datos incluidos

El esquema de `supabase/schema.sql` contempla:

- `clubs`: clubes y metadatos visibles.
- `club_competitions`: participación de cada club en Liga, Cup o LFF.
- `categories`: categorías y años de nacimiento.
- `players`: jugadores y estadísticas existentes.
- `matches`: fixture, resultados, fecha, hora, cancha y estado.
- `team_photos`: fotos administradas por Staff.
- `app_settings`: configuración editable que no debe quedar hardcodeada.
- `staff_users`: autorización Staff separada de los datos públicos.

## Prioridad de las fuentes durante la migración

El script `scripts/migrate-to-supabase.mjs` construye una exportación consolidada con esta prioridad:

1. Firestore actual.
2. JSON/TypeScript local como respaldo.

Si un ID existe en ambos lados, gana Firestore. Así se conservan cambios que hayan sido realizados desde Staff y que todavía no estén reflejados en los archivos del repositorio.

## Protección contra pérdida de datos

Antes de escribir en Supabase el script:

1. Carga los fixtures, jugadores y fotos de respaldo.
2. Intenta leer las colecciones públicas actuales de Firestore.
3. Fusiona ambas fuentes por ID.
4. Normaliza clubes, categorías, competencias y estados.
5. Aborta si encuentra un jugador, partido o foto que no pueda mapearse.
6. Aborta si aparecen IDs duplicados después de la fusión.
7. Crea un respaldo completo en `.migration-backups/`.
8. Calcula SHA-256 del respaldo.

El directorio `.migration-backups/` está ignorado por Git para evitar publicar una copia de los datos de jugadores.

## Variables de entorno

Usar `.env.local` o variables seguras del entorno. Nunca guardar la secret key real en Git.

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Durante la migración también deben seguir disponibles:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_ARTIFACT_ID=...
```

La `SUPABASE_SECRET_KEY` es exclusivamente para el script de migración o procesos de servidor controlados. No debe tener prefijo `NEXT_PUBLIC_` ni `EXPO_PUBLIC_`.

## Preparación de la base

`supabase/schema.sql` es el esquema objetivo revisable. Antes del corte:

1. Ejecutarlo en el proyecto Supabase.
2. Confirmar que todas las tablas existen.
3. Confirmar que RLS está habilitado.
4. Crear al menos un usuario en Supabase Auth.
5. Insertar su `auth.users.id` en `public.staff_users` con `active = true`.
6. Confirmar que un usuario anónimo puede leer los datos públicos pero no escribir.
7. Confirmar que una cuenta autenticada sin registro Staff tampoco puede escribir.
8. Confirmar que la cuenta Staff sí puede insertar, actualizar y eliminar.

## Preflight sin escritura

Con Node 20+:

```bash
node --env-file=.env.local scripts/migrate-to-supabase.mjs
```

O mediante pnpm:

```bash
NODE_OPTIONS="--env-file=.env.local" pnpm migrate:supabase:dry
```

El modo por defecto **no escribe nada en Supabase**. Solo valida y genera el respaldo.

## Aplicar la migración

Solo después de revisar el preflight y el respaldo:

```bash
node --env-file=.env.local scripts/migrate-to-supabase.mjs --apply
```

El script hace `upsert`, por lo que conserva los IDs actuales y puede repetirse sin crear duplicados por ID.

Al terminar consulta de nuevo Supabase y verifica que todos los IDs esperados de categorías, clubes, jugadores, partidos y fotos existan.

## Criterio de corte

No cambiar producción a Supabase hasta cumplir todos estos puntos:

- [ ] El preflight termina sin errores.
- [ ] Existe un respaldo `.migration-backups/lifi-pre-supabase-*.json` y su SHA-256 está registrado.
- [ ] El esquema está aplicado en Supabase.
- [ ] El `--apply` termina con todos los IDs verificados.
- [ ] El panel Staff puede iniciar sesión con una cuenta autorizada.
- [ ] Staff puede crear y editar un jugador de prueba.
- [ ] Staff puede editar un partido de prueba.
- [ ] Staff puede subir y eliminar una foto de prueba.
- [ ] La web pública muestra los mismos clubes, jugadores, partidos, resultados y fotos que antes del corte.
- [ ] Se comparan conteos Firestore vs. Supabase y cualquier diferencia está explicada.
- [ ] Se valida en móvil y escritorio.

## Retiro del contenido hardcodeado

Solo después del corte exitoso se puede hacer una segunda limpieza del repositorio:

- eliminar `src/data/legacy-players.json` como fuente de runtime;
- eliminar `src/data/league-fixtures.json` como fuente de runtime;
- eliminar `src/data/lff-fixtures.ts` como fuente de runtime;
- eliminar `src/data/seed-team-photos.ts` como fuente de runtime;
- retirar adaptadores y reglas de Firestore que ya no tengan uso;
- mover clubes, categorías, temporada activa y demás configuración editable a Supabase.

Los archivos pueden mantenerse temporalmente en historial Git como respaldo, pero no deben seguir alimentando la aplicación una vez confirmado el corte.
