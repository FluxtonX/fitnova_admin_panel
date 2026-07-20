import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './config';

const EXERCISES_COLLECTION = 'exercises';

export const getExercises = async () => {
  try {
    const exercisesRef = collection(db, EXERCISES_COLLECTION);
    const q = query(exercisesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
};

export const getExerciseById = async (id) => {
  try {
    const docRef = doc(db, EXERCISES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    }
    throw new Error('Exercise not found');
  } catch (error) {
    throw error;
  }
};

export const createExercise = async (data) => {
  try {
    const docRef = await addDoc(collection(db, EXERCISES_COLLECTION), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const updateExercise = async (id, data) => {
  try {
    const docRef = doc(db, EXERCISES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    throw error;
  }
};

export const deleteExercise = async (id) => {
  try {
    await deleteDoc(doc(db, EXERCISES_COLLECTION, id));
  } catch (error) {
    throw error;
  }
};
