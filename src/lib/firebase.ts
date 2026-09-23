import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export { firebaseConfig };
export const OWNER_EMAIL = 'p.paulomaciel.32@gmail.com';

const hasConfig = Object.keys(firebaseConfig).length > 0 && firebaseConfig.apiKey !== '';

export const isCloudEnabled = hasConfig;

const app = hasConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;
