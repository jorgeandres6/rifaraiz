import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query as firestoreQuery,
  where,
  orderBy,
  limit as limitFn,
  QueryConstraint,
  FirestoreDataConverter,
  DocumentData,
  Query,
  writeBatch,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// --- Generic helpers for common CRUD operations and real-time listeners ---
export function coll<T = DocumentData>(name: string) {
  return collection(db, name) as unknown as CollectionReferenceWithData<T>;
}

export type CollectionReferenceWithData<T> = {
  path: string;
};

export async function addDocument<T = any>(collectionName: string, data: T) {
  return addDoc(collection(db, collectionName), data as any);
}

export async function setDocument<T = any>(collectionName: string, id: string, data: T) {
  return setDoc(doc(db, collectionName, id), data as any);
}

export async function updateDocument(collectionName: string, id: string, partial: Partial<any>) {
  return updateDoc(doc(db, collectionName, id), partial as any);
}

export async function getDocument<T = any>(collectionName: string, id: string) {
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as T) } as T & { id: string }) : null;
}

export async function getCollection<T = any>(collectionName: string, q?: Query) {
  const qRef = q ?? collection(db, collectionName);
  const snap = await getDocs(qRef as any);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })) as Array<T & { id: string }>;
}

export function listenCollection<T = any>(collectionName: string, onChange: (items: Array<T & { id: string }>) => void, constraints?: QueryConstraint[]) {
  const qRef = constraints && constraints.length ? firestoreQuery(collection(db, collectionName), ...constraints) : (collection(db, collectionName) as any);
  const unsub = onSnapshot(qRef, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
    onChange(items);
  });
  return unsub;
}

// --- React hook for real-time collections (simple) ---
export function useCollection<T = any>(collectionName: string, constraints?: QueryConstraint[]) {
  const [items, setItems] = useState<Array<T & { id: string }>>([]);
  useEffect(() => {
    const qRef = constraints && constraints.length ? firestoreQuery(collection(db, collectionName), ...constraints) : (collection(db, collectionName) as any);
    const unsub = onSnapshot(qRef, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) })));
    });
    return () => unsub();
  }, [collectionName, JSON.stringify(constraints || [])]);
  return items;
}

export async function deleteDocument(collectionName: string, id: string) {
  return deleteDoc(doc(db, collectionName, id));
}

// --- Example typed helpers for common collections used in this app ---
export type Raffle = {
  title: string;
  description?: string;
  createdAt?: any;
  [k: string]: any;
};

export const Raffles = {
  getAll: (constraints?: QueryConstraint[]) => getCollection<Raffle>("raffles", constraints as any),
  listen: (onChange: (items: Array<Raffle & { id: string }>) => void, constraints?: QueryConstraint[]) => listenCollection<Raffle>("raffles", onChange, constraints),
  add: (data: Partial<Raffle>) => {
    const prepared = sanitizeForFirestore({ ...data, createdAt: serverTimestamp() });
    return addDocument<Raffle>("raffles", prepared as Raffle);
  },
  // Increment soldTickets and currentSales atomically
  incrementSales: async (raffleId: string, ticketsSold: number, revenue: number) => {
    const ref = doc(db, "raffles", raffleId);
    return updateDoc(ref, { soldTickets: increment(ticketsSold), currentSales: increment(revenue) } as any);
  }
};

// --- Tickets helpers ---
export type Ticket = {
  raffleId: string;
  userId: string;
  purchaseDate?: any;
  ticketNumber: string;
  originalUserId: string;
  transferCount: number;
  purchasedPackInfo?: any;
  [k: string]: any;
};

function sanitizeForFirestore(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }
  
  // Handle objects
  const out: any = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) {
      // Recursively sanitize nested objects
      if (v && typeof v === 'object' && !v.seconds && !v.nanoseconds) {
        out[k] = sanitizeForFirestore(v);
      } else {
        out[k] = v;
      }
    }
  });
  return out;
}

export const Tickets = {
  add: (data: Partial<Ticket>) => {
    const prepared = sanitizeForFirestore({ ...data, purchaseDate: serverTimestamp() });
    return addDocument<Ticket>("tickets", prepared as Ticket);
  },
  addBatch: async (tickets: Partial<Ticket>[]) => {
    const batch = writeBatch(db);
    tickets.forEach(t => {
      const docRef = doc(collection(db, "tickets"));
      const prepared = sanitizeForFirestore({ ...t, purchaseDate: serverTimestamp() });
      batch.set(docRef, prepared);
    });
    await batch.commit();
  },
  listen: (onChange: (items: Array<Ticket & { id: string }>) => void, constraints?: QueryConstraint[]) => listenCollection<Ticket>("tickets", onChange, constraints),
};

