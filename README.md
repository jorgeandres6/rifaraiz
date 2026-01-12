<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Vs7TGYu18XORYdwYNjFmXT5nami3r1Ic

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## 🔌 Firebase (opcional)

Para usar Firebase en este proyecto:

1. Instala la dependencia:
   `npm install firebase`

2. Copia `.env.local.example` a `.env.local` y rellena con tus credenciales del proyecto (no subas `.env.local` al repo):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID` (opcional)

3. Se añade la inicialización en `services/firebase.ts` y exportamos `auth`, `db`, `storage` y funciones para Analytics.

4. Firestore — Ejemplo rápido

   - Hemos incluido helpers en `services/firestore.ts`:
     - `useCollection(collectionName)` — hook React para escuchar colecciones en tiempo real.
     - `getCollection`, `getDocument`, `addDocument`, `setDocument`, `updateDocument`, `deleteDocument`, `listenCollection`.
   - Ejemplo de uso (componente de demo): `components/FirestoreDemo.tsx` — muestra cómo suscribirse a la colección `raffles`.

   Ejemplo de consulta para obtener las últimas 10 rifas:

```ts
import { firestoreQuery, orderBy, limit } from "firebase/firestore";
const q = firestoreQuery(collection(db, "raffles"), orderBy("createdAt", "desc"), limit(10));
const items = await getCollection("raffles", q);
```

5. En Vercel, añade las mismas variables de entorno en la sección Environment Variables para producción.
---

## 🚀 Despliegue en Vercel

1. Conecta tu repositorio a Vercel y selecciona la rama que quieras desplegar.
2. En Settings → Environment Variables añade las mismas claves que tienes en `.env.local` (usa el prefijo `VITE_`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID` (opcional)
3. Build Command: `npm run build` (por defecto Vercel detecta esto). Output directory: `dist`.
4. Opcional: Si usas Authentication, configura las URLs de autorización en la consola de Firebase (p. ej. `https://your-project.vercel.app`).

Una vez configurado, despliega y verifica que las colecciones `raffles` y `tickets` se sincronizan correctamente desde la UI cuando los usuarios creen rifas o compren boletos.
---

# rifaraiz
