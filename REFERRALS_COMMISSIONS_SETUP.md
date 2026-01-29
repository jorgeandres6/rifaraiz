# 🎯 Sistema de Referidos y Comisiones - Documentación Completa

## Descripción General

Se ha implementado un **sistema completo de referidos y comisiones** que funciona con Firebase en tiempo real. Ahora cuando un usuario compra boletos, automáticamente se generan comisiones para su red de referidos.

## 🔄 Cómo Funciona

### 1. **Estructura de Red (Upline)**

Cuando un usuario se registra con un código de referido:
```
Usuario A (Nivel 0) - compra 100 USD
  ↓
Usuario B (Nivel 1) - referido directo de A
  ↓
Usuario C (Nivel 2) - referido directo de B
  ↓
Usuario D (Nivel 3) - referido directo de C
```

El campo `upline` en el documento del usuario contiene: `[A.id, C.id, D.id]`

### 2. **Cálculo de Comisiones**

Cuando Usuario B compra:
- **Usuario A (Nivel 1)**: 10% de comisión = $10
- **Usuario C (Nivel 2)**: 5% de comisión = $5
- **Usuario D (Nivel 3)**: 2% de comisión = $2

Configuración:
```typescript
const COMMISSION_CONFIG = {
  level1: 0.10, // 10% para referido directo
  level2: 0.05, // 5% para segundo nivel
  level3: 0.02, // 2% para tercer nivel
};
```

### 3. **Flujo de Compra**

```
Usuario compra boletos
         ↓
Crea PurchaseOrder (PENDING)
         ↓
Se calculan comisiones automáticamente
         ↓
Se guardan en Firestore (comisiones collection)
         ↓
Admin verifica la orden
         ↓
PurchaseOrder → VERIFIED
         ↓
Comisiones permanecen PENDING hasta pago
```

## 📁 Archivos Modificados/Creados

### ✨ Nuevos Archivos

1. **`services/commissionService.ts`** (NUEVO)
   - `calculateCommissions()` - Calcula comisiones por nivel
   - `buildUpline()` - Construye el árbol de referidos
   - `getCommissionStats()` - Estadísticas de comisiones
   - `getNetworkStats()` - Estadísticas de la red

2. **`COMMISSIONS_GUIDE.md`** (NUEVO)
   - Guía para implementar Cloud Functions (opcional)
   - Ejemplo de función serverless

### 📝 Archivos Modificados

1. **`services/auth.ts`**
   - ✅ Importa `buildUpline` del nuevo servicio
   - ✅ Calcula el `upline` al registrarse con código de referido
   - ✅ Guarda correctamente `referredBy` y `upline` en Firestore

2. **`App.tsx`**
   - ✅ Importa `calculateCommissions` y `buildUpline`
   - ✅ `handlePurchaseTicket` ahora crea comisiones automáticamente
   - ✅ Las comisiones se guardan en Firestore en tiempo real

3. **`components/Commissions.tsx`**
   - ✅ Ya muestra correctamente las comisiones del usuario
   - ✅ Diferencia entre PENDING y PAID

## 🧪 Prueba del Sistema

### Test 1: Registrarse con código de referido

1. Crear Usuario A (Sin referido)
   - `referralCode`: "USER123"
   - `upline`: []
   - `referredBy`: null

2. Crear Usuario B con código de A
   - `referralCode`: "USER456"
   - `upline`: [A.id]
   - `referredBy`: A.id

3. Crear Usuario C con código de B
   - `referralCode`: "USER789"
   - `upline`: [B.id, A.id]
   - `referredBy`: B.id

### Test 2: Compra genera comisiones

1. Usuario B compra 5 boletos por $50
2. Verificar en Firestore `commissions` collection:
   ```
   - Usuario A recibe $5 (10% de $50) - Nivel 1
   - Usuario C recibe $2.50 (5% de $50) - Nivel 2
   ```

### Test 3: Ver comisiones en el dashboard

1. Iniciar sesión como Usuario A
2. Ir a "Mis Recompensas" → "Comisiones por Referidos"
3. Debe mostrar:
   - Comisión PENDING de $5
   - Detalles: "Nivel 1 - de Usuario B (USER456)"

