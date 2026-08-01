# Traspaso de proyecto · LIFI Web

Actualizado: 1 de agosto de 2026.

## Cómo continuar en otro chat de Codex

Abre este repositorio o adjunta el ZIP exportado y usa este mensaje:

> Continúa el proyecto LIFI desde `CODEX_HANDOFF.md`. Trabaja sobre la rama `codex/modernizacion-lifi-2026`, conserva los datos deportivos y no publiques a producción sin validar primero las reglas de Firestore, el build y un preview de Vercel.

## Estado del repositorio

- Repositorio: `StgoSandrock/Lifiweb`.
- Rama de trabajo: `codex/modernizacion-lifi-2026`.
- Último commit funcional: `20b246b` (`style: remove scroll fade effect`).
- La rama está limpia y contiene todos los cambios locales de modernización y traspaso.
- La integración disponible de GitHub tenía acceso de lectura, por lo que la rama aún no fue subida y no existe Pull Request.

## Arquitectura implementada

- Next.js 16, React 19 y TypeScript.
- Firebase modular para Authentication y Firestore.
- `/`: lobby con selección de competencia.
- `/liga`: Clausura 2026, posiciones, fixture y planteles.
- `/lifi-cup`: información Cup existente, incluidos 41 partidos Mini con `Fecha por definir`.
- `/staff`: acceso y administración protegida por Firebase Auth + `staffRoles/{uid}` o custom claims.
- Fuente única de clubes y categorías en `src/config/league.ts`.
- Reglas nuevas en `firestore.rules`.
- Respaldo local en `src/data`, sin escritura o migración automática.

## Estado deportivo auditado

- 10 clubes de Liga.
- 5 categorías.
- 1.265 jugadores en Firestore: 1.264 Liga y 1 Cup.
- 266 partidos: 225 Liga y 41 Cup.
- Liga: 45 partidos y 9 fechas por categoría.
- 0 duplicados detectados.
- 0 estadísticas ficticias y 0 partidos jugados.
- 0 referencias activas a UC Chicureo, Newen, Apertura o Fair Play.

## QA aprobado

- ESLint: aprobado.
- TypeScript: aprobado.
- Vitest: 4 archivos, 11/11 pruebas.
- Build de producción: aprobado.
- Rutas estáticas: `/`, `/liga`, `/lifi-cup`, `/staff`, 404, manifest, robots y sitemap.
- Verificación visual: escritorio y 390 px, sin overflow horizontal.

## Preview actual

- Deployment: `dpl_6vk1eNHDVsPndoZFfjFL5tArzVkF`.
- URL: `https://lifiweb-gkpfo64pt-stgosandrocks-projects.vercel.app`.
- Estado al entregar: `READY`.
- No fue promovido a producción.
- Vercel todavía no está conectado al repositorio de GitHub.

## Pendientes críticos

### Cuenta Staff

La cuenta solicitada no pudo crearse. Firebase respondió `OPERATION_NOT_ALLOWED` porque Email/Password sigue deshabilitado. No existe usuario ni rol parcial y ninguna contraseña fue guardada.

1. Firebase Console → proyecto `lifiwebapp` → Authentication → Sign-in method.
2. Habilitar Email/Password.
3. Crear el usuario solicitado o repetir el alta mediante Identity Toolkit.
4. Crear `staffRoles/{uid}` con `{ active: true, email: "stgosandrock7@gmail.com" }`.
5. Verificar el correo antes de usar las reglas seguras.

### Seguridad Firestore

La auditoría comprobó que las reglas actualmente desplegadas aún permiten escritura pública y anónima. Las reglas seguras están listas en el repositorio, pero deben publicarse:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project lifiwebapp
pnpm qa:security
```

La última prueba debe rechazar tanto escritura pública como anónima.

### GitHub y producción

```bash
git push -u origin codex/modernizacion-lifi-2026
```

Luego abrir un PR hacia `main`, revisar los checks y fusionar. En Vercel, conectar el proyecto `lifiweb` con `StgoSandrock/Lifiweb`, usar `main` como Production Branch, framework Next.js y raíz `./`.

## Comandos de validación

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit:firestore
pnpm qa:security
```

No ejecutar migraciones masivas ni borrar jugadores o partidos para resolver inconsistencias.
