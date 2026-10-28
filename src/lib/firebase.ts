import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  type Firestore 
} from 'firebase/firestore';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'test-addss',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:113556212660:web:181a92ccb463b4269bc0e1',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'test-addss.firebasestorage.app',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCVSlLvcCrmPYim4WFKT-rfgBoUSUv9uS8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'test-addss.firebaseapp.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '113556212660'
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Inicialización de Firebase Authentication + Google OAuth Provider
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Configuración de Firestore con persistencia IndexedDB multiventana
// Evita volver a leer toda la colección de 134 leads en cada F5 o visita móvil, protegiendo la cuota gratuita (Spark)
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  firestoreDb = getFirestore(app);
}

export const db: Firestore = firestoreDb;

/**
 * Elimina propiedades undefined para evitar errores fatales en Firestore SDK (Unsupported field value: undefined)
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

