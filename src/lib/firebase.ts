import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Warn if any required env var is missing to help debugging local setups.
const missing: string[] = [];
if (!firebaseConfig.apiKey) missing.push('VITE_FIREBASE_API_KEY');
if (!firebaseConfig.authDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId) missing.push('VITE_FIREBASE_PROJECT_ID');
if (!firebaseConfig.storageBucket) missing.push('VITE_FIREBASE_STORAGE_BUCKET');
if (!firebaseConfig.messagingSenderId) missing.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
if (!firebaseConfig.appId) missing.push('VITE_FIREBASE_APP_ID');
if (missing.length) {
  // eslint-disable-next-line no-console
  console.warn('[firebase] Missing env vars:', missing.join(', '));
}

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

function normalizeInterestRate(value: unknown): number {
  const rate = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(rate) || rate <= 0) return 0.005;
  if (rate < 0.004) return 0.005;
  return rate;
}

export async function fetchAllRecords(): Promise<GpoDoc[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      batchId: data.batchId || '',
      gpo: data.gpo || '',
      interestRate: normalizeInterestRate(data.interestRate ?? 0.005),
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
