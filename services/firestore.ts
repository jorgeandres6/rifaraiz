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
  add: (data: Partial<Raffle>) => addDocument<Raffle>("raffles", { ...data, createdAt: serverTimestamp() } as Raffle),
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

function sanitizeForFirestore(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  const out: any = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
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

// Re-export serverTimestamp for callers that want to use it
export { serverTimestamp };


