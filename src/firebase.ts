import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { v4 as uuidv4 } from 'uuid';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ------------------------------------
// Key Management
// ------------------------------------

export interface AccessKey {
  id: string; // The text of the key itself, e.g., "STRAT-AI-ABCD-1234"
  createdAt: number;
  expiresAt: number;
  durationLabel: string;
}

export async function createAccessKey(durationMonths: number, durationLabel: string): Promise<AccessKey> {
  const newKey = `STRATAI-${uuidv4().split('-')[0].toUpperCase()}-${uuidv4().split('-')[1].toUpperCase()}`;
  const now = Date.now();
  const expiresAt = now + (durationMonths * 30 * 24 * 60 * 60 * 1000); // Approximation of months in ms

  const accessKey: AccessKey = {
    id: newKey,
    createdAt: now,
    expiresAt,
    durationLabel
  };

  const path = `keys/${newKey}`;
  try {
    await setDoc(doc(db, 'keys', newKey), accessKey);
    return accessKey;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function validateAccessKey(keyId: string): Promise<boolean> {
  const path = `keys/${keyId}`;
  try {
    const docRef = doc(db, 'keys', keyId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return false;
    }
    
    const keyData = snapshot.data() as AccessKey;
    const now = Date.now();
    return now < keyData.expiresAt;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return false;
  }
}

export function subscribeToKeys(callback: (keys: AccessKey[]) => void, onError: (err: any) => void) {
  const path = 'keys';
  return onSnapshot(collection(db, 'keys'), (snapshot) => {
    const keys: AccessKey[] = [];
    snapshot.forEach(doc => {
      keys.push(doc.data() as AccessKey);
    });
    // sort by created desc
    keys.sort((a, b) => b.createdAt - a.createdAt);
    callback(keys);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
    onError(error);
  });
}
