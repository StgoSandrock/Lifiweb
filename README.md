# LIFI · Liga Infantil de Fútbol Interestadios

Aplicación oficial del Torneo Clausura 2026. La versión 2 migra el antiguo HTML monolítico a Next.js, TypeScript y Firebase modular, sin resembrar ni modificar automáticamente Firestore.

## Desarrollo

Requisitos: Node.js 20.9 o superior y pnpm.

```bash
pnpm install
pnpm dev
```

Variables opcionales: copia `.env.example` a `.env.local`. La configuración Firebase del cliente es pública; la seguridad real depende de Authentication y `firestore.rules`.

## Validación

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit:firestore
pnpm qa:security
```

`qa:security` crea un documento aislado y efímero; si una regla insegura permite escribir, lo elimina inmediatamente. Nunca usa las colecciones de jugadores o partidos.

## Seguridad Staff

1. En Firebase Console, habilita **Authentication → Sign-in method → Email/Password**.
2. Crea la cuenta Staff y verifica su correo.
3. Copia su UID y crea manualmente `staffRoles/{uid}` con `{ active: true }`, o asigna un custom claim `staff: true` mediante Admin SDK.
4. Despliega las reglas: `npx firebase-tools login` y luego `npx firebase-tools deploy --only firestore:rules --project lifiwebapp`.
5. Ejecuta `pnpm qa:security`: ambos resultados deben indicar `writeAllowed: false` y estado 403.

Los roles no pueden crearse desde el cliente. Las reglas mantienen lectura pública para fixture/planteles y permiten escritura solo a cuentas verificadas con rol.

## Estructura

- `src/config`: fuente única de clubes, alias, logos y categorías.
- `src/types`: modelo de dominio.
- `src/lib/firebase`: configuración, adaptadores, lectura pública y operaciones Staff.
- `src/lib`: clasificación, ordenamiento, normalización y validación.
- `src/components`: interfaz pública y panel Staff.
- `src/data`: respaldo extraído de la última versión válida del HTML.
- `firestore.rules`: autorización y validación de escrituras.
- `scripts`: auditoría de solo lectura y prueba efímera de seguridad.

Consulta [docs/AUDIT.md](docs/AUDIT.md) para los conteos y riesgos encontrados.
