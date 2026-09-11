import { initializeApp, getApps } from 'firebase/app';

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(config);
export async function googleSignIn() { return { user: null, credential: null, accessToken: null }; }
export async function firebaseEmailLogin(email: string) { return { user: { uid: `local-${email}`, email }, accessToken: null }; }
export async function firebaseEmailRegister(email: string) { return { user: { uid: `local-${email}`, email }, accessToken: null }; }
export async function firebaseLogout() { return undefined; }
export async function getAccessToken() { return null; }
