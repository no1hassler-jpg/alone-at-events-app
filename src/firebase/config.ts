import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, browserLocalPersistence, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyDiY2mnaEAaoQJ67M-sFsJtbLmmD1DlJQ0',
  authDomain: 'alone-at-events.firebaseapp.com',
  projectId: 'alone-at-events',
  storageBucket: 'alone-at-events.firebasestorage.app',
  messagingSenderId: '763951068805',
  appId: '1:763951068805:web:a12d643d0beaca7ddddbec',
};

const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// getReactNativePersistence relies on native modules that don't exist in a browser,
// so the web preview (used to verify UI changes) needs browserLocalPersistence instead.
export const auth: Auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage),
});

export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
