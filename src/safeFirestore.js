import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FS_apiKey,
  authDomain: import.meta.env.VITE_FS_authDomain,
  projectId: import.meta.env.VITE_FS_projectId,
  storageBucket: import.meta.env.VITE_FS_storageBucket,
  messagingSenderId: import.meta.env.VITE_FS_messagingSenderId,
  appId: import.meta.env.VITE_FS_appId,
  measurementId: import.meta.env.VITE_FS_measurementId,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

setPersistence(getAuth(), browserLocalPersistence);

export const useUser = () => {
  const [user, setUser] = useState(null);

  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return unsubscribe;
  
  }, []);

  const login = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  }

  return {
    user,
    isLoggedIn: user !== null,
    login,
    logout: () => signOut(auth),
  };
};
