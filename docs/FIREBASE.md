# Activación segura de Firebase

## Paso imprescindible

Desde una terminal con acceso administrativo al proyecto `lifiwebapp`:

```bash
npx firebase-tools login
npx firebase-tools use lifiwebapp
npx firebase-tools deploy --only firestore:rules,storage --project lifiwebapp
```

Es importante desplegar **Firestore y Cloud Storage**. El panel Staff guarda los metadatos de las galerías en Firestore y los archivos de imagen en Firebase Storage; desplegar solamente `firestore:rules` deja la subida de fotos sin las reglas necesarias.

Después ejecuta `pnpm qa:security`. La salida correcta es:

```json
[
  { "label": "unauthenticated", "writeAllowed": false, "status": 403 },
  { "label": "anonymous-auth", "writeAllowed": false, "status": 403 }
]
```

## Alta de Staff sin custom claims

1. Habilita Email/Password en Firebase Authentication.
2. Crea el usuario y verifica su correo.
3. En Firestore crea la colección privada `staffRoles`.
4. Usa el UID exacto como ID del documento y guarda un booleano `active: true`.

Alternativamente, un administrador puede asignar el custom claim `staff: true`. La aplicación y las reglas aceptan ambos mecanismos.

No crees ni publiques service accounts, claves privadas o tokens de CI en el repositorio.
