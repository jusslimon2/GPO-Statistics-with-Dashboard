import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDuz2AidAjBqEkoKvUOvEFXPvOEEXY5mps",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "gpo-dashboard-d71da.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "gpo-dashboard-d71da",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "gpo-dashboard-d71da.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "526678782097",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:526678782097:web:eacc6cbe6e2d675f39cf30",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface GpoRecord {
  gpo: string;
  interestRate: number;
  profit: number;
  usedLimit: number;
}

export interface GpoDoc extends GpoRecord {
  id: string;
  batchId: string;
  createdAt: string;
}

const COLLECTION = 'gpo_statistics';

export async function fetchAllRecords(): Promise<GpoDoc[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      batchId: data.batchId || '',
      gpo: data.gpo || '',
      interestRate: data.interestRate ?? 0.005,
      profit: data.profit ?? 0,
      usedLimit: data.usedLimit ?? 0,
      createdAt: data.createdAt || '',
    };
  });
}

export async function saveRecords(records: GpoRecord[]): Promise<void> {
  const batchId = crypto.randomUUID();
  const now = new Date().toISOString();
  const col = collection(db, COLLECTION);
  const batch = writeBatch(db);

  for (const r of records) {
    const docRef = doc(col);
    batch.set(docRef, { ...r, batchId, createdAt: now });
  }

  await batch.commit();
}

export async function updateRecord(id: string, updates: Partial<GpoRecord>): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, updates);
}

export async function removeRecord(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await deleteDoc(ref);
}
