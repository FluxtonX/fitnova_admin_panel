import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyBuhx148XDOHGS_TQipCkoxs2tl0cD5dx8",
  authDomain: "fitnovva.firebaseapp.com",
  projectId: "fitnovva",
  storageBucket: "fitnovva.firebasestorage.app",
  messagingSenderId: "917529088327",
  appId: "1:917529088327:web:74224d8c4b5d73db0cbc62",
  measurementId: "G-7NC687R29E"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Authenticate anonymously so Firestore Security Rules allow read/write operations
signInAnonymously(auth).catch((err) => {
  console.warn('Firebase Anonymous Auth notice:', err.message);
});

export default app;
