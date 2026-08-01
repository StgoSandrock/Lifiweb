# LIFI App

Aplicación nativa multiplataforma de la Liga Infantil de Fútbol Interestadios, construida con Expo SDK 54, React Native, Expo Router, TypeScript y Firebase.

## Primer hito implementado

- Lobby con acceso independiente a LIFI Liga y LIFI Cup.
- Clausura 2026 con cinco categorías.
- Tabla PJ, PG, PE, PP, GF, GC, DG y PTS calculada desde resultados oficiales.
- Fixture ordenado y agrupado desde Fecha 1 hasta Fecha 9.
- Clubes, escudos y planteles; `inter.png` se usa para Inter.
- Estados de carga, conexión en vivo y respaldo local.
- Acceso Staff mediante Firebase Authentication y rol verificado.
- Edición Staff de fecha, hora, cancha, estado y marcador.
- Creación, edición, búsqueda y eliminación confirmada de jugadores.
- Validaciones compartidas con la web y auditoría `updatedAt`/`updatedBy`.

La app no incluye contraseñas, correos Staff ni secretos. Las escrituras dependen de Authentication y `firestore.rules`.

## Ejecutar en un teléfono

Desde la raíz del repositorio:

```bash
pnpm install
pnpm mobile:start
```

1. Instala Expo Go en Android o iPhone.
2. Conecta el computador y el teléfono a la misma red Wi-Fi.
3. Escanea el QR que aparece en la terminal.
4. Si la red bloquea la conexión local, usa `pnpm --filter @lifi/mobile start --tunnel`.

## Validar

```bash
pnpm mobile:lint
pnpm mobile:typecheck
pnpm mobile:export
```

`mobile:export` crea bundles de producción para Android, iOS y web en `apps/mobile/dist`; esa carpeta es generada y no se sube a Git.

## Builds instalables

El repositorio deja `eas.json` preparado, pero no enlaza una cuenta de Expo sin autorización del propietario.

```bash
cd apps/mobile
pnpm dlx eas-cli@latest login
pnpm dlx eas-cli@latest build:configure
pnpm dlx eas-cli@latest build --profile preview --platform android
pnpm dlx eas-cli@latest build --profile preview --platform ios
```

El build de iOS para dispositivos o App Store requiere una cuenta Apple Developer. Para Google Play se necesita una cuenta de Google Play Console. Antes de publicar hay que revisar los identificadores `cl.lifi.app`, iconos finales, ficha de tienda y política de privacidad.

## Seguridad pendiente fuera del código

El proyecto Firebase todavía debe tener Email/Password habilitado, la cuenta con correo verificado y un documento `staffRoles/{uid}` con `{ active: true }`. También deben desplegarse las reglas seguras incluidas en la raíz del repositorio. Sin esos pasos, el login Staff no puede completarse aunque la interfaz móvil ya esté implementada.