## 🔗 Integración con Firebase

### Collections Necesarias

- ✅ `users` - Documento con `upline`, `referredBy`, `referralCode`
- ✅ `commissions` - Documento con comisión, usuario, nivel, estado
- ✅ `purchaseOrders` - Órdenes de compra
- ✅ `raffles` - Rifas disponibles

### Listeners Activados

En `App.tsx`, las comisiones se sincronizan en tiempo real:

```typescript
commissionsUnsub = Commissions.listen((items: any[]) => {
  const parsed = items.map((c: any) => ({
    ...c,
    date: c.date instanceof Timestamp ? c.date.toDate() : new Date(c.date)
  }));
  setCommissions(parsed);
});
```

## 🚀 Características Principales

### ✅ Ya Implementado

- [x] Cálculo automático de comisiones por 3 niveles
- [x] Sincronización en tiempo real con Firebase
- [x] Construcción correcta del upline al registrarse
- [x] Almacenamiento en colección `commissions`
- [x] Visualización en dashboard del usuario
- [x] Diferenciación entre comisiones PENDING y PAID

### 🔜 Opcionales (Mejoras Futuras)

- [ ] Cloud Functions para procesar comisiones automáticamente
- [ ] Webhook para pagos automáticos de comisiones
- [ ] Sistema de cashout para que usuarios retiren comisiones
- [ ] Reporte detallado de comisiones por periodo
- [ ] Historico de transacciones

## 📊 Estadísticas Disponibles

### Para cada usuario, puedes obtener:

```typescript
getCommissionStats(commissions, userId) → {
  total: 250.00,           // Total de comisiones
  pending: 100.00,         // Pendiente de pago
  paid: 150.00,            // Ya pagadas
  count: 15,               // Número total de comisiones
  byLevel: {               // Desglose por nivel
    level1: 120.00,
    level2: 80.00,
    level3: 50.00
  }
}
```

```typescript
getNetworkStats(userId, users) → {
  directReferralsCount: 5,    // Referidos directos
  directReferrals: [...],      // Lista de referidos
  totalNetworkSize: 23,        // Total de red
  downline: [...]              // Árbol completo de referidos
}
```

## ⚙️ Configuración

Para cambiar los porcentajes de comisión, edita `services/commissionService.ts`:

```typescript
export const COMMISSION_CONFIG = {
  level1: 0.10, // Cambiar a 0.15 para 15%
  level2: 0.05, // Cambiar a 0.08 para 8%
  level3: 0.02, // Cambiar a 0.05 para 5%
};
```

## 🔐 Reglas de Firestore

Recomendado agregar a `firestore.rules`:

```javascript
match /commissions/{document=**} {
  // Usuarios pueden leer sus propias comisiones
  allow read: if request.auth != null && 
              resource.data.userId == request.auth.uid;
  
  // Solo Cloud Functions pueden crear comisiones
  allow create: if false; // Usar Cloud Functions en producción
  allow update, delete: if false;
}
```

## 🐛 Troubleshooting

### Problema: Las comisiones no aparecen

**Solución**:
1. Verificar que el usuario tiene `upline` en Firestore
2. Verificar que la orden de compra se creó correctamente
3. Revisar la consola del navegador para errores
4. Asegurar que Firebase está configurado correctamente

### Problema: El upline no se guarda

**Solución**:
1. El código de referido debe ser exacto (case-sensitive)
2. El referidor debe estar registrado en Firestore
3. Revisar `services/auth.ts` función `signupWithEmail`

### Problema: Las comisiones muestran montos incorrectos

**Solución**:
1. Verificar que `totalPrice` en PurchaseOrder es correcto
2. Revisar porcentajes en `COMMISSION_CONFIG`
3. Chequear que el upline tiene el orden correcto (directo primero)

## 📞 Contacto / Soporte

Para problemas o dudas sobre el sistema de comisiones, revisar:
- `COMMISSIONS_GUIDE.md` - Documentación técnica
- `services/commissionService.ts` - Código fuente
- `App.tsx` línea ~550 - Integración en flujo de compra
