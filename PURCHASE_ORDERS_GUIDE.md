# Sistema de Órdenes de Compra (Purchase Orders)

## 📋 Descripción General

Se ha implementado un sistema completo de órdenes de compra que permite:
1. **Crear órdenes** cuando los usuarios compran boletos o paquetes
2. **Gestionar órdenes** desde el panel de administración
3. **Rastrear estados** de las órdenes en el dashboard del usuario
4. **Almacenar datos** en Firestore de forma segura

## 🔄 Flujo de Órdenes de Compra

```
PENDING → PAID → VERIFIED → (Boletos Asignados)
   ↓
REJECTED → (Orden Rechazada)
```

### Estados de la Orden

- **PENDING** - "Por Pagar": Orden creada, esperando pago del usuario
- **PAID** - "Pagado": Pago recibido, esperando verificación del admin
- **VERIFIED** - "Verificado": Admin aprobó, boletos generados y asignados
- **REJECTED** - "Rechazado": Admin rechazó con motivo específico
- **CANCELLED** - "Cancelado": Usuario canceló la orden

## 🏗️ Estructura de Datos

### Interfaz PurchaseOrder (types.ts)

```typescript
interface PurchaseOrder {
  id: string;                    // ID único de la orden
  userId: string;                // Usuario que realizó la compra
  raffleId: string;              // Rifa a la que pertenece
  packId?: string;               // ID del paquete (opcional)
  quantity: number;              // Cantidad de boletos
  totalPrice: number;            // Precio total en dólares
  status: PurchaseOrderStatus;   // PENDING | PAID | VERIFIED | REJECTED | CANCELLED
  createdAt: Date;               // Fecha de creación
  paidAt?: Date;                 // Fecha de pago
  verifiedAt?: Date;             // Fecha de verificación
  rejectionReason?: string;      // Motivo del rechazo (si aplica)
  ticketIds?: string[];          // IDs de boletos asignados (cuando VERIFIED)
}
```

## 📂 Colección en Firestore

**Colección:** `purchaseOrders`

Cada documento contiene:
```json
{
  "userId": "user123",
  "raffleId": "raffle456",
  "quantity": 5,
  "totalPrice": 50.00,
  "status": "PENDING",
  "createdAt": "2026-01-28T10:30:00Z",
  "paidAt": null,
  "verifiedAt": null,
  "rejectionReason": null,
  "ticketIds": null
}
```

## 🔧 Helpers en Firestore (services/firestore.ts)

```typescript
// Obtener todas las órdenes
PurchaseOrders.getAll(constraints?)

// Escuchar cambios en tiempo real
PurchaseOrders.listen(onChange, constraints?)

// Obtener una orden específica
PurchaseOrders.get(id)

// Crear una nueva orden
PurchaseOrders.add({
  userId: "user123",
  raffleId: "raffle456",
  quantity: 5,
  totalPrice: 50.00
  // status y createdAt se asignan automáticamente
})

// Actualizar una orden
PurchaseOrders.update(id, partial)

// Marcar como pagada
PurchaseOrders.markAsPaid(id)

// Verificar y asignar boletos
PurchaseOrders.verify(id, ticketIds)

// Rechazar una orden
PurchaseOrders.reject(id, "Motivo del rechazo")

// Cancelar una orden
PurchaseOrders.cancel(id)
```

## 👨‍💼 Panel de Administración

### Ubicación
**Archivo:** `components/PurchaseOrdersModal.tsx`

### Características

1. **Visualización por Pestañas**
   - Por Pagar (PENDING)
   - Pagado (PAID)
   - Verificado (VERIFIED)
   - Rechazado (REJECTED)
   - Cancelado (CANCELLED)

2. **Vista de Listado**
   - Muestra usuario, rifa, cantidad, monto y fecha
   - Click para ver detalles de la orden

3. **Vista de Detalles**
   - Información completa de la orden
   - Historial de cambios (timeline)
   - Botones de acción según el estado:

#### Acciones por Estado

**Para PENDING:**
- ✓ Marcar como Pagado → Cambios a PAID
- ✗ Rechazar Orden → Rechaza con motivo

**Para PAID:**
- ✓ Verificar y Asignar Boletos → Genera boletos y cambia a VERIFIED
- ✗ Rechazar Orden → Rechaza con motivo

**Para VERIFIED/REJECTED/CANCELLED:**
- Solo visualización

## 👥 Dashboard del Usuario

### Ubicación
**Archivo:** `components/UserPurchaseOrders.tsx`

### Características

1. **Vista Resumida en MyTickets**
   - Pestaña "Órdenes de Compra" junto a "Mis Boletos"
   - Contador de órdenes totales

2. **Información Mostrada**
   - Rifa asociada
   - Estado actual con icono
   - Monto total
   - Fecha de creación
   - Boletos asignados (si VERIFIED)

3. **Timeline de Estados**
   - Orden Creada
   - Pago Recibido (si aplicable)
   - Verificado y Asignado (si aplicable)

4. **Mensajes Contextuales**
   - **PENDING:** "Esperando recibir tu pago..."
   - **PAID:** "Pago recibido. Esperando verificación..."
   - **VERIFIED:** "Orden verificada. X boleto(s) asignado(s)..."
   - **REJECTED:** "Orden rechazada: [razón]"

## 📱 Integración en Componentes

### AdminPanel.tsx

