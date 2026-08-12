import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  writeBatch,
  Firestore
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = firebaseConfigJson;

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with long polling and robust fallback
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

let dbInstance: Firestore;

try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  }, databaseId);
} catch (e) {
  console.warn('Firestore persistent cache initialization fallback:', e);
  try {
    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true
    }, databaseId);
  } catch (err) {
    console.warn('Firestore long polling initialization fallback:', err);
    dbInstance = getFirestore(app, databaseId);
  }
}

export const db = dbInstance;

export { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  writeBatch
};

export default app;
