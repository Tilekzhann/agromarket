// lib/firebase/config.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBVFRWcmRJTxvNyS8Ns-9zJgeNxpxhowJ0",
  authDomain: "agromarket-2523f.firebaseapp.com",
  projectId: "agromarket-2523f",
  storageBucket: "agromarket-2523f.firebasestorage.app",
  messagingSenderId: "732907580368",
  appId: "1:732907580368:web:da353714a21a762b42a7d5",
  measurementId: "G-CF3W0740NS"
};

// Инициализация Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

console.log('🔥 Firebase initialized:', app.name); // Проверка в консоли
console.log('📦 Firestore:', db); // Проверка в консоли

export { app, db, storage, auth };