```typescript
// Props
interface AdminPanelProps {
  // ... otros props
  purchaseOrders?: PurchaseOrder[];
}

// Estado
const [isPurchaseOrdersOpen, setIsPurchaseOrdersOpen] = useState(false);

// Tab
<button onClick={() => setActiveTab('orders')} className={getTabClass('orders')}>
  <ClipboardListIcon className="h-5 w-5 mr-2" />
  Órdenes ({purchaseOrders.length})
</button>

// Modal
{isPurchaseOrdersOpen && (
  <PurchaseOrdersModal
    onClose={() => setIsPurchaseOrdersOpen(false)}
    purchaseOrders={purchaseOrders}
    users={users}
    raffles={raffles}
  />
)}
```

### MyTickets.tsx

```typescript
// Props
interface MyTicketsProps {
  // ... otros props
  purchaseOrders?: PurchaseOrder[];
  userId: string;
}

// Tabs
<button onClick={() => setActiveTab('orders')}>
  Órdenes de Compra ({purchaseOrders.length})
</button>

// Componente
{activeTab === 'orders' && (
  <UserPurchaseOrders
    purchaseOrders={purchaseOrders}
    raffles={raffles}
    userId={userId}
  />
)}
```

## 🚀 Cómo Implementar en tu Aplicación

### 1. En App.tsx o componente padre

```typescript
import { PurchaseOrders } from './services/firestore';

// En tu componente principal
const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

// Escuchar cambios en tiempo real
useEffect(() => {
  const unsubscribe = PurchaseOrders.listen((orders) => {
    setPurchaseOrders(orders);
  });
  return () => unsubscribe();
}, []);

// Pasar props
<AdminPanel
  purchaseOrders={purchaseOrders}
  // ... otros props
/>

<MyTickets
  purchaseOrders={purchaseOrders}
  userId={currentUser.id}
  // ... otros props
/>
```

### 2. Crear una Orden de Compra

Cuando el usuario compra boletos:

```typescript
const handleBuyTickets = async (raffleId: string, quantity: number, totalPrice: number) => {
  try {
    const order = await PurchaseOrders.add({
      userId: currentUser.id,
      raffleId: raffleId,
      quantity: quantity,
      totalPrice: totalPrice
    });
    
    console.log('Orden creada:', order.id);
    
    // Mostrar confirmación
    showNotification(`Orden creada: #${order.id.substring(0, 8)}`);
  } catch (error) {
    console.error('Error creando orden:', error);
  }
};
```

### 3. Actualizar Estado en Admin

```typescript
// Cuando el admin verifica la orden
const handleVerifyOrder = async (orderId: string) => {
  try {
    // Aquí normalmente crearías los boletos reales
    const ticketIds = await createTickets(order);
    
    // Marcar orden como verificada
    await PurchaseOrders.verify(orderId, ticketIds);
    
    // Notificar al usuario
    await addNotification({
      userId: order.userId,
      title: 'Orden Verificada',
      message: `Tu orden #${orderId.substring(0, 8)} ha sido verificada. Tus boletos están listos.`
    });
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 🔐 Reglas de Firestore

Recomendadas para `purchaseOrders` en `firestore.rules`:

```javascript
match /purchaseOrders/{document=**} {
  // Los usuarios pueden leer sus propias órdenes
  allow read: if request.auth.uid == resource.data.userId;
  
  // Los admins pueden leer todas las órdenes
  allow read: if hasRole('admin');
  
  // Los usuarios pueden crear órdenes
  allow create: if request.auth.uid == request.resource.data.userId;
  
  // Solo admins pueden actualizar órdenes
  allow update: if hasRole('admin');
  
  // No se pueden eliminar órdenes (solo marcar como CANCELLED)
  allow delete: if false;
}
```

## 📊 Consultas Útiles

```typescript
// Obtener órdenes pendientes de un usuario
const userPendingOrders = PurchaseOrders.getAll([
  where('userId', '==', userId),
  where('status', '==', 'PENDING')
]);

// Obtener órdenes pagadas por una rifa
const raffleOrders = PurchaseOrders.getAll([
  where('raffleId', '==', raffleId),
  where('status', '==', 'PAID'),
  orderBy('createdAt', 'desc')
]);

// Contar órdenes verificadas
const verifiedCount = purchaseOrders.filter(o => o.status === 'VERIFIED').length;
```

## 🎨 Estilos y Colores

- **PENDING:** Amarillo (#FCD34D)
- **PAID:** Azul (#60A5FA)
- **VERIFIED:** Verde (#4ADE80)
- **REJECTED:** Rojo (#F87171)
- **CANCELLED:** Gris (#D1D5DB)

## ⚠️ Notas Importantes

1. **Seguridad**: Siempre valida en el backend que el usuario tenga permiso antes de crear/actualizar órdenes
2. **Timestamps**: Los timestamps se crean automáticamente con `serverTimestamp()` en Firestore
3. **Generación de Boletos**: La generación real de boletos debe ocurrir cuando la orden se verifica (estado VERIFIED)
4. **Notificaciones**: Considera agregar notificaciones automáticas cuando el estado cambia
5. **Auditoría**: Las órdenes contienen un historial de cambios que puede ser útil para auditoría

## 🔄 Próximos Pasos Recomendados

1. **Agregar validación de pagos** (integración con pasarelas de pago)
2. **Enviar emails** cuando cambia el estado de la orden
3. **Crear reportes** de órdenes por período
4. **Implementar reintentos** automáticos para órdenes pendientes
5. **Agregar historial** detallado de cambios en Firestore

---

**Sistema implementado:** 28 de Enero de 2026
**Versión:** 1.0
