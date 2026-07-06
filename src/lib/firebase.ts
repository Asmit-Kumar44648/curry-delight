/// <reference types="vite/client" />

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAS09hIXWeMJz_A_AjLzEZGRSqYxlp7iYY",
  authDomain: "curry-delight-app.firebaseapp.com",
  projectId: "curry-delight-app",
  storageBucket: "curry-delight-app.firebasestorage.app",
  messagingSenderId: "125124196108",
  appId: "1:125124196108:web:97a4b1376783f7c6687b29"
};

let app: any = null;
let db: any = null;
let auth: any = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  // Using the default database for the new project
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { db, auth };
