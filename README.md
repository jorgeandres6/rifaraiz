<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RifaRaiz - Sistema de Rifas con Referidos y Comisiones

Plataforma completa para gestionar rifas en línea con un sistema MLM (multinivel) de referidos y comisiones integrado con Firebase.

## ✨ Características Principales

- 🎲 **Gestión de Rifas**: Crear y administrar rifas con múltiples packs de boletos
- 👥 **Sistema de Referidos**: Código único para cada usuario con árbol de red
- 💰 **Comisiones Automáticas**: 3 niveles de comisiones (10%, 5%, 2%)
- 🔐 **Autenticación**: Email/Contraseña + Google Sign-In con Firebase
- 📊 **Dashboard**: Vista en tiempo real de estatutos, comisiones y referidos
- 🎁 **Premios Extra**: Sistema de premios adicionales por rifa
- 📱 **Responsive**: Optimizado para mobile y desktop
- 🌍 **Multiidioma**: Interfaz en español

## ⚡ Quick Start

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local
# Llenar .env.local con tus credenciales de Firebase

# 3. Ejecutar en desarrollo
npm run dev
```

### Primeros Pasos

1. Registrate sin código de referido (Usuario A)
2. Copia tu código de referido desde el dashboard
3. Registrate nuevamente con ese código (Usuario B)
4. Compra boletos y verifica que las comisiones se crean automáticamente
5. Ve a "Mis Recompensas" para ver tus comisiones

[→ Leer QUICK_START.md para guía detallada](./QUICK_START.md)

## 📚 Documentación

### 🚀 Para Empezar Rápido
- **[QUICK_START.md](./QUICK_START.md)** - Primeros pasos en 5 minutos
- **[SISTEMA_COMPLETO.md](./SISTEMA_COMPLETO.md)** - Visión general completa

### 📖 Documentación Técnica
- **[REFERRALS_COMMISSIONS_SETUP.md](./REFERRALS_COMMISSIONS_SETUP.md)** - Guía completa del sistema
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Detalles técnicos de la implementación
- **[COMMISSIONS_GUIDE.md](./COMMISSIONS_GUIDE.md)** - Cloud Functions (avanzado)

### 🛠️ Otros Recursos
- **[PURCHASE_ORDERS_GUIDE.md](./PURCHASE_ORDERS_GUIDE.md)** - Sistema de órdenes de compra
- **[CHANGELOG.md](./CHANGELOG.md)** - Historial de cambios

## 🔄 Sistema de Comisiones

### Cómo Funciona

```
Usuario A se registra
    ↓
Usuario A genera código "USERA123"
    ↓
Usuario B se registra con código de A
    ↓
Usuario C se registra con código de B
    
Cuando Usuario C compra $100:
  - Usuario B (Nivel 1): $10 (10%)
  - Usuario A (Nivel 2): $5 (5%)
```

### Características

✅ Cálculo automático de comisiones por 3 niveles
✅ Sincronización en tiempo real con Firebase
✅ Dashboard con estadísticas por nivel
✅ Estados PENDING y PAID
✅ Árbol de referidos completo
✅ Estadísticas de red

[→ Leer más en REFERRALS_COMMISSIONS_SETUP.md](./REFERRALS_COMMISSIONS_SETUP.md)

## 🔌 Firebase (Requerido)

Este proyecto utiliza Firebase para autenticación, base de datos en tiempo real y almacenamiento.

### Configuración

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Copia `.env.local.example` a `.env.local` y completa con tus credenciales:

```env
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
VITE_FIREBASE_APP_ID=xxxxx
VITE_FIREBASE_MEASUREMENT_ID=xxxxx
```

3. Habilita los proveedores de autenticación:
   - Email/Password
   - Google Sign-In

4. Crea las colecciones en Firestore:
   - `users`
   - `raffles`
   - `tickets`
   - `commissions`
   - `purchaseOrders`
   - `userPrizes`
   - `rouletteChances`

[→ Helpers en services/firestore.ts para más detalles]

## 🧪 Pruebas

### Ejecutar tests en consola del navegador

```javascript
import { runAllTests } from './commissionsTest'
runAllTests()
```

Tests disponibles:
- ✅ calculateCommissions
- ✅ buildUpline
- ✅ getCommissionStats
- ✅ getNetworkStats

## 📊 Estructura del Proyecto

```
src/
├── App.tsx                 # Componente principal
├── types.ts               # Tipos TypeScript
├── components/            # Componentes React
│   ├── Dashboard.tsx      # Dashboard principal
│   ├── Commissions.tsx    # Panel de comisiones
│   ├── ReferralStats.tsx  # Estadísticas de referidos
│   ├── AdminPanel.tsx     # Panel de administración
│   └── ...
├── services/              # Servicios
│   ├── firebase.ts        # Configuración de Firebase
│   ├── firestore.ts       # Helpers de Firestore
│   ├── auth.ts            # Autenticación
│   ├── commissionService.ts  # ⭐ Sistema de comisiones
│   └── geminiService.ts   # API de Gemini
├── pages/                 # Páginas
└── data/                  # Datos locales (fallback)
```

## 🎮 Uso

### Como Usuario
1. Registrarse con email o Google
2. Copiar código de referido personal
3. Compartir con otros usuarios
4. Comprar boletos y ganar comisiones
5. Ver estadísticas en "Mis Recompensas"

### Como Admin
1. Crear nuevas rifas
2. Configurar packs de boletos
3. Verificar órdenes de compra
4. Administrar premios
5. Procesar comisiones

## 🚀 Deploy

### Vercel (Recomendado)

```bash
npm run build
vercel deploy
```

### Firebase Hosting

```bash
firebase deploy
```

## 📄 Licencia

MIT

## 🤝 Soporte

Para preguntas sobre:
- **Sistema de Comisiones**: Ver `REFERRALS_COMMISSIONS_SETUP.md`
- **Cloud Functions**: Ver `COMMISSIONS_GUIDE.md`
- **Órdenes de Compra**: Ver `PURCHASE_ORDERS_GUIDE.md`
- **Problemas**: Revisar `QUICK_START.md` sección Troubleshooting

---

**Versión**: 1.0
**Status**: ✅ Productivo
**Última actualización**: 28 de Enero, 2026

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

5. Activa los proveedores de autenticación en la consola de Firebase (Authentication → Sign-in method):
   - Habilita **Email/Password** para permitir registro e inicio de sesión con correo/contraseña.
   - Habilita **Google** para permitir inicio con cuenta Google. Asegúrate de añadir `http://localhost:5173` (o tu dominio) en **Authorized domains** y configurar credenciales si solicitan.

6. Email verification & security rules
   - El flujo de registro ahora envía automáticamente un correo de verificación. Los usuarios deben verificar su dirección antes de iniciar sesión con Email/Password.
   - Puedes reenviar el correo de verificación desde la **Configuración** en la app.
   - He incluido un archivo `firestore.rules` con reglas de ejemplo (limita acceso a usuarios autenticados, propietarios y admins). Revisión y ajustes según tu modelo de roles son recomendados.

7. En Vercel, añade las mismas variables de entorno en la sección Environment Variables para producción.
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
