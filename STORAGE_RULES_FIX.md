# Solución: Error CORS en Firebase Storage

## El Problema
Estás recibiendo un error CORS al intentar subir imágenes a Firebase Storage. Esto ocurre porque las reglas de seguridad de Firebase Storage no están configuradas.

## La Solución

### Opción 1: Usar Firebase CLI (Recomendado)

1. **Instala Firebase CLI** (si no lo tienen):
   ```bash
   npm install -g firebase-tools
   ```

2. **Auténticate en Firebase**:
   ```bash
   firebase login
   ```

3. **Inicializa Firebase en tu proyecto** (si aún no lo hizo):
   ```bash
   firebase init storage
   ```
   - Selecciona tu proyecto: `rifa-raiz`
   - Usa el archivo de reglas por defecto o reemplázalo

4. **Reemplaza las reglas de storage**:
   - Abre `storage.rules` en la raíz del proyecto
   - Usa las reglas proporcionadas en el archivo `storage.rules`

5. **Despliegalas reglas**:
   ```bash
   firebase deploy --only storage
   ```

### Opción 2: Firebase Console (Manual)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `rifa-raiz`
3. En el menú lateral, ve a **Storage** → **Rules**
4. Reemplaza las reglas actuales con:
   ```rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow anyone to read images (public access)
    match /raffles/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
      allow delete: if request.auth != null;
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
   ```
5. Haz clic en **"Publish"** (Publicar)

## Qué Hacen Estas Reglas

- **`allow read: if true`** - Cualquiera puede ver las imágenes (públicas)
- **`allow write: if request.auth != null`** - Solo usuarios autenticados pueden subir/eliminar
- **`allow delete: if request.auth != null`** - Solo usuarios autenticados pueden eliminar

## Verificación

Después de desplegar las reglas:
1. Intenta editar una rifa y subir una imagen nuevamente
2. Si aún hay problemas, revisa:
   - Que el usuario esté autenticado correctamente
   - Los logs de Browser Console para más detalles del error
   - Las reglas de Firebase Storage en Console

## Notas de Seguridad

⚠️ **Estos cambios SOLO permiten subidas si:**
- El usuario está autenticado en Firebase (`request.auth != null`)
- Sigue siendo seguro porque:
  - Las imágenes se almacenan en la carpeta `/raffles/`
  - Solo usuario autenticados pueden escribir
  - Cualquiera puede leerlas (lo cual es correcto para una app pública)

Si necesitas mayor control, puedes ajustar las reglas para que:
- Solo admins puedan subir: `allow write: if request.auth.token.role == 'admin'`
- Subidas a carpetas específicas del usuario: `match /raffles/{userId}/{allPaths=**}`
