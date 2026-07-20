import { auth, db } from './config';
import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export const loginAdmin = async (email, password) => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Verify admin role (assuming you have a 'users' collection with role field)
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().role === 'admin') {
      return user;
    } else {
      await signOut(auth);
      throw new Error('Unauthorized. Admin access required.');
    }
  } catch (error) {
    throw error;
  }
};

export const logoutAdmin = async () => {
  return signOut(auth);
};

export const observeAuthState = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          callback(user);
        } else {
          callback(null);
        }
      } catch {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};
