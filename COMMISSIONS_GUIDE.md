# Guía: Cloud Functions para Comisiones (Opcional pero Recomendado)

Para mejorar aún más el sistema de comisiones y hacerlo más robusto, se recomienda usar **Google Cloud Functions** para procesar automáticamente las comisiones cuando se creen órdenes de compra verificadas.

## Descripción

Actualmente, las comisiones se calculan y guardan en Firebase cuando:
1. Un usuario crea una orden de compra
2. Se calcula automáticamente basado en el upline del usuario

Sin embargo, para un sistema más robusto en producción, se pueden crear **Cloud Functions** que:
- Se ejecuten automáticamente cuando una orden de compra sea verificada
- Garanticen que siempre se creen las comisiones correctas
- Eviten duplicados y errores de sincronización

## Función Recomendada: `onPurchaseOrderVerified`

```javascript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

interface Commission {
  userId: string;
  amount: number;
  status: 'PENDING' | 'PAID';
  level: number;
  sourceUserId: string;
  raffleId: string;
  date: admin.firestore.FieldValue;
}

const COMMISSION_CONFIG = {
  level1: 0.10, // 10%
  level2: 0.05, // 5%
  level3: 0.02, // 2%
};

export const onPurchaseOrderVerified = functions.firestore
  .document('purchaseOrders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only process if status changed to VERIFIED
    if (before.status !== 'PENDING' || after.status !== 'VERIFIED') {
      return;
    }

    try {
      const userId = after.userId;
      const raffleId = after.raffleId;
      const totalPrice = after.totalPrice;

      // Get the buyer's user document to get upline
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData || !userData.upline || userData.upline.length === 0) {
        console.log(`User ${userId} has no upline, no commissions to create`);
        return;
      }

      const uplineIds = userData.upline as string[];
      const commissions: Commission[] = [];

      // Level 1: Direct referrer
      if (uplineIds.length > 0) {
        commissions.push({
          userId: uplineIds[0],
          amount: totalPrice * COMMISSION_CONFIG.level1,
          status: 'PENDING',
          level: 1,
          sourceUserId: userId,
          raffleId: raffleId,
          date: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Level 2
      if (uplineIds.length > 1) {
        commissions.push({
          userId: uplineIds[1],
          amount: totalPrice * COMMISSION_CONFIG.level2,
          status: 'PENDING',
          level: 2,
          sourceUserId: userId,
          raffleId: raffleId,
          date: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Level 3
      if (uplineIds.length > 2) {
        commissions.push({
          userId: uplineIds[2],
          amount: totalPrice * COMMISSION_CONFIG.level3,
          status: 'PENDING',
          level: 3,
          sourceUserId: userId,
          raffleId: raffleId,
          date: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Batch write commissions
      const batch = db.batch();
      commissions.forEach((commission) => {
        const commissionRef = db.collection('commissions').doc();
        batch.set(commissionRef, commission);
      });

      await batch.commit();
      console.log(
        `Created ${commissions.length} commissions for order ${context.params.orderId}`
      );
    } catch (error) {
      console.error('Error processing commissions:', error);
      throw error;
    }
  });
```

## Cómo Desplegar

1. **Instala Firebase Tools**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Inicializa Functions en tu proyecto**:
   ```bash
   firebase init functions
   ```

3. **Añade la función anterior al archivo `functions/src/index.ts`**

4. **Despliega**:
   ```bash
   firebase deploy --only functions
   ```

## Reglas de Firestore Necesarias

Asegúrate de que tus reglas de Firestore permitan la creación de comisiones:

```json
{
  "rules": {
    "commissions": {
      ".read": "request.auth != null",
      ".create": "request.auth.uid != null && request.resource.data.userId == request.auth.uid",
      ".write": false
    }
  }
}
```

## Beneficios

- ✅ **Atomicidad**: Las comisiones siempre se crean correctamente
- ✅ **Escalabilidad**: Puede manejar millones de órdenes sin problemas
- ✅ **Confiabilidad**: Si hay errores, Cloud Functions los reintentan automáticamente
- ✅ **Auditoría**: Registro completo en Cloud Logging

## Estado Actual (Sin Cloud Functions)

El sistema funciona correctamente sin Cloud Functions porque:
- Las comisiones se crean en `handlePurchaseTicket` en el cliente
- Se guardan directamente en Firestore
- La sincronización es en tiempo real con los listeners

Para implementar Cloud Functions en el futuro, simplemente remueve la lógica del cliente y déjala en las funciones.
