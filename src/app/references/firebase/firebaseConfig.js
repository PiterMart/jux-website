import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);

// ─── IMPORTANT ───────────────────────────────────────────────────────────────
// Auth and Storage have been moved to separate files to reduce bundle size.
// Pages that only need Firestore (the vast majority) no longer download the
// Auth SDK (85 KiB) or Storage SDK (26 KiB).
//
// Import auth from:    "./firebaseAuth"
// Import storage from: "./firebaseStorage"
// ─────────────────────────────────────────────────────────────────────────────

export { app, firestore };