// --- Commissions helpers ---
export type Commission = {
  userId: string;
  amount: number;
  status?: string;
  level?: number;
  sourceUserId?: string;
  raffleId?: string;
  date?: any;
  [k: string]: any;
};

export const Commissions = {
  getAll: (constraints?: QueryConstraint[]) => getCollection<Commission>("commissions", constraints as any),
  listen: (onChange: (items: Array<Commission & { id: string }>) => void, constraints?: QueryConstraint[]) => listenCollection<Commission>("commissions", onChange, constraints),
  add: (data: Partial<Commission>) => {
    const prepared = sanitizeForFirestore({ ...data, date: serverTimestamp() });
    return addDocument<Commission>("commissions", prepared as Commission);
  },
  addBatch: async (comms: Partial<Commission>[]) => {
    const batch = writeBatch(db);
    comms.forEach(c => {
      const docRef = doc(collection(db, "commissions"));
      const prepared = sanitizeForFirestore({ ...c, date: serverTimestamp() });
      batch.set(docRef, prepared);
    });
    await batch.commit();
  },
  update: (id: string, partial: Partial<Commission>) => updateDocument("commissions", id, partial),
};

// --- Users helpers ---
export type UserDoc = {
  name: string;
  email: string;
  role?: string;
  referralCode?: string;
  upline?: string[];
  phone?: string;
  city?: string;
  password?: string;
  [k: string]: any;
};

export const Users = {
  getAll: (constraints?: QueryConstraint[]) => getCollection<UserDoc>("users", constraints as any),
  listen: (onChange: (items: Array<UserDoc & { id: string }>) => void, constraints?: QueryConstraint[]) => listenCollection<UserDoc>("users", onChange, constraints),
  get: (id: string) => getDocument<UserDoc>("users", id),
  set: (id: string, data: Partial<UserDoc>) => {
    const prepared = sanitizeForFirestore(data);
    return setDocument<UserDoc>("users", id, prepared as UserDoc);
  },
  add: (data: Partial<UserDoc>) => {
    const prepared = sanitizeForFirestore(data);
    return addDocument<UserDoc>("users", prepared as UserDoc);
  },
  update: (id: string, partial: Partial<UserDoc>) => {
    const prepared = sanitizeForFirestore(partial);
    return updateDocument("users", id, prepared as any);
  },
};

// --- UserPrizes helpers ---
export type UserPrizeDoc = {
  userId: string;
  prizeId: string;
  prizeName: string;
  raffleId: string;
  dateWon?: any;
  redeemed?: boolean;
  redeemedDate?: any;
  redeemedByAdminId?: string;
  code: string;
  [k: string]: any;
};

export const UserPrizes = {
  getAll: (constraints?: QueryConstraint[]) => getCollection<UserPrizeDoc>("userPrizes", constraints as any),
  listen: (onChange: (items: Array<UserPrizeDoc & { id: string }>) => void, constraints?: QueryConstraint[]) => listenCollection<UserPrizeDoc>("userPrizes", onChange, constraints),
  get: (id: string) => getDocument<UserPrizeDoc>("userPrizes", id),
  add: (data: Partial<UserPrizeDoc>) => {
    const prepared = sanitizeForFirestore({ ...data, dateWon: data.dateWon || serverTimestamp() });
    return addDocument<UserPrizeDoc>("userPrizes", prepared as UserPrizeDoc);
  },
  update: (id: string, partial: Partial<UserPrizeDoc>) => {
    const prepared = sanitizeForFirestore(partial);
    return updateDocument("userPrizes", id, prepared as any);
  },
};

// Re-export serverTimestamp for callers that want to use it
export { serverTimestamp };

// --- PurchaseOrders helpers ---
export type PurchaseOrderDoc = {
  userId: string;
  raffleId: string;
  packId?: string;
  quantity: number;
  totalPrice: number;
  status?: string;
  createdAt?: any;
  paidAt?: any;
  paidByAdminId?: string;
  verifiedAt?: any;
  verifiedByAdminId?: string;
  rejectionReason?: string;
  rejectedByAdminId?: string;
  ticketIds?: string[];
  [k: string]: any;
};

