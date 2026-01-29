# ⚡ Quick Start - Sistema de Comisiones

## 🚀 En 5 Minutos

### 1. **Verificar que Firebase está configurado**
```
✓ .env.local tiene VITE_FIREBASE_PROJECT_ID
✓ Firestore collections existen: users, commissions, purchaseOrders
```

### 2. **Crear un usuario sin referido (Usuario A)**
- Email: user_a@test.com
- Contraseña: Test123!
- No usar código de referido
- Copiar su `referralCode` del dashboard

### 3. **Crear usuario con referido (Usuario B)**
- Email: user_b@test.com
- Contraseña: Test123!
- **Usar código de Usuario A** como referido
- Verificar que `upline` se guardó en Firestore

### 4. **Realizar compra**
- Usuario B compra 1 boleto por $10
- Verificar comisión en Firestore:
  - Usuario A recibe: $1 (10%)

### 5. **Ver comisiones en Dashboard**
- Login como Usuario A
- Dashboard → "Mis Recompensas"
- Debe mostrar: $1.00 PENDING

---

## 🔧 Configuración Rápida

### Cambiar porcentajes de comisión
Editar `services/commissionService.ts`:

```typescript
export const COMMISSION_CONFIG = {
  level1: 0.15, // Cambiar a 15%
  level2: 0.08, // Cambiar a 8%
  level3: 0.05, // Cambiar a 5%
};
```

### Cambiar cantidad de niveles
En `calculateCommissions()`:

```typescript
// Agregar nivel 4 (1% de comisión)
if (uplineIds.length > 3) {
  commissions.push({
    userId: uplineIds[3],
    amount: purchaseAmount * 0.01,
    status: CommissionStatus.PENDING,
    level: 4,
    sourceUserId: buyerUserId,
    raffleId: raffleId,
  });
}
```

---

## 🧪 Test Rápido en Consola

```javascript
// En consola del navegador (F12)
import { runAllTests } from './commissionsTest'
runAllTests()
```

Resultado esperado: Todos los tests PASS ✓

---

## 📱 Flujo Completo

```
1. Usuario se registra
   → upline se calcula automáticamente

2. Usuario compra boletos
   → Comisiones se crean automáticamente
   → Se guardan en Firebase

3. Usuario ve Dashboard
   → Comisiones aparecen en "Mis Recompensas"
   → Puede ver detalles por nivel
```

---

## ⚠️ Checklist Pre-Producción

Antes de pasar a producción, verificar:

- [ ] Firebase está configurado correctamente
- [ ] Firestore rules están actualizadas
- [ ] `upline` se guarda en usuarios nuevos
- [ ] Comisiones se crean al comprar
- [ ] Dashboard muestra comisiones correctamente
- [ ] Percentajes de comisión son correctos
- [ ] No hay errores en consola

---

## 🆘 Problemas Comunes

### "No veo comisiones"
→ Verificar que `currentUser.upline` no está vacío

### "Upline no se guardó"
→ Verificar que el código de referido es exacto

### "Comisiones muestran $0"
→ Verificar que el totalPrice de la orden es correcto

---

## 📚 Documentación Completa

- **Guía Completa**: `REFERRALS_COMMISSIONS_SETUP.md`
- **Cloud Functions**: `COMMISSIONS_GUIDE.md`
- **Resumen Técnico**: `IMPLEMENTATION_SUMMARY.md`

---

¡Listo para usar! 🎉
