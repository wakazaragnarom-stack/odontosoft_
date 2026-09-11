import { initializeApp, getApps } from 'firebase/app';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(config);

export async function googleSignIn() { return { user: null, credential: null, accessToken: null }; }
export async function firebaseEmailLogin(email: string) { return { user: { uid: `local-${email}`, email }, accessToken: null }; }
export async function firebaseEmailRegister(email: string) { return { user: { uid: `local-${email}`, email }, accessToken: null }; }
export async function firebaseLogout() { return undefined; }
export async function getAccessToken() { return null; }
