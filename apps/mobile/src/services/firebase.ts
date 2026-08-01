import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import type { Persistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyBLGMtJ6QJSNwakmD_PdgtstARICyu1sEI",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "lifiwebapp.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "lifiwebapp",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "lifiwebapp.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "798436972351",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "1:798436972351:web:7242cbd43e3fb46c99a58a",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = (() => {
  try {
    const nativeAuth = FirebaseAuth as typeof FirebaseAuth & {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
    };
    return FirebaseAuth.initializeAuth(firebaseApp, {
      persistence: nativeAuth.getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return FirebaseAuth.getAuth(firebaseApp);
  }
})();

export const firebaseDb = getFirestore(firebaseApp);
export const firebaseArtifactId = process.env.EXPO_PUBLIC_FIREBASE_ARTIFACT_ID ?? "lifi-2026-prod";
