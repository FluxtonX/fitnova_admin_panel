import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const createBaseService = (collectionName) => {
  return {
    getAll: async () => {
      try {
        const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        throw error;
      }
    },
    
    getById: async (id) => {
      try {
        const snapshot = await getDoc(doc(db, collectionName, id));
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() };
        }
        throw new Error('Document not found');
      } catch (error) {
        throw error;
      }
    },
    
    create: async (data) => {
      try {
        const docRef = await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        return docRef.id;
      } catch (error) {
        throw error;
      }
    },
    
    update: async (id, data) => {
      try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
          ...data,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        throw error;
      }
    },
    
    delete: async (id) => {
      try {
        await deleteDoc(doc(db, collectionName, id));
      } catch (error) {
        throw error;
      }
    }
  };
};

export const workoutService = createBaseService('fitness_plans');
export const nutritionService = createBaseService('recipes');
export const meditationService = createBaseService('meditations');
export const sleepService = createBaseService('sleep_sounds');
export const challengeService = createBaseService('challenges');
export const notificationService = createBaseService('notifications');