export const PurchaseOrders = {
  getAll: (constraints?: QueryConstraint[]) => getCollection<PurchaseOrderDoc>("purchaseOrders", constraints as any),
  listen: (onChange: (items: Array<PurchaseOrderDoc & { id: string }>) => void, constraints?: QueryConstraint[]) => listenCollection<PurchaseOrderDoc>("purchaseOrders", onChange, constraints),
  get: (id: string) => getDocument<PurchaseOrderDoc>("purchaseOrders", id),
  add: (data: Partial<PurchaseOrderDoc>) => {
    const prepared = sanitizeForFirestore({ ...data, createdAt: serverTimestamp(), status: 'PENDING' });
    return addDocument<PurchaseOrderDoc>("purchaseOrders", prepared as PurchaseOrderDoc);
  },
  update: (id: string, partial: Partial<PurchaseOrderDoc>) => {
    const prepared = sanitizeForFirestore(partial);
    return updateDocument("purchaseOrders", id, prepared as any);
  },
  markAsPaid: (id: string, adminId: string, paymentMethod?: string, paymentNotes?: string) => {
    const prepared = sanitizeForFirestore({ 
      status: 'PAID', 
      paidAt: serverTimestamp(), 
      paidByAdminId: adminId,
      paymentMethod: paymentMethod || undefined,
      paymentNotes: paymentNotes || undefined
    });
    return updateDocument("purchaseOrders", id, prepared as any);
  },
  verify: (id: string, ticketIds: string[], adminId: string, verificationNotes?: string) => {
    const prepared = sanitizeForFirestore({ 
      status: 'VERIFIED', 
      verifiedAt: serverTimestamp(), 
      verifiedByAdminId: adminId, 
      ticketIds,
      verificationNotes: verificationNotes || undefined
    });
    return updateDocument("purchaseOrders", id, prepared as any);
  },
  reject: (id: string, rejectionReason: string, adminId: string) => {
    const prepared = sanitizeForFirestore({ status: 'REJECTED', rejectionReason, rejectedByAdminId: adminId });
    return updateDocument("purchaseOrders", id, prepared as any);
  },
  cancel: (id: string) => {
    const prepared = sanitizeForFirestore({ status: 'CANCELLED' });
    return updateDocument("purchaseOrders", id, prepared as any);
  },
};

// --- RouletteChances helpers ---
export type RouletteChanceDoc = {
  userId: string;
  raffleId: string;
  chances: number;
  createdAt?: any;
  [k: string]: any;
};

export const RouletteChances = {
  getAll: (constraints?: QueryConstraint[]) => getCollection<RouletteChanceDoc>("rouletteChances", constraints as any),
  listen: (onChange: (items: Array<RouletteChanceDoc & { id: string }>) => void, constraints?: QueryConstraint[]) => listenCollection<RouletteChanceDoc>("rouletteChances", onChange, constraints),
  get: (id: string) => getDocument<RouletteChanceDoc>("rouletteChances", id),
  add: (data: Partial<RouletteChanceDoc>) => {
    const prepared = sanitizeForFirestore({ ...data, createdAt: serverTimestamp() });
    return addDocument<RouletteChanceDoc>("rouletteChances", prepared as RouletteChanceDoc);
  },
  update: (id: string, partial: Partial<RouletteChanceDoc>) => {
    const prepared = sanitizeForFirestore(partial);
    return updateDocument("rouletteChances", id, prepared as any);
  },
  incrementChances: async (userId: string, raffleId: string, amount: number) => {
    // Find existing chance record
    const constraints = [where('userId', '==', userId), where('raffleId', '==', raffleId)];
    const existing = await getCollection<RouletteChanceDoc>("rouletteChances", firestoreQuery(collection(db, "rouletteChances"), ...constraints) as any);
    
    if (existing.length > 0) {
      // Update existing
      const record = existing[0];
      await updateDocument("rouletteChances", record.id, { chances: (record.chances || 0) + amount });
    } else {
      // Create new
      await RouletteChances.add({ userId, raffleId, chances: amount });
    }
  },
  decrementChances: async (userId: string, raffleId: string) => {
    const constraints = [where('userId', '==', userId), where('raffleId', '==', raffleId)];
    const existing = await getCollection<RouletteChanceDoc>("rouletteChances", firestoreQuery(collection(db, "rouletteChances"), ...constraints) as any);
    
    if (existing.length > 0) {
      const record = existing[0];
      const newChances = Math.max(0, (record.chances || 0) - 1);
      await updateDocument("rouletteChances", record.id, { chances: newChances });
    }
  },
};
