import { collection, doc, getDocs, getDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, where, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, firebaseConfig } from './config';

const USERS_COLLECTION = 'users';

export const getUsers = async (pageSize = 10, lastDoc = null, searchTerm = '') => {
  try {
    let q;
    const usersRef = collection(db, USERS_COLLECTION);
    
    // Very basic search simulation (Firestore doesn't natively support full-text search easily without external extensions)
    if (searchTerm) {
      q = query(
        usersRef,
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff'),
        limit(pageSize)
      );
    } else {
      q = lastDoc 
        ? query(usersRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize))
        : query(usersRef, orderBy('createdAt', 'desc'), limit(pageSize));
    }

    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return {
      users,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize
    };
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    throw new Error('User not found');
  } catch (error) {
    throw error;
  }
};

export const updateUserStatus = async (userId, status) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, { status, updatedAt: new Date().toISOString() });
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    // Note: This only deletes the Firestore document. Deleting from Firebase Auth usually requires the Admin SDK from a secure backend environment.
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
  } catch (error) {
    throw error;
  }
};

export const createNewUser = async (email, password, profileData) => {
  let secondaryApp;
  try {
    // Generate a unique name for the secondary app instance
    const appName = `SecondaryApp-${Date.now()}`;
    secondaryApp = initializeApp(firebaseConfig, appName);
    const secondaryAuth = getAuth(secondaryApp);

    // Create user in Firebase Authentication
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = credential.user.uid;

    // Create user document in Firestore users/{uid}
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userDocRef, {
      ...profileData,
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      status: 'active',
      role: profileData.role || 'user',
    });

    return uid;
  } catch (error) {
    throw error;
  } finally {
    if (secondaryApp) {
      await deleteApp(secondaryApp);
    }
  }
};